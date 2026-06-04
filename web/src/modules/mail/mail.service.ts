// src/modules/mail/mail.service.ts
// Production-grade mail sending service with transporter caching,
// retry support, batch sending, and message threading.

import nodemailer, { Transporter } from "nodemailer";
import prisma from "@/lib/prisma";
import { EncryptionService } from "@/modules/encryption/encryption.service";
import { logger } from "@/lib/logger";
import { smtpRateLimiter } from "@/lib/rate-limit";
import { getSenderAddress, formatTrackingPixel, buildTrackingUrl } from "./mail.utils";
import type {
  SmtpAccountConfig,
  SendEmailOptions,
  SendEmailResult,
  BatchSendResult,
  TransporterCacheEntry,
} from "./mail.types";

// ---------------------------------------------------------------------------
// Transporter Cache
// ---------------------------------------------------------------------------

const transporterCache = new Map<string, TransporterCacheEntry>();

/** Max age for cached transporters: 30 minutes */
const TRANSPORTER_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Returns a cached transporter or creates a new one.
 * Transporters are cached by SMTP account ID to prevent reconnecting.
 */
export function getOrCreateTransporter(account: SmtpAccountConfig): Transporter {
  const existing = transporterCache.get(account.id);

  // Reuse if fresh
  if (existing && Date.now() - existing.createdAt < TRANSPORTER_MAX_AGE_MS) {
    return existing.transporter;
  }

  // Evict stale entry
  if (existing) {
    transporterCache.delete(account.id);
  }

  // Decrypt password
  let decryptedPassword: string;
  try {
    decryptedPassword = EncryptionService.decrypt(account.encryptedPass);
  } catch {
    throw new Error(`Failed to decrypt SMTP password for ${account.name}`);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: account.host,
    port: account.port,
    secure: account.encryptionType === "SSL" || account.port === 465,
    auth: {
      user: account.username,
      pass: decryptedPassword,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  // Cache it
  transporterCache.set(account.id, {
    transporter,
    createdAt: Date.now(),
    accountId: account.id,
  });

  return transporter;
}

/**
 * Verifies an SMTP transporter connection.
 */
export async function verifyTransporter(account: SmtpAccountConfig): Promise<boolean> {
  const transporter = getOrCreateTransporter(account);

  try {
    await transporter.verify();
    return true;
  } catch (error) {
    logger.error("SMTP verification failed", "MailService", {
      accountName: account.name,
      host: account.host,
    });
    // Evict failed transporter from cache
    transporterCache.delete(account.id);
    return false;
  }
}

/**
 * Invalidates a cached transporter (e.g. after credentials change).
 */
export function invalidateTransporter(accountId: string): void {
  transporterCache.delete(accountId);
}

// ---------------------------------------------------------------------------
// Email Sending
// ---------------------------------------------------------------------------

/**
 * Sends a single email through the specified SMTP account.
 * Supports message threading via inReplyTo/references headers.
 */
export async function sendEmail(
  account: SmtpAccountConfig,
  options: SendEmailOptions,
  customSenderName?: string
): Promise<SendEmailResult> {
  const transporter = getOrCreateTransporter(account);
  const from = getSenderAddress(account, customSenderName || options.fromName);

  // Check rate limit
  const rateCheck = smtpRateLimiter.consume(account.id);
  if (!rateCheck.allowed) {
    logger.warn("SMTP rate limit exceeded", "MailService", {
      accountId: account.id,
      remaining: rateCheck.remaining,
    });
    return {
      success: false,
      error: "SMTP rate limit exceeded. Try again later.",
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(options.inReplyTo && {
        inReplyTo: options.inReplyTo,
        references: options.references || options.inReplyTo,
      }),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown SMTP error";
    logger.error("Failed to send email", "MailService", {
      to: options.to,
      accountId: account.id,
      error: errorMessage,
    });

    return {
      success: false,
      error: `SMTP send failed: ${errorMessage}`,
    };
  }
}

/**
 * Sends a single email, resolving the SMTP account from a campaign or account ID.
 * Convenience wrapper for use in server actions / API routes.
 */
export async function sendEmailByCampaign(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  campaignId?: string;
  smtpAccountId?: string;
  fromName?: string;
  inReplyTo?: string;
  references?: string | string[];
}): Promise<SendEmailResult> {
  let accountId = options.smtpAccountId;
  let senderName = options.fromName;

  // Resolve SMTP from campaign if not provided
  if (!accountId && options.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: options.campaignId },
      select: { smtpAccountId: true, senderName: true },
    });

    if (!campaign?.smtpAccountId) {
      throw new Error(`Campaign ${options.campaignId} has no SMTP account configured`);
    }

    accountId = campaign.smtpAccountId;
    senderName = senderName || campaign.senderName || "The Example Team";
  }

  if (!accountId) {
    throw new Error("No SMTP account configured");
  }

  // Fetch the full SMTP account
  const smtpAccount = await prisma.smtpAccount.findUnique({
    where: { id: accountId },
  });

  if (!smtpAccount) {
    throw new Error("SMTP account not found");
  }

  return sendEmail(smtpAccount, {
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    inReplyTo: options.inReplyTo,
    references: options.references,
  }, senderName);
}

/**
 * Sends emails in batches with concurrency control.
 * Returns detailed results for each email.
 */
export async function sendBatch(
  account: SmtpAccountConfig,
  emails: SendEmailOptions[],
  concurrency = 5,
  delayMs = 0
): Promise<BatchSendResult> {
  const results: SendEmailResult[] = [];
  let sent = 0;
  let failed = 0;

  // Process in chunks
  for (let i = 0; i < emails.length; i += concurrency) {
    const chunk = emails.slice(i, i + concurrency);

    const chunkResults = await Promise.allSettled(
      chunk.map((email) => sendEmail(account, email))
    );

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
        if (result.value.success) sent++;
        else failed++;
      } else {
        results.push({ success: false, error: result.reason?.message || "Unknown error" });
        failed++;
      }
    }

    // Delay between chunks to avoid overwhelming SMTP
    if (delayMs > 0 && i + concurrency < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    total: emails.length,
    sent,
    failed,
    results,
  };
}

// Re-export utilities for convenience
export { getSenderAddress, formatTrackingPixel, buildTrackingUrl } from "./mail.utils";
