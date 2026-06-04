// src/inngest/utils/inngest.helpers.ts
// Shared utilities for Inngest workflow functions

import { logger } from "@/lib/logger";

/**
 * Wraps an async operation with retry logic and exponential backoff.
 * Useful for AI API calls and external service interactions within steps.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    context?: string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, context = "unknown" } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        logger.warn(`Retry ${attempt + 1}/${maxRetries} for ${context}`, "InngestHelper", {
          delay,
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Chunks an array into smaller batches for parallel processing.
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
