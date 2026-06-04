"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { stopAllSequencesAction } from "./dashboard-actions";
import { Loader2, OctagonX, X, AlertTriangle } from "lucide-react";

export function StopSequencesButton({ variant = "card" }: { variant?: "card" | "button" }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleStop = async () => {
    setLoading(true);
    const result = await stopAllSequencesAction();
    setLoading(false);
    setShowModal(false);
    
    if (result.success) {
      router.refresh();
    } else {
      alert("Failed: " + result.error);
    }
  };

  return (
    <>
      {variant === "card" ? (
        <button
          onClick={() => setShowModal(true)}
          className="group flex flex-col justify-between p-6 h-44 w-full text-left transition-all duration-300"
          style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-layered)',
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <OctagonX className="w-4 h-4 text-[#EF4444] group-hover:text-[var(--text-primary)] transition-colors" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse-dot" />
              <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>Emergency</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-[#FCA5A5]">Stop All Sequences</p>
            <p className="text-xs text-[#DC2626] mt-0.5">Pauses all active outreach immediately</p>
          </div>
        </button>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="h-9 px-5 text-[#EF4444] rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap hover:translate-y-[-1px]"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="Emergency Stop All"
        >
          <OctagonX className="w-3.5 h-3.5" />
          Stop All
        </button>
      )}

      {/* Emergency Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} role="dialog" aria-modal="true">
          <div className="w-full max-w-md overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-container)', boxShadow: 'var(--shadow-2xl)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Confirm Emergency Stop</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-[var(--text-faint)] hover:text-[var(--text-primary)] rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                This will immediately pause <span className="font-bold text-[var(--text-primary)]">all active campaigns</span> and un-sent lead sequences. You can resume them manually later.
              </p>
              
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="w-full py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:translate-y-[-1px] disabled:opacity-50 disabled:transform-none"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    color: '#FFFFFF',
                    borderRadius: 'var(--radius-button)',
                    boxShadow: '0 0 20px rgba(239,68,68,0.2)',
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <OctagonX className="w-4 h-4" />}
                  Stop Everything Now
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="w-full py-3 text-[var(--text-faint)] hover:text-[var(--text-primary)] text-sm font-bold transition-colors"
                  style={{ borderRadius: 'var(--radius-button)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
