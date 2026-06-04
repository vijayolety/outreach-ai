"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateEmailDraft } from "@/modules/ai/ai.service";

import type { ActionResult, LeadWithMessages } from "@/types";

export async function updateLeadStatusAction(
  leadId: string,
  status: string
): Promise<ActionResult<LeadWithMessages>> {
  try {
    let data: Record<string, unknown> = { status };
    if (status === "pause") data = { isPaused: true };
    if (status === "resume") data = { isPaused: false };

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data,
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        campaign: true,
      },
    });

    revalidatePath(`/leads/${leadId}`);
    revalidatePath(`/leads`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("[updateLeadStatus]", error);
    return { success: false, error: "Failed to update lead status" };
  }
}

export async function generateAIReplyAction(
  leadId: string,
  userFeedback?: string
): Promise<ActionResult<{ draft: string; rationale: string }>> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        campaign: true,
      },
    });

    if (!lead) return { success: false, error: "Lead not found" };

    const conversationHistory = lead.messages
      .map((m) => `${m.role === "USER" ? "ME" : "LEAD"}: ${m.content}`)
      .join("\n\n");

    const lastMessage = lead.messages.filter((m) => m.role === "LEAD").pop();

    const feedback = `The lead (${lead.firstName}) just replied. 
  
--- FULL CONVERSATION HISTORY ---
INITIAL OUTREACH: ${lead.emailBody}

${conversationHistory}

--- END HISTORY ---

The lead's most recent message was: "${lastMessage?.content || "No reply yet"}". 
${userFeedback ? `\nUSER FEEDBACK FOR REGENERATION: "${userFeedback}"\n` : ""}

Please draft a professional, concise response that:
1. Acknowledges their specific point.
2. Offers value based on our campaign context: "${lead.campaign?.context || ""}".
3. Proposes a clear next step (like a 15-min call).
${userFeedback ? `IMPORTANT: Follow the user feedback strictly: ${userFeedback}` : ""}`;

    const draftResult = await generateEmailDraft(lead, lead.campaign, feedback);

    return {
      success: true,
      data: { draft: draftResult.body, rationale: draftResult.rationale },
    };
  } catch (error) {
    console.error("[generateAIReply]", error);
    return { success: false, error: "Failed to generate AI reply" };
  }
}

export async function sendReplyAction(
  leadId: string,
  content: string
): Promise<ActionResult<LeadWithMessages>> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { campaign: true },
    });

    if (!lead) return { success: false, error: "Lead not found" };

    const { sendEmailByCampaign: sendEmail } = await import("@/modules/mail/mail.service");
    const { formatEmailHTML } = await import("@/lib/email-signature");

    await sendEmail({
      to: lead.email,
      subject: `Re: ${lead.emailSubject || "Quick question"}`,
      html: formatEmailHTML(content),
      campaignId: lead.campaignId,
    });


    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        messages: {
          create: { role: "USER", content },
        },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        campaign: true,
      },
    });

    revalidatePath(`/leads/${leadId}`);
    return { success: true, data: updatedLead };
  } catch (error) {
    console.error("[sendReply]", error);
    const msg = error instanceof Error ? error.message : "Failed to send reply";
    return { success: false, error: msg };
  }
}

export async function syncLeadInboxAction(
  leadId: string
): Promise<ActionResult<{ newMessages: number }>> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { campaign: true, messages: true },
    });
    if (!lead || !lead.campaign.smtpAccountId)
      return { success: false, error: "Missing lead or sending account" };

    const smtpAccount = await prisma.smtpAccount.findUnique({
      where: { id: lead.campaign.smtpAccountId }
    });

    if (!smtpAccount) return { success: false, error: "SMTP Account not found" };

    const { EncryptionService } = await import("@/modules/encryption/encryption.service");
    let decryptedPass = "";
    try {
      decryptedPass = EncryptionService.decrypt(smtpAccount.encryptedPass);
    } catch (e) {
      return { success: false, error: "Failed to decrypt SMTP password" };
    }

    const { ImapFlow } = require("imapflow");
    const client = new ImapFlow({
      host: smtpAccount.host.replace("smtp.", "imap."),
      port: 993,
      secure: true,
      auth: {
        user: smtpAccount.username,
        pass: decryptedPass,
      },
      logger: false,
      emitLogs: false,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
    });


    let newMessageCount = 0;

    try {
      // Use a timeout for the entire connection process
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 15000))
      ]);
    } catch (connectError) {
      console.error("[syncInbox] IMAP connect failed:", connectError);
      return { success: false, error: "Inbox connection timed out. Please check your settings." };
    }

    const lock = await client.getMailboxLock("INBOX");

    try {
      const messageUids = await client.search({ from: lead.email });
      if (Array.isArray(messageUids) && messageUids.length > 0) {
        for (const uid of messageUids) {
          // Fetch both envelope (for messageId) and body
          const msg = await client.fetchOne(uid, { envelope: true, source: true });
          if (!msg || !msg.source) continue;

          const messageId = msg.envelope?.messageId;
          
          // Verify this email is related to our campaign thread
          const cleanSubject = lead.emailSubject ? lead.emailSubject.replace(/^(re:\s*|fwd:\s*)+/i, '').trim().toLowerCase() : "";
          const incomingSubject = msg.envelope?.subject ? msg.envelope.subject.toLowerCase() : "";
          const isRelatedBySubject = cleanSubject && incomingSubject.includes(cleanSubject);
          const isInReplyToUs = msg.envelope?.inReplyTo && lead.messages.some(m => m.messageId === msg.envelope.inReplyTo);

          if (!isRelatedBySubject && !isInReplyToUs) {
             continue; // Skip unrelated emails
          }

          let content = msg.source.toString();

          // Deduplicate by messageId if available
          if (messageId) {
            const existingById = await prisma.message.findUnique({
              where: { messageId }
            });
            if (existingById) continue;
          }

          // MIME content extraction (fallback if messageId was missing or for old data)
          if (content.includes("Content-Type: text/plain")) {
            content = content.split("Content-Type: text/plain").pop() || content;
            content = content.split("--")[0];
            if (content.includes("\r\n\r\n")) {
              content = content.split("\r\n\r\n").slice(1).join("\r\n\r\n");
            }
          } else if (content.includes("\r\n\r\n")) {
            content = content.split("\r\n\r\n").slice(1).join("\r\n\r\n");
          }

          content = content
            .replace(/Content-Transfer-Encoding: .*/g, "")
            .replace(/Content-Type: .*/g, "")
            .replace(/charset=.*/g, "")
            .trim();

          if (!content) continue;

          // Secondary deduplication by content hash/prefix (safety net)
          const existingByContent = await prisma.message.findFirst({
            where: {
              leadId: lead.id,
              role: "LEAD",
              content: content.substring(0, 100),
            },
          });

          if (!existingByContent) {
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                replied: true,
                status: "Hot",
                messages: {
                  create: {
                    role: "LEAD",
                    messageId, // Store the ID for future deduplication
                    content:
                      content.length > 1000
                        ? content.substring(0, 1000) + "..."
                        : content,
                  },
                },
              },
            });
            newMessageCount++;
          }
        }
      }
    } finally {
      lock.release();
      await client.logout().catch(() => {});
    }

    revalidatePath(`/leads/${leadId}`);
    return { success: true, data: { newMessages: newMessageCount } };
  } catch (error) {
    console.error("[syncInbox]", error);
    const msg = error instanceof Error ? error.message : "Inbox sync failed";
    return { success: false, error: msg };
  }
}
