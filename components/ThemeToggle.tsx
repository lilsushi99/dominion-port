'use client';

// components/ThemeToggle.tsx — Minimalist Editorial Theme Switch
import React, { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

function emptySubscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg text-[#75746f] hover:text-[#171717] dark:hover:text-[#d6d5cf] hover:bg-[#000000]/5 dark:hover:bg-[#ffffff]/5 transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle light/dark theme"
    >
      {theme === 'dark' ? (
        <Sun size={15} className="transition-transform duration-200" />
      ) : (
        <Moon size={15} className="transition-transform duration-200" />
      )}
    </button>
  );
}
