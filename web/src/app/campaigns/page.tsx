export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Plus, PlayCircle, CheckCircle2, FileText } from "lucide-react";
import { CampaignsClient } from "./CampaignsClient";

export default async function CampaignsListPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { leads: true, errors: true } },
      leads: { select: { sent: true, status: true } },
    },
  });

  const active = campaigns.filter((c) => c.status === "active");
  const completed = campaigns.filter((c) => c.status === "completed" || c.status === "paused");
  const drafts = campaigns.filter((c) => c.status === "draft");

  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient tracking-tight">Campaigns</h1>
          <p className="text-[#64748B] text-sm mt-1">Manage and track your outreach performance</p>
        </div>
        <Link
          href="/campaigns/new/upload"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Active */}
      <Section icon={PlayCircle} title="Active" count={active.length} color="emerald">
        {active.length === 0 ? (
          <EmptyState text="No active sequences running" />
        ) : (
          <div className="col-span-full">
            <CampaignsClient campaigns={active} />
          </div>
        )}
      </Section>

      {/* Completed & Paused */}
      <Section icon={CheckCircle2} title="Completed & Paused" count={completed.length} color="zinc">
        {completed.length === 0 ? (
          <EmptyState text="Nothing here yet" />
        ) : (
          <div className="col-span-full">
            <CampaignsClient campaigns={completed} />
          </div>
        )}
      </Section>

      {/* Drafts */}
      <Section icon={FileText} title="Drafts" count={drafts.length} color="amber">
        {drafts.length === 0 ? (
          <EmptyState text="No pending drafts" />
        ) : (
          <div className="col-span-full">
            <CampaignsClient campaigns={drafts} />
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  count,
  color,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  const badgeColors: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    zinc: "bg-white/5 text-zinc-400 border-white/10",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-[#475569]" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColors[color] || badgeColors.zinc}`} style={{ fontFamily: 'var(--font-mono)' }}>
          {count}
        </span>
      </div>
      <div>
        {children}
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <p className="text-sm text-[#475569]">{text}</p>
    </div>
  );
}
