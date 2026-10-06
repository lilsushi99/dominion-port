'use client';

// components/ContactLinks.tsx — Editorial Contact Links with Text & Subtle Glass Icon Options
import React from 'react';
import {
  Mail,
  Linkedin,
  MessageCircle,
  Twitter,
  Instagram,
  Dribbble,
  Facebook,
  Github,
  Globe,
  ExternalLink
} from 'lucide-react';
import { ContactLink } from '@/lib/types';

interface ContactLinksProps {
  links: ContactLink[];
}

function getPlatformIcon(platform?: string | null, label?: string) {
  const p = (platform || label || '').toLowerCase();
  if (p.includes('mail') || p.includes('email') || p.includes('@')) return Mail;
  if (p.includes('linkedin')) return Linkedin;
  if (p.includes('whatsapp') || p.includes('wa.me')) return MessageCircle;
  if (p.includes('twitter') || p.includes('x.com') || p === 'x') return Twitter;
  if (p.includes('instagram')) return Instagram;
  if (p.includes('dribbble')) return Dribbble;
  if (p.includes('facebook')) return Facebook;
  if (p.includes('github')) return Github;
  if (p.includes('behance')) return Globe;
  return ExternalLink;
}

export function ContactLinks({ links }: ContactLinksProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-[14px] text-[#000000] dark:text-[#8f8e89] mb-[4em]">
      {links.map((link) => {
        const isIconMode = link.presentation_mode === 'icon';
        const IconComponent = getPlatformIcon(link.platform, link.label);

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
              <IconComponent size={16} className="transition-transform group-hover:scale-110" />
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
