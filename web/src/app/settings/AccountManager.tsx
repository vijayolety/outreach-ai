"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, Save, X, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AccountManager({ initialAccounts }: { initialAccounts: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [accounts, setAccounts] = useState(initialAccounts);

  // Sync state with server props
  useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);

  const [form, setForm] = useState({
    name: "",
    host: "",
    port: "465",
    username: "",
    password: "",
    encryptionType: "TLS",
    fromEmail: "",
    fromName: ""
  });

  const handleEdit = (acc: any) => {
    setEditingId(acc.id);
    setForm({
      name: acc.name,
      host: acc.host,
      port: acc.port.toString(),
      username: acc.username,
      password: "",
      encryptionType: acc.encryptionType || "TLS",
      fromEmail: acc.fromEmail || "",
      fromName: acc.fromName || ""
    });
    const formElement = document.getElementById("smtp-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      name: "",
      host: "",
      port: "465",
      username: "",
      password: "",
      encryptionType: "TLS",
      fromEmail: "",
      fromName: ""
    });
    setShowPass(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading(editingId ? "Updating SMTP connection..." : "Verifying & Saving SMTP...");

    try {
      const url = editingId ? `/api/smtp/${editingId}` : "/api/smtp";
      const method = editingId ? "PATCH" : "POST";

      // Convert port to number for Zod
      const payload = {
        ...form,
        port: parseInt(form.port, 10)
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save account");
      }

      toast.success(editingId ? "SMTP Account Updated" : "SMTP Account Added", { id: toastId });
      router.refresh();
      cancelEdit();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this SMTP configuration? This will also remove it from any active campaigns.")) return;

    const toastId = toast.loading("Deleting account...");

    try {
      const res = await fetch(`/api/smtp/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to delete");

      toast.success("Account deleted", { id: toastId });

      // Optimistic UI update
      setAccounts(prev => prev.filter(a => a.id !== id));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleToggleStatus = async (id: string) => {
    const toastId = toast.loading("Updating status...");
    try {
      const res = await fetch(`/api/smtp?id=${id}`, { method: "PATCH" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update status");

      toast.success(data.message, { id: toastId });

      // Optimistic UI update
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: data.data.isActive } : a));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      {/* List Existing SMTP Accounts */}
      <div className="space-y-4">
        {accounts.length > 0 ? (
          <div className="grid gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex justify-between items-center p-5 card-surface group hover:border-[#6366F1]/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 card-elevated flex items-center justify-center text-[var(--text-faint)] group-hover:text-[var(--text-primary)] transition-colors relative">
                    <Mail className="w-5 h-5" />
                    {acc.isVerified && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-[var(--bg-surface)]" title="Verified" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{acc.name}</p>
                    <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                      {acc.username} <span className="mx-1 opacity-20">|</span> {acc.host}:{acc.port}
                      {acc.fromEmail && <span className="block mt-0.5 opacity-60">Sender: {acc.fromName} &lt;{acc.fromEmail}&gt;</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(acc.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${acc.isActive
                      ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 hover:bg-[#10B981]/20"
                      : "bg-[var(--bg-elevated)] text-[var(--text-faint)] border-[var(--border-muted)] hover:bg-[var(--bg-surface)]"
                      }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {acc.isActive ? "Active" : "Disabled"}
                  </button>
                  <button
                    onClick={() => handleEdit(acc)}
                    className="p-2 transition-all rounded-lg"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    title="Edit Configuration"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2 transition-all rounded-lg"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[var(--bg-sink)] rounded-2xl border border-dashed border-[var(--border-muted)]">
            <p className="text-sm font-bold" style={{ color: 'var(--text-faint)' }}>No SMTP accounts configured yet.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Account Form */}
      <div id="smtp-form" className="pt-8" style={{ borderTop: '1px solid var(--border-muted)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
              {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {editingId ? "Edit SMTP Connection" : "Add New Connection"}
            </h3>
          </div>
          {editingId && (
            <button
              onClick={cancelEdit}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <X className="w-3 h-3" />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Friendly Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Display Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sales Inbox"
                className="input-dark w-full"
              />
            </div>

            {/* Host */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SMTP Host</label>
              <input
                type="text"
                required
                value={form.host}
                onChange={e => setForm({ ...form, host: e.target.value })}
                placeholder="e.g. smtp.gmail.com"
                className="input-dark w-full"
              />
            </div>

            {/* Port */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SMTP Port</label>
              <input
                type="number"
                required
                value={form.port}
                onChange={e => setForm({ ...form, port: e.target.value })}
                placeholder="465 or 587"
                className="input-dark w-full"
              />
            </div>

            {/* Encryption */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Encryption</label>
              <select
                value={form.encryptionType}
                onChange={e => setForm({ ...form, encryptionType: e.target.value })}
                className="input-dark w-full cursor-pointer appearance-none"
              >
                <option value="TLS">STARTTLS (Port 587)</option>
                <option value="SSL">SSL/TLS (Port 465)</option>
                <option value="NONE">None (Not recommended)</option>
              </select>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SMTP Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="you@company.com"
                className="input-dark w-full"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                App Password {editingId && <span className="font-normal lowercase opacity-40">(leave blank to keep current)</span>}
              </label>
              <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-input)' }}>
                <input
                  type={showPass ? "text" : "password"}
                  required={!editingId}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editingId ? "••••••••••••••••" : "Enter your secure app password"}
                  className="w-full py-2.5 text-sm outline-none bg-transparent text-[var(--text-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors ml-2"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* From Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Sender Display Name</label>
              <input
                type="text"
                required
                value={form.fromName}
                onChange={e => setForm({ ...form, fromName: e.target.value })}
                placeholder="e.g. Vijay from Example"
                className="input-dark w-full"
              />
            </div>

            {/* From Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Sender Email Address</label>
              <input
                type="email"
                required
                value={form.fromEmail}
                onChange={e => setForm({ ...form, fromEmail: e.target.value })}
                placeholder="e.g. hello@Example.ai"
                className="input-dark w-full"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 px-8"
            >
              {loading ? "Verifying Connection..." : (editingId ? "Update Configuration" : "Verify & Save Account")}
              <ShieldCheck className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
