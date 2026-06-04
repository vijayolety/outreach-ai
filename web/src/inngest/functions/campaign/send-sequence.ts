// src/inngest/functions/campaign/send-sequence.ts
// Email sending workflow — handles sending approved drafts for a campaign
// Features: transporter reuse, tracking pixels, message threading, rate limiting

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { getOrCreateTransporter, verifyTransporter } from "@/modules/mail/mail.service";
import { getSenderAddress, formatTrackingPixel, buildTrackingUrl } from "@/modules/mail/mail.utils";
import { formatEmailHTML } from "@/lib/email-signature";
import { logger } from "@/lib/logger";
import { smtpRateLimiter } from "@/lib/rate-limit";
import type { SmtpAccountConfig } from "@/types/smtp";

export const sendEmailSequence = inngest.createFunction(
  {
    id: "send-email-sequence",
    retries: 2,
    concurrency: {
      limit: 2,
    },
    triggers: [{ event: "campaign/send.sequence" }],
  },
  async ({ event, step }: { event: { data: { campaignId: string } }; step: any }) => {
    const { campaignId } = event.data as { campaignId: string };

    // Step 1: Fetch campaign, SMTP config, and approved unsent leads
    const data = await step.run("fetch-send-data", async () => {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          userId: true,
          senderName: true,
          smtpAccountId: true,
        },
      });

      if (!campaign) return { campaign: null, smtpAccount: null, leads: [] };

      const smtpAccount = campaign.smtpAccountId
        ? await prisma.smtpAccount.findUnique({
            where: { id: campaign.smtpAccountId },
          })
        : null;

      const leads = await prisma.lead.findMany({
        where: {
          campaignId,
          sent: false,
          isApproved: true,
          isPaused: false,
        },
        select: {
          id: true,
          email: true,
          emailSubject: true,
          emailBody: true,
        },
      });

      return { campaign, smtpAccount, leads };
    });

    if (!data.campaign || !data.smtpAccount) {
      return { error: "Missing campaign or SMTP configuration" };
    }

    if (data.leads.length === 0) {
      return { success: true, sent: 0, message: "No leads to send" };
    }

    const smtpAccount = data.smtpAccount as SmtpAccountConfig;

    // Step 2: Verify SMTP connection
    const isVerified = await step.run("verify-smtp", async () => {
      return verifyTransporter(smtpAccount);
    });

    if (!isVerified) {
      logger.error("SMTP verification failed", "SendSequence", {
        accountId: smtpAccount.id,
      });
      return { error: "SMTP connection failed. Check your settings." };
    }

    // Step 3: Send emails one by one (with rate limiting)
    const transporter = getOrCreateTransporter(smtpAccount);
    const from = getSenderAddress(smtpAccount, data.campaign.senderName || undefined);
    let sentCount = 0;
    let failedCount = 0;

    for (const lead of data.leads) {
      await step.run(`send-${lead.id}`, async () => {
        // Check if already sent (idempotency)
        const current = await prisma.lead.findUnique({
          where: { id: lead.id },
          select: { sent: true },
        });
        if (current?.sent) return { skipped: true };

        // Check rate limit
        const rateCheck = smtpRateLimiter.consume(smtpAccount.id);
        if (!rateCheck.allowed) {
          logger.warn("Rate limit hit during send sequence", "SendSequence", {
            accountId: smtpAccount.id,
            leadId: lead.id,
          });
          return { rateLimited: true };
        }

        // Build email HTML with tracking pixel
        const trackingUrl = buildTrackingUrl(lead.id);
        const htmlBody =
          formatEmailHTML(lead.emailBody!, data.campaign!.senderName || undefined) +
          formatTrackingPixel(trackingUrl);

        try {
          const info = await transporter.sendMail({
            from,
            to: lead.email,
            subject: lead.emailSubject!,
            html: htmlBody,
            text: lead.emailBody!,
          });

          // Record sent status and store messageId for threading
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              sent: true,
              messages: {
                create: {
                  role: "USER",
                  content: lead.emailBody!,
                  messageId: info.messageId,
                },
              },
            },
          });

          sentCount++;
          return { sent: true, messageId: info.messageId };
        } catch (error) {
          failedCount++;
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          logger.error("Failed to send email", "SendSequence", {
            leadEmail: lead.email,
            error: errorMsg,
          });
          throw error; // Let Inngest handle retries
        }
      });
    }

    logger.info("Send sequence complete", "SendSequence", {
      campaignId,
      sent: sentCount,
      failed: failedCount,
    });

    return { success: true, sent: sentCount, failed: failedCount };
  }
);
