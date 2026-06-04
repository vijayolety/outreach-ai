// web/src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const toastId = toast.loading("Verifying credentials...");

        const res = await signIn("credentials", {
            redirect: false,
            email: form.email,
            password: form.password,
        });

        if (res?.error) {
            toast.error(res.error, { id: toastId });
            setLoading(false);
        } else {
            toast.success("Login successful", { id: toastId });
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 relative" style={{ background: 'var(--bg-sink)' }}>
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)', filter: 'blur(80px)' }} />

            <div className="w-full max-w-md space-y-8 p-8 relative z-10 card-surface animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gradient">Welcome back</h2>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Log in to your Outreach AI account.</p>
                </div>

                <div className="mt-8 space-y-6">
                    <GoogleSignInButton text="Sign in with Google" />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full" style={{ borderTop: '1px solid var(--border-muted)' }}></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="px-2 font-medium" style={{ background: 'var(--bg-surface)', color: 'var(--text-faint)' }}>Or continue with</span>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                                    <input
                                        type="email"
                                        required
                                        className="input-dark w-full !pl-12"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="input-dark w-full !pl-12 !pr-12"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center"
                        >
                            {loading ? "Signing in..." : "Sign in to Dashboard"}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-bold text-[#6366F1] hover:text-[#818CF8] transition-all">
                        Create Account
                    </Link>
                </p>
            </div>
        </div>
    );
}