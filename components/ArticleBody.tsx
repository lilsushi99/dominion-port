// components/ArticleBody.tsx
import React from 'react';
import Image from 'next/image';
import { ArticleBlock } from '@/lib/types';
import { getSafeMediaUrl } from '@/lib/media-url';

interface ArticleBodyProps {
  blocks: ArticleBlock[];
}

export function ArticleBody({ blocks }: ArticleBodyProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-6 text-[#b9b8b2] text-[15px] leading-[1.75] editorial-paragraphs">
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading': {
            const level = block.content.level || 2;
            const text = block.content.text || '';
            if (level === 2) {
              return (
                <h2
                  key={block.id}
                  className="text-[18px] font-semibold text-[#d6d5cf] tracking-[-0.01em] pt-6 pb-2"
                >
                  {text}
                </h2>
              );
            }
            return (
              <h3
                key={block.id}
                className="text-[16px] font-medium text-[#d6d5cf] pt-4 pb-1"
              >
                {text}
              </h3>
            );
          }

          case 'paragraph': {
            return (
              <p key={block.id} className="mb-[1.5em]">
                {block.content.text}
              </p>
            );
          }

          case 'quote': {
            return (
              <blockquote
                key={block.id}
                className="my-8 pl-4 border-l border-[#3a3a3a] text-[#d6d5cf] italic text-[16px] leading-[1.6]"
              >
                <p>&ldquo;{block.content.text}&rdquo;</p>
                {block.content.attribution && (
                  <footer className="text-[13px] text-[#75746f] not-italic mt-2">
                    — {block.content.attribution}
                  </footer>
                )}
              </blockquote>
            );
          }

          case 'image': {
            const rawP = block.content.path || block.content.url;
            const imgPath = getSafeMediaUrl(rawP);
            if (!imgPath) return null;
            return (
              <figure key={block.id} className="my-8 space-y-2">
                <div className="rounded-[4px] overflow-hidden bg-[#202020] border border-[#333333]/30">
                  <Image
                    src={imgPath}
                    alt={block.content.alt || ''}
                    width={1200}
                    height={750}
                    className="w-full h-auto rounded-[4px] block object-contain"
                    sizes="(max-width: 768px) 100vw, 655px"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {block.content.caption && (
                  <figcaption className="text-[13px] text-[#75746f]">
                    {block.content.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'video': {
            const rawP = block.content.path || block.content.url;
            const videoPath = getSafeMediaUrl(rawP);
            if (!videoPath) return null;
            return (
              <figure key={block.id} className="my-8 space-y-2">
                <div className="rounded-[4px] overflow-hidden bg-[#202020] border border-[#333333]/30">
                  <video
                    src={videoPath}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-auto rounded-[4px] block"
                  />
                </div>
                {block.content.caption && (
                  <figcaption className="text-[13px] text-[#75746f]">
                    {block.content.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          case 'list': {
            const items = block.content.items || [];
            return (
              <ul key={block.id} className="my-4 space-y-2 list-disc list-inside">
                {items.map((item, idx) => (
                  <li key={idx} className="text-[#b9b8b2]">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          case 'link': {
            return (
              <div key={block.id} className="my-6">
                <a
                  href={block.content.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d6d5cf] font-medium underline underline-offset-[3px] hover:text-white transition-colors duration-150 inline-flex items-center gap-1.5"
                >
                  <span>{block.content.text || block.content.url}</span>
                  <span className="text-[13px] text-[#75746f]">↗</span>
                </a>
              </div>
            );
          }

          case 'code': {
            return (
              <div
                key={block.id}
                className="my-6 p-4 rounded-[4px] bg-[#222222] border border-[#333333]/40 font-mono text-[13px] text-[#d6d5cf] overflow-x-auto leading-relaxed"
              >
                <pre>{block.content.code}</pre>
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
