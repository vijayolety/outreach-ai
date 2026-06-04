export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight, Plus, RotateCcw, OctagonX, BarChart3, Users, Send, Flame } from "lucide-react";
import prisma from "@/lib/prisma";
import { StopSequencesButton } from "./StopSequencesButton";
import { CampaignsClient } from "./campaigns/CampaignsClient";

import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  let userId: string;
  try {
    const user = await getAuthUser();
    userId = user.id;
  } catch {
    redirect("/login");
    return;
  }

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: {
      _count: { select: { leads: true, errors: true } },
      leads: { select: { sent: true, status: true, replied: true } },
    },
  });

  const totalLeads = campaigns.reduce((acc, c) => acc + c._count.leads, 0);
  const totalSent = campaigns.reduce((acc, c) => acc + c.leads.filter(l => l.sent).length, 0);
  const totalHot = campaigns.reduce((acc, c) => acc + c.leads.filter(l => l.status === "Hot" || l.status === "hot").length, 0);
  const totalReplied = campaigns.reduce((acc, c) => acc + c.leads.filter(l => l.replied).length, 0);
  const lastCampaign = campaigns[0];

  return (
    <div className="w-full space-y-8 relative">
      {/* Mesh gradient backdrop */}
      <div className="mesh-gradient" />

      {/* Header */}
      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-gradient tracking-tight">Dashboard</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1.5">Overview of your outreach performance</p>
      </div>

      {/* Bento Grid — Row 1: Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <StatCard label="Total Leads" value={totalLeads} icon={Users} color="default" />
        <StatCard label="Emails Sent" value={totalSent} icon={Send} color="default" />
        <StatCard label="Replies" value={totalReplied} icon={BarChart3} color="blue" />
        <StatCard label="Hot Leads" value={totalHot} icon={Flame} color="green" />
      </div>

      {/* Bento Grid — Row 2: Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {/* New Campaign */}
        <Link
          href="/campaigns/new/upload"
          className="group flex flex-col justify-between p-6 h-44 card-surface hover:border-[rgba(99,102,241,0.3)] transition-all duration-300"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <Plus className="w-4 h-4 text-[#6366F1] group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">New Campaign</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Upload leads, configure AI, and launch</p>
          </div>
        </Link>

        {/* Resume Campaign */}
        <Link
          href={lastCampaign ? `/campaigns/${lastCampaign.id}/setup` : "/campaigns/new/upload"}
          className="group flex flex-col justify-between p-6 h-44 card-surface hover:border-[rgba(99,102,241,0.3)] transition-all duration-300"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <RotateCcw className="w-4 h-4 text-[#3B82F6] group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Resume Campaign</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
              {lastCampaign?.name || "No recent campaigns"}
            </p>
          </div>
        </Link>

        {/* Kill Switch */}
        <StopSequencesButton />
      </div>

      {/* Bento Grid — Row 3: Recent Campaigns */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Recent Campaigns</h2>
          <Link href="/campaigns" className="text-xs text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors">
            View all →
          </Link>
        </div>
        <div>
          {campaigns.length === 0 ? (
            <div className="col-span-full py-16 rounded-xl flex flex-col items-center justify-center gap-2" style={{ border: '1px dashed var(--border-muted)', background: 'var(--bg-elevated)' }}>
              <BarChart3 className="w-6 h-6" style={{ color: 'var(--text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No campaigns yet</p>
            </div>
          ) : (
            <CampaignsClient campaigns={campaigns} />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: "default" | "blue" | "green" }) {
  const accents = {
    default: { icon: 'var(--text-secondary)', value: 'var(--text-primary)', bg: 'var(--bg-elevated)', border: 'var(--border-muted)' },
    blue: { icon: '#3B82F6', value: '#3B82F6', bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.15)' },
    green: { icon: '#10B981', value: '#10B981', bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.15)' },
  };
  const a = accents[color];

  return (
    <div
      className="p-5 transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: a.bg,
        border: `1px solid ${a.border}`,
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-layered)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5" style={{ color: a.icon }} />
      </div>
      <p className="text-3xl font-bold tabular-nums" style={{ color: a.value, fontFamily: 'var(--font-mono)' }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</p>
    </div>
  );
}
