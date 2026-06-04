"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleCampaignStatus } from "../actions";
import { syncCampaignInboxAction } from "../../dashboard-actions";
import { RotateCcw, Download, Pause, Play, AlertCircle } from "lucide-react";
import { StopSequencesButton } from "../../StopSequencesButton";

export function CampaignActions({ campaign, leads }: { campaign: any, leads: any[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    await toggleCampaignStatus(campaign.id);
    setLoading(false);
    router.refresh();
  };

  const handleExport = () => {
    const headers = ["First Name", "Last Name", "Email", "Company", "Status", "Sent", "Opened", "Replied"];
    const rows = leads.map(l => [
      l.firstName,
      l.lastName,
      l.email,
      l.companyName,
      l.status,
      l.sent ? "Yes" : "No",
      l.opened ? "Yes" : "No",
      l.replied ? "Yes" : "No"
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${campaign.name || "campaign"}_leads.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSync = async () => {
    setLoading(true);
    await syncCampaignInboxAction(campaign.id);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={handleSync}
        disabled={loading}
        className="h-9 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        title="Sync inbox"
      >
        <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Sync</span>
      </button>

      <button 
        onClick={handleToggle}
        disabled={loading}
        className="h-9 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
      >
        {campaign.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{campaign.status === "active" ? "Pause" : "Resume"}</span>
      </button>

      <button 
        onClick={handleExport}
        className="h-9 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-2"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Export</span>
      </button>

      <div className="w-px h-5 bg-zinc-200 mx-1" />

      <StopSequencesButton variant="button" />
    </div>
  );
}
