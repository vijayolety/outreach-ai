// src/app/(auth)/signup/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Mail,
    Lock,
    User,
    ArrowRight,
    Eye,
    EyeOff,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type FormData = {
    name: string;
    email: string;
    password: string;
};

export default function SignUpPage() {
    const router = useRouter();

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const toastId = toast.loading("Creating your account...");

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            toast.success("Account created successfully!", { id: toastId });
            router.push("/login?registered=true");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 relative" style={{ background: 'var(--bg-sink)' }}>
            {/* Background mesh glow */}
            <div className="mesh-gradient opacity-40" />

            <div className="w-full max-w-md space-y-8 p-8 relative z-10 card-surface animate-in fade-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-muted)] mb-6">
                        <Sparkles className="w-6 h-6 text-[#6366F1]" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gradient">
                        Join Outreach AI
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Start scaling your outreach with tactical AI.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="input-dark w-full !pl-12"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    className="input-dark w-full !pl-12"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-tight mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-faint)' }} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="input-dark w-full !pl-12 !pr-12"
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

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 group"
                    >
                        {isLoading ? "Generating your tactical workspace..." : "Create Tactical Account"}
                        {!isLoading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>Already have an account?</span>
                    <Link
                        href="/login"
                        className="ml-2 font-bold text-[#6366F1] hover:text-[#818CF8] transition-all"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}