// src/modules/ai/ai.service.ts
// Core AI service — email draft generation, prompt refinement, testing

import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAIProvider } from "./ai.provider";
import { buildEmailPrompts, postProcessEmailBody, formatFirstName } from "./ai.prompts";
import type { Lead, Campaign, CampaignWithStrategy, Settings, EmailDraft, AIProviderName } from "@/types";

// ---------------------------------------------------------------------------
// JSON Parsing
// ---------------------------------------------------------------------------

interface EmailDraftRaw {
  subject?: string;
  body?: string;
  rationale?: string;
}

function safeParseJSON(text: string): EmailDraftRaw {
  if (!text) return {};
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as EmailDraftRaw;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Exported Functions
// ---------------------------------------------------------------------------

/**
 * Generates a personalized email draft for a lead using the configured AI provider.
 */
export async function generateEmailDraft(
  lead: Lead,
  campaign: Campaign | CampaignWithStrategy | null,
  userFeedback = "",
  cachedSettings?: Settings | null
): Promise<EmailDraft> {
  const settings =
    cachedSettings ??
    (campaign?.userId
      ? await prisma.settings.findUnique({ where: { userId: campaign.userId } })
      : null);

  if (!settings) throw new Error("AI settings not configured.");

  const { systemPrompt, userPrompt } = buildEmailPrompts({
    lead,
    campaign,
    userFeedback,
    basePromptOverride: settings.basePrompt || undefined,
  });

  try {
    const providerName = (settings.aiProvider || "gemini") as AIProviderName;
    const provider = getAIProvider(providerName, settings);
    const rawResponse = await provider.generate(systemPrompt, userPrompt, 0.7, true);
    const parsed = safeParseJSON(rawResponse);

    const body = postProcessEmailBody(
      parsed.body || "",
      lead.firstName
    );

    return {
      subject: parsed.subject || "Drafting Failed",
      body,
      rationale: `[${settings.aiProvider}] ${parsed.rationale || "N/A"}`,
    };
  } catch (error) {
    logger.error("AI draft generation failed", error instanceof Error ? error : new Error(String(error)));
    return {
      subject: "Error",
      body: "Could not generate draft.",
      rationale: "API failure",
    };
  }
}

/**
 * Refines a prompt using AI — returns structured suggestions.
 */
export async function refinePromptWithAI(
  prompt: string,
  providerName?: AIProviderName,
  apiKey?: string
): Promise<EmailDraftRaw> {
  if (!apiKey) throw new Error("API key missing for refinement");

  const selectedProvider = providerName || "gemini";

  const tempSettings = {
    aiProvider: selectedProvider,
    openaiApiKey: selectedProvider === "openai" ? apiKey : null,
    claudeApiKey: selectedProvider === "claude" ? apiKey : null,
    groqApiKey: selectedProvider === "groq" ? apiKey : null,
    geminiApiKey: selectedProvider === "gemini" ? apiKey : null,
  } as Settings;

  try {
    const provider = getAIProvider(selectedProvider, tempSettings);
    const rawResponse = await provider.generate(
      "You are an expert prompt engineer. Always return valid JSON.",
      prompt,
      0.7,
      true
    );
    return safeParseJSON(rawResponse);
  } catch {
    return {};
  }
}

/**
 * Test email generation with mock lead data — useful for prompt tuning.
 */
export async function testEmailGeneration(
  promptOverride: string,
  leadNotes: string,
  cachedSettings?: Settings | null
): Promise<EmailDraft> {
  const mockLead: Lead = {
    id: "test",
    campaignId: "test",
    firstName: "Test",
    lastName: "User",
    companyName: "Test Co",
    jobTitle: "CEO",
    email: "test@example.com",
    notes: leadNotes,
    sector: null,
    city: null,
    zipcode: null,
    country: null,
    linkedinUrl: null,
    status: "Cold",
    emailSubject: null,
    emailBody: null,
    aiRationale: null,
    sent: false,
    opened: false,
    replied: false,
    isApproved: false,
    isPaused: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCampaign = {
    context: promptOverride,
    tone: "Professional",
    cta: "Book a call",
  } as Campaign;

  if (!cachedSettings) {
    throw new Error("Settings required for test generation");
  }

  return generateEmailDraft(mockLead, mockCampaign, "", cachedSettings);
}
