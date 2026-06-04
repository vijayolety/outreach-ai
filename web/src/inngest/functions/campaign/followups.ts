// src/inngest/functions/campaign/followups.ts
// Follow-up scheduling workflow — waits for configured delay, then checks for replies

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const scheduleFollowUps = inngest.createFunction(
  {
    id: "schedule-follow-ups",
    retries: 2,
    triggers: [{ event: "campaign/schedule.followup" }],
  },
  async ({ event, step }: { event: { data: { leadId: string; delayDays?: number; followupNumber?: number } }; step: any }) => {
    const { leadId, delayDays = 3, followupNumber = 1 } = event.data as {
      leadId: string;
      delayDays?: number;
      followupNumber?: number;
    };

    // Wait for the configured delay
    await step.sleep(`wait-${delayDays}-days`, `${delayDays}d`);

    // Check if lead has replied
    const replied = await step.run("check-reply-status", async () => {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { replied: true, isPaused: true, sent: true },
      });

      if (!lead) return { skip: true, reason: "Lead not found" };
      if (lead.replied) return { skip: true, reason: "Lead already replied" };
      if (lead.isPaused) return { skip: true, reason: "Lead is paused" };
      if (!lead.sent) return { skip: true, reason: "Initial email not sent" };

      return { skip: false };
    });

    if (replied.skip) {
      logger.info("Follow-up skipped", "FollowUps", {
        leadId,
        reason: replied.reason,
        followupNumber,
      });
      return { status: "skipped", reason: replied.reason };
    }

    // Send follow-up (placeholder — will be expanded with actual follow-up generation)
    await step.run("send-followup", async () => {
      logger.info("Follow-up triggered", "FollowUps", {
        leadId,
        followupNumber,
      });

      // TODO: Generate follow-up email via AI and send through mail service
      // For now, just log the intent
    });

    return { status: "completed", followupNumber };
  }
);
