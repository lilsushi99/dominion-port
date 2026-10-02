'use client';

// components/admin/HippoAppShell.tsx — Framed Admin App Shell (FlowMail design)
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  FolderGit2,
  FileText,
  Tags,
  Image as ImageIcon,
  Sliders,
  LogOut,
  ExternalLink,
  Menu,
  X,
  KeyRound
} from 'lucide-react';
import { HippoAuthProvider, useHippoAuth } from './HippoAuthProvider';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/hippo', icon: LayoutDashboard },
  { label: 'Home (CMS)', href: '/hippo/cms', icon: Home },
  { label: 'Projects', href: '/hippo/projects', icon: FolderGit2 },
  { label: 'Papers', href: '/hippo/papers', icon: FileText },
  { label: 'Categories', href: '/hippo/categories', icon: Tags },
  { label: 'Media', href: '/hippo/media', icon: ImageIcon },
];

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useHippoAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isLoginPage = pathname === '/hippo/login';

  if (isLoginPage) {
    return <div className="min-h-screen flex items-center justify-center p-4">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#5b4be0] border-t-transparent animate-spin" />
      </div>
    );
  }

  const monogram = user?.username ? user.username.substring(0, 2).toUpperCase() : 'DM';

  return (
    <div className="min-h-screen p-0 sm:p-6 flex items-center justify-center">
      {/* Floating Framed Container (max-width 1440px, radius 20px) */}
      <div className="w-full max-w-[1440px] min-h-[calc(100vh-48px)] bg-[#f6f5fa] rounded-none sm:rounded-[20px] shadow-[0_1px_3px_rgba(22,21,28,0.06)] border border-[#e4e3ea] overflow-hidden grid grid-cols-1 lg:grid-cols-[224px_1fr]">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#fdfcff] border-b border-[#e4e3ea]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px] text-[#16151c]">Dominion</span>
            <span className="text-[12px] text-[#86858f] font-normal">admin</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg border border-[#e4e3ea] text-[#4a4955] hover:bg-[#f6f5fa]"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Sidebar (224px, #fdfcff) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#fdfcff] border-r border-[#e4e3ea] p-4 flex flex-col justify-between transition-transform duration-200 lg:static lg:w-auto lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div>
            {/* Logo Row */}
            <div className="hidden lg:flex items-center gap-2 h-10 px-2 mb-4">
              <span className="font-semibold text-[16px] text-[#16151c] tracking-tight">Dominion</span>
              <span className="text-[12px] text-[#86858f] font-medium bg-[#f6f5fa] px-2 py-0.5 rounded-md border border-[#e4e3ea]">
                admin
              </span>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/hippo' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 h-10 px-3 rounded-lg text-[14px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[#f6f5fa] text-[#16151c] font-semibold shadow-xs'
                        : 'text-[#4a4955] hover:bg-[#f6f5fa] hover:text-[#16151c]'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#5b4be0]' : 'text-[#86858f]'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Block & Footer Links */}
          <div className="pt-4 border-t border-[#e4e3ea] relative">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg text-[13px] text-[#86858f] hover:text-[#16151c] hover:bg-[#f6f5fa] transition-colors"
            >
              <span>View live site</span>
              <ExternalLink size={14} />
            </Link>

            {/* User Profile / Monogram */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#f6f5fa] text-left transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#ece9fd] text-[#5b4be0] font-semibold text-[12px] flex items-center justify-center shrink-0">
                    {monogram}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#16151c] truncate">
                      {user?.username || 'Admin'}
                    </div>
                    <div className="text-[11px] text-[#86858f] truncate">{user?.email}</div>
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute bottom-full left-0 w-full mb-1 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl shadow-[0_4px_12px_rgba(22,21,28,0.08)] p-1 z-50">
                  <Link
                    href="/hippo/account"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#4a4955] hover:bg-[#f6f5fa] hover:text-[#16151c]"
                  >
                    <KeyRound size={15} />
                    <span>Change password</span>
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#d92d4a] hover:bg-[#fde8ec] text-left"
                  >
                    <LogOut size={15} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-48px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

export function HippoAppShell({ children }: { children: React.ReactNode }) {
  return (
    <HippoAuthProvider>
      <ShellInner>{children}</ShellInner>
    </HippoAuthProvider>
  );
}
