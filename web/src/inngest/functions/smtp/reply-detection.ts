// src/inngest/functions/smtp/reply-detection.ts
// IMAP reply detection — batch fetch recent unseen emails, match to leads via threading

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { ImapFlow } from "imapflow";
import { EncryptionService } from "@/modules/encryption/encryption.service";
import { deriveImapHost, sanitizeEmailContent } from "@/modules/mail/mail.utils";
import { logger } from "@/lib/logger";

export const checkInboxForReplies = inngest.createFunction(
  {
    id: "check-inbox-replies",
    retries: 1,
    concurrency: {
      limit: 1,
    },
    triggers: [{ cron: "*/15 * * * *" }],
  },
  async ({ step }: { step: any }) => {
    // Step 1: Fetch all verified SMTP accounts
    const smtpAccounts = await step.run("fetch-smtp-accounts", async () => {
      return prisma.smtpAccount.findMany({
        where: { isVerified: true },
        select: {
          id: true,
          host: true,
          username: true,
          encryptedPass: true,
          name: true,
        },
      });
    });

    const summary = { accountsChecked: 0, totalReplies: 0, errors: 0 };

    for (const account of smtpAccounts) {
      await step.run(`check-account-${account.id}`, async () => {
        // Decrypt IMAP password
        let decryptedPass: string;
        try {
          decryptedPass = EncryptionService.decrypt(account.encryptedPass);
        } catch {
          logger.error("Failed to decrypt password for reply detection", "ReplyDetection", {
            accountId: account.id,
          });
          summary.errors++;
          return;
        }

        const imapHost = deriveImapHost(account.host);

        const client = new ImapFlow({
          host: imapHost,
          port: 993,
          secure: true,
          auth: {
            user: account.username,
            pass: decryptedPass,
          },
          logger: false,
        });

        try {
          await client.connect();
          const lock = await client.getMailboxLock("INBOX");

          try {
            // Get campaigns linked to this SMTP account
            const campaigns = await prisma.campaign.findMany({
              where: { smtpAccountId: account.id },
              select: { id: true },
            });

            const campaignIds = campaigns.map((c) => c.id);
            if (campaignIds.length === 0) return;

            // Fetch active leads that have been sent but not replied to
            const activeLeads = await prisma.lead.findMany({
              where: {
                campaignId: { in: campaignIds },
                sent: true,
                replied: false,
              },
              select: {
                id: true,
                email: true,
                emailSubject: true,
                messages: {
                  select: { messageId: true },
                },
              },
            });

            if (activeLeads.length === 0) return;

            // Build a lookup map for efficient matching
            const leadsByEmail = new Map<string, typeof activeLeads>();
            for (const lead of activeLeads) {
              const key = lead.email.toLowerCase();
              const existing = leadsByEmail.get(key) || [];
              existing.push(lead);
              leadsByEmail.set(key, existing);
            }

            // Batch fetch recent unseen messages (instead of per-lead search)
            const recentUids = await client.search({
              seen: false,
              since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            } as any);

            if (!Array.isArray(recentUids) || recentUids.length === 0) return;

            // Process in batches of 50
            const FETCH_BATCH = 50;
            for (let i = 0; i < Math.min(recentUids.length, 200); i += FETCH_BATCH) {
              const batch = recentUids.slice(i, i + FETCH_BATCH);

              for (const uid of batch) {
                try {
                  const msg = await client.fetchOne(uid, {
                    source: true,
                    envelope: true,
                  }) as any;

                  if (!msg?.envelope) continue;

                  // Check if this email is from any of our active leads
                  const fromAddress = msg.envelope.from?.[0]?.address?.toLowerCase();
                  if (!fromAddress) continue;

                  const matchingLeads = leadsByEmail.get(fromAddress);
                  if (!matchingLeads || matchingLeads.length === 0) continue;

                  for (const lead of matchingLeads) {
                    // Match by threading (In-Reply-To) or subject
                    const isInReplyToUs =
                      msg.envelope.inReplyTo &&
                      lead.messages.some(
                        (m) => m.messageId === msg.envelope?.inReplyTo
                      );

                    const cleanSubject = lead.emailSubject
                      ? lead.emailSubject.replace(/^(re:\s*|fwd:\s*)+/i, "").trim().toLowerCase()
                      : "";
                    const incomingSubject = msg.envelope.subject
                      ? msg.envelope.subject.toLowerCase()
                      : "";
                    const isRelatedBySubject =
                      cleanSubject && incomingSubject.includes(cleanSubject);

                    if (!isInReplyToUs && !isRelatedBySubject) continue;

                    // Extract and sanitize reply content
                    const rawContent = msg.source
                      ? msg.source.toString().split("\r\n\r\n")[1] || "Reply received"
                      : "Reply received";

                    const content = sanitizeEmailContent(rawContent, 500);

                    await prisma.lead.update({
                      where: { id: lead.id },
                      data: {
                        replied: true,
                        status: "Hot",
                        messages: {
                          create: {
                            role: "LEAD",
                            content,
                          },
                        },
                      },
                    });

                    summary.totalReplies++;
                    logger.info("Reply detected", "ReplyDetection", {
                      leadId: lead.id,
                      from: fromAddress,
                    });
                  }
                } catch (fetchError) {
                  // Individual message fetch failure shouldn't stop the batch
                  logger.warn("Failed to fetch message", "ReplyDetection", {
                    uid: String(uid),
                  });
                }
              }
            }
          } finally {
            lock.release();
            await client.logout();
          }
        } catch (err) {
          logger.error("Error checking IMAP inbox", "ReplyDetection", {
            accountId: account.id,
            host: account.host,
          });
          summary.errors++;
        }
      });

      summary.accountsChecked++;
    }

    return summary;
  }
);
