// src/app/campaigns/actions.ts
// Campaign server actions — form handlers for campaign management

"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { CampaignService } from "@/modules/campaign/campaign.service";
import type { LeadInput } from "@/types";

export async function createCampaignFromUpload(formData: FormData) {
  const user = await getAuthUser();

  const rawData = formData.get("leadsData");
  if (!rawData || typeof rawData !== "string") {
    throw new Error("No data provided");
  }

  const leads: LeadInput[] = JSON.parse(rawData);
  const campaignName = (formData.get("campaignName") as string) || "New Campaign";

  const campaignId = await CampaignService.createFromUpload(
    user.id,
    campaignName,
    leads
  );

  redirect(`/campaigns/${campaignId}/setup`);
}

export async function updateCampaignSetup(formData: FormData) {
  const user = await getAuthUser();
  const id = formData.get("campaignId") as string;

  // Verify ownership
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  await prisma.campaign.update({
    where: { id },
    data: {
      name: (formData.get("campaignName") as string) || undefined,
      strategyId: (formData.get("strategyId") as string) || null,
      smtpAccountId: (formData.get("smtpAccountId") as string) || null,
      tone: (formData.get("tone") as string) || undefined,
      cta: (formData.get("cta") as string) || undefined,
      senderName: (formData.get("senderName") as string) || undefined,
      context: (formData.get("context") as string) || undefined,
      businessType: (formData.get("businessType") as string) || undefined,
      locationContext: (formData.get("locationContext") as string) || undefined,
      followup1Delay: parseInt((formData.get("followup1Delay") as string) || "3"),
      followup2Delay: parseInt((formData.get("followup2Delay") as string) || "7"),
    },
  });

  // Trigger bulk generation in background
  const { inngest } = await import("@/inngest/client");
  await inngest.send({
    name: "campaign/generate.drafts",
    data: { campaignId: id },
  });

  redirect(`/campaigns/${id}/review`);
}

export async function toggleCampaignStatus(id: string) {
  const user = await getAuthUser();
  const result = await CampaignService.toggleStatus(id, user.id);

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data.newStatus;
}

export async function stopAllCampaigns() {
  const user = await getAuthUser();
  const result = await CampaignService.stopAll(user.id);

  if (!result.success) {
    throw new Error(result.error);
  }
}