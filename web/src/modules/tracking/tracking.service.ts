// src/modules/tracking/tracking.service.ts
// Email tracking service — open tracking, click tracking (future), event recording

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const TrackingService = {
  /**
   * Records an email open event for a lead.
   * Called when the tracking pixel is loaded.
   */
  async recordOpen(leadId: string): Promise<boolean> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { id: true, opened: true },
      });

      if (!lead) {
        logger.warn("Open tracking: lead not found", "TrackingService", { leadId });
        return false;
      }

      // Only update if not already opened
      if (!lead.opened) {
        await prisma.lead.update({
          where: { id: leadId },
          data: { 
            opened: true,
            status: "Opened" 
          },
        });
      }

      return true;
    } catch (error) {
      logger.error("Failed to record email open", "TrackingService", { leadId });
      return false;
    }
  },

  /**
   * Gets tracking stats for a campaign.
   */
  async getCampaignStats(campaignId: string) {
    const leads = await prisma.lead.findMany({
      where: { campaignId },
      select: {
        sent: true,
        opened: true,
        replied: true,
        status: true,
      },
    });

    const total = leads.length;
    const sent = leads.filter((l) => l.sent).length;
    const opened = leads.filter((l) => l.opened).length;
    const replied = leads.filter((l) => l.replied).length;
    const hot = leads.filter((l) => l.status === "Hot").length;

    return {
      total,
      sent,
      opened,
      replied,
      hot,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
    };
  },
};
