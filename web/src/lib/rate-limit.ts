// src/lib/rate-limit.ts
// In-memory sliding window rate limiter
// Future-ready: swap internals with Redis (ioredis) without changing the interface

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxTokens: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Creates a token-bucket rate limiter keyed by arbitrary string (userId, IP, smtpAccountId, etc.)
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxTokens: 50, windowMs: 60 * 60 * 1000 }); // 50/hour
 *   const result = limiter.consume("user_123");
 *   if (!result.allowed) { return errorResponse("Rate limit exceeded", 429); }
 */
export function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leaks
  const CLEANUP_INTERVAL = Math.max(config.windowMs * 2, 60_000);
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.lastRefill > config.windowMs * 3) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Don't block Node from exiting
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return {
    /**
     * Attempt to consume one token for the given key.
     * Returns whether the request is allowed and remaining tokens.
     */
    consume(key: string): RateLimitResult {
      const now = Date.now();
      let entry = store.get(key);

      if (!entry) {
        entry = { tokens: config.maxTokens, lastRefill: now };
        store.set(key, entry);
      }

      // Refill tokens based on elapsed time
      const elapsed = now - entry.lastRefill;
      const tokensToAdd = Math.floor(
        (elapsed / config.windowMs) * config.maxTokens
      );

      if (tokensToAdd > 0) {
        entry.tokens = Math.min(config.maxTokens, entry.tokens + tokensToAdd);
        entry.lastRefill = now;
      }

      if (entry.tokens > 0) {
        entry.tokens -= 1;
        return {
          allowed: true,
          remaining: entry.tokens,
          resetAt: entry.lastRefill + config.windowMs,
        };
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.lastRefill + config.windowMs,
      };
    },

    /** Get remaining tokens without consuming */
    peek(key: string): RateLimitResult {
      const entry = store.get(key);
      if (!entry) {
        return {
          allowed: true,
          remaining: config.maxTokens,
          resetAt: Date.now() + config.windowMs,
        };
      }
      return {
        allowed: entry.tokens > 0,
        remaining: entry.tokens,
        resetAt: entry.lastRefill + config.windowMs,
      };
    },

    /** Reset a specific key (useful for testing) */
    reset(key: string) {
      store.delete(key);
    },

    /** Clear all entries */
    clear() {
      store.clear();
    },
  };
}

/** Pre-configured SMTP rate limiter: 50 emails per hour per account */
export const smtpRateLimiter = createRateLimiter({
  maxTokens: 50,
  windowMs: 60 * 60 * 1000,
});

/** Pre-configured API rate limiter: 100 requests per minute per user */
export const apiRateLimiter = createRateLimiter({
  maxTokens: 100,
  windowMs: 60 * 1000,
});
