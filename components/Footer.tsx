// components/Footer.tsx — Site Footer with Dynamic Settings & Temporary Admin Link
import Link from 'next/link';

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
    <footer className="w-full pt-16 pb-12 mt-auto border-t border-[#222222]/40 text-[13px] leading-[1.6] text-[#75746f]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span>© {year} — {designedByText}{' '}</span>
          <a
            href={designerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d6d5cf] hover:text-white underline underline-offset-2 transition-colors"
          >
            {designerName}
          </a>
          {copyrightText && (
            <span className="ml-2 text-[#75746f]">{copyrightText}</span>
          )}

          {/* TEMP: remove before production */}
          <span className="text-[#3a3a3a] mx-2">·</span>
          <Link
            href="/hippo"
            className="text-[#75746f] hover:text-[#d6d5cf] underline underline-offset-2 transition-colors"
          >
            Admin
          </Link>
          {/* /TEMP */}
        </div>
      </div>
    </footer>
  );
}
