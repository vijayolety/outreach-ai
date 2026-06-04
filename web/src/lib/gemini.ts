import { GoogleGenAI } from '@google/genai';
import prisma from './prisma';

export async function generateEmailDraft(lead: any, campaign: any) {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });
  if (!settings?.geminiApiKey) {
    throw new Error("Gemini API Key is not configured");
  }

  const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
  
  const systemPrompt = `You are an expert B2B cold email copywriter.
Tone: ${campaign.tone || 'Personalized, non-generic, concise'}
Goal: ${campaign.cta || 'Drive reply'}

Write a short, curiosity-driven subject line and a concise email body for the following lead:
Name: ${lead.firstName} ${lead.lastName}
Company: ${lead.companyName}
Title: ${lead.jobTitle}
Location: ${lead.city ? lead.city + ', ' + lead.country : 'Unknown'}
Context: ${campaign.context || ''}
Lead Notes: ${lead.notes || ''}

Return your response in pure JSON format exactly like this:
{
  "subject": "The subject line",
  "body": "The email body without signature",
  "rationale": "Brief 1-sentence explanation of why this email works for this lead"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: systemPrompt,
  });

  try {
    const text = response.text || '';
    // Strip markdown formatting if any
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return { subject: "Drafting Failed", body: "Could not generate draft", rationale: "Parse error" };
  }
}
