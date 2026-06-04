// web/src/app/campaigns/[id]/page.tsx
import prisma from "@/lib/prisma";
import { updateCampaignSetup } from "../actions";

import { Stepper } from "@/components/Stepper";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CampaignSetupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Authenticate user
  let userId: string;
  try {
    const user = await getAuthUser();
    userId = user.id;
  } catch {
    redirect("/login");
    return;
  }

  // 2. Fetch campaign securely (ensuring it belongs to the logged-in user)
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId },
    include: { _count: { select: { leads: true } } }
  });

  if (!campaign) return <div className="p-8 text-center" style={{ color: '#64748B' }}>Campaign not found or unauthorized.</div>;

  // 3. Fetch dependencies
  const settings = await prisma.settings.findUnique({ where: { userId } });
  const strategies = await prisma.strategy.findMany({ orderBy: { name: 'asc' } });

  // 4. Fetch the user's verified SMTP accounts
  const smtpAccounts = await prisma.smtpAccount.findMany({
    where: { userId, isVerified: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      fromEmail: true,
    },
  });

  return (
    <div className="w-full space-y-6">
      <Stepper campaignId={id} />

      <form action={updateCampaignSetup} className="space-y-6">
        <input type="hidden" name="campaignId" value={campaign.id} />

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/campaigns/${campaign.id}`} className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>Campaign</Link>
            <span style={{ color: 'rgba(255,255,255,0.06)' }}>/</span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Configuration</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient tracking-tight">{campaign.name || 'Campaign Setup'}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Define your outreach strategy and AI context</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column: Core Info (7/12) */}
          <div className="flex-1 lg:w-[58.33%] space-y-6">
            <div className="p-6 card-surface space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Campaign Identity</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Define your internal name and outreach context</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Campaign Name</label>
                  <input
                    type="text"
                    name="campaignName"
                    defaultValue={campaign.name || "Untitled Campaign"}
                    className="input-dark w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>AI Author / Sender Name</label>
                    <input
                      type="text"
                      name="senderName"
                      defaultValue={campaign.senderName || "The Example Team"}
                      placeholder="e.g. Your Name or 'GTM Team'"
                      className="input-dark w-full"
                    />
                  </div>

                  {/* SMTP Account Selector */}
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Sending Email (SMTP)</label>
                    <div className="relative">
                      <select
                        name="smtpAccountId"
                        required
                        defaultValue={campaign.smtpAccountId || ""}
                        className="input-dark w-full cursor-pointer appearance-none"
                      >
                        <option value="" disabled>Select an email account...</option>
                        {smtpAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.fromEmail})
                          </option>
                        ))}
                      </select>
                    </div>

                    {smtpAccounts.length === 0 && (
                      <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
                        No SMTP accounts. <Link href="/settings" className="underline hover:text-red-700">Add one in Settings.</Link>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Context for AI <span className="font-normal opacity-50">(anchors personalization)</span></label>
                  <textarea
                    name="context"
                    defaultValue={campaign.context || ""}
                    placeholder="e.g. Offering AI ops support to recently funded startups..."
                    rows={4}
                    className="input-dark w-full resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 card-surface space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Sequence Logic</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Configure follow-up timing and sequence steps</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Follow-up 1</label>
                  <select
                    name="followup1Delay"
                    defaultValue={campaign.followup1Delay}
                    className="input-dark w-full cursor-pointer appearance-none"
                  >
                    {(settings?.followupDelayOptions || "1,3,5,7,10,14").split(',').map((d: string) => (
                      <option key={d} value={d.trim()}>Day {d.trim()} — if no reply</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#64748B' }}>Follow-up 2</label>
                  <select
                    name="followup2Delay"
                    defaultValue={campaign.followup2Delay}
                    className="input-dark w-full cursor-pointer appearance-none"
                  >
                    {(settings?.followupDelayOptions || "1,3,5,7,10,14").split(',').map((d: string) => (
                      <option key={d} value={d.trim()}>Day {d.trim()} — if no reply</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Style & Auto-detected (5/12) */}
          <div className="flex-1 lg:w-[41.66%] space-y-6">
            <div className="p-6 card-surface space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Tone & Strategy</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Refine how the AI communicates</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold mb-3 block" style={{ color: 'var(--text-muted)' }}>AI Outreach Strategy</label>
                  <select
                    name="strategyId"
                    defaultValue={campaign.strategyId || ""}
                    className="input-dark w-full cursor-pointer"
                  >
                    <option value="">Global Default</option>
                    {strategies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-2 italic" style={{ color: '#475569' }}>Select a proven strategy from the Prompt Engineering Studio</p>
                </div>
                <div>
                  <label className="text-xs font-medium mb-3 block" style={{ color: '#64748B' }}>Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {['Professional', 'Friendly', 'Direct'].map(t => (
                      <label key={t} className="cursor-pointer">
                        <input type="radio" name="tone" value={t} className="peer sr-only" defaultChecked={(!campaign.tone && t === 'Professional') || campaign.tone?.includes(t)} />
                        <div className="px-4 py-2 rounded-lg border border-[var(--border-muted)] text-xs font-bold transition-all peer-checked:bg-[var(--text-primary)] peer-checked:text-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--text-faint)]">
                          {t}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium mb-3 block" style={{ color: '#64748B' }}>CTA Style</label>
                  <div className="flex flex-wrap gap-2">
                    {['Book a call', 'Reply back', 'Custom'].map(c => (
                      <label key={c} className="cursor-pointer">
                        <input type="radio" name="cta" value={c} className="peer sr-only" defaultChecked={(!campaign.cta && c === 'Book a call') || campaign.cta?.includes(c)} />
                        <div className="px-4 py-2 rounded-lg border border-[var(--border-muted)] text-xs font-bold transition-all peer-checked:bg-[var(--text-primary)] peer-checked:text-[var(--bg-surface)] text-[var(--text-muted)] hover:border-[var(--text-faint)]">
                          {c}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 card-surface space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Auto-Detected Context</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Refined by AI during lead ingestion</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-tight mb-1 block" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>Business Type</label>
                  <input
                    type="text"
                    name="businessType"
                    defaultValue={campaign.businessType || ""}
                    placeholder="e.g. SaaS, Real Estate..."
                    className="input-dark w-full py-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-tight mb-1 block" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>Geographic Focus</label>
                  <input
                    type="text"
                    name="locationContext"
                    defaultValue={campaign.locationContext || ""}
                    placeholder="e.g. North America, Global..."
                    className="input-dark w-full py-2"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
            >
              Generate {campaign._count.leads} Drafts
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}