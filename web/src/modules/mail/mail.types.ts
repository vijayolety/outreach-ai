// src/modules/mail/mail.types.ts
// Re-exports from central types + module-specific internal types

export type {
  SmtpAccountConfig,
  SendEmailOptions,
  SendEmailResult,
  BatchSendOptions,
  BatchSendResult,
  TransporterCacheEntry,
} from "@/types/smtp";
