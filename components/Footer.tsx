// components/Footer.tsx — Clean Dynamic Footer (Admin link removed)
import React from 'react';

export interface FooterProps {
  year: number;
  copyrightText?: string;
  designedByText?: string;
  designerName?: string;
  designerUrl?: string;
}

export function Footer({
  year = 2026,
  copyrightText = '',
  designedByText = 'Designed by',
  designerName = 'Castiel',
  designerUrl = 'https://dflamez.com.ng'
}: FooterProps) {
  return (
    <footer className="w-full pt-16 pb-12 mt-auto border-t border-[#000000]/10 dark:border-[#222222]/40 text-[13px] leading-[1.6] text-[#55544f] dark:text-[#8f8e89] transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span>© {year} {designedByText}{' '}</span>
          <a
            href={designerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#000000] dark:text-[#d6d5cf] hover:text-[#5b4be0] dark:hover:text-white underline underline-offset-2 transition-colors font-medium"
          >
            {designerName}
          </a>
          {copyrightText && (
            <span className="ml-2 text-[#75746f]">{copyrightText}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
