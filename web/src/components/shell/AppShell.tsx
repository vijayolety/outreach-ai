"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LayoutDashboard, Users, Zap, Menu, X, User, LogOut, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

type AccountStatus = "connected" | "disconnected";

function StatusPill({ status, label }: { status: AccountStatus; label: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all"
      style={{
        background: 'var(--bg-elevated)',
        borderColor: status === "connected" ? 'rgba(16,185,129,0.2)' : 'var(--border-muted)',
      }}
      role="status"
    >
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          status === "connected" ? "bg-[#10B981] animate-pulse-dot" : "bg-[#64748B]"
        }`}
      />
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: status === "connected" ? '#10B981' : 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

function NavLink({
  href,
  children,
  icon: Icon,
  onClick,
}: {
  href: string;
  children: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
        isActive
          ? "text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
      style={{
        background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'var(--border-muted)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
      }}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-[#6366F1]' : ''}`} />
      {children}
    </Link>
  );
}

export function AppShell({
  children,
  accountStatus = "connected",
  accountLabel = "Gmail Active",
}: {
  children: ReactNode;
  accountStatus?: AccountStatus;
  accountLabel?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-sink)' }}>
      {/* Floating Navbar Island */}
      <header className="sticky top-0 z-50 flex justify-center px-4 pt-4">
        <div
          className="w-full max-w-[1200px] flex items-center justify-between px-5 py-2.5 rounded-full"
          style={{
            background: 'var(--bg-surface)',
            opacity: 0.95,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border-muted)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                Outreach AI
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              <NavLink href="/campaigns" icon={LayoutDashboard}>Campaigns</NavLink>
              <NavLink href="/leads" icon={Users}>Leads</NavLink>
              <NavLink href="/ai-eval" icon={Zap}>AI Eval</NavLink>
            </nav>
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <StatusPill status={accountStatus} label={accountLabel} />
            </div>
            <div className="h-4 w-px hidden sm:block" style={{ background: 'var(--border-muted)' }} />
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 transition-all duration-200 rounded-full"
                style={{ 
                  color: 'var(--text-muted)',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                title="Toggle Theme"
              >
                {mounted && (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
              </button>
              <Link
                href="/profile"
                className="p-2 transition-all duration-200 rounded-full"
                style={{ 
                  color: pathname === '/profile' ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: pathname === '/profile' ? 'rgba(99,102,241,0.15)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/profile') e.currentTarget.style.background = 'var(--border-muted)';
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/profile') e.currentTarget.style.background = 'transparent';
                }}
                title="Your Profile"
              >
                <User className={`w-4 h-4 ${pathname === '/profile' ? 'text-[#6366F1]' : ''}`} />
              </Link>
              <Link
                href="/settings"
                className="p-2 transition-all duration-200 rounded-full"
                style={{ 
                  color: pathname === '/settings' ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: pathname === '/settings' ? 'rgba(99,102,241,0.15)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (pathname !== '/settings') e.currentTarget.style.background = 'var(--border-muted)';
                }}
                onMouseLeave={(e) => {
                  if (pathname !== '/settings') e.currentTarget.style.background = 'transparent';
                }}
                title="Settings"
              >
                <Settings className={`w-4 h-4 ${pathname === '/settings' ? 'text-[#6366F1]' : ''}`} />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-[var(--text-muted)] hover:text-[#EF4444] hover:bg-red-500/5 rounded-full transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-full transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div
          className="md:hidden mx-4 mt-2 rounded-2xl p-3 space-y-1"
          style={{
            background: 'var(--bg-surface)',
            opacity: 0.98,
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-muted)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <NavLink href="/campaigns" icon={LayoutDashboard} onClick={() => setMobileMenuOpen(false)}>
            Campaigns
          </NavLink>
          <NavLink href="/leads" icon={Users} onClick={() => setMobileMenuOpen(false)}>
            Leads
          </NavLink>
          <NavLink href="/ai-eval" icon={Zap} onClick={() => setMobileMenuOpen(false)}>
            AI Eval
          </NavLink>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {children}
        <footer className="mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-bold" style={{ borderTop: '1px solid var(--border-muted)', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
          <p className="uppercase tracking-widest">© Examplelabs 2026</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Support</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
