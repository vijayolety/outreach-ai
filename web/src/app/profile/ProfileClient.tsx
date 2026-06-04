"use client";

import { useState, useRef } from "react";
import { updateProfile, updatePassword, updateUserImage } from "./actions";
import { toast } from "sonner";
import { Save, User, Lock, Eye, EyeOff, ShieldCheck, Mail, Camera, ChevronDown, ChevronRight, Clock, Calendar, Loader2 } from "lucide-react";

interface ProfileClientProps {
  user: any;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState({
    personal: true,
    security: true,
    account: true
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (2MB limit for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large. Please select an image under 2MB.");
      return;
    }

    setImageLoading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await updateUserImage(base64String);
        if (res.success) {
          toast.success("Profile image updated");
        } else {
          toast.error(res.error || "Failed to upload image");
        }
      } catch (error) {
        toast.error("An unexpected error occurred during upload");
      } finally {
        setImageLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await updateProfile(formData);
      if (res.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await updatePassword(formData);
      if (res.success) {
        toast.success("Password updated successfully");
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(res.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-8">
      {/* Header with Image Upload */}
      <div className="flex justify-between items-end mb-4">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-sm overflow-hidden" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--bg-surface)' }}>
              {imageLoading ? (
                <Loader2 className="w-6 h-6 text-[var(--text-faint)] animate-spin" />
              ) : user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-[var(--text-faint)]" />
              )}
            </div>
            <button
              onClick={handleImageClick}
              disabled={imageLoading}
              className="absolute bottom-0 right-0 p-1.5 rounded-full border shadow-sm transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-muted)', color: 'var(--text-muted)' }}
              title="Change Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient tracking-tight">User Profile</h1>
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account identity, security settings, and personal preferences.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* 1. Personal Information */}
        <section className="card-surface overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('personal')}
            className="p-6 cursor-pointer flex items-center justify-between group"
            style={{ borderBottom: '1px solid var(--border-muted)', background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Personal Information</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Update your public name and primary contact email</p>
              </div>
            </div>
            {expanded.personal ? <ChevronDown className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" />}
          </div>

          {expanded.personal && (
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={user.name || ""}
                    className="input-dark w-full"
                    placeholder="e.g. Vijay"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                  <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-input)' }}>
                    <Mail className="w-4 h-4 mr-2" style={{ color: 'var(--text-faint)' }} />
                    <input
                      type="email"
                      name="email"
                      defaultValue={user.email || ""}
                      className="w-full py-2.5 text-sm outline-none bg-transparent"
                      placeholder="vijay@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {profileLoading ? "Saving..." : "Save Profile Details"}
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 2. Security & Password */}
        <section className="card-surface overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('security')}
            className="p-6 cursor-pointer flex items-center justify-between group"
            style={{ borderBottom: '1px solid var(--border-muted)', background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7' }}>
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Security & Credentials</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Secure your account with a strong password</p>
              </div>
            </div>
            {expanded.security ? <ChevronDown className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" />}
          </div>

          {expanded.security && (
            <form onSubmit={handleUpdatePassword} className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Current Password</label>
                  <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-input)' }}>
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      name="currentPassword"
                      autoComplete="current-password"
                      className="w-full py-2.5 text-sm outline-none bg-transparent" style={{ color: 'var(--text-primary)' }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors ml-2"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] italic" style={{ color: 'var(--text-faint)' }}>Required to verify your identity before changing passwords.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>New Password</label>
                    <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-input)' }}>
                      <input
                        type={showNewPass ? "text" : "password"}
                        name="newPassword"
                        autoComplete="new-password"
                        className="w-full py-2.5 text-sm outline-none bg-transparent" style={{ color: 'var(--text-primary)' }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors ml-2"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Confirm New Password</label>
                    <div className="flex items-center px-4 transition-all" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-input)' }}>
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        name="confirmPassword"
                        autoComplete="new-password"
                        className="w-full py-2.5 text-sm outline-none bg-transparent" style={{ color: 'var(--text-primary)' }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] transition-colors ml-2"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {passwordLoading ? "Updating..." : "Change Password"}
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 3. Account Health */}
        <section className="card-surface overflow-hidden transition-all">
          <div
            onClick={() => toggleSection('account')}
            className="p-6 cursor-pointer flex items-center justify-between group"
            style={{ borderBottom: '1px solid var(--border-muted)', background: 'var(--bg-elevated)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--border-muted)', color: 'var(--text-secondary)' }}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Account Health & Privacy</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Overview of your account status and data</p>
              </div>
            </div>
            {expanded.account ? <ChevronDown className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" /> : <ChevronRight className="w-5 h-5 text-[var(--text-faint)] group-hover:text-[var(--text-primary)]" />}
          </div>

          {expanded.account && (
            <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border flex items-center gap-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-muted)' }}>
                  <div className="p-2.5 rounded-lg border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-muted)', color: 'var(--text-faint)' }}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--text-faint)' }}>Member Since</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border flex items-center gap-4" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-muted)' }}>
                  <div className="p-2.5 rounded-lg border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-muted)', color: 'var(--text-faint)' }}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--text-faint)' }}>Last Account Update</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {new Date(user.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid var(--border-muted)' }}>
                <div className="flex items-center gap-2" style={{ color: 'var(--text-faint)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                  <span className="text-xs font-bold uppercase tracking-tight">Account Active & Healthy</span>
                </div>
                <button className="px-5 py-2 border rounded-xl text-xs font-bold transition-all" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-muted)', color: 'var(--text-secondary)' }}>
                  Request Data Export
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
