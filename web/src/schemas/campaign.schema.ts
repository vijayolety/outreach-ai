// src/schemas/campaign.schema.ts
// Zod validation schemas for campaign operations

import { z } from "zod";

export const CampaignCreateSchema = z.object({
  campaignName: z.string().min(1, "Campaign name is required").max(100),
  leadsData: z.string().min(1, "Leads data is required"),
});

export const CampaignSetupSchema = z.object({
  campaignId: z.string().cuid(),
  campaignName: z.string().min(1).max(100),
  strategyId: z.string().cuid().nullable().optional(),
  smtpAccountId: z.string().cuid().nullable().optional(),
  tone: z.string().max(50).optional(),
  cta: z.string().max(200).optional(),
  senderName: z.string().max(100).optional(),
  context: z.string().max(5000).optional(),
  businessType: z.string().max(200).optional(),
  locationContext: z.string().max(200).optional(),
  followup1Delay: z.coerce.number().int().min(1).max(30).default(3),
  followup2Delay: z.coerce.number().int().min(1).max(30).default(7),
});

export type CampaignCreateInput = z.infer<typeof CampaignCreateSchema>;
export type CampaignSetupInput = z.infer<typeof CampaignSetupSchema>;
