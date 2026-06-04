// src/inngest/functions/smtp/smtp-health.ts
// Periodic SMTP health check — verifies all active SMTP accounts
// Marks accounts as unverified if connection fails

import { inngest } from "../../client";
import prisma from "@/lib/prisma";
import { verifyTransporter, invalidateTransporter } from "@/modules/mail/mail.service";
import { logger } from "@/lib/logger";
import type { SmtpAccountConfig } from "@/types/smtp";

export const smtpHealthCheck = inngest.createFunction(
  {
    id: "smtp-health-check",
    retries: 0,
    triggers: [{ cron: "0 */6 * * *" }],
  },
  async ({ step }: { step: any }) => {
    const accounts = await step.run("fetch-verified-accounts", async () => {
      return prisma.smtpAccount.findMany({
        where: { isVerified: true },
      });
    });

    const summary = { checked: 0, healthy: 0, unhealthy: 0 };

    for (const account of accounts) {
      await step.run(`health-check-${account.id}`, async () => {
        const isHealthy = await verifyTransporter(account as SmtpAccountConfig);

        if (!isHealthy) {
          // Mark as unverified and evict from transporter cache
          await prisma.smtpAccount.update({
            where: { id: account.id },
            data: { isVerified: false },
          });
          invalidateTransporter(account.id);

          summary.unhealthy++;
          logger.warn("SMTP account marked unhealthy", "SmtpHealth", {
            accountId: account.id,
            accountName: account.name,
          });
        } else {
          summary.healthy++;
        }

        summary.checked++;
      });
    }

    logger.info("SMTP health check complete", "SmtpHealth", summary);
    return summary;
  }
);
