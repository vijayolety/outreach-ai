import prisma from "@/lib/prisma";
import { LeadDetailClient } from "./LeadDetailClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      campaign: true,
    },
  });

  if (!lead) return <div className="p-8 text-center text-zinc-400">Lead not found</div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/leads" className="flex items-center gap-1.5 text-[#64748B] hover:text-white text-sm font-medium transition-all duration-200">
          <ChevronLeft className="w-4 h-4" /> Back to leads
        </Link>
      </div>
      <LeadDetailClient lead={lead} />
    </div>
  );
}
