// src/modules/ai/ai.provider.ts
// AI provider interface and concrete implementations
// Factory pattern for multi-provider LLM support

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { Settings, AIProviderName } from "@/types";

// ---------------------------------------------------------------------------
// Provider Interface
// ---------------------------------------------------------------------------

export interface AIProvider {
  generate(
    systemPrompt: string,
    userPrompt: string,
    temperature?: number,
    isJson?: boolean
  ): Promise<string>;
}

// ---------------------------------------------------------------------------
// Concrete Implementations
// ---------------------------------------------------------------------------

class OpenAIProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private model: string = "gpt-4o-mini"
  ) {}

  async generate(
    system: string,
    user: string,
    temp = 0.7,
    isJson = true
  ): Promise<string> {
    const client = new OpenAI({ apiKey: this.apiKey });
    const res = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: isJson ? { type: "json_object" } : undefined,
      temperature: temp,
    });
    return res.choices[0].message.content || "{}";
  }
}

class ClaudeProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private model: string = "claude-3-5-haiku-latest"
  ) {}

  async generate(
    system: string,
    user: string,
    temp = 0.7
  ): Promise<string> {
    const client = new Anthropic({ apiKey: this.apiKey });
    const res = await client.messages.create({
      model: this.model,
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
      temperature: temp,
    });
    const block = res.content[0];
    return block.type === "text" ? block.text : "{}";
  }
}

class GeminiProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private model: string = "gemini-1.5-flash"
  ) {}

  async generate(
    system: string,
    user: string,
    temp = 0.7,
    isJson = true
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    
    const result = await ai.models.generateContent({
      model: this.model,
      systemInstruction: system,
      contents: [{ role: "user", parts: [{ text: user }] }],
      config: {
        temperature: temp,
        responseMimeType: isJson ? "application/json" : "text/plain",
      },
    });

    // Return the text directly as per SDK docs
    const text = result.text || "";
    
    if (!text) {
      console.warn("[GeminiProvider] Received empty text response", result);
    }
    
    return text;
  }
}

class GroqProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private model: string = "llama-3.3-70b-versatile"
  ) {}

  async generate(
    system: string,
    user: string,
    temp = 0.7,
    isJson = true
  ): Promise<string> {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: isJson ? { type: "json_object" } : undefined,
          temperature: temp,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

// ---------------------------------------------------------------------------
// Provider Factory
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate AI provider based on provider name and user settings.
 * Validates that the required API key exists.
 */
export function getAIProvider(
  providerName: AIProviderName,
  settings: Settings
): AIProvider {
  switch (providerName) {
    case "openai": {
      if (!settings.openaiApiKey) throw new Error("OpenAI API key not configured");
      return new OpenAIProvider(settings.openaiApiKey);
    }
    case "claude": {
      if (!settings.claudeApiKey) throw new Error("Claude API key not configured");
      return new ClaudeProvider(settings.claudeApiKey);
    }
    case "groq": {
      if (!settings.groqApiKey) throw new Error("Groq API key not configured");
      return new GroqProvider(settings.groqApiKey);
    }
    case "gemini":
    default: {
      if (!settings.geminiApiKey) throw new Error("Gemini API key not configured");
      return new GeminiProvider(settings.geminiApiKey);
    }
  }
}
