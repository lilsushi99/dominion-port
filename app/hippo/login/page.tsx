'use client';

// app/hippo/login/page.tsx — Admin Login Page
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { useHippoAuth } from '@/components/admin/HippoAuthProvider';

export default function HippoLoginPage() {
  const { login } = useHippoAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setLoading(true);
    setError(null);

    const result = await login(identifier, password);
    if (!result.success) {
      setError(result.error || "Those details don't match.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[380px] mx-auto">
      {/* Site Header */}
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">Dominion</h1>
        <p className="text-[13px] text-[#86858f] mt-0.5">Portfolio Administration</p>
      </div>

      {/* Login Card */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
        {error && (
          <div className="mb-4 p-3 bg-[#fde8ec] border border-[#d92d4a]/20 rounded-lg text-[13px] text-[#d92d4a] flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
              Email or username
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@dominion.design"
                className="w-full h-10 px-3 pl-9 bg-[#fdfcff] border border-[#e4e3ea] hover:border-[#cfcdd8] focus:border-[#5b4be0] focus:ring-3 focus:ring-[#5b4be0]/15 rounded-[10px] text-[14px] text-[#16151c] placeholder:text-[#86858f] outline-none transition-all"
              />
              <User size={16} className="absolute left-3 top-3 text-[#86858f]" />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 px-3 pl-9 pr-10 bg-[#fdfcff] border border-[#e4e3ea] hover:border-[#cfcdd8] focus:border-[#5b4be0] focus:ring-3 focus:ring-[#5b4be0]/15 rounded-[10px] text-[14px] text-[#16151c] placeholder:text-[#86858f] outline-none transition-all"
              />
              <Lock size={16} className="absolute left-3 top-3 text-[#86858f]" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#86858f] hover:text-[#16151c] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-[#5b4be0] hover:bg-[#4d3ed1] disabled:opacity-45 text-white text-[14px] font-medium rounded-[10px] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Log in</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
