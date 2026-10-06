'use client';

// components/FloatingWorkButton.tsx — Organic Paint-Splash Blob "See What I've Built" Mobile-First Shortcut
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
          // Hide button as soon as work section enters the viewport
          if (entry.isIntersecting) {
            setVisible(false);
          } else {
            const rect = workSection.getBoundingClientRect();
            if (rect.top > 180) {
              setVisible(true);
            } else {
              setVisible(false);
            }
          }
        },
        {
          threshold: [0, 0.1, 0.2],
          rootMargin: '0px 0px -10% 0px'
        }
      );

      observerRef.current.observe(workSection);
    }

    const handleScroll = () => {
      if (!workSection) return;
      const rect = workSection.getBoundingClientRect();
      if (rect.top <= 180) {
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
      className={`fixed right-3 sm:right-8 z-30 pointer-events-none transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{
        // On mobile, position higher up (near 2nd intro paragraph), on desktop position fixed bottom-right
        top: 'clamp(210px, 32vh, 320px)',
        bottom: 'auto'
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
        {/* Original Organic Paint-Splash Blob SVG (flat fill, no gradient, no shadow) */}
        <div className="relative w-[88px] h-[88px] sm:w-[102px] sm:h-[102px] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 active:scale-95">
          <svg
            viewBox="0 0 140 140"
            className="w-full h-full drop-none select-none block"
            style={{
              fill: 'var(--blob-fill)'
            }}
          >
            {/* Custom organic paint-splash shape with asymmetrical splatters extending from central core */}
            <path d="M70,20 C82,10 90,26 100,18 C108,12 114,28 122,36 C130,44 142,52 134,64 C126,76 142,88 128,100 C118,110 114,128 100,126 C86,124 78,138 66,134 C52,130 44,142 32,128 C20,114 8,112 10,96 C12,82 2,72 10,58 C18,44 14,32 28,26 C40,20 54,30 70,20 Z" />
            {/* Small detached organic paint droplets */}
            <circle cx="128" cy="18" r="3.5" />
            <circle cx="136" cy="78" r="2.8" />
            <circle cx="16" cy="120" r="3" />
            <circle cx="10" cy="38" r="2.2" />
          </svg>

          {/* Centered clean text in site typography */}
          <span
            className="absolute inset-0 flex flex-col items-center justify-center text-center text-[10px] sm:text-[11px] font-medium leading-[1.15] px-2.5 select-none pointer-events-none"
            style={{
              color: 'var(--blob-text)',
              fontFamily: 'var(--font-inter-tight), -apple-system, sans-serif',
              letterSpacing: '-0.01em'
            }}
          >
            <span>See What</span>
            <span>I&apos;ve Built</span>
          </span>
        </div>
      </button>
    </div>
  );
}
