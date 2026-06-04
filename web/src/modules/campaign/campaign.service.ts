// src/modules/campaign/campaign.service.ts
// Campaign management service — CRUD, status transitions, stats

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { LeadInput, CampaignListItem, ActionResult } from "@/types";

export const CampaignService = {
  /**
   * Creates a campaign with leads from CSV upload.
   * Uses createMany for efficient bulk insert.
   */
  async createFromUpload(
    userId: string,
    campaignName: string,
    leads: LeadInput[]
  ): Promise<string> {
    // Auto-detect business type and location from leads
    const sectors = [...new Set(leads.map((l) => l.sector).filter(Boolean))].slice(0, 3);
    const cities = [...new Set(leads.map((l) => l.city).filter(Boolean))].slice(0, 2);
    const countries = [...new Set(leads.map((l) => l.country).filter(Boolean))].slice(0, 2);

    const businessType = sectors.join(" / ") || "Unknown";
    const locationContext = [...cities, ...countries].join(", ") || "Global";

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: campaignName || "New Campaign",
        status: "draft",
        businessType,
        locationContext,
      },
    });

    // Bulk create leads (much faster than individual creates)
    const validLeads = leads.filter((l) => l.email);

    if (validLeads.length > 0) {
      await prisma.lead.createMany({
        data: validLeads.map((lead) => ({
          campaignId: campaign.id,
          firstName: lead.firstName || "",
          lastName: lead.lastName || "",
          email: lead.email,
          companyName: lead.companyName || "",
          jobTitle: lead.jobTitle || "",
          city: lead.city || null,
          country: lead.country || null,
          notes: lead.notes || null,
          sector: lead.sector || null,
          linkedinUrl: lead.linkedinUrl || null,
        })),
        skipDuplicates: true,
      });
    }

    return campaign.id;
  },

  /**
   * Gets a campaign with lead counts and stats for the list page.
   */
  async getListForUser(userId: string): Promise<CampaignListItem[]> {
    return prisma.campaign.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { leads: true, errors: true } },
        leads: { select: { sent: true, status: true } },
      },
    });
  },

  /**
   * Toggles campaign between active and paused.
   * Also updates lead pause states.
   */
  async toggleStatus(
    campaignId: string,
    userId: string
  ): Promise<ActionResult<{ newStatus: string }>> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId },
      select: { id: true, status: true },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    const newStatus = campaign.status === "active" ? "paused" : "active";
    const isPaused = newStatus === "paused";

    await prisma.$transaction([
      prisma.campaign.update({
        where: { id: campaignId },
        data: { status: newStatus },
      }),
      prisma.lead.updateMany({
        where: { campaignId, sent: false, isApproved: true },
        data: { isPaused },
      }),
    ]);

    return { success: true, data: { newStatus } };
  },

  /**
   * Stops all active campaigns for a user.
   */
  async stopAll(userId: string): Promise<ActionResult<{ count: number }>> {
    try {
      const result = await prisma.campaign.updateMany({
        where: { status: "active", userId },
        data: { status: "paused" },
      });

      await prisma.lead.updateMany({
        where: {
          campaign: { userId },
          sent: false,
          isApproved: true,
        },
        data: { isPaused: true },
      });

      return { success: true, data: { count: result.count } };
    } catch (error) {
      logger.error("Failed to stop all campaigns", "CampaignService");
      return { success: false, error: "Failed to stop sequences" };
    }
  },

  /**
   * Deletes a campaign and all related data.
   */
  async delete(campaignId: string, userId: string): Promise<ActionResult> {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId },
      select: { id: true },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    await prisma.campaign.delete({ where: { id: campaignId } });
    return { success: true, data: undefined };
  },

  /**
   * Bulk deletes campaigns for a user.
   */
  async bulkDelete(campaignIds: string[], userId: string): Promise<ActionResult> {
    await prisma.campaign.deleteMany({
      where: { id: { in: campaignIds }, userId },
    });
    return { success: true, data: undefined };
  },
};
