"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";


export async function saveSettings(formData: FormData) {
  const user = await getAuthUser();
  const userId = user.id;

  const data: Record<string, string | number> = {};
  
  if (formData.has("aiProvider")) data.aiProvider = formData.get("aiProvider") as string;
  if (formData.has("geminiApiKey")) data.geminiApiKey = formData.get("geminiApiKey") as string;
  if (formData.has("groqApiKey")) data.groqApiKey = formData.get("groqApiKey") as string;
  if (formData.has("openaiApiKey")) data.openaiApiKey = formData.get("openaiApiKey") as string;
  if (formData.has("claudeApiKey")) data.claudeApiKey = formData.get("claudeApiKey") as string;
  if (formData.has("gmailEmailAddress")) data.gmailEmailAddress = formData.get("gmailEmailAddress") as string;
  if (formData.has("gmailRefreshToken")) data.gmailRefreshToken = formData.get("gmailRefreshToken") as string;
  
  if (formData.has("maxEmailsPerHour")) {
    data.maxEmailsPerHour = parseInt(formData.get("maxEmailsPerHour") as string) || 30;
  }
  
  if (formData.has("followupDelayOptions")) {
    data.followupDelayOptions = formData.get("followupDelayOptions") as string;
  }

  try {
    await prisma.settings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function addAccount(formData: FormData) {
  const user = await getAuthUser();
  const userId = user.id;

  const name = formData.get("name") as string;
  const host = formData.get("host") as string;
  const port = parseInt(formData.get("port") as string) || 587;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const encryptionType = formData.get("encryptionType") as string || "TLS";
  const fromEmail = formData.get("fromEmail") as string;
  const fromName = formData.get("fromName") as string;

  try {
    const { SmtpService } = await import("@/modules/smtp/smtp.service");
    const account = await SmtpService.createSmtpAccount(userId, {
      name,
      host,
      port,
      username,
      password,
      encryptionType: encryptionType as "TLS" | "SSL" | "NONE",
      fromEmail,
      fromName,
    });

    revalidatePath("/settings");
    return { success: true, account };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to add account";
    console.error("[addAccount] Failed:", error);
    return { success: false, error: msg };
  }
}

export async function deleteAccount(id: string) {
  const user = await getAuthUser();

  try {
    const { SmtpService } = await import("@/modules/smtp/smtp.service");
    await SmtpService.deleteSmtpAccount(id, user.id);
    revalidatePath("/settings");
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete account";
    return { success: false, error: msg };
  }
}
