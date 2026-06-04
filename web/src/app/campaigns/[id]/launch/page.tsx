import prisma from "@/lib/prisma";
import { LaunchClient } from "./LaunchClient";
import { Stepper } from "@/components/Stepper";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CampaignLaunchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let userId: string;
  try {
    const user = await getAuthUser();
    userId = user.id;
  } catch {
    redirect("/login");
    return;
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id, userId },
    include: { _count: { select: { leads: true } } }
  });

  if (!campaign) return <div>Campaign not found</div>;

  // Fetch the specific SMTP account associated with this campaign
  let smtpAccount = null;
  if (campaign.smtpAccountId) {
    smtpAccount = await prisma.smtpAccount.findUnique({
      where: { id: campaign.smtpAccountId },
      select: {
        id: true,
        name: true,
        fromEmail: true,
        username: true,
        host: true,
        isVerified: true,
      },
    });
  }

  // Fetch user settings for rate limits
  const settings = await prisma.settings.findUnique({ where: { userId } });
  
  const readyLeads = await prisma.lead.count({
    where: { campaignId: id, isApproved: true }
  });

  return (
    <div className="flex flex-col h-full relative">
      <Stepper campaignId={id} />
      <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <LaunchClient 
          campaign={campaign} 
          smtpAccount={smtpAccount}
          settings={settings} 
          totalLeads={campaign._count.leads} 
          readyLeads={readyLeads} 
        />
      </div>
    </div>
  );
}
