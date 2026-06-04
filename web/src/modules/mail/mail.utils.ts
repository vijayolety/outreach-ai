// src/modules/mail/mail.utils.ts
// Mail utility functions — sender formatting, tracking, content sanitization

import type { SmtpAccountConfig } from "./mail.types";

/**
 * Builds a formatted RFC 5322 sender address string.
 * e.g. "John Doe" <john@example.com>
 */
export function getSenderAddress(
  account: Pick<SmtpAccountConfig, "fromEmail" | "fromName">,
  customSenderName?: string
): string {
  const senderName = customSenderName || account.fromName || "The Example Team";
  return `"${senderName}" <${account.fromEmail}>`;
}

/**
 * Generates an invisible 1x1 tracking pixel <img> tag.
 */
export function formatTrackingPixel(trackingUrl: string): string {
  return `<img src="${trackingUrl}" width="1" height="1" style="display:none !important;" alt="" />`;
}

/**
 * Builds the tracking URL for open detection.
 */
export function buildTrackingUrl(leadId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/api/track/open/${leadId}`;
}

/**
 * Sanitizes email content to prevent injection attacks.
 * Strips potentially dangerous tags/attributes while preserving formatting.
 */
export function sanitizeEmailContent(content: string, maxLength = 500): string {
  if (!content) return "";

  let sanitized = content
    // Strip script tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Strip event handlers
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
    // Strip data URIs in src attributes
    .replace(/src\s*=\s*["']data:[^"']*["']/gi, "");

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + "...";
  }

  return sanitized;
}

/**
 * Derives IMAP host from SMTP host using common provider patterns.
 */
export function deriveImapHost(smtpHost: string): string {
  if (smtpHost.includes("smtp.")) {
    return smtpHost.replace("smtp.", "imap.");
  }
  return smtpHost;
}
