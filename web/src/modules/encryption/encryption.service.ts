// src/modules/encryption/encryption.service.ts
// Consolidated AES-256-GCM encryption with backward-compat CBC decryption

import crypto from "crypto";

const RAW_KEY = process.env.ENCRYPTION_KEY;
if (!RAW_KEY && process.env.NODE_ENV === "production") {
  throw new Error("ENCRYPTION_KEY environment variable is required in production");
}

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(RAW_KEY || "Example-outreach-ai-secure-salt-2026")
  .digest();

const GCM_ALGORITHM = "aes-256-gcm";
const GCM_IV_LENGTH = 12;

const CBC_ALGORITHM = "aes-256-cbc";
const CBC_IV_LENGTH = 16;

export const EncryptionService = {
  /**
   * Encrypts using AES-256-GCM (preferred, includes authentication tag).
   * Format: gcm:iv:authTag:ciphertext
   */
  encrypt(text: string): string {
    if (!text) return "";

    const iv = crypto.randomBytes(GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv(GCM_ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Prefix with "gcm:" to distinguish from legacy CBC format
    return `gcm:${iv.toString("hex")}:${authTag}:${encrypted}`;
  },

  /**
   * Decrypts a string. Auto-detects format:
   * - "gcm:iv:tag:ciphertext" → AES-256-GCM
   * - "iv:tag:ciphertext" → legacy AES-256-GCM (from old utils/encryption.ts)
   * - "iv:ciphertext" → legacy AES-256-CBC (from old core/security/encryption.ts)
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return "";

    // New GCM format (prefixed)
    if (encryptedText.startsWith("gcm:")) {
      return this._decryptGcm(encryptedText.slice(4));
    }

    const parts = encryptedText.split(":");

    if (parts.length === 3) {
      // Legacy GCM format: iv:authTag:ciphertext
      return this._decryptGcm(encryptedText);
    }

    if (parts.length === 2) {
      // Legacy CBC format: iv:ciphertext
      return this._decryptCbc(encryptedText);
    }

    throw new Error("Invalid encrypted text format");
  },

  /** AES-256-GCM decryption */
  _decryptGcm(text: string): string {
    const [ivHex, authTagHex, encryptedContent] = text.split(":");

    if (!ivHex || !authTagHex || !encryptedContent) {
      throw new Error("Invalid GCM encrypted text format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(GCM_ALGORITHM, ENCRYPTION_KEY, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedContent, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  },

  /** Legacy AES-256-CBC decryption (backward compat) */
  _decryptCbc(text: string): string {
    // For CBC, we need the key in the old format (hex string from env)
    const cbcKeyRaw = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
    const cbcKey = Buffer.from(cbcKeyRaw, "hex");

    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");

    const decipher = crypto.createDecipheriv(CBC_ALGORITHM, cbcKey, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  },
};
