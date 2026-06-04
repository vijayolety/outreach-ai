"use client";

import { useState } from "react";
import { startCampaignAction } from "./actions";
import { Check, Loader2, Rocket, Clock, ShieldAlert, Send, Users, Activity } from "lucide-react";
import { StopSequencesButton } from "../../../StopSequencesButton";
import Link from "next/link";

export function LaunchClient({ campaign, smtpAccount, settings, totalLeads, readyLeads }: any) {
  const [loading, setLoading] = useState(false);

  // Extract user email from smtpAccount config if available
  let senderEmail = "Not configured";
  let isAccountConnected = false;

  try {
    if (smtpAccount) {
      // Use the specific account selected for this campaign
      senderEmail = smtpAccount.fromEmail || smtpAccount.username || smtpAccount.name;
      isAccountConnected = true;
    }
  } catch (error) {
    console.error("Error resolving selected SMTP account:", error);
  }

  const canLaunch = readyLeads > 0 && isAccountConnected;
  const pendingLeads = totalLeads - readyLeads;

  const handleLaunch = async () => {
    setLoading(true);
    await startCampaignAction(campaign.id);
    window.location.href = `/campaigns/${campaign.id}/sending`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/campaigns/${campaign.id}`} className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>Campaign</Link>
          <span style={{ color: 'var(--border-muted)' }}>/</span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Launch Control</span>
        </div>
        <h1 className="text-3xl font-bold text-gradient tracking-tight">{campaign.name || 'Ready to Launch'}</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Final review before starting automated outreach</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Summary (7/12) */}
        <div className="flex-1 lg:w-[58.33%] space-y-6">
          <div className="p-6 card-surface space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Campaign Summary</h3>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Final review of your sequence configuration</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SummaryItem icon={Rocket} label="Campaign" value={campaign.name || "Untitled"} />
              <SummaryItem icon={Users} label="Total Leads" value={totalLeads} />
              <SummaryItem icon={Send} label="Sender Address" value={senderEmail} />
              <SummaryItem icon={Activity} label="Send Rate" value={`${settings?.maxEmailsPerHour || 30}/hr`} />
              <SummaryItem icon={Clock} label="Est. Completion" value={`~${Math.max(1, Math.ceil(totalLeads / (settings?.maxEmailsPerHour || 30)))} hours`} />
            </div>
          </div>

          <div className="p-6 card-surface space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Sequence Timeline</h3>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Automatic follow-up progression</p>
            </div>
            
            <div className="space-y-6 pl-2">
              <TimelineStep label="Day 0" title="Initial Outreach" description="Personalized email will be sent immediately." status="active" />
              <TimelineStep label={`Day ${campaign.followup1Delay || 3}`} title="Follow-up #1" description="Sent only if no reply is detected." status="pending" />
              <TimelineStep label={`Day ${campaign.followup2Delay || 7}`} title="Follow-up #2" description="Final touchpoint for non-responsive leads." status="pending" />
            </div>
          </div>
        </div>

        {/* Right Column: Checklist & Action (5/12) */}
        <div className="flex-1 lg:w-[41.66%] space-y-6">
          <div className="p-6 card-surface space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Pre-send Checklist</h3>
              <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Safety checks before starting</p>
            </div>
            
            <ul className="space-y-4">
              <CheckItem label="Sender account connected" checked={isAccountConnected} />
              <CheckItem label={`${totalLeads} leads validated`} checked={totalLeads > 0} />
              <CheckItem label={`${readyLeads} drafts approved`} checked={readyLeads > 0} />
              <CheckItem label="Rate limits configured" checked={!!settings?.maxEmailsPerHour} />
            </ul>

            {pendingLeads > 0 && (
              <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}>
                <ShieldAlert className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed" style={{ color: '#FCD34D' }}>
                  <span className="font-semibold">{pendingLeads} leads</span> are still pending review and will <span className="font-semibold">not</span> be sent until approved.
                </p>
              </div>
            )}

            <button 
              onClick={handleLaunch} 
              disabled={loading || !canLaunch}
              className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
              Launch Campaign
            </button>
          </div>

          <div className="p-6 border space-y-4" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)', borderRadius: 'var(--radius-card)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#F87171]" style={{ fontFamily: 'var(--font-mono)' }}>Emergency Kill Switch</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#FCA5A5' }}>
              Stop all active outreach cycles immediately if you detect logic errors or drift.
            </p>
            <StopSequencesButton variant="button" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="p-3.5 border" style={{ background: 'var(--bg-elevated)', borderColor: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-badge)' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3 h-3 text-[#475569]" />
        <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{label}</span>
      </div>
      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{value}</p>
    </div>
  );
}

function TimelineStep({ label, title, description, status }: { label: string; title: string; description: string; status: 'active' | 'pending' }) {
  return (
    <div className="relative pl-6 last:border-0 pb-6 last:pb-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
      <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0D0E12] ${status === 'active' ? 'bg-[#6366F1] ring-4 ring-[#6366F1]/10' : 'bg-[#16171D]'}`} />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <span style={{ color: 'var(--border-muted)' }}>·</span>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
      </div>
      <p className="text-xs" style={{ color: '#64748B' }}>{description}</p>
    </div>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${checked ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--bg-elevated)] text-[var(--text-faint)]'}`}>
        <Check className="w-3 h-3" />
      </div>
      <span className={`text-sm font-bold ${checked ? 'text-[var(--text-primary)]' : 'text-[var(--text-faint)]'}`}>{label}</span>
    </li>
  );
}
