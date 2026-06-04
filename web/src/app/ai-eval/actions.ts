"use server";

import { testEmailGeneration, refinePromptWithAI } from "@/modules/ai/ai.service";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import type { AIProviderName } from "@/types";


export async function runEvaluationAction(prompt: string, notes: string) {
  try {
    const user = await getAuthUser();
    const userId = user.id;

    const settings = await prisma.settings.findUnique({ where: { userId } });
    const draft = await testEmailGeneration(prompt, notes, settings);
    
    const score = calculateHeuristicScore(draft.body, notes);
    
    return { 
      success: true, 
      data: {
        score,
        feedback: generateFeedback(score, draft.body),
        draft: draft.body,
        subject: draft.subject,
        rationale: draft.rationale
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveStructuredPromptAction(data: any) {
  try {
    const user = await getAuthUser();
    const userId = user.id;

    await prisma.settings.upsert({
      where: { userId },
      update: {
        promptRole: data.role,
        promptProduct: data.product,
        promptPersona: data.persona,
        promptPainPoint: data.painPoint,
        promptSocialProof: data.socialProof,
        promptTone: data.tone,
        promptCta: data.cta,
      },
      create: { 
        user: { connect: { id: userId } },
        promptRole: data.role,
        promptProduct: data.product,
        promptPersona: data.persona,
        promptPainPoint: data.painPoint,
        promptSocialProof: data.socialProof,
        promptTone: data.tone,
        promptCta: data.cta,
      }
    });
    revalidatePath("/settings");
    revalidatePath("/ai-eval");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function refineStructuredPromptAction(currentForm: any, feedback: string) {
  try {
    const user = await getAuthUser();
    const userId = user.id;

    const settings = await prisma.settings.findUnique({ where: { userId } });
    if (!settings) throw new Error("Settings not found");

    const provider = settings.aiProvider || "gemini";
    let apiKey = "";

    if (provider === "openai") apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY || "";
    else if (provider === "groq") apiKey = settings.groqApiKey || process.env.GROQ_API_KEY || "";
    else if (provider === "claude") apiKey = settings.claudeApiKey || process.env.CLAUDE_API_KEY || "";
    else apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY || "";

    if (!apiKey) throw new Error(`${provider} API key missing. Please set it in Settings or .env`);

    const prompt = `You are a Prompt Engineering Expert. 
I have a B2B outreach strategy that received the following feedback from an auditor: "${feedback}"

CURRENT STRATEGY:
- Role: ${currentForm.role}
- Product: ${currentForm.product}
- Persona: ${currentForm.persona}
- Pain Point: ${currentForm.painPoint}
- Social Proof: ${currentForm.socialProof}
- Tone: ${currentForm.tone}
- CTA: ${currentForm.cta}

TASK:
Improve the strategy fields to address the auditor's feedback and reach 99% quality. 
Keep the tone peer-to-peer and direct. Avoid all marketing fluff.

Return ONLY a JSON object with the improved fields:
{
  "role": "...",
  "product": "...",
  "persona": "...",
  "painPoint": "...",
  "socialProof": "...",
  "tone": "...",
  "cta": "..."
}`;

    const improved = await refinePromptWithAI(prompt, provider as AIProviderName, apiKey);

    return { success: true, data: improved };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveAsNewStrategyAction(name: string, data: any) {
  try {
    const user = await getAuthUser();
    const userId = user.id;

    const strategy = await prisma.strategy.create({
      data: {
        name,
        role: data.role,
        product: data.product,
        persona: data.persona,
        painPoint: data.painPoint,
        socialProof: data.socialProof,
        tone: data.tone,
        cta: data.cta,
      }
    });
    revalidatePath("/ai-eval");
    return { success: true, data: strategy };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInitialDataAction() {
  let userId: string;
  try {
    const user = await getAuthUser();
    userId = user.id;
  } catch {
    return { basePrompt: "", strategies: [], structured: {} };
  }

  const settings = await prisma.settings.findUnique({ where: { userId } });
  const strategies = await prisma.strategy.findMany({
    orderBy: { createdAt: "desc" }
  });

  return { 
    basePrompt: settings?.basePrompt || "",
    strategies,
    structured: {
      role: settings?.promptRole || "",
      product: settings?.promptProduct || "",
      persona: settings?.promptPersona || "",
      painPoint: settings?.promptPainPoint || "",
      socialProof: settings?.promptSocialProof || "",
      tone: settings?.promptTone || "",
      cta: settings?.promptCta || "",
    }
  };
}


function calculateHeuristicScore(body: string, notes: string): number {
  const bodyLower = body.toLowerCase();
  const notesLower = notes.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  
  let scores = {
    hook: 0,       // Anchoring in lead notes
    brevity: 0,    // Word count (50-100 is sweet spot)
    human: 0,      // Lack of AI-sounding words
    friction: 0    // Low friction CTA
  };

  // 1. Hook Strength (Max 30)
  const matches = notesLower.filter(w => bodyLower.includes(w)).length;
  scores.hook = Math.min(30, matches * 8);

  // 2. Brevity (Max 25)
  const words = body.split(/\s+/).length;
  if (words >= 40 && words <= 100) scores.brevity = 25;
  else if (words < 40) scores.brevity = 15;
  else scores.brevity = Math.max(0, 25 - (words - 100) / 2);

  // 3. Human Factor (Max 25)
  const roboticWords = ["leveraging", "synergy", "cutting-edge", "robust", "transformative", "optimize", "streamline"];
  const robotCount = roboticWords.filter(w => bodyLower.includes(w)).length;
  scores.human = Math.max(0, 25 - robotCount * 10);

  // 4. CTA Friction (Max 20)
  const lowFriction = ["worth", "look", "chat", "thoughts", "open", "interest"];
  const highFriction = ["demo", "call", "calendar", "meeting", "schedule", "30 minutes"];
  const hasLow = lowFriction.some(w => bodyLower.includes(w));
  const hasHigh = highFriction.some(w => bodyLower.includes(w));
  scores.friction = hasLow ? 20 : (hasHigh ? 5 : 10);

  return scores.hook + scores.brevity + scores.human + scores.friction;
}

function generateFeedback(score: number, body: string): string {
  if (score > 90) return "Excellent 2026-ready outreach! Authentic hook, high brevity, and low-friction CTA.";
  if (score > 75) return "Strong start. To reach 99%, try removing marketing buzzwords and making the opening hook even more specific to the lead notes.";
  if (score > 50) return "Average. The email feels a bit generic. Focus on the 'Trigger' in the first sentence and keep paragraphs under 2 sentences.";
  return "Critically low personalization. This email will likely be flagged as spam or ignored. Use specific details from the Lead Notes immediately.";
}
