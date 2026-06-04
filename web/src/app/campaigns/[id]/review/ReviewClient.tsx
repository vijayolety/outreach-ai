"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import { 
  getLeadsAction, 
  saveDraftAction, 
  approveLeadAction,
  approveAllLeadsAction,
  regenerateDraftAction, 
  sendTestAction 
} from "./actions";
import { 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Check, 
  CheckCheck,
  Send, 
  RefreshCcw, 
  Save, 
  X,
  Mail,
  User,
  Zap,
  ChevronRight,
  Inbox,
  Eye,
  Edit3
} from "lucide-react";
import Link from "next/link";
import type { Lead } from "@/types";

export function ReviewClient({ campaign, initialLeads }: { campaign: any, initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState(initialLeads[0]?.id);
  const [loading, setLoading] = useState<string | null>(null);
  const [regenFeedback, setRegenFeedback] = useState("");
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showTestInput, setShowTestInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'edit'>('edit');
  
  // Controlled form fields — ensures regenerated content updates immediately
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  
  const router = useRouter();

  const draftedLeadsCount = leads.filter(l => l.emailSubject).length;
  const approvedCount = leads.filter(l => l.isApproved).length;
  const needReviewCount = leads.length - draftedLeadsCount;

  // Polling for background generation
  useEffect(() => {
    if (needReviewCount === 0) return;
    const interval = setInterval(async () => {
      const updatedLeads = await getLeadsAction(campaign.id);
      setLeads(updatedLeads);
      const stillNeedsReview = updatedLeads.filter((l: any) => !l.emailSubject).length;
      if (stillNeedsReview === 0) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [needReviewCount, campaign.id]);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  // Sync controlled inputs when selected lead changes
  useEffect(() => {
    if (selectedLead) {
      setEditSubject(selectedLead.emailSubject || "");
      
      // Convert plain text to HTML for ReactQuill if it's not already HTML
      let body = selectedLead.emailBody || "";
      if (body && !body.includes('<p>') && !body.includes('<br>')) {
        // 1. Normalize greeting - Ensure "Hi [Name]," is capitalized and has breaks
        body = body.trim().replace(/^(hi)\s+/i, 'Hi ');
        
        // 2. Ensure greeting has proper spacing
        if (!body.includes('\n\n')) {
          body = body.replace(/^(Hi\s+[^,]+,)\s*/i, '$1\n\n');
        }

        // 3. Fix capitalization of first letter after greeting or breaks
        body = body.replace(/([.!?\n]\s*)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
        
        // 4. Wrap paragraphs
        body = body
          .split(/\n\n+/)
          .filter(p => p.trim())
          .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
          .join('<p><br></p>');
      }
      setEditBody(body);
    }
  }, [selectedLeadId, selectedLead?.emailSubject, selectedLead?.emailBody]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoading("save");
    const result = await saveDraftAction(selectedLead.id, editSubject, editBody, campaign.id);
    if (result.success) {
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, emailSubject: editSubject, emailBody: editBody } : l));
      showStatus('success', 'Draft saved');
    } else {
      showStatus('error', result.error || 'Failed to save');
    }
    setLoading(null);
  };

  const handleApprove = async () => {
    if (!selectedLead) return;
    setLoading("approve");
    const result = await approveLeadAction(selectedLead.id, campaign.id);
    if (result.success) {
      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, isApproved: true } : l));
      showStatus('success', 'Lead approved');
      
      // Auto-select next unapproved lead
      const currentIndex = leads.findIndex(l => l.id === selectedLeadId);
      const nextUnapproved = leads.find((l, i) => i > currentIndex && !l.isApproved && l.emailSubject);
      if (nextUnapproved) {
        setSelectedLeadId(nextUnapproved.id);
      }
    } else {
      showStatus('error', result.error || 'Failed to approve');
    }
    setLoading(null);
  };

  const handleApproveAll = async () => {
    setLoading("approveAll");
    const result = await approveAllLeadsAction(campaign.id);
    if (result.success) {
      setLeads(leads.map(l => l.emailSubject ? { ...l, isApproved: true } : l));
      showStatus('success', `${result.data.count} leads approved`);
    } else {
      showStatus('error', result.error || 'Failed to approve all');
    }
    setLoading(null);
  };

  const handleRegenerate = async () => {
    if (!selectedLead || !regenFeedback.trim()) return;
    setLoading("regenerate");
    const result = await regenerateDraftAction(selectedLead.id, campaign.id, regenFeedback);
    if (result.success) {
      const updated = result.data;
      setLeads(leads.map(l => l.id === updated.id ? updated : l));
      // Immediately update controlled inputs with the new draft
      setEditSubject(updated.emailSubject || "");
      setEditBody(updated.emailBody || "");
      setRegenFeedback("");
      setShowRegenInput(false);
      showStatus('success', 'Draft regenerated');
    } else {
      showStatus('error', result.error || 'Failed to regenerate');
    }
    setLoading(null);
  };

  const handleSendTest = async () => {
    if (!selectedLead || !testEmail.trim()) return;
    setLoading("test");
    const result = await sendTestAction(selectedLead.id, testEmail);
    if (result.success) {
      showStatus('success', 'Test email sent');
      setShowTestInput(false);
      setTestEmail("");
    } else {
      showStatus('error', result.error || 'Failed to send test');
    }
    setLoading(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast */}
      {statusMessage && (
        <div className={`fixed top-24 right-8 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`} role="alert">
          {statusMessage.text}
        </div>
      )}

    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/campaigns/${campaign.id}`} className="text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>Campaign</Link>
            <span style={{ color: 'var(--border-muted)' }}>/</span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Review Workspace</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient tracking-tight">{campaign.name || 'Review Drafts'}</h1>
          <p className="text-sm" style={{ color: '#64748B' }}>{leads.length} leads · {approvedCount} approved · {draftedLeadsCount} drafted</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleApproveAll}
            disabled={loading === 'approveAll' || approvedCount === draftedLeadsCount}
            className="btn-success px-4 py-2.5 flex items-center gap-2"
          >
            {loading === 'approveAll' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Approve All ({draftedLeadsCount - approvedCount})
          </button>
          <Link 
            href={`/campaigns/${campaign.id}/launch`} 
            className="btn-primary px-5 py-2.5 flex items-center gap-2"
          >
            Continue to Launch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6" style={{ height: 'calc(100vh - 220px)', minHeight: '650px' }}>
        
        {/* Left: Queue (4/12) */}
        <div className="flex-1 lg:w-[33.33%] lg:max-w-[33.33%] flex flex-col card-surface overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Sequence Queue</h2>
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#6366F1]" style={{ fontFamily: 'var(--font-mono)' }}>
              {approvedCount}/{leads.length} Approved
            </span>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {leads.map((lead, idx) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`w-full text-left p-4 flex items-center gap-4 transition-all duration-200 ${
                  selectedLeadId === lead.id ? 'bg-white/5 border-l-2 border-[#6366F1]' : 'hover:bg-white/[0.02] border-l-2 border-transparent'
                }`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
              >
                <div className="text-[10px] font-bold text-[#475569] w-4" style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${selectedLeadId === lead.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{lead.companyName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {lead.isApproved ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : lead.emailSubject === "Error" ? (
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Generation Failed" />
                  ) : lead.emailSubject ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-200" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Workspace (8/12) */}
        <div className="flex-1 lg:w-[66.66%] flex flex-col card-surface overflow-hidden">
          {selectedLead ? (
            <>
              {/* Workspace Header */}
              <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.06)', color: '#94A3B8' }}>
                    {selectedLead.firstName[0]}{selectedLead.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{selectedLead.firstName} {selectedLead.lastName}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedLead.jobTitle} at {selectedLead.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setShowTestInput(!showTestInput); setShowRegenInput(false); }}
                    disabled={selectedLead.emailSubject === "Error"}
                    className="flex items-center gap-2 px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors disabled:opacity-30"
                    title="Send test email"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-medium">Test</span>
                  </button>
                  <button 
                    onClick={() => { setShowRegenInput(!showRegenInput); setShowTestInput(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors"
                    title="Regenerate draft"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span className="text-xs font-medium">{selectedLead.emailSubject === "Error" ? "Try Again" : "Regenerate"}</span>
                  </button>
                  <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <button
                    onClick={handleApprove}
                    disabled={loading === 'approve' || selectedLead.isApproved || selectedLead.emailSubject === "Error" || !selectedLead.emailSubject}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      selectedLead.isApproved 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default' 
                        : 'btn-primary'
                    }`}
                  >
                    {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    {selectedLead.isApproved ? 'Approved' : 'Approve'}
                  </button>
                </div>
              </div>

              {/* Inline Inputs */}
              {(showRegenInput || showTestInput) && (
                <div className="px-6 py-3 border-b flex items-center gap-3 shrink-0" style={{ background: 'rgba(255,255,255,0.03)', borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                  {showRegenInput ? (
                    <>
                      <input 
                        type="text"
                        value={regenFeedback}
                        onChange={(e) => setRegenFeedback(e.target.value)}
                        placeholder={selectedLead.emailSubject === "Error" ? "Provide context to fix error..." : "Feedback for AI (e.g. 'Make it shorter')"}
                        className="input-dark flex-1 py-1.5 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleRegenerate()}
                      />
                      <button onClick={handleRegenerate} disabled={loading === 'regenerate'} className="btn-primary px-3 py-1.5 text-[11px] font-bold">
                        {loading === 'regenerate' ? <Loader2 className="w-3 h-3 animate-spin" /> : (selectedLead.emailSubject === "Error" ? "Retry" : "Regenerate")}
                      </button>
                    </>
                  ) : (
                    <>
                      <input 
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="Send test email to..."
                        className="input-dark flex-1 py-1.5 text-xs"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
                      />
                      <button onClick={handleSendTest} disabled={loading === 'test'} className="btn-primary px-3 py-1.5 text-[11px] font-bold">
                        Send Test
                      </button>
                    </>
                  )}
                  <button onClick={() => { setShowRegenInput(false); setShowTestInput(false); }} className="text-[var(--text-faint)] hover:text-[var(--text-primary)] p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Editor Surface */}
              {!selectedLead.emailSubject ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium">AI Drafting in progress...</p>
                </div>
              ) : selectedLead.emailSubject === "Error" ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <X className="w-8 h-8 text-[#EF4444]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">AI Generation Failed</h3>
                    <p className="text-sm max-w-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                      There was an error generating this draft. This usually happens if your AI provider API key is missing or invalid.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/settings" className="text-xs font-bold text-[#6366F1] hover:underline">Check AI Settings</Link>
                    <span style={{ color: 'var(--border-muted)' }}>|</span>
                    <button onClick={() => setShowRegenInput(true)} className="text-xs font-bold text-[var(--text-primary)] hover:underline">Try Again</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
                  {/* Scrollable area: subject + body only */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Subject</label>
                      <input 
                        type="text" 
                        name="subject" 
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="input-dark w-full py-3 font-medium"
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex-1 flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Message Content</label>
                        </div>

                        <div className="flex-1 card-surface overflow-hidden flex flex-col" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <div className="flex-1 flex flex-col [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-[var(--border-muted)] [&_.ql-toolbar]:bg-[var(--bg-elevated)]/50 [&_.ql-container]:border-none [&_.ql-container]:flex-1 [&_.ql-editor]:min-h-full [&_.ql-editor]:text-sm [&_.ql-editor]:text-[var(--text-primary)] [&_.ql-editor]:leading-relaxed [&_.ql-editor]:p-4 [&_p]:mb-4">
                            <ReactQuill 
                              theme="snow" 
                              value={editBody} 
                              onChange={setEditBody}
                              modules={{
                                toolbar: [
                                  ['bold', 'italic', 'underline', 'strike'],
                                  [{ list: 'ordered' }, { list: 'bullet' }],
                                  ['link', 'clean']
                                ]
                              }}
                              className="h-full flex flex-col"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fixed footer: rationale + save button — always visible */}
                  <div className="px-6 py-4 border-t flex items-center justify-between shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                      <div className="flex items-center gap-1.5 px-2 py-1 border rounded-md shrink-0" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' }}>
                        <Zap className="w-3 h-3 text-[#6366F1]" />
                        <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: '#818CF8', fontFamily: 'var(--font-mono)' }}>AI Strategy</span>
                      </div>
                      <p className="text-[11px] font-bold italic line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                        "{selectedLead.aiRationale || 'Highly personalized based on lead notes'}"
                      </p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading === 'save'} 
                      className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0"
                    >
                      {loading === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-4">
              <Inbox className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">Select a lead to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
