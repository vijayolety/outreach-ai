// src/app/campaigns/[id]/setup/page.tsx
// Campaign setup page — server component with parallel data fetching

import prisma from "@/lib/prisma";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { updateCampaignSetup } from "../../actions";
import { Stepper } from "@/components/Stepper";
import { ArrowRight } from "lucide-react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CampaignSetupPage({ params }: PageProps) {
  // Auth
  const user = await getAuthUser();
  const userId = user.id;

  // Params
  const { id } = await params;

  // Parallel queries — all use proper select/include optimization
  const [campaign, settings, strategies, smtpAccounts] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id, userId },
      include: {
        _count: { select: { leads: true } },
      },
    }),

    prisma.settings.findUnique({
      where: { userId },
      select: {
        followupDelayOptions: true,
      },
    }),

    prisma.strategy.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.smtpAccount.findMany({
      where: { isVerified: true, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        fromEmail: true,
        isVerified: true,
      },
    }),
  ]);

  if (!campaign) {
    return (
      <div className="p-8 text-center" style={{ color: '#64748B' }}>
        Campaign not found
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Stepper campaignId={id} />

      <form action={updateCampaignSetup} className="space-y-6">
        <input type="hidden" name="campaignId" value={campaign.id} />

        {/* Header */}
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="text-[10px] font-bold uppercase tracking-widest transition-colors"
              style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}
            >
              Campaign
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.06)' }}>/</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>
              Configuration
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gradient">
            {campaign.name || "Campaign Setup"}
          </h1>

          <p className="text-sm" style={{ color: '#64748B' }}>
            Define your outreach strategy and AI context
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* LEFT COLUMN */}
          <div className="flex-1 space-y-6 lg:w-[58.33%]">
            {/* Campaign Identity */}
            <div className="space-y-6 card-surface p-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Campaign Identity
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Define your internal name and outreach context
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    name="campaignName"
                    defaultValue={campaign.name || ""}
                    className="input-dark w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>
                    AI Author / Sender Name
                  </label>
                  <input
                    type="text"
                    name="senderName"
                    defaultValue={campaign.senderName || ""}
                    placeholder="Your Name or GTM Team"
                    className="input-dark w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    Context for AI
                  </label>
                  <textarea
                    name="context"
                    rows={4}
                    defaultValue={campaign.context || ""}
                    placeholder="Offering AI ops support..."
                    className="input-dark w-full resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Followups */}
            <div className="space-y-6 card-surface p-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Sequence Logic
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Configure follow-up timing
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[1, 2].map((step) => (
                  <div key={step}>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>
                      Follow-up {step}
                    </label>
                    <select
                      name={`followup${step}Delay`}
                      defaultValue={
                        step === 1
                          ? campaign.followup1Delay
                          : campaign.followup2Delay
                      }
                      className="input-dark w-full cursor-pointer appearance-none"
                    >
                      {(settings?.followupDelayOptions || "1,3,5,7,10,14")
                        .split(",")
                        .map((delay) => (
                          <option key={delay} value={delay.trim()} className="bg-[var(--bg-surface)]">
                            Day {delay.trim()}
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex-1 space-y-6 lg:w-[41.66%]">
            {/* Strategy & SMTP */}
            <div className="space-y-6 card-surface p-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Tone & Strategy
                </h3>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Configure outreach behavior
                </p>
              </div>

              {/* SMTP Account Selector */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>
                  Sending Email Account
                </label>
                <select
                  name="smtpAccountId"
                  defaultValue={campaign.smtpAccountId || ""}
                  className="input-dark w-full cursor-pointer appearance-none"
                >
                  <option value="" className="bg-[var(--bg-surface)]">Select Sending Account...</option>
                  {smtpAccounts.map((account) => (
                    <option key={account.id} value={account.id} className="bg-[var(--bg-surface)]">
                      {account.name} ({account.fromEmail})
                    </option>
                  ))}
                </select>

                {smtpAccounts.length === 0 && (
                  <p className="mt-2 text-[10px] text-[#EF4444] font-bold uppercase tracking-tight">
                    No SMTP accounts found.{" "}
                    <Link href="/settings" className="underline">
                      Add one in settings
                    </Link>
                  </p>
                )}
              </div>

              {/* AI Strategy Selector */}
              {strategies.length > 0 && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>
                    AI Strategy
                  </label>
                  <select
                    name="strategyId"
                    defaultValue={campaign.strategyId || ""}
                    className="input-dark w-full cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-[var(--bg-surface)]">Default Strategy</option>
                    {strategies.map((strategy) => (
                      <option key={strategy.id} value={strategy.id} className="bg-[var(--bg-surface)]">
                        {strategy.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tone Selector */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>
                  Tone
                </label>
                <select
                  name="tone"
                  defaultValue={campaign.tone || "Professional"}
                  className="input-dark w-full cursor-pointer appearance-none"
                >
                  <option value="Professional" className="bg-[var(--bg-surface)]">Professional</option>
                  <option value="Conversational" className="bg-[var(--bg-surface)]">Conversational</option>
                  <option value="Friendly" className="bg-[var(--bg-surface)]">Friendly</option>
                  <option value="Direct" className="bg-[var(--bg-surface)]">Direct</option>
                  <option value="Casual" className="bg-[var(--bg-surface)]">Casual</option>
                  <option value="Formal" className="bg-[var(--bg-surface)]">Formal</option>
                </select>
              </div>

              {/* CTA Selector */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>
                  Call to Action
                </label>
                <select
                  name="cta"
                  defaultValue={campaign.cta || "Book a call"}
                  className="input-dark w-full cursor-pointer appearance-none"
                >
                  <option value="Book a call" className="bg-[var(--bg-surface)]">Book a call</option>
                  <option value="Reply to this email" className="bg-[var(--bg-surface)]">Reply to this email</option>
                  <option value="Visit our site" className="bg-[var(--bg-surface)]">Visit our site</option>
                  <option value="Schedule a demo" className="bg-[var(--bg-surface)]">Schedule a demo</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Generate {campaign._count.leads} Drafts
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}