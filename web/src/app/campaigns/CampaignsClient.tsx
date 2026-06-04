"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Trash2, CheckSquare, Square, Loader2, AlertTriangle } from "lucide-react";
import { deleteCampaignAction, bulkDeleteCampaignsAction } from "../dashboard-actions";
import type { CampaignListItem } from "@/types";

interface CampaignsClientProps {
  campaigns: CampaignListItem[];
}

export function CampaignsClient({ campaigns }: CampaignsClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "single" | "bulk";
    id?: string;
  }>({ isOpen: false, type: "single" });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === campaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(campaigns.map((c) => c.id));
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    if (modalState.type === "single" && modalState.id) {
      await deleteCampaignAction(modalState.id);
      setSelectedIds((prev) => prev.filter((x) => x !== modalState.id));
    } else if (modalState.type === "bulk") {
      await bulkDeleteCampaignsAction(selectedIds);
      setSelectedIds([]);
    }
    setModalState({ isOpen: false, type: "single" });
    setIsDeleting(false);
    router.refresh();
  };

  const statusAccent = (status: string) => {
    switch (status) {
      case "active": return { border: 'rgba(16,185,129,0.2)', dot: '#10B981', text: '#10B981', bg: 'rgba(16,185,129,0.05)' };
      case "draft": return { border: 'rgba(245,158,11,0.2)', dot: '#F59E0B', text: '#F59E0B', bg: 'rgba(245,158,11,0.05)' };
      case "completed": return { border: 'rgba(99,102,241,0.2)', dot: '#6366F1', text: '#6366F1', bg: 'rgba(99,102,241,0.05)' };
      default: return { border: 'var(--border-muted)', dot: 'var(--text-faint)', text: 'var(--text-muted)', bg: 'var(--bg-elevated)' };
    }
  };

  return (
    <>
      {/* Delete Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-container)', boxShadow: 'var(--shadow-2xl)' }}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {modalState.type === "bulk"
                      ? `Delete ${selectedIds.length} Campaigns?`
                      : "Delete Campaign?"}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    This action cannot be undone. This will permanently delete the
                    campaign and all associated data.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-muted)' }}>
              <button
                onClick={() => setModalState({ isOpen: false, type: "single" })}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold text-[var(--text-muted)] rounded-lg transition-all duration-200 hover:text-[var(--text-primary)]"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-button)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 hover:translate-y-[-1px]"
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  borderRadius: 'var(--radius-button)',
                  boxShadow: '0 0 16px rgba(239,68,68,0.2)',
                }}
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete {modalState.type === "bulk" ? "All" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Bulk Actions Header */}
        {campaigns.length > 0 && (
          <div className="flex items-center justify-between p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-card)' }}>
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm transition-colors"
            >
              {selectedIds.length === campaigns.length ? (
                <CheckSquare className="w-4 h-4 text-[#6366F1]" />
              ) : (
                <Square className="w-4 h-4 text-[var(--text-faint)]" />
              )}
              <span className="font-bold text-[var(--text-muted)]">Select All</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={() => setModalState({ isOpen: true, type: "bulk" })}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-1.5 text-[#EF4444] text-sm font-medium transition-all duration-200 disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-button)' }}
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        )}

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {campaigns.map((c) => {
            const sentCount = c.leads?.filter((l) => l.sent).length || 0;
            const hotCount = c.leads?.filter((l) => l.status === "hot" || l.status === "Hot").length || 0;
            const totalLeads = c._count?.leads || 0;
            const progress = totalLeads > 0 ? Math.round((sentCount / totalLeads) * 100) : 0;
            const hasErrors = (c._count?.errors || 0) > 0;
            const isSelected = selectedIds.includes(c.id);
            const accent = statusAccent(c.status);

            return (
              <div
                key={c.id}
                className="group relative p-5 transition-all duration-300 hover:translate-y-[-2px]"
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.08)' : accent.bg,
                  border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : accent.border}`,
                  borderRadius: 'var(--radius-card)',
                  boxShadow: isSelected ? 'var(--shadow-glow-primary)' : 'var(--shadow-layered)',
                }}
              >
                {/* Select & Delete Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <button
                    onClick={() => setModalState({ isOpen: true, type: "single", id: c.id })}
                    disabled={isDeleting}
                    className="p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    style={{ borderRadius: 'var(--radius-badge)', color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleSelect(c.id)}
                    className="transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
                    ) : (
                      <Square className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </div>

                {/* Clickable Area for Navigation */}
                <div
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    router.push(
                      c.status === "draft"
                        ? `/campaigns/${c.id}/setup`
                        : `/campaigns/${c.id}`
                    );
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4 pr-16">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--brand-primary)]">
                          {c.name || "Untitled Campaign"}
                        </h3>
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${c.status === "active" ? "animate-pulse-dot" : ""}`}
                          style={{ background: accent.dot }}
                        />
                      </div>
                      <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {totalLeads} leads · <span style={{ color: accent.text }}>{c.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] font-bold mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="text-[var(--text-faint)]">Progress</span>
                      <span className="text-[var(--text-muted)]">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-muted)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${c.status === "completed" ? 100 : progress}%`,
                          background: hasErrors
                            ? 'linear-gradient(90deg, #EF4444, #F87171)'
                            : 'linear-gradient(90deg, #10B981, #34D399)',
                          boxShadow: hasErrors
                            ? '0 0 8px rgba(239,68,68,0.4)'
                            : '0 0 8px rgba(16,185,129,0.4)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-muted)' }}>
                    <div className="flex items-center gap-3 text-xs font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="text-[var(--text-muted)]">
                        <span className="text-[var(--text-primary)]">{sentCount}</span>{" "}Sent
                      </span>
                      <span className="text-[var(--text-muted)]">
                        <span className="font-bold text-[#10B981]">{hotCount}</span>{" "}Hot
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 transition-colors" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
