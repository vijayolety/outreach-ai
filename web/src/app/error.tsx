"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-8">
      <div className="w-20 h-20 rounded-[28px] bg-red-50 border border-red-100 flex items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>

      <div className="space-y-3 max-w-md">
        <h1 className="text-2xl font-black text-black tracking-tight uppercase">
          System Error
        </h1>
        <p className="text-sm text-zinc-500 font-medium leading-relaxed">
          An unexpected error occurred while processing your request.
          This has been logged for investigation.
        </p>
        {error.digest && (
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <button
        onClick={reset}
        className="bg-black hover:bg-zinc-800 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center gap-2"
      >
        <RefreshCcw className="w-4 h-4" />
        Retry Operation
      </button>
    </div>
  );
}
