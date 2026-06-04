"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Check, 
  Clock, 
  Send, 
  AlertCircle, 
  Activity, 
  ArrowRight, 
  Pause, 
  Play,
  MailCheck,
  MailQuestion,
  MailX
} from "lucide-react";
import { StopSequencesButton } from "../../../StopSequencesButton";

export function SendingClient({ campaign, recentLeads, stats }: any) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000); 
    return () => clearInterval(interval);
  }, [router]);

  const progressPercent = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/campaigns/${campaign.id}`} className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>Campaign</Link>
            <span style={{ color: 'var(--border-muted)' }}>/</span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Real-time Monitor</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient tracking-tight">{campaign.name || 'Monitoring Outreach'}</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Tracking live sequence progression and responses</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 border rounded-full" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#10B981]" style={{ fontFamily: 'var(--font-mono)' }}>Active</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Stats & Timeline (7/12) */}
        <div className="flex-1 lg:w-[58.33%] space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Sent" value={stats.sent} icon={MailCheck} color="text-[#10B981]" bg="bg-[#10B981]/10" border="border-[#10B981]/20" />
            <StatCard label="Pending" value={stats.pending} icon={MailQuestion} color="text-[#F59E0B]" bg="bg-[#F59E0B]/10" border="border-[#F59E0B]/20" />
            <StatCard label="Failed" value={stats.failed} icon={MailX} color="text-[#EF4444]" bg="bg-[#EF4444]/10" border="border-[#EF4444]/20" />
          </div>

          {/* Progress */}
          <div className="p-6 card-surface space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Overall Progress</h3>
              <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{progressPercent}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-[#6366F1] rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <div className="flex items-center justify-between text-xs font-medium" style={{ color: '#475569' }}>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#6366F1]" />
                <span style={{ fontFamily: 'var(--font-mono)' }}>30 emails/hr</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{stats.total > 0 ? `${Math.ceil(stats.pending / 30 * 60)} min remaining` : 'No leads'}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 card-surface space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Sequence Lifecycle</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Automated outreach progression</p>
            </div>
            <div className="space-y-6 pl-2">
              <TimelineStep label="Day 0" title="Initial Outreach" description="Currently being dispatched to approved leads." status="active" />
              <TimelineStep label={`Day ${campaign.followup1Delay || 3}`} title="Follow-up #1" description="Queued for leads who haven't replied." status="pending" />
              <TimelineStep label={`Day ${campaign.followup2Delay || 7}`} title="Follow-up #2" description="Final touchpoint in the automated cycle." status="pending" />
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 border flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)', borderRadius: 'var(--radius-card)' }}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#EF4444]" />
              <div>
                <p className="text-xs font-bold text-[#F87171]" style={{ fontFamily: 'var(--font-mono)' }}>Emergency Controls</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#FCA5A5' }}>Stop all active outreach cycles immediately.</p>
              </div>
            </div>
            <StopSequencesButton variant="button" />
          </div>
        </div>

        {/* Right Column: Live Feed (5/12) */}
        <div className="flex-1 lg:w-[41.66%] flex flex-col h-[700px] card-surface overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border-muted)', background: 'var(--bg-elevated)' }}>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Live Feed</h2>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#10B981] uppercase tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Real-time
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {recentLeads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-3 text-center p-8">
                <Clock className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium">Waiting for activity...</p>
              </div>
            ) : (
              recentLeads.map((lead: any) => (
                <div key={lead.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-all duration-200" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                    lead.sent ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                  }`}>
                    {lead.sent ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{lead.email}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }} suppressHydrationWarning>
                      {lead.sent ? 'Dispatched' : 'Processing'} · {new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Link href={`/leads/${lead.id}`} className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-[var(--bg-elevated)] text-center" style={{ borderTop: '1px solid var(--border-muted)' }}>
            <Link href={`/campaigns/${campaign.id}`} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
              View Campaign Insights
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`p-5 card-surface border ${border} ${bg} flex flex-col items-center justify-center text-center`}>
      <Icon className={`w-4 h-4 ${color} mb-3`} />
      <p className={`text-3xl font-bold tabular-nums ${color}`} style={{ fontFamily: 'var(--font-mono)' }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>{label}</p>
    </div>
  );
}

function TimelineStep({ label, title, description, status }: any) {
  return (
    <div className="relative pl-6 last:border-0 pb-6 last:pb-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0D0E12] ${
        status === 'active' ? 'bg-[#6366F1] ring-4 ring-[#6366F1]/10' : 'bg-[#16171D]'
      }`} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <span style={{ color: 'var(--border-muted)' }}>·</span>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
      </div>
      <p className="text-xs" style={{ color: '#64748B' }}>{description}</p>
    </div>
  );
}
