"use client";

import { useState, useEffect } from "react";
import { Zap, Loader2, Check, AlertCircle, Play, ShieldCheck, Search, Sparkles, Save, FileText, Target, Info, Layers, UserCircle, Briefcase, HelpCircle, Layout } from "lucide-react";
import { runEvaluationAction, saveStructuredPromptAction, getInitialDataAction, refineStructuredPromptAction, saveAsNewStrategyAction } from "./actions";

export default function AiEvalPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refining, setRefining] = useState(false);
  const [saved, setSaved] = useState(false);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
  const [showSaveNameModal, setShowSaveNameModal] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState("");

  const [result, setResult] = useState<{ score: number; feedback: string; draft: string; subject?: string; rationale?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'structured' | 'preview'>('structured');

  const [form, setForm] = useState({
    role: "Elite B2B sales copywriter specializing in highly technical GTM cold outreach.",
    product: "Example: Advanced AI-driven outreach automation.",
    persona: "VP of Sales, Growth Lead, or Founder.",
    painPoint: "Low reply rates and time-consuming manual research.",
    socialProof: "Helped 50+ SaaS companies double their pipeline.",
    tone: "Peer-to-peer, conversational, and direct.",
    cta: "Is this on your radar for Q3?",
    testNotes: "Vijay is the founder of Example. He is looking for ways to scale his outreach without losing the human touch. He recently posted about the importance of personalized hooks on LinkedIn."
  });

  useEffect(() => {
    async function load() {
      const data = await getInitialDataAction();
      setStrategies(data.strategies || []);
      if (data.structured) {
        setForm(prev => ({
          ...prev,
          role: data.structured.role || prev.role,
          product: data.structured.product || prev.product,
          persona: data.structured.persona || prev.persona,
          painPoint: data.structured.painPoint || prev.painPoint,
          socialProof: data.structured.socialProof || prev.socialProof,
          tone: data.structured.tone || prev.tone,
          cta: data.structured.cta || prev.cta,
        }));
      }
    }
    load();
  }, []);

  const handleSaveNewStrategy = async () => {
    if (!newStrategyName.trim()) return;
    setSaving(true);
    const res = await saveAsNewStrategyAction(newStrategyName, form);
    if (res.success && res.data) {
      setStrategies([(res as any).data, ...strategies]);
      setActiveStrategyId((res as any).data.id);
      setShowSaveNameModal(false);
      setNewStrategyName("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Error: " + (res as any).error);
    }
    setSaving(false);
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const builtPrompt = `Role: ${form.role}

Context:
- Product/Service: ${form.product}
- Target Persona: ${form.persona}
- Core Pain Point: ${form.painPoint}
- Social Proof: ${form.socialProof}

Constraints & Guidelines:
- Tone: ${form.tone}
- CTA: ${form.cta}
- Length: Max 120 words.
- Opening: Start with a specific hook from notes. No "I hope you're well".
- Style: Direct, conversational, zero marketing fluff.
- Spam Avoidance: No sales trigger words (free, guarantee).

Output Format:
- Subject Line Options (3 options)
- Email Body`;

  const handleTest = async () => {
    setLoading(true);
    const res = await runEvaluationAction(builtPrompt, form.testNotes);
    if (res.success && res.data) {
      setResult(res.data as any);
    } else {
      alert("Error: " + (res as any).error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveStructuredPromptAction(form);
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleRefine = async () => {
    if (!result?.feedback) return;
    setRefining(true);
    const res = await refineStructuredPromptAction(form, result.feedback);
    if (res.success && res.data) {
      setForm(prev => ({
        ...prev,
        ...res.data
      }));
      // Clear results so user can test the new prompt
      setResult(null);
    } else {
      alert("Refinement failed: " + (res as any).error);
    }
    setRefining(false);
  };

  return (
    <div className="w-full space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#10B981]" />
            AI Strategy Studio
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Engineer and audit your outreach prompts with high-fidelity simulations.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center justify-center gap-2 px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "STRATEGY SAVED" : "SAVE TO ALL CAMPAIGNS"}
        </button>
      </div>

      {/* Strategy Library */}
      <div className="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="card-elevated p-2">
            <Layout className="w-5 h-5 text-[var(--text-faint)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Active Strategy</p>
            <select
              value={activeStrategyId || ""}
              onChange={(e) => {
                const id = e.target.value;
                setActiveStrategyId(id);
                if (id) {
                  const s = strategies.find(x => x.id === id);
                  if (s) {
                    setForm({
                      role: s.role || "",
                      product: s.product || "",
                      persona: s.persona || "",
                      painPoint: s.painPoint || "",
                      socialProof: s.socialProof || "",
                      tone: s.tone || "",
                      cta: s.cta || "",
                      testNotes: form.testNotes
                    });
                  }
                }
              }}
              className="bg-transparent border-none text-sm font-bold text-[var(--text-primary)] focus:outline-none p-0 w-full cursor-pointer appearance-none"
            >
              <option value="" className="bg-[var(--bg-surface)]">Default (Global Settings)</option>
              {strategies.map(s => (
                <option key={s.id} value={s.id} className="bg-[var(--bg-surface)]">{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveNameModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-muted)] text-[var(--text-muted)] rounded-lg text-[11px] font-bold hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Strategy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Input Sidebar */}
        <div className="space-y-6">
          <div className="card-surface shadow-sm overflow-hidden">
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setActiveTab('structured')}
                className={`flex-1 px-4 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'structured' ? 'bg-white/5 text-[var(--text-primary)] border-b-2 border-[#6366F1]' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <Layers className="w-3.5 h-3.5" />
                Structure
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex-1 px-4 py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'preview' ? 'bg-white/5 text-[var(--text-primary)] border-b-2 border-[#6366F1]' : 'text-[var(--text-faint)] hover:text-[var(--text-muted)]'}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <FileText className="w-3.5 h-3.5" />
                Prompt
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'structured' ? (
                <div className="space-y-6">
                  {/* ROLE */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-[var(--text-faint)]" />
                      <label className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Persona Role</label>
                    </div>
                    <textarea
                      value={form.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className="input-dark w-full h-20"
                    />
                  </div>

                  {/* CONTEXT */}
                  <div className="space-y-4 pt-6" style={{ borderTop: '1px solid var(--border-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[var(--text-faint)]" />
                      <label className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Campaign Context</label>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-tight">Product/Service</p>
                        <input
                          value={form.product}
                          onChange={(e) => handleChange('product', e.target.value)}
                          className="input-dark w-full px-3 py-2"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-tight">Target Persona</p>
                        <input
                          value={form.persona}
                          onChange={(e) => handleChange('persona', e.target.value)}
                          className="input-dark w-full px-3 py-2"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-tight">Pain Point</p>
                        <input
                          value={form.painPoint}
                          onChange={(e) => handleChange('painPoint', e.target.value)}
                          className="input-dark w-full px-3 py-2"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-tight">Social Proof</p>
                        <input
                          value={form.socialProof}
                          onChange={(e) => handleChange('socialProof', e.target.value)}
                          className="input-dark w-full px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CONSTRAINTS */}
                  <div className="space-y-4 pt-6" style={{ borderTop: '1px solid var(--border-muted)' }}>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[var(--text-faint)]" />
                      <label className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Guidelines</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-tight">Tone</p>
                        <input
                          value={form.tone}
                          onChange={(e) => handleChange('tone', e.target.value)}
                          className="input-dark w-full px-3 py-2"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] ml-1 uppercase tracking-tight">Desired CTA</p>
                        <input
                          value={form.cta}
                          onChange={(e) => handleChange('cta', e.target.value)}
                          className="input-dark w-full px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>System Prompt</p>
                  <div className="bg-[var(--bg-sink)] text-[#10B981] p-6 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-[var(--border-muted)] shadow-inner overflow-y-auto max-h-[500px]">
                    {builtPrompt}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Harness */}
          <div className="card-surface p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Test Simulation (Lead Data)</label>
              <div className="flex gap-2">
                <button className="text-[9px] font-bold text-[var(--text-faint)] hover:text-[var(--text-primary)] border border-[var(--border-muted)] px-2 py-1 rounded transition-colors">MOCK DATA</button>
              </div>
            </div>
            <textarea
              value={form.testNotes}
              onChange={(e) => handleChange('testNotes', e.target.value)}
              placeholder="Paste sample lead notes here to test the prompt..."
              className="input-dark w-full h-24"
            />
            <button
              onClick={handleTest}
              disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
              RUN AUDIT SIMULATION
            </button>
          </div>
        </div>

        {/* Results Harness */}
        <div className="space-y-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Score Dashboard */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card-surface p-4 shadow-sm">
                  <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Quality</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-[#10B981]">{result.score}%</span>
                    <span className="text-[10px] text-[var(--text-faint)] mb-1 font-bold">SCORE</span>
                  </div>
                </div>
                <div className="card-surface p-4 shadow-sm col-span-2 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)' }}>Auditor Feedback</p>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">{result.feedback}</p>
                  </div>
                  <button
                    onClick={handleRefine}
                    disabled={refining}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg text-[10px] font-bold hover:bg-[var(--bg-surface)] transition-all disabled:opacity-50"
                  >
                    {refining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-[#6366F1]" />}
                    AUTO-FIX
                  </button>
                </div>
              </div>

              {/* Inbox Simulation */}
              <div className="card-surface overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-[var(--bg-elevated)] flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-muted)' }}>
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-[var(--text-faint)]" />
                    <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Delivery Preview</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/5" />
                  </div>
                </div>

                <div className="p-8">
                  <div className="bg-[#0D0E12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-w-[600px] mx-auto antialiased">
                    <div className="bg-white/5 px-8 py-4 border-b border-white/5">
                      <p className="text-[11px] text-[var(--text-muted)] font-bold uppercase">Subject: <span className="text-[var(--text-primary)] font-bold ml-1">{result.subject || 're: inquiry'}</span></p>
                    </div>
                    <div className="p-10">
                      <div className="text-[15px] text-[var(--text-secondary)] leading-[1.6] whitespace-pre-wrap">
                        {result.draft}
                      </div>

                      <div className="mt-8 pt-8 border-t border-white/5">
                        <p className="text-[15px] text-[#94A3B8] mb-5">Best regards,<br /><strong>The GTM Team</strong></p>
                        <div className="flex gap-3">
                          <div className="w-[3px] h-10 bg-[#6366F1] rounded-sm" />
                          <div>
                            <p className="text-[15px] font-bold text-[var(--text-primary)] leading-tight">GTM Team</p>
                            <p className="text-[13px] font-bold text-[var(--text-faint)]">Outreach Intelligence</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#10B981] mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>Strategy Rationale</p>
                  <p className="text-xs text-[#10B981]/70 italic mt-0.5">{result.rationale}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] border-2 border-dashed border-[var(--border-muted)] bg-[var(--bg-elevated)]/50 rounded-3xl flex flex-col items-center justify-center text-[var(--text-faint)] gap-6">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center animate-pulse">
                <Search className="w-10 h-10 opacity-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-[var(--text-faint)] uppercase tracking-[0.2em]" style={{ fontFamily: 'var(--font-mono)' }}>Auditor Standby</p>
                <p className="text-xs text-[var(--text-muted)] max-w-[240px] mx-auto leading-relaxed">Configure your strategy and run the audit to simulate delivery.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Strategy Modal */}
      {showSaveNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="card-surface shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6" style={{ borderBottom: '1px solid var(--border-muted)' }}>
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#6366F1]" />
                Strategy Library
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Give this strategy a unique identifier.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#475569] uppercase tracking-widest mb-2 block" style={{ fontFamily: 'var(--font-mono)' }}>Strategy Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  placeholder="e.g. Technical SEO Outreach"
                  className="input-dark w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNewStrategy()}
                />
              </div>
            </div>
            <div className="p-6 bg-[var(--bg-elevated)] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSaveNameModal(false)}
                className="px-4 py-2 text-xs font-bold text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-all uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewStrategy}
                disabled={saving || !newStrategyName.trim()}
                className="btn-primary px-6 py-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Library"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
