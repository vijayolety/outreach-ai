"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Clock,
  Pause,
  Play,
  ChevronDown,
  MessageCircle,
  RefreshCcw,
  Loader2,
  Zap,
  Mail,
  Building,
  MapPin,
} from "lucide-react";
import {
  updateLeadStatusAction,
  sendReplyAction,
  generateAIReplyAction,
  syncLeadInboxAction,
} from "./actions";
import type { LeadWithMessages } from "@/types";

// Enhanced helper function to format message content for professional readability
function formatMessageContent(text: string) {
  if (!text) return "";

  let cleanText = text;

  // 1. Handle potential JSON artifacts if the AI returned a raw object string
  if (cleanText.trim().startsWith('{') && cleanText.trim().endsWith('}')) {
    try {
      const parsed = JSON.parse(cleanText.trim());
      cleanText = parsed.message || parsed.content || parsed.body || parsed.emailBody || cleanText;
    } catch (e) {
      // Fallback to raw text if not valid JSON
    }
  }

  // 2. Strip AI internal tags and reasoning blocks
  cleanText = cleanText.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
  cleanText = cleanText.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  
  // 3. Remove markdown code block wrappers
  cleanText = cleanText.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "");

  // 4. Strip specific wrapping tags occasionally produced by LLMs
  const artifacts = ['message', 'email', 'response', 'draft', 'subject', 'body'];
  artifacts.forEach(tag => {
    const start = new RegExp(`<${tag}>`, 'gi');
    const end = new RegExp(`<\\/${tag}>`, 'gi');
    cleanText = cleanText.replace(start, "").replace(end, "");
  });

  // 5. Clean up redundant "Subject:" lines if they appear in the body
  cleanText = cleanText.replace(/^Subject:\s?.*\n/i, "");

  // 6. Split and format lines
  return cleanText.trim().split("\n").map((line, idx) => {
    let lineText = line.trim();
    
    // Skip empty lines with a spacer
    if (!lineText) return <div key={idx} className="h-3" />;

    // Convert markdown bullets to clean glyphs
    if (lineText.startsWith("* ") || lineText.startsWith("- ")) {
      lineText = "• " + lineText.substring(2);
    }

    // Process bolding (**text**) using safe replacement
    const boldRegex = /\*\*(.*?)\*\*/g;
    if (boldRegex.test(lineText)) {
      return (
        <p
          key={idx}
          className="mb-1 leading-relaxed text-[var(--text-secondary)]"
          dangerouslySetInnerHTML={{
            __html: lineText.replace(boldRegex, '<strong class="text-[var(--brand-primary)] font-semibold">$1</strong>'),
          }}
        />
      );
    }

    return <p key={idx} className="mb-1 leading-relaxed text-[var(--text-secondary)]">{lineText}</p>;
  });
}

export function LeadDetailClient({ lead: initialLead }: { lead: LeadWithMessages }) {
  const [lead, setLead] = useState(initialLead);
  const [replyText, setReplyText] = useState("");
  const [aiRationale, setAiRationale] = useState("");
  const [regenComment, setRegenComment] = useState("");
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [lead.messages]);

  const showStatus = useCallback((type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  }, []);

  const handleGenerateAI = async (feedback?: string) => {
    setGenerating(true);
    setShowRegenInput(false);
    setRegenComment("");
    const result = await generateAIReplyAction(lead.id, feedback);
    if (result.success) {
      setReplyText(result.data.draft);
      setAiRationale(result.data.rationale);
    } else {
      showStatus("error", result.error);
    }
    setGenerating(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    const result = await sendReplyAction(lead.id, replyText);
    if (result.success) {
      setLead(result.data);
      setReplyText("");
      setAiRationale("");
      showStatus("success", "Reply sent");
    } else {
      showStatus("error", result.error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    const result = await updateLeadStatusAction(lead.id, newStatus);
    if (result.success) setLead(result.data);
    else showStatus("error", result.error);
  };

  const handleSync = async () => {
    setLoading(true);
    const result = await syncLeadInboxAction(lead.id);
    if (result.success) {
      if (result.data.newMessages > 0) {
        showStatus("success", `${result.data.newMessages} new message(s) synced`);
        window.location.reload();
      } else {
        showStatus("success", "No new messages");
      }
    } else {
      showStatus("error", result.error);
    }
    setLoading(false);
  };

  const relevantMessages = lead.messages.filter(m => m.leadId === lead.id);

  return (
    // Global container wrapper updated to fit the tactical dark theme
    <div className="space-y-6 text-[var(--text-primary)] select-none overflow-x-hidden w-full max-w-full">
      {/* Status toast updated to neon styling */}
      {statusMessage && (
        <div className={`fixed top-20 right-6 z-[100] px-4 py-2.5 rounded-none border shadow-2xl text-xs font-mono tracking-widest uppercase ${statusMessage.type === "success"
            ? "bg-[var(--bg-elevated)] border-emerald-500 text-emerald-500 shadow-[var(--shadow-glow-primary)]"
            : "bg-[var(--bg-elevated)] border-red-500 text-red-500 shadow-[var(--shadow-lg)]"
          }`} role="alert">
          {statusMessage.text}
        </div>
      )}

      {/* Bento Grid Layout - Ensured strict full width control */}
      <div className="flex flex-col lg:flex-row gap-6 w-full overflow-x-hidden">

        {/* Left Column: Lead Info + Actions Card (4/12 width mapping) */}
        <div className="flex-1 lg:w-[33.33%] space-y-4 min-w-0">

          {/* Lead Profile Card: Dark cyberpunk style, orange left border indicator */}
          <div className="p-6 rounded-none border border-[var(--border-muted)] border-l-[4px] border-l-[#FFAB00] bg-[var(--bg-surface)] shadow-[var(--shadow-layered)]">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-none bg-[var(--bg-elevated)] border border-[var(--border-muted)] flex items-center justify-center text-md font-mono font-bold text-[#FFAB00]">
                {lead.firstName[0]}{lead.lastName?.[0] || ""}
              </div>
              <div className="min-w-0">
                <h1 className="text-md font-bold tracking-tight uppercase text-[var(--text-primary)] truncate font-sans">{lead.firstName} {lead.lastName}</h1>
                <p className="text-[10px] font-mono tracking-widest text-[#FF6D00] uppercase truncate font-bold">{lead.jobTitle || "LEAD TARGET"}</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-[11px] tracking-wide">
              <InfoRow icon={Building} label={lead.companyName} />
              <InfoRow icon={Mail} label={lead.email} />
              {lead.city && <InfoRow icon={MapPin} label={`${lead.city}${lead.country ? `, ${lead.country}` : ""}`} />}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-[#FFAB00]/10">
              <span className={`px-2.5 py-0.5 rounded-none text-[10px] font-mono uppercase font-medium border ${lead.status === "Hot" ? "bg-[#5C3A0B]/40 text-[#FFAB00] border-[#FFAB00]/40"
                  : lead.status === "Warm" || lead.status === "Opened" || lead.opened ? "bg-amber-950/40 text-amber-400 border-amber-500/30"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800"
                }`}>
                {lead.status === "Opened" || lead.opened ? "Opened" : lead.status}
              </span>
              {lead.sent && <span className="px-2 py-0.5 rounded-none text-[10px] font-mono uppercase bg-blue-950/40 text-blue-400 border border-blue-500/30">Sent</span>}
              {lead.replied && <span className="px-2 py-0.5 rounded-none text-[10px] font-mono uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">Replied</span>}
              {lead.isPaused && <span className="px-2 py-0.5 rounded-none text-[10px] font-mono uppercase bg-amber-950/40 text-amber-500 border border-amber-500/30">Paused</span>}
            </div>
          </div>

          {/* Actions Card: Integrated interactive group tooltips for hover function identification */}
          <div className="p-5 rounded-none border border-[var(--border-muted)] border-l-[4px] border-l-[#FF6D00] bg-[var(--bg-surface)] space-y-3">
            <p className="text-[10px] font-mono font-bold tracking-widest text-[var(--text-faint)] uppercase">System Controls</p>
            <div className="grid grid-cols-2 gap-2">

              {/* Mark Hot Button */}
              <div className="relative group">
                <button onClick={() => handleStatusChange("Hot")} className={`w-full py-2.5 rounded-none text-[11px] font-mono uppercase font-bold border transition-all duration-200 ${lead.status === "Hot" ? "bg-[#FFAB00] text-black border-[#FFAB00]" : "border-[var(--border-muted)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[#FFAB00]/50 hover:text-[var(--text-primary)]"}`}>
                  Mark Hot
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-black border border-[#FFAB00] text-[#FFAB00] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg">
                  Elevate priority status to hot
                </div>
              </div>

              {/* Mark Won Button */}
              <div className="relative group">
                <button onClick={() => handleStatusChange("Closed")} className="w-full py-2.5 rounded-none text-[11px] font-mono uppercase font-bold border border-[var(--border-muted)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-emerald-500/50 hover:text-emerald-400 transition-all duration-200">
                  Mark Won
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-black border border-emerald-500 text-emerald-400 text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg">
                  Close deal as successfully won
                </div>
              </div>

              {/* Pause/Resume Button */}
              <div className="relative group">
                <button onClick={() => handleStatusChange(lead.isPaused ? "resume" : "pause")} className="w-full py-2.5 rounded-none text-[11px] font-mono uppercase font-bold border border-[var(--border-muted)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-amber-500/50 hover:text-amber-400 transition-all duration-200 flex items-center justify-center gap-1.5">
                  {lead.isPaused ? <Play className="w-3 h-3 text-[#FFAB00]" /> : <Pause className="w-3 h-3 text-[#FF6D00]" />}
                  {lead.isPaused ? "Resume" : "Pause"}
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-black border border-amber-500 text-amber-400 text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg">
                  {lead.isPaused ? "Re-activate automated message cycles" : "Halt sequence drip execution"}
                </div>
              </div>

              {/* Sync Inbox Button */}
              <div className="relative group">
                <button onClick={handleSync} disabled={loading} className="w-full py-2.5 rounded-none text-[11px] font-mono uppercase font-bold border border-[var(--border-muted)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[#FFAB00]/50 hover:text-[var(--text-primary)] transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-30">
                  <Clock className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  Sync Inbox
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-black border border-[#FFAB00] text-[#FFAB00] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg">
                  Fetch live email thread changes
                </div>
              </div>

            </div>
          </div>

          {/* AI Rationale / Strategy Box */}
          {aiRationale && (
            <div className="p-5 rounded-none border border-blue-500/30 bg-blue-500/5 shadow-[var(--shadow-lg)]">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-[10px] font-mono tracking-widest uppercase text-blue-500 font-bold">AI Tactical Strategy</p>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">{aiRationale}</p>
            </div>
          )}
        </div>

        {/* Right Column: Thread + Composer (8/12 width mapping) */}
        <div className="flex-1 lg:w-[66.66%] flex flex-col min-h-0 min-w-0 overflow-x-hidden">

          {/* Message Thread Container - Sharp border configuration with subtle gradient background layout */}
          <div className="flex-1 rounded-none border border-[var(--border-muted)] bg-[var(--bg-surface)] overflow-hidden flex flex-col shadow-[var(--shadow-layered)] w-full max-w-full" style={{ minHeight: "530px" }}>
            <div className="px-6 py-4 border-b border-[var(--border-muted)] flex items-center justify-between bg-[var(--bg-elevated)]">
              <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-[var(--text-primary)]">Communications Log</h2>
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#FFAB00] bg-[#5C3A0B]/10 px-2 py-0.5 border border-[#FFAB00]/20">
                {relevantMessages.length + (lead.sent ? 1 : 0)} entries
              </span>
            </div>

            {/* Conversation Core Thread Box - explicit break-words and hidden overflow-x strictly prevents page scroll bars */}
            <div ref={threadRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-5 break-words w-full max-w-full" style={{ scrollbarWidth: "thin", maxHeight: "420px" }}>

              {/* Initial Outreach message mapping */}
              {lead.sent && lead.emailBody && (
                <div className="flex justify-end w-full max-w-full">
                  <div className="bg-[var(--bg-elevated)] rounded-none p-5 max-w-[85%] border border-[var(--border-muted)] break-words w-full">
                    <div className="flex items-center gap-2 mb-2 border-b border-[var(--border-muted)] pb-1.5">
                      <Zap className="w-3 h-3 text-[#FFAB00]" />
                      <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#FFAB00]">Outbound Lead Inception</span>
                    </div>
                    {lead.emailSubject && (
                      <p className="text-xs font-mono font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider"><span className="text-[var(--text-faint)]">SUBJ:</span> {lead.emailSubject}</p>
                    )}
                    <div className="text-sm text-[var(--text-primary)] leading-relaxed font-sans break-words whitespace-pre-wrap">
                      {formatMessageContent(lead.emailBody)}
                    </div>
                  </div>
                </div>
              )}

              {/* Thread Messages layout mapping */}
              {relevantMessages.map(msg => (
                <div key={msg.id} className={`flex w-full max-w-full ${msg.role === "LEAD" ? "justify-start" : "justify-end"}`}>
                  <div className={`rounded-none p-5 max-w-[85%] border break-words w-full ${msg.role === "LEAD"
                      ? "bg-[var(--bg-surface)] border-[var(--border-muted)] border-l-[3px] border-l-[#FFAB00]"
                      : "bg-[var(--bg-elevated)] border-[var(--border-muted)]"
                    }`}>
                    <div className="flex items-center justify-between mb-2 border-b border-[var(--border-muted)] pb-1.5 font-mono text-[10px] tracking-wider">
                      <span className={msg.role === "LEAD" ? "text-[#FFAB00] font-bold" : "text-[var(--text-faint)]"}>
                        {msg.role === "LEAD" ? `${lead.firstName} ${lead.lastName} (INBOUND)` : "YOU (OUTBOUND)"}
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    {/* Integrated parsing layer cleans any raw text markup markers safely */}
                    <div className="text-sm text-[var(--text-primary)] leading-relaxed font-sans break-words whitespace-pre-wrap">
                      {formatMessageContent(msg.content)}
                    </div>
                  </div>
                </div>
              ))}

              {relevantMessages.length === 0 && !lead.sent && (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <MessageCircle className="w-8 h-8 text-[var(--text-faint)] mb-3" />
                  <p className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)]">No telemetry log lines generated yet</p>
                </div>
              )}
            </div>

            {/* Composer Input Area */}
            <div className="border-t border-[var(--border-muted)] p-5 space-y-4 bg-[var(--bg-elevated)]">
              <div className="relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Draft system outbox reply packet..."
                  rows={4}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-muted)] rounded-none px-4 py-3 text-sm text-[var(--text-primary)] font-sans resize-none focus:outline-none focus:border-[#FFAB00]/60 transition-colors placeholder:text-[var(--text-muted)]"
                  aria-label="Reply content"
                />
                {generating && (
                  <div className="absolute inset-0 bg-[var(--bg-sink)]/90 rounded-none flex items-center justify-center gap-2 border border-[#FFAB00]/30 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFAB00]" />
                    <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#FFAB00]">Synthesizing response draft...</span>
                  </div>
                )}
              </div>

              {/* Feedback Loop Refinement Entry Input */}
              {showRegenInput && (
                <div className="flex gap-2 bg-[var(--bg-sink)] p-2 border border-[var(--border-muted)]">
                  <input
                    type="text"
                    value={regenComment}
                    onChange={(e) => setRegenComment(e.target.value)}
                    placeholder="Provide alignment guidelines (e.g., make it shorter, more formal)..."
                    className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded-none px-3 py-2 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#FFAB00]/50 placeholder:text-[var(--text-faint)]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && regenComment.trim()) handleGenerateAI(regenComment);
                    }}
                  />
                  <button
                    onClick={() => handleGenerateAI(regenComment)}
                    disabled={generating}
                    className="px-4 py-2 bg-[#FFAB00] text-black rounded-none text-[11px] font-mono uppercase tracking-widest font-bold hover:bg-[#FF6D00] transition-colors disabled:opacity-40"
                  >
                    Iterate
                  </button>
                  <button onClick={() => { setShowRegenInput(false); setRegenComment(""); }} className="px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono text-[11px] uppercase tracking-wider">
                    Abort
                  </button>
                </div>
              )}

              {/* Control Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2">

                <div className="relative group">
                  <button
                    onClick={() => handleGenerateAI()}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A2A3A]/60 border border-[#FFAB00]/30 hover:bg-[#1A2A3A] rounded-none text-[11px] font-mono uppercase tracking-widest text-[#FFAB00] transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6D00]" />
                    {replyText ? "AI Re-Draft Pattern" : "Generate AI Draft"}
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 bg-[var(--bg-surface)] border border-[#FFAB00] text-[#FFAB00] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg">
                    Use language models to generate contextual message templates
                  </div>
                </div>

                {replyText && (
                  <div className="relative group">
                    <button
                      onClick={() => setShowRegenInput(!showRegenInput)}
                      className="flex items-center gap-1.5 px-3 py-2.5 border border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] text-[11px] font-mono uppercase tracking-widest transition-colors"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Refine with details
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-[var(--bg-surface)] border border-[var(--border-muted)] text-[var(--text-secondary)] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg">
                      Input custom context optimization rules
                    </div>
                  </div>
                )}

                <div className="ml-auto relative group">
                  <button
                    onClick={handleSendReply}
                    disabled={loading || !replyText.trim()}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-surface)] hover:bg-[#FFAB00] hover:text-black rounded-none text-[11px] font-mono uppercase tracking-widest font-bold transition-all disabled:opacity-20 disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-faint)] disabled:border-transparent"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Transmit Signal
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50 bg-[var(--bg-surface)] border border-[var(--border-muted)] text-[var(--text-primary)] text-[9px] font-mono uppercase tracking-widest px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg">
                    Dispatch email pipeline delivery sequence
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// Fixed Row metadata configuration utilizing specific font systems
function InfoRow({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2.5 max-w-full overflow-hidden">
      <Icon className="w-3.5 h-3.5 text-[#FF6D00] shrink-0" />
      <span className="text-[var(--text-secondary)] font-bold font-mono text-[11px] uppercase tracking-wide truncate max-w-full">{label || "UNKNOWN TELEMETRY"}</span>
    </div>
  );
}