// src/types/smtp.ts
// SMTP-specific type definitions

import type { Transporter } from "nodemailer";

/** Minimal SMTP account shape needed by the mail module */
export interface SmtpAccountConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  encryptedPass: string;
  encryptionType: string;
  fromEmail: string;
  fromName: string | null;
}

/** Options for sending a single email */
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** For threading: set In-Reply-To header */
  inReplyTo?: string;
  /** For threading: set References header */
  references?: string | string[];
  /** Override the default sender display name */
  fromName?: string;
}

/** Result from sending an email */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/** Options for batch sending */
export interface BatchSendOptions {
  emails: SendEmailOptions[];
  smtpAccountId: string;
  /** Max concurrent sends (default: 5) */
  concurrency?: number;
  /** Delay between sends in ms (default: 0) */
  delayMs?: number;
}

/** Result from batch sending */
export interface BatchSendResult {
  total: number;
  sent: number;
  failed: number;
  results: SendEmailResult[];
}

/** Transporter cache entry with metadata */
export interface TransporterCacheEntry {
  transporter: Transporter;
  createdAt: number;
  accountId: string;
}
