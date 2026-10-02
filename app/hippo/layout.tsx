// app/hippo/layout.tsx — Admin Layout Shell
import type { Metadata } from 'next';
import '@/styles/admin-tokens.css';
import { HippoAppShell } from '@/components/admin/HippoAppShell';

export const metadata: Metadata = {
  title: 'Dominion Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export default function HippoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#e6e9ec] text-[#16151c] antialiased selection:bg-[#ece9fd] selection:text-[#5b4be0]">
      <HippoAppShell>{children}</HippoAppShell>
    </div>
  );
}
