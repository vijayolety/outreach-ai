// src/lib/logger.ts
// Production-grade structured logger with safe serialization

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
}

/** Fields that should never appear in logs */
const REDACTED_FIELDS = new Set([
  "password",
  "pass",
  "encryptedPass",
  "secret",
  "apiKey",
  "accessToken",
  "refreshToken",
  "access_token",
  "refresh_token",
  "id_token",
  "geminiApiKey",
  "openaiApiKey",
  "groqApiKey",
  "claudeApiKey",
  "authorization",
]);

function redactSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[MAX_DEPTH]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj.length > 500 ? obj.slice(0, 500) + "…" : obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.slice(0, 20).map((item) => redactSensitive(item, depth + 1));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_FIELDS.has(key)) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = redactSensitive(value, depth + 1);
    }
  }
  return redacted;
}

function formatEntry(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const ctx = entry.context ? ` [${entry.context}]` : "";
  const data = entry.data ? ` ${JSON.stringify(redactSensitive(entry.data))}` : "";
  return `${prefix}${ctx} ${entry.message}${data}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  contextOrData?: string | Record<string, unknown>,
  data?: Record<string, unknown>
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (typeof contextOrData === "string") {
    entry.context = contextOrData;
    if (data) entry.data = data;
  } else if (contextOrData) {
    entry.data = contextOrData;
  }

  return entry;
}

const isProduction = process.env.NODE_ENV === "production";

export const logger = {
  debug(message: string, contextOrData?: string | Record<string, unknown>, data?: Record<string, unknown>) {
    if (isProduction) return;
    const entry = createLogEntry("debug", message, contextOrData, data);
    console.debug(formatEntry(entry));
  },

  info(message: string, contextOrData?: string | Record<string, unknown>, data?: Record<string, unknown>) {
    const entry = createLogEntry("info", message, contextOrData, data);
    console.log(formatEntry(entry));
  },

  warn(message: string, contextOrData?: string | Record<string, unknown>, data?: Record<string, unknown>) {
    const entry = createLogEntry("warn", message, contextOrData, data);
    console.warn(formatEntry(entry));
  },

  error(message: string, contextOrData?: string | Record<string, unknown> | Error, data?: Record<string, unknown>) {
    if (contextOrData instanceof Error) {
      const entry = createLogEntry("error", message, {
        errorName: contextOrData.name,
        errorMessage: contextOrData.message,
        stack: isProduction ? undefined : contextOrData.stack,
        ...data,
      });
      console.error(formatEntry(entry));
    } else {
      const entry = createLogEntry("error", message, contextOrData as string | Record<string, unknown>, data);
      console.error(formatEntry(entry));
    }
  },
};