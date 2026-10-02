// components/Gallery.tsx
import React from 'react';
import Image from 'next/image';

interface GalleryItem {
  id: number;
  path: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
}

interface GalleryProps {
  items: GalleryItem[];
}

export function Gallery({ items }: GalleryProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-14 space-y-12">
      {items.map((item) => (
        <figure key={item.id} className="space-y-2.5">
          <div className="rounded-[4px] overflow-hidden bg-[#202020] border border-[#333333]/30">
            <Image
              src={item.path}
              alt={item.alt}
              width={item.width || 1400}
              height={item.height || 900}
              className="w-full h-auto rounded-[4px] block object-contain"
              sizes="(max-width: 1024px) 100vw, 1100px"
              referrerPolicy="no-referrer"
            />
          </div>
          {item.caption && (
            <figcaption className="text-[13px] text-[#75746f] italic leading-normal pt-1">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
