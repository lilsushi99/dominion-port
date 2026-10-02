// components/ContactLinks.tsx
import React from 'react';
import { ContactLink } from '@/lib/types';

interface ContactLinksProps {
  links: ContactLink[];
}

export function ContactLinks({ links }: ContactLinksProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-[#8f8e89] mb-[4em]">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target={link.url.startsWith('http') ? '_blank' : undefined}
          rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-[#b9b8b2] underline underline-offset-[3px] hover:text-[#d6d5cf] transition-colors duration-150"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
