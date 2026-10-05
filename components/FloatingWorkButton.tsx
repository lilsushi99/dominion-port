'use client';

// components/FloatingWorkButton.tsx — Organic Floating "Skip the talk → See what I built" Shortcut
import React, { useState, useEffect } from 'react';
import { ArrowDown } from 'lucide-react';

export function FloatingWorkButton() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const workEl = document.getElementById('work');
      if (workEl) {
        const rect = workEl.getBoundingClientRect();
        // Hide button when user has scrolled well into the work section
        if (rect.top < 120) {
          setVisible(false);
        } else {
          setVisible(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToWork = () => {
    const workEl = document.getElementById('work');
    if (workEl) {
      workEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 animate-fade-in">
      <button
        type="button"
        onClick={scrollToWork}
        className="group relative cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-[#1e1d24]/90 dark:bg-[#25242d]/90 text-[#f4f4f2] text-[12px] font-medium backdrop-blur-md border border-[#3e3d48]/60 shadow-[0_4px_20px_rgba(0,0,0,0.18)] hover:scale-[1.02] hover:bg-[#282732] dark:hover:bg-[#2d2c37] transition-all duration-200"
        style={{
          borderRadius: '24px 8px 22px 14px', // Organic stretched blob feel
        }}
        title="Skip introduction and jump to work"
      >
        <span>Skip the talk &rarr; See what I built</span>
        <ArrowDown
          size={13}
          className="text-[#9e9da8] group-hover:text-white group-hover:translate-y-0.5 transition-all"
        />
      </button>
    </div>
  );
}
