// src/modules/smtp/smtp.service.ts
// SMTP account management — CRUD operations, verification, ownership validation

import prisma from "@/lib/prisma";
import { SmtpSchema } from "@/schemas/smtp.schema";
import { EncryptionService } from "@/modules/encryption/encryption.service";
import nodemailer from "nodemailer";
import type { z } from "zod";
import type { SmtpAccountSafe } from "@/types";
import { logger } from "@/lib/logger";

export const SmtpService = {
  /**
   * Creates a new SMTP account after verifying the connection.
   * Password is encrypted at rest using AES-256-GCM.
   */
  async createSmtpAccount(
    userId: string,
    data: z.infer<typeof SmtpSchema>
  ): Promise<SmtpAccountSafe> {
    // Verify connection before saving
    const isValid = await this.verifyConnection(data);
    if (!isValid) {
      throw new Error("Failed to connect to SMTP server with provided credentials.");
    }

    const encryptedPass = EncryptionService.encrypt(data.password);

    const account = await prisma.smtpAccount.create({
      data: {
        userId,
        name: data.name,
        host: data.host,
        port: data.port,
        username: data.username,
        encryptedPass,
        encryptionType: data.encryptionType,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        isVerified: true,
      },
    });

    // Strip encrypted password before returning
    const { encryptedPass: _, ...safe } = account;
    return safe;
  },

  /**
   * Returns all SMTP accounts for a user, with encrypted passwords stripped.
   */
  async getSmtpAccountsByUser(userId?: string): Promise<SmtpAccountSafe[]> {
    const where = userId ? { userId } : {};
    const accounts = await prisma.smtpAccount.findMany({
      where: { ...where, isVerified: true, isActive: true },
      select: {
        id: true,
        userId: true,
        name: true,
        host: true,
        port: true,
        username: true,
        encryptionType: true,
        fromEmail: true,
        fromName: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return accounts;
  },

  /**
   * Deletes an SMTP account after verifying ownership.
   * Unlinks any campaigns using this account to prevent orphans.
   */
  async deleteSmtpAccount(id: string, userId: string): Promise<void> {
    // Verify ownership
    const account = await prisma.smtpAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new Error("SMTP account not found or unauthorized");
    }

    // Unlink campaigns using this SMTP account
    await prisma.campaign.updateMany({
      where: { smtpAccountId: id },
      data: { smtpAccountId: null },
    });

    // Delete the account
    await prisma.smtpAccount.delete({
      where: { id },
    });
  },

  /**
   * Toggles the active status of an SMTP account.
   */
  async toggleSmtpStatus(id: string, userId: string): Promise<boolean> {
    const account = await prisma.smtpAccount.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!account) {
      throw new Error("SMTP account not found");
    }

    const updated = await prisma.smtpAccount.update({
      where: { id },
      data: { isActive: !account.isActive },
    });

    return updated.isActive;
  },

  /**
   * Verifies an SMTP connection with the given credentials.
   * Returns true if the connection succeeds, false otherwise.
   */
  async verifyConnection(data: z.infer<typeof SmtpSchema>): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: data.host,
        port: data.port,
        secure: data.encryptionType === "SSL" || data.port === 465,
        auth: {
          user: data.username,
          pass: data.password,
        },
      });

      await transporter.verify();
      return true;
    } catch (error) {
      logger.error("SMTP verification failed", "SmtpService", {
        host: data.host,
        port: data.port,
      });
      return false;
    }
  },
};