import { AppShell } from "@/components/shell/AppShell";
import { LeadUploadForm } from "@/components/leads/LeadUploadForm";

export default function LeadUploadPage() {
  return (
    <AppShell accountStatus="disconnected" accountLabel="Not connected">
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="text-xs font-medium text-zinc-500">
            Lead upload + validation
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Upload leads — errors fixed before AI touches anything
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            Upload a CSV or link a Google Sheet, validate required fields, and proceed with valid
            leads only.
          </p>
        </header>

        <LeadUploadForm />
      </div>
    </AppShell>
  );
}

