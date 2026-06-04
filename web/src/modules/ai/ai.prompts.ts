// src/modules/ai/ai.prompts.ts
// Prompt template construction for email draft generation.
// Strategy-aware, type-safe prompt building.

import type { Lead, Campaign, CampaignWithStrategy } from "@/types";

interface PromptContext {
  lead: Lead;
  campaign: Campaign | CampaignWithStrategy | null;
  userFeedback?: string;
  basePromptOverride?: string;
}

interface PromptPair {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Extracts the strategy from a campaign if it has one included.
 */
function getStrategy(campaign: Campaign | CampaignWithStrategy | null) {
  if (!campaign) return null;
  if ("strategy" in campaign && campaign.strategy) {
    return campaign.strategy;
  }
  return null;
}

/**
 * Formats a lead's first name for use in email greetings.
 */
export function formatFirstName(firstName: string | null | undefined): string {
  if (!firstName) return "there";
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
}

/**
 * Builds the system + user prompt pair for email generation.
 */
export function buildEmailPrompts(ctx: PromptContext): PromptPair {
  const firstName = formatFirstName(ctx.lead.firstName);
  const strategy = getStrategy(ctx.campaign);

  const role = strategy?.role || "world-class B2B cold email copywriter";
  const product = strategy?.product || "B2B Services";
  const cta = strategy?.cta || ctx.campaign?.cta || "Book a call";

  const systemPrompt =
    (ctx.basePromptOverride ||
      `You are an elite ${role}. 
Your goal is to write hyper-personalized outreach emails that feel 100% human.

FORMATTING RULES:
1. NO WALLS OF TEXT: Use short, punchy paragraphs.
2. DOUBLE NEWLINES: You MUST use exactly two newlines ("\\n\\n") between every paragraph.
3. STRUCTURE:
   - Paragraph 1: "Hi ${firstName},"
   - Paragraph 2: Hook (from Lead Notes).
   - Paragraph 3: Value proposition.
   - Paragraph 4: Question based on "${cta}".`) +
    `
IMPORTANT: Output valid JSON ONLY:
{
  "subject": "Curiosity-driven subject line",
  "body": "Email body starting with 'Hi ${firstName},'",
  "rationale": "Briefly explain the hook"
}`;

  const userPrompt = `Lead: ${ctx.lead.firstName} ${ctx.lead.lastName} (${ctx.lead.jobTitle} at ${ctx.lead.companyName})
Notes: ${ctx.lead.notes || "N/A"}
Strategy: ${product}. CTA: ${cta}.
${ctx.userFeedback ? `FEEDBACK: ${ctx.userFeedback}` : ""}
TASK: Write the email. Start with 'Hi ${firstName},'. Use double newlines. Output JSON ONLY.`;

  return { systemPrompt, userPrompt };
}

/**
 * Post-processes AI-generated email body:
 * - Ensures greeting presence
 * - Fixes name hallucination
 * - Normalizes paragraph spacing
 */
export function postProcessEmailBody(body: string, firstName: string): string {
  if (!body) return "";

  const formattedName = formatFirstName(firstName);
  const expectedGreeting = `Hi ${formattedName},`;

  let processed = body.trim().replace(/\r\n/g, "\n");

  // 1. Force greeting if missing
  if (!processed.toLowerCase().startsWith("hi ")) {
    processed = `${expectedGreeting}\n\n${processed}`;
  }
  // 2. Correct name if AI hallucinated a different one
  else if (!processed.includes(formattedName)) {
    processed = processed.replace(/^Hi\s+[^,]+,/i, expectedGreeting);
  }

  // 3. Normalize spacing
  processed = processed
    .replace(/\n{3,}/g, "\n\n")
    .replace(/([.?!])\s*\n([a-zA-Z])/g, "$1\n\n$2")
    .replace(/^(Hi\s+[^,]+,)\s*/i, "$1\n\n");

  return processed;
}
