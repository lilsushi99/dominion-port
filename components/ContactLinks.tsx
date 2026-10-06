'use client';

// components/ContactLinks.tsx — Editorial Contact Links with Text & Subtle Glass Icon Options
import React from 'react';
import { Mail, ExternalLink } from 'lucide-react';
import { ContactLink } from '@/lib/types';
import { BrandIcon } from '@/components/icons/BrandIcons';

interface ContactLinksProps {
  links: ContactLink[];
}

type PlatformKey = 'email' | 'linkedin' | 'whatsapp' | 'x' | 'instagram' | 'behance' | 'dribbble' | 'facebook' | 'github' | 'other';

function matchPlatform(text: string): PlatformKey | null {
  const p = text.toLowerCase().trim();
  if (!p) return null;
  if (p.includes('linkedin')) return 'linkedin';
  if (p.includes('whatsapp') || p.includes('wa.me')) return 'whatsapp';
  if (p.includes('twitter') || p.includes('x.com') || p === 'x' || /\bx\b/.test(p)) return 'x';
  if (p.includes('instagram')) return 'instagram';
  if (p.includes('behance')) return 'behance';
  if (p.includes('dribbble')) return 'dribbble';
  if (p.includes('facebook')) return 'facebook';
  if (p.includes('github')) return 'github';
  if (p.includes('mail')) return 'email';
  return null;
}

// Explicit platform setting wins, then the label, then the URL host.
function detectPlatform(platform?: string | null, label?: string, url?: string): PlatformKey {
  const u = (url || '').toLowerCase();
  if (u.startsWith('mailto:')) return 'email';
  return (
    matchPlatform(platform || '') ||
    matchPlatform(label || '') ||
    matchPlatform(u.replace(/^https?:\/\//, '').split('/')[0]) ||
    'other'
  );
}

function PlatformIcon({ platform, size = 16, className }: { platform: PlatformKey; size?: number; className?: string }) {
  if (platform === 'email') return <Mail size={size} className={className} />;
  if (platform === 'other') return <ExternalLink size={size} className={className} />;
  return <BrandIcon name={platform} size={size} className={className} />;
}

export function ContactLinks({ links }: ContactLinksProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-[14px] text-[#000000] dark:text-[#8f8e89] mb-[4em]">
      {links.map((link) => {
        const isIconMode = link.presentation_mode === 'icon';
        const platformKey = detectPlatform(link.platform, link.label, link.url);

        if (isIconMode) {
          return (
            <a
              key={link.id}
              href={link.url}
              target={link.url.startsWith('http') ? '_blank' : undefined}
              rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              title={link.label}
              className="group relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#000000]/5 dark:bg-[#ffffff]/5 hover:bg-[#000000]/10 dark:hover:bg-[#ffffff]/10 border border-[#000000]/20 dark:border-[#ffffff]/10 text-[#000000] dark:text-[#d6d5cf] shadow-2xs hover:scale-105 transition-all backdrop-blur-sm"
              aria-label={link.label}
            >
              <PlatformIcon platform={platformKey} size={16} className="transition-transform group-hover:scale-110" />
              <span className="sr-only">{link.label}</span>
            </a>
          );
        }

        return (
          <a
            key={link.id}
            href={link.url}
            target={link.url.startsWith('http') ? '_blank' : undefined}
            rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-[#000000] dark:text-[#b9b8b2] underline underline-offset-[3px] hover:text-[#000000] dark:hover:text-[#d6d5cf] transition-colors duration-150 py-1"
          >
            {link.label}
          </a>
        );
      })}
    </div>
  );
}
