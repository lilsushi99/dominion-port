'use client';

// app/hippo/account/page.tsx — Admin Account & Security
import React, { useState } from 'react';
import { KeyRound, Check, Shield } from 'lucide-react';
import { useHippoAuth } from '@/components/admin/HippoAuthProvider';

export default function HippoAccountPage() {
  const { user, csrfToken } = useHippoAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/v1/admin/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || 'Failed to update password.');
        setSaving(false);
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaving(false);
      showToast('Password updated successfully!');
    } catch {
      setError('Network error while updating password.');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[560px] space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#16151c] text-white px-4 py-2.5 rounded-xl shadow-lg text-[13px] flex items-center gap-2">
          <Check size={16} className="text-[#12874f]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">Account & Security</h1>
        <p className="text-[13px] text-[#86858f] mt-0.5">Manage admin credentials and session authentication.</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
        <h2 className="text-[15px] font-semibold text-[#16151c] flex items-center gap-2">
          <Shield size={16} className="text-[#5b4be0]" />
          <span>Admin Profile</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <span className="text-[#86858f] block">Username</span>
            <span className="font-medium text-[#16151c]">{user?.username}</span>
          </div>
          <div>
            <span className="text-[#86858f] block">Email Address</span>
            <span className="font-medium text-[#16151c]">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
        <h2 className="text-[15px] font-semibold text-[#16151c] flex items-center gap-2">
          <KeyRound size={16} className="text-[#5b4be0]" />
          <span>Change Password</span>
        </h2>

        {error && (
          <div className="p-3 bg-[#fde8ec] border border-[#d92d4a]/20 rounded-xl text-[12px] text-[#d92d4a]">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
              New Password (minimum 8 characters)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-xl text-[13px] font-medium shadow-xs cursor-pointer"
            >
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
