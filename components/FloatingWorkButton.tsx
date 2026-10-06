'use client';

// components/FloatingWorkButton.tsx — Organic Paint-Splash Blob "See What I Built" Scroll Shortcut
import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';

function emptySubscribe() {
  return () => {};
}

export function FloatingWorkButton() {
  const [visible, setVisible] = useState(true);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const workSection = document.getElementById('work');

    if (workSection && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          // Hide button as soon as work section starts entering the viewport
          if (entry.isIntersecting) {
            setVisible(false);
          } else {
            // Only show if we are above the work section
            const rect = workSection.getBoundingClientRect();
            if (rect.top > 200) {
              setVisible(true);
            } else {
              setVisible(false);
            }
          }
        },
        {
          threshold: [0, 0.1, 0.25],
          rootMargin: '0px 0px -10% 0px'
        }
      );

      observerRef.current.observe(workSection);
    }

    const handleScroll = () => {
      if (!workSection) return;
      const rect = workSection.getBoundingClientRect();
      if (rect.top <= 200) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToWork = () => {
    const workSection = document.getElementById('work');
    if (!workSection) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    workSection.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  if (!isMounted) return null;

  return (
    <div
      className={`fixed right-4 sm:right-8 z-30 pointer-events-none transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{
        bottom: 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))',
        right: 'max(1rem, calc(1.5rem + env(safe-area-inset-right, 0px)))'
      }}
    >
      <button
        type="button"
        onClick={scrollToWork}
        aria-label="Scroll down to projects section"
        className={`pointer-events-auto relative cursor-pointer group focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8f8e89] ${
          visible ? 'animate-blob-wobble' : ''
        }`}
      >
        {/* Organic Paint-Splash Blob SVG (flat fill, no gradient, no shadow) */}
        <div className="relative w-[92px] h-[92px] sm:w-[104px] sm:h-[104px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 active:scale-95">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full drop-none select-none block"
            style={{
              fill: 'var(--blob-fill)',
            }}
          >
            {/* Custom organic paint-splash shape with asymmetrical lobes and circular core */}
            <path d="M58.5,12.2 C74.8,9.8 91.2,18.4 99.4,32.6 C107.6,46.8 114.2,63.1 107.8,77.5 C101.4,91.9 86.8,102.3 70.5,106.8 C54.2,111.3 35.8,107.8 23.4,97.2 C11.0,86.6 4.6,68.9 7.8,53.2 C11.0,37.5 22.8,24.8 36.8,17.4 C43.5,13.8 50.8,13.3 58.5,12.2 Z" />
            {/* Small subtle asymmetrical splash droplets */}
            <circle cx="108" cy="24" r="3.5" />
            <circle cx="15" cy="88" r="2.8" />
            <circle cx="105" cy="95" r="2.2" />
          </svg>

          {/* Centered clean text in site font */}
          <span
            className="absolute inset-0 flex flex-col items-center justify-center text-center text-[10.5px] sm:text-[11.5px] font-medium leading-[1.15] px-3 select-none pointer-events-none"
            style={{
              color: 'var(--blob-text)',
              fontFamily: 'var(--font-inter-tight), -apple-system, sans-serif',
              letterSpacing: '-0.01em'
            }}
          >
            <span>See What</span>
            <span>I Built</span>
          </span>
        </div>
      </button>
    </div>
  );
}
