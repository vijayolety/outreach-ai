import prisma from "@/lib/prisma";
import SettingsClient from "./SettingsClient";
import { SmtpService } from "@/modules/smtp/smtp.service";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  let userId: string;
  try {
    const user = await getAuthUser();
    userId = user.id;
  } catch {
    redirect("/login");
    return;
  }

  // Fetch or create default settings for the user
  let settings = await prisma.settings.findUnique({ 
    where: { userId }
  });

  if (!settings) {
    settings = await prisma.settings.create({
      data: { userId }
    });
  }

  // Use the service to get formatted accounts (without encrypted passwords)
  const accounts = await SmtpService.getSmtpAccountsByUser();

  return (
    <div className="w-full space-y-6">
      <SettingsClient settings={settings} accounts={accounts} />
    </div>
  );
}
