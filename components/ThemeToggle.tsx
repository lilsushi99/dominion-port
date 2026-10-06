'use client';

// components/ThemeToggle.tsx — Minimalist Editorial Theme Switch
import React, { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

function emptySubscribe() {
  return () => {};
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) return null;

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-lg text-[#000000] dark:text-[#8f8e89] hover:text-[#000000] dark:hover:text-[#eae9e4] hover:bg-[#000000]/5 dark:hover:bg-[#ffffff]/5 transition-colors focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#000000] dark:focus-visible:outline-[#8f8e89] ${className}`}
      title={label}
      aria-label={label}
    >
      {isDark ? (
        <Sun size={17} strokeWidth={1.5} className="block transition-transform duration-200" />
      ) : (
        <Moon size={17} strokeWidth={1.5} className="block transition-transform duration-200" />
      )}
    </button>
  );
}
