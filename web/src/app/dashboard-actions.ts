// src/app/dashboard-actions.ts
// Dashboard server actions — cross-cutting operations

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CampaignService } from "@/modules/campaign/campaign.service";
import { LeadService } from "@/modules/lead/lead.service";
import type { ActionResult, Lead } from "@/types";

export async function stopAllSequencesAction(): Promise<ActionResult<{ count: number }>> {
  try {
    const campaignResult = await prisma.campaign.updateMany({
      where: { status: "active" },
      data: { status: "paused" },
    });

    await prisma.lead.updateMany({
      where: { sent: false, isApproved: true },
      data: { isPaused: true },
    });

    revalidatePath("/");
    return { success: true, data: { count: campaignResult.count } };
  } catch (error) {
    console.error("[stopAllSequences]", error);
    return { success: false, error: "Failed to stop sequences" };
  }
}

export async function deleteLeadAction(id: string): Promise<ActionResult> {
  const result = await LeadService.delete(id);
  if (result.success) revalidatePath("/leads");
  return result;
}

export async function bulkDeleteLeadsAction(ids: string[]): Promise<ActionResult> {
  const result = await LeadService.bulkDelete(ids);
  if (result.success) revalidatePath("/leads");
  return result;
}

export async function updateLeadAction(
  id: string,
  data: Partial<Pick<Lead, "status" | "emailSubject" | "emailBody" | "isApproved" | "isPaused" | "notes">>
): Promise<ActionResult<Lead>> {
  const result = await LeadService.update(id, data);
  if (result.success) revalidatePath("/leads");
  return result;
}

export async function bulkUpdateLeadsAction(
  ids: string[],
  data: Partial<Pick<Lead, "status" | "isApproved" | "isPaused">>
): Promise<ActionResult<Lead[]>> {
  const result = await LeadService.bulkUpdate(ids, data);
  if (result.success) revalidatePath("/leads");
  return result;
}

export async function syncCampaignInboxAction(
  campaignId: string
): Promise<ActionResult<{ synced: number }>> {
  try {
    const leads = await prisma.lead.findMany({
      where: { campaignId, sent: true },
      select: { id: true, email: true },
    });

    const { syncLeadInboxAction } = await import("./leads/[id]/actions");

    const results = await Promise.all(
      leads.map(async (lead) => {
        try {
          const result = await syncLeadInboxAction(lead.id);
          return result.success && result.data.newMessages > 0;
        } catch {
          return false;
        }
      })
    );

    const synced = results.filter(Boolean).length;

    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, data: { synced } };
  } catch (error) {
    console.error("[syncCampaignInbox]", error);
    return { success: false, error: "Failed to sync campaign inbox" };
  }
}

export async function deleteCampaignAction(id: string): Promise<ActionResult> {
  try {
    await prisma.campaign.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/campaigns");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteCampaign]", error);
    return { success: false, error: "Failed to delete campaign" };
  }
}

export async function bulkDeleteCampaignsAction(ids: string[]): Promise<ActionResult> {
  try {
    await prisma.campaign.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/");
    revalidatePath("/campaigns");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[bulkDeleteCampaigns]", error);
    return { success: false, error: "Failed to delete campaigns" };
  }
}
