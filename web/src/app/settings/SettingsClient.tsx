"use client";

import { useState } from "react";
import AccountManager from "./AccountManager";
import { saveSettings } from "./actions";
import { toast } from "sonner";
import { Save, Bot, Mail, Sliders, Zap, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

import type { Settings, SmtpAccountSafe } from "@/types";

interface SettingsClientProps {
  settings: Settings | null;
  accounts: SmtpAccountSafe[];
}

export default function SettingsClient({ settings, accounts }: SettingsClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState({
    ai: true,
    delivery: true,
    smtp: true
  });

  const [showKeys, setShowKeys] = useState({
    gemini: false,
    openai: false,
    groq: false,
    claude: false
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleKey = (key: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>, section: string) => {
    e.preventDefault();
    setLoading(section);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await saveSettings(formData);
      if (res.success) {
        toast.success(`${section} settings saved successfully`);
      } else {
        toast.error(res.error || `Failed to save ${section} settings`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient tracking-tight">Configuration</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Manage your outreach engine, AI models, and email integrations.</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* 1. AI Integration Section */}
        <section className="overflow-hidden transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #3B82F6', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-layered)' }}>
          <div
            onClick={() => toggleSection('ai')}
            className="p-6 cursor-pointer flex items-center justify-between group"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">AI Intelligence</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Configure your LLM providers and primary engine</p>
              </div>
            </div>
            {expanded.ai ? <ChevronDown className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" />}
          </div>

          {expanded.ai && (
            <form onSubmit={(e) => handleSave(e, "AI")} className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Primary AI Provider</label>
                  <select
                    name="aiProvider"
                    defaultValue={settings?.aiProvider || "gemini"}
                    className="input-dark w-full"
                  >
                    <option value="gemini">Google Gemini (Recommended)</option>
                    <option value="openai">OpenAI GPT-4</option>
                    <option value="groq">Groq (Llama 3)</option>
                    <option value="claude">Anthropic Claude</option>
                  </select>
                </div>

                {/* Gemini */}
                <div className="space-y-2">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Gemini API Key</label>
                  <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-input)' }}>
                    <input
                      type={showKeys.gemini ? "text" : "password"}
                      name="geminiApiKey"
                      defaultValue={settings?.geminiApiKey || ""}
                      placeholder="AI Studio Key..."
                      className="w-full py-2.5 text-sm outline-none bg-transparent" style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('gemini')}
                      className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors ml-2"
                    >
                      {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* OpenAI */}
                <div className="space-y-2">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>OpenAI API Key</label>
                  <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-input)' }}>
                    <input
                      type={showKeys.openai ? "text" : "password"}
                      name="openaiApiKey"
                      defaultValue={settings?.openaiApiKey || ""}
                      placeholder="sk-..."
                      className="w-full py-2.5 text-sm outline-none bg-transparent" style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('openai')}
                      className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors ml-2"
                    >
                      {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Groq */}
                <div className="space-y-2">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Groq API Key</label>
                  <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-input)' }}>
                    <input
                      type={showKeys.groq ? "text" : "password"}
                      name="groqApiKey"
                      defaultValue={settings?.groqApiKey || ""}
                      placeholder="gsk_..."
                      className="w-full py-2.5 text-sm outline-none bg-transparent" style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('groq')}
                      className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors ml-2"
                    >
                      {showKeys.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Claude */}
                <div className="space-y-2">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Claude API Key</label>
                  <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-input)' }}>
                    <input
                      type={showKeys.claude ? "text" : "password"}
                      name="claudeApiKey"
                      defaultValue={settings?.claudeApiKey || ""}
                      placeholder="x-api-key..."
                      className="w-full py-2.5 text-sm outline-none bg-transparent" style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleKey('claude')}
                      className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors ml-2"
                    >
                      {showKeys.claude ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading === "AI"}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading === "AI" ? "Saving..." : "Save AI Settings"}
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 2. Outreach Delivery Section */}
        <section className="overflow-hidden transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #F59E0B', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-layered)' }}>
          <div
            onClick={() => toggleSection('delivery')}
            className="p-6 cursor-pointer flex items-center justify-between group"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Delivery Controls</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage throughput and safety limits</p>
              </div>
            </div>
            {expanded.delivery ? <ChevronDown className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" />}
          </div>

          {expanded.delivery && (
            <form onSubmit={(e) => handleSave(e, "Delivery")} className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: '#94A3B8' }}>Max Emails Per Hour (Per Account)</label>
                  <input
                    type="number"
                    name="maxEmailsPerHour"
                    defaultValue={settings?.maxEmailsPerHour || 30}
                    className="input-dark w-full"
                  />
                  <p className="text-[10px] italic" style={{ color: '#475569' }}>Recommended: 20-40 to avoid spam filters.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: '#94A3B8' }}>Follow-up Delay Options (Days)</label>
                  <input
                    type="text"
                    name="followupDelayOptions"
                    defaultValue={settings?.followupDelayOptions || "1,3,5,7,10,14"}
                    className="input-dark w-full"
                  />
                  <p className="text-[10px] italic" style={{ color: '#475569' }}>Comma-separated list of days for sequence steps.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading === "Delivery"}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading === "Delivery" ? "Saving..." : "Save Delivery Settings"}
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 3. SMTP Integrations */}
        <section className="overflow-hidden transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #8B5CF6', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-layered)' }}>
          <div
            onClick={() => toggleSection('smtp')}
            className="p-6 cursor-pointer flex items-center justify-between group"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Email Sending Accounts</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Add and manage SMTP or Gmail connections</p>
              </div>
            </div>
            {expanded.smtp ? <ChevronDown className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" />}
          </div>

          {expanded.smtp && (
            <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <AccountManager initialAccounts={accounts} />
            </div>
          )}
        </section>

      </div>
    </div>
  );
}