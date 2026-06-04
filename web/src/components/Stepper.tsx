"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Stepper({ campaignId }: { campaignId?: string }) {
  const pathname = usePathname();
  
  const steps = [
    { label: "Upload", path: "upload" },
    { label: "Configure", path: "setup" },
    { label: "Review", path: "review" },
    { label: "Launch", path: "launch" },
    { label: "Monitor", path: "sending" }
  ];

  return (
    <div className="w-full" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'var(--bg-surface)' }}>
      <div className="flex items-center w-full px-2">
      {steps.map((step, idx) => {
        const isActive = pathname.includes(`/${step.path}`);
        
        // Fix: Existing campaigns shouldn't link to a non-existent /[id]/upload page
        const href = (step.path === 'upload' && campaignId) 
          ? `/campaigns/${campaignId}/setup` // Redirect back to setup
          : `/campaigns/${campaignId || 'new'}/${step.path}`;
          
        const isCompleted = !!campaignId || step.path === 'upload';

        return (
          <div key={step.label} className="flex-1">
            {isCompleted ? (
              <Link 
                href={href}
                className={`block py-3 text-xs font-semibold text-center border-b-2 transition-all duration-200 ${
                  isActive ? 'text-white border-[#6366F1]' : 'text-[#475569] border-transparent hover:text-[#94A3B8] hover:border-[rgba(99,102,241,0.3)]'
                }`}
              >
                <span className="hidden sm:inline-block mr-1 opacity-40" style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1} ·</span> {step.label}
              </Link>
            ) : (
              <span className="block py-3 text-xs font-semibold text-center border-b-2 border-transparent cursor-not-allowed" style={{ color: 'rgba(255,255,255,0.15)' }}>
                <span className="hidden sm:inline-block mr-1 opacity-40" style={{ fontFamily: 'var(--font-mono)' }}>{idx + 1} ·</span> {step.label}
              </span>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
