import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-8">
      <div className="w-20 h-20 rounded-[28px] bg-zinc-50 border border-zinc-200 flex items-center justify-center">
        <Search className="w-10 h-10 text-zinc-300" />
      </div>

      <div className="space-y-3 max-w-md">
        <h1 className="text-6xl font-black text-black tracking-tighter">404</h1>
        <p className="text-sm text-zinc-500 font-medium leading-relaxed">
          The resource you're looking for doesn't exist or has been moved.
          Check the URL or navigate back to the dashboard.
        </p>
      </div>

      <Link
        href="/"
        className="bg-black hover:bg-zinc-800 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-black/10 active:scale-95 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Command Center
      </Link>
    </div>
  );
}
