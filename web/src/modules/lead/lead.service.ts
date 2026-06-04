// src/modules/lead/lead.service.ts
// Lead management service — CRUD, bulk operations, status management

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Lead, ActionResult } from "@/types";

export const LeadService = {
  /**
   * Deletes a single lead.
   */
  async delete(leadId: string): Promise<ActionResult> {
    try {
      await prisma.lead.delete({ where: { id: leadId } });
      return { success: true, data: undefined };
    } catch (error) {
      logger.error("Failed to delete lead", "LeadService", { leadId });
      return { success: false, error: "Failed to delete lead" };
    }
  },

  /**
   * Bulk deletes leads.
   */
  async bulkDelete(leadIds: string[]): Promise<ActionResult> {
    try {
      await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
      return { success: true, data: undefined };
    } catch (error) {
      logger.error("Failed to bulk delete leads", "LeadService");
      return { success: false, error: "Failed to delete leads" };
    }
  },

  /**
   * Updates a single lead with partial data.
   */
  async update(
    leadId: string,
    data: Partial<Pick<Lead, "status" | "emailSubject" | "emailBody" | "isApproved" | "isPaused" | "notes">>
  ): Promise<ActionResult<Lead>> {
    try {
      const updated = await prisma.lead.update({
        where: { id: leadId },
        data,
      });
      return { success: true, data: updated };
    } catch (error) {
      logger.error("Failed to update lead", "LeadService", { leadId });
      return { success: false, error: "Failed to update lead" };
    }
  },

  /**
   * Bulk updates leads with the same data.
   */
  async bulkUpdate(
    leadIds: string[],
    data: Partial<Pick<Lead, "status" | "isApproved" | "isPaused">>
  ): Promise<ActionResult<Lead[]>> {
    try {
      await prisma.lead.updateMany({
        where: { id: { in: leadIds } },
        data,
      });

      const updated = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
      });

      return { success: true, data: updated };
    } catch (error) {
      logger.error("Failed to bulk update leads", "LeadService");
      return { success: false, error: "Failed to update leads" };
    }
  },

  /**
   * Gets leads for a campaign with optional filters.
   */
  async getByCampaign(
    campaignId: string,
    filters?: {
      sent?: boolean;
      replied?: boolean;
      isApproved?: boolean;
      status?: string;
    }
  ) {
    return prisma.lead.findMany({
      where: {
        campaignId,
        ...filters,
      },
      include: { messages: true },
      orderBy: { createdAt: "asc" },
    });
  },
};
