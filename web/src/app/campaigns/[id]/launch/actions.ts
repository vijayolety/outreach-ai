"use server";

import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function startCampaignAction(campaignId: string) {
  console.log(`[startCampaignAction] Starting campaign ${campaignId}`);
  try {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "active" }
    });
    console.log(`[startCampaignAction] Status updated to active`);

    // Trigger Inngest function for background sending
    const result = await inngest.send({
      name: "campaign/send.sequence",
      data: { campaignId }
    } as any);
    console.log(`[startCampaignAction] Inngest event sent:`, result);
  } catch (error: any) {
    console.error(`[startCampaignAction] Error:`, error);
    throw new Error(`Failed to launch campaign: ${error.message}`);
  }
}
