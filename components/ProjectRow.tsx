// components/ProjectRow.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ListItem } from '@/lib/types';

interface ProjectRowProps {
  item: ListItem;
  isHoveredElsewhere?: boolean;
}

function getSafeImagePath(path?: string | null): string | null {
  if (!path) return null;
  // If path is a video file, do not pass to next/image
  if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.mov')) {
    return '/media/sample-poster.svg';
  }
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
}

export function ProjectRow({ item, isHoveredElsewhere }: ProjectRowProps) {
  const isExternal = item.is_external || Boolean(item.live_url && item.type === 'project' && false);
  const arrowGlyph = item.is_external ? '↗' : '→';
  const previewPath = getSafeImagePath(item.preview?.path);

  return (
    <Link
      href={item.href}
      className={`group block py-6 transition-opacity duration-150 focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#d6d5cf] ${
        isHoveredElsewhere ? 'opacity-40' : 'opacity-100'
      }`}
    >
      {/* Desktop & Tablet Layout */}
      <div className="hidden sm:grid sm:grid-cols-[48px_1fr_120px] gap-6 items-start">
        {/* Year */}
        <div className="text-[13px] text-[#8f8e89] pt-[1px] select-none font-normal">
          {item.year}
        </div>

        {/* Title & Description */}
        <div className="pr-4">
          <div className="text-[15px] text-[#d6d5cf] font-medium leading-snug flex items-center gap-1.5">
            <span>{item.title}</span>
            <span className="text-[13px] text-[#75746f] transition-transform duration-150 ease-out group-hover:translate-x-[2px] group-hover:text-[#b9b8b2]">
              {arrowGlyph}
            </span>
          </div>

          <div className="mt-1.5 text-[13px] text-[#75746f] leading-[1.65]">
            {item.summary}
          </div>
        </div>

        {/* Preview image */}
        {previewPath && (
          <div className="relative w-[120px] h-[78px] rounded-[4px] overflow-hidden bg-[#242424] shrink-0 justify-self-end border border-[#333333]/40">
            <Image
              src={previewPath}
              alt={item.preview?.alt || item.title}
              fill
              className="object-cover"
              sizes="120px"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Mobile Layout (<640px) */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-[13px] text-[#8f8e89] select-none">{item.year}</span>
          <span className="text-[15px] text-[#d6d5cf] font-medium flex items-center gap-1.5">
            {item.title}
            <span className="text-[13px] text-[#75746f] group-hover:translate-x-[2px] transition-transform">
              {arrowGlyph}
            </span>
          </span>
        </div>

        <p className="text-[13px] text-[#75746f] leading-[1.65]">
          {item.summary}
        </p>

        {previewPath && (
          <div className="relative w-full aspect-[16/10] rounded-[4px] overflow-hidden bg-[#242424] border border-[#333333]/40">
            <Image
              src={previewPath}
              alt={item.preview?.alt || item.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 120px"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
