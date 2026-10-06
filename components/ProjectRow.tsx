'use client';

// components/ProjectRow.tsx — Editorial Project / Paper List Item with Cover Pop-Out on Hover
import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ListItem } from '@/lib/types';
import { getSafeMediaUrl } from '@/lib/media-url';

interface ProjectRowProps {
  item: ListItem;
  isHoveredElsewhere?: boolean;
}

export function ProjectRow({ item, isHoveredElsewhere }: ProjectRowProps) {
  const isExternal = item.is_external || Boolean(item.live_url && item.type === 'project' && false);
  const arrowGlyph = item.is_external ? '↗' : '→';
  const rawPath = item.preview?.path;
  const previewPath = getSafeMediaUrl(rawPath);
  const isVideo = Boolean(previewPath && (previewPath.endsWith('.mp4') || previewPath.endsWith('.webm') || previewPath.endsWith('.mov')));

  const rowRef = useRef<HTMLAnchorElement>(null);
  const [isMobileCentered, setIsMobileCentered] = useState(false);

  useEffect(() => {
    // Touch devices: highlight nearest to center
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (!isTouch || !rowRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If intersecting near middle 40% of viewport
          setIsMobileCentered(entry.isIntersecting);
        });
      },
      {
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0.1
      }
    );

    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={rowRef}
      href={item.href}
      className={`group block py-6 transition-opacity duration-200 focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#8f8e89] relative ${
        isHoveredElsewhere ? 'opacity-35' : 'opacity-100'
      }`}
    >
      {/* Desktop & Tablet Layout */}
      <div className="hidden sm:grid sm:grid-cols-[48px_1fr_120px] gap-6 items-start">
        {/* Year */}
        <div className="text-[13px] text-[#000000] dark:text-[#8f8e89] pt-[1px] select-none font-normal font-mono transition-colors">
          {item.year}
        </div>

        {/* Title & Description */}
        <div className="pr-4">
          <div className="text-[15px] text-[#000000] dark:text-[#eae9e4] font-medium leading-snug flex items-center gap-1.5 transition-colors group-hover:text-[#000000] dark:group-hover:text-white">
            <span>{item.title}</span>
            <span className="text-[13px] text-[#000000] dark:text-[#8f8e89] transition-transform duration-150 ease-out group-hover:translate-x-[2px] group-hover:text-[#000000] dark:group-hover:text-[#eae9e4]">
              {arrowGlyph}
            </span>
          </div>

          <div className="mt-1.5 text-[13px] text-[#000000] dark:text-[#8f8e89] leading-[1.65] transition-colors">
            {item.summary}
          </div>
        </div>

        {/* Cover image container with smooth Pop-Out scaling */}
        {previewPath && (
          <div className="relative justify-self-end w-[120px] h-[78px] z-10">
            <div
              className="w-[120px] h-[78px] rounded-[6px] overflow-hidden bg-[#242424] border border-[#333333]/30 transition-transform duration-250 ease-out will-change-transform group-hover:scale-[1.8] group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.4)] group-hover:z-30 group-focus-within:scale-[1.8] group-focus-within:-translate-y-1 group-focus-within:shadow-[0_16px_32px_rgba(0,0,0,0.4)] group-focus-within:z-30 origin-right"
            >
              {isVideo ? (
                <video
                  src={previewPath}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover block"
                />
              ) : (
                <Image
                  src={previewPath}
                  alt={item.preview?.alt || item.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-250 ease-out"
                  sizes="120px"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Layout (<640px) */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[13px] text-[#000000] dark:text-[#8f8e89] select-none font-mono transition-colors">{item.year}</span>
          <span className="text-[15px] text-[#000000] dark:text-[#eae9e4] font-medium flex items-center gap-1.5 transition-colors">
            {item.title}
            <span className="text-[13px] text-[#000000] dark:text-[#8f8e89] group-hover:translate-x-[2px] transition-transform">
              {arrowGlyph}
            </span>
          </span>
        </div>

        <p className="text-[13px] text-[#000000] dark:text-[#8f8e89] leading-[1.65] transition-colors">
          {item.summary}
        </p>

        {previewPath && (
          <div className="relative w-full aspect-[16/10] rounded-[6px] overflow-hidden bg-[#242424] border border-[#333333]/30">
            <div
              className={`w-full h-full transition-transform duration-300 ease-out ${
                isMobileCentered ? 'scale-[1.12]' : 'scale-100'
              }`}
            >
              {isVideo ? (
                <video
                  src={previewPath}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover block"
                />
              ) : (
                <Image
                  src={previewPath}
                  alt={item.preview?.alt || item.title}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 120px"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
