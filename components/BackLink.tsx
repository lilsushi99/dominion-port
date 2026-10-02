'use client';

// components/BackLink.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BackLinkProps {
  categorySlug?: string;
}

export function BackLink({ categorySlug }: BackLinkProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      const destination = categorySlug ? `/?c=${encodeURIComponent(categorySlug)}` : '/';
      router.push(destination);
    }
  };

  return (
    <div className="mb-10">
      <Link
        href="/"
        onClick={handleBack}
        className="text-[14px] text-[#8f8e89] hover:text-[#d6d5cf] transition-colors duration-150 inline-block py-1 focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#d6d5cf]"
      >
        back
      </Link>
    </div>
  );
}
