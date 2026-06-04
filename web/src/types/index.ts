// src/types/index.ts
// Consolidated type definitions for the Outreach AI platform

import type { Prisma } from "@prisma/client";

// ─── Base Model Types (inferred from Prisma schema) ───

export type Lead = Prisma.LeadGetPayload<{}>;

export type Campaign = Prisma.CampaignGetPayload<{}>;

export type Message = Prisma.MessageGetPayload<{}>;

export type Settings = Prisma.SettingsGetPayload<{}>;

export type Strategy = Prisma.StrategyGetPayload<{}>;

export type SmtpAccount = Prisma.SmtpAccountGetPayload<{}>;

// ─── Auth Types ───

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

// ─── Composite Types (with relations) ───

export type CampaignWithStrategy = Prisma.CampaignGetPayload<{
  include: { strategy: true };
}>;

export type CampaignWithLeads = Prisma.CampaignGetPayload<{
  include: { leads: true; strategy: true };
}>;

export type LeadWithMessages = Prisma.LeadGetPayload<{
  include: { messages: true; campaign: true };
}>;

export type LeadWithCampaign = Prisma.LeadGetPayload<{
  include: { campaign: true };
}>;

export type CampaignWithLeadCounts = Prisma.CampaignGetPayload<{
  include: {
    _count: { select: { leads: true } };
    leads: { select: { sent: true; status: true } };
  };
}>;

/** Campaign with error counts for the campaigns list page */
export type CampaignListItem = Prisma.CampaignGetPayload<{
  include: {
    _count: { select: { leads: true; errors: true } };
    leads: { select: { sent: true; status: true } };
  };
}>;

// ─── SMTP Safe Type (no encrypted fields exposed to client) ───

export type SmtpAccountSafe = Omit<SmtpAccount, "encryptedPass">;

// ─── Server Action Result Pattern ───

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Lead Input (for CSV upload) ───

export interface LeadInput {
  firstName: string;
  lastName: string;
  jobTitle: string;
  companyName: string;
  email: string;
  sector?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  linkedinUrl?: string;
  notes?: string;
}

export interface LeadValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface LeadValidationResult {
  validLeads: LeadInput[];
  errors: LeadValidationError[];
}

// ─── AI Draft Types ───

export interface EmailDraft {
  subject: string;
  body: string;
  rationale: string;
}

// ─── Lead Status Enum ───

export const LEAD_STATUSES = ["Cold", "Warm", "Hot", "Closed", "NotInterested"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

// ─── Campaign Status Enum ───

export const CAMPAIGN_STATUSES = ["draft", "active", "completed", "paused"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// ─── AI Provider Enum ───

export const AI_PROVIDERS = ["gemini", "openai", "groq", "claude"] as const;
export type AIProviderName = (typeof AI_PROVIDERS)[number];

// ─── Tone & CTA Enums ───

export const TONES = [
  "Professional",
  "Conversational",
  "Friendly",
  "Direct",
  "Casual",
  "Formal",
] as const;
export type Tone = (typeof TONES)[number];

export const CTA_STYLES = [
  "Book a call",
  "Reply to this email",
  "Visit our site",
  "Schedule a demo",
  "Custom",
] as const;
export type CtaStyle = (typeof CTA_STYLES)[number];
