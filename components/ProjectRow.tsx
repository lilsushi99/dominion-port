// components/ProjectRow.tsx — Editorial Project / Paper List Item with Light/Dark Theme Support
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
  if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.mov')) {
    return null;
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
      className={`group block py-6 transition-all duration-150 focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#d6d5cf] ${
        isHoveredElsewhere ? 'opacity-35' : 'opacity-100'
      }`}
    >
      {/* Desktop & Tablet Layout */}
      <div className="hidden sm:grid sm:grid-cols-[48px_1fr_120px] gap-6 items-start">
        {/* Year */}
        <div className="text-[13px] text-[#75746f] dark:text-[#8f8e89] pt-[1px] select-none font-normal font-mono transition-colors">
          {item.year}
        </div>

        {/* Title & Description */}
        <div className="pr-4">
          <div className="text-[15px] text-[#171717] dark:text-[#d6d5cf] font-medium leading-snug flex items-center gap-1.5 transition-colors">
            <span>{item.title}</span>
            <span className="text-[13px] text-[#75746f] transition-transform duration-150 ease-out group-hover:translate-x-[2px] group-hover:text-[#171717] dark:group-hover:text-[#eae9e4]">
              {arrowGlyph}
            </span>
          </div>

          <div className="mt-1.5 text-[13px] text-[#555555] dark:text-[#75746f] leading-[1.65] transition-colors">
            {item.summary}
          </div>
        </div>

        {/* Preview image */}
        {previewPath && (
          <div className="relative w-[120px] h-[78px] rounded-[4px] overflow-hidden bg-[#242424] shrink-0 justify-self-end border border-[#333333]/30">
            <Image
              src={previewPath}
              alt={item.preview?.alt || item.title}
              fill
              unoptimized
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
          <span className="text-[13px] text-[#75746f] dark:text-[#8f8e89] select-none font-mono transition-colors">{item.year}</span>
          <span className="text-[15px] text-[#171717] dark:text-[#d6d5cf] font-medium flex items-center gap-1.5 transition-colors">
            {item.title}
            <span className="text-[13px] text-[#75746f] group-hover:translate-x-[2px] transition-transform">
              {arrowGlyph}
            </span>
          </span>
        </div>

        <p className="text-[13px] text-[#555555] dark:text-[#75746f] leading-[1.65] transition-colors">
          {item.summary}
        </p>

        {previewPath && (
          <div className="relative w-full aspect-[16/10] rounded-[4px] overflow-hidden bg-[#242424] border border-[#333333]/30">
            <Image
              src={previewPath}
              alt={item.preview?.alt || item.title}
              fill
              unoptimized
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
