'use client';

// components/ProfileAvatar.tsx — Stacked Profile Pictures with Cross-Fade & Hover/Tap Switching
import React, { useState, useSyncExternalStore } from 'react';
import Image from 'next/image';

interface ProfileImage {
  id: number;
  url: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

interface ProfileAvatarProps {
  images: ProfileImage[];
}

function subscribeTouch(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const touchQuery = window.matchMedia('(hover: none)');
  touchQuery.addEventListener('change', callback);
  return () => touchQuery.removeEventListener('change', callback);
}

function getTouchSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none)').matches;
}

export function ProfileAvatar({ images }: ProfileAvatarProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isTouch = useSyncExternalStore(subscribeTouch, getTouchSnapshot, () => false);

  if (!images || images.length === 0) {
    return null;
  }

  const hasMultiple = images.length > 1;

  // Desktop Hover: show next image on hover, reset to 0 on leave
  const handleMouseEnter = () => {
    if (!isTouch && hasMultiple) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handleMouseLeave = () => {
    if (!isTouch && hasMultiple) {
      setCurrentIndex(0);
    }
  };

  // Touch & Keyboard: Cycle through images on tap/click
  const handleCycle = () => {
    if (hasMultiple) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hasMultiple && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleCycle();
    }
  };

  return (
    <div className="mb-6 inline-block">
      <button
        type="button"
        onClick={handleCycle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        aria-label={
          hasMultiple
            ? `Profile picture ${currentIndex + 1} of ${images.length}. Click or tap to view next image.`
            : 'Profile picture of Dominion'
        }
        className={`relative w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] rounded-[22px] overflow-hidden bg-[#222222] border border-[#444444]/30 dark:border-[#555555]/30 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#eae9e4] shrink-0 block select-none ${
          hasMultiple ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{
          borderRadius: '38%',
        }}
      >
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={img.url}
              alt={img.alt || 'Dominion'}
              width={img.width || 128}
              height={img.height || 128}
              priority={idx === 0}
              className="w-full h-full object-cover"
              sizes="(max-width: 640px) 56px, 64px"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </button>
    </div>
  );
}
