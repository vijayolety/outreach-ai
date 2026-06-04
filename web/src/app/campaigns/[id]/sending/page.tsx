import prisma from "@/lib/prisma";
import { Stepper } from "@/components/Stepper";
import { SendingClient } from "./SendingClient";

export default async function CampaignSendingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { 
      leads: {
        orderBy: { updatedAt: 'desc' },
        take: 10
      },
      _count: { select: { leads: true } }
    }
  });

  if (!campaign) return <div>Campaign not found</div>;

  const sentCount = await prisma.lead.count({ where: { campaignId: id, sent: true } });
  const failedCount = 0; // Keeping simple for MVP
  const pendingCount = campaign._count.leads - sentCount - failedCount;

  return (
    <div className="flex flex-col h-full relative">
      <Stepper campaignId={id} />
      <div className="flex-1 overflow-hidden py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <SendingClient 
          campaign={campaign} 
          recentLeads={campaign.leads}
          stats={{ sent: sentCount, pending: pendingCount, failed: failedCount, total: campaign._count.leads }}
        />
      </div>
    </div>
  );
}
