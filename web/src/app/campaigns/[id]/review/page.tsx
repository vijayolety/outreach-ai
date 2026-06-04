import prisma from "@/lib/prisma";
import { ReviewClient } from "./ReviewClient";
import { Stepper } from "@/components/Stepper";

export default async function CampaignReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { leads: true }
  });

  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div className="flex flex-col h-full relative">
      <Stepper campaignId={id} />
      <div className="flex-1 overflow-hidden pt-4 pb-16 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <ReviewClient campaign={campaign} initialLeads={campaign.leads} />
      </div>
    </div>
  );
}
