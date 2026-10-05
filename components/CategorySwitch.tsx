'use client';

// components/CategorySwitch.tsx — Minimalist Editorial Interactive Category Filters
import React from 'react';
import { Category } from '@/lib/types';

interface CategorySwitchProps {
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

export function CategorySwitch({
  categories,
  activeCategory,
  onSelectCategory
}: CategorySwitchProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-10 text-[12px] sm:text-[13px] font-mono">
      {/* ALL Filter */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all duration-150 uppercase tracking-wider ${
          activeCategory === null
            ? 'bg-[#000000]/10 dark:bg-[#ffffff]/10 text-[#171717] dark:text-[#ffffff] border-[#000000]/20 dark:border-[#ffffff]/25 font-semibold shadow-2xs'
            : 'bg-transparent text-[#75746f] dark:text-[#8f8e89] border-transparent hover:border-[#000000]/10 dark:hover:border-[#ffffff]/10 hover:text-[#171717] dark:hover:text-[#d6d5cf]'
        }`}
      >
        [ all ]
      </button>

      {/* Dynamic Project Categories + Papers */}
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        return (
          <button
            key={cat.id || cat.slug}
            type="button"
            onClick={() => onSelectCategory(cat.slug)}
            className={`cursor-pointer px-3 py-1.5 rounded-lg border transition-all duration-150 uppercase tracking-wider ${
              isActive
                ? 'bg-[#000000]/10 dark:bg-[#ffffff]/10 text-[#171717] dark:text-[#ffffff] border-[#000000]/20 dark:border-[#ffffff]/25 font-semibold shadow-2xs'
                : 'bg-transparent text-[#75746f] dark:text-[#8f8e89] border-transparent hover:border-[#000000]/10 dark:hover:border-[#ffffff]/10 hover:text-[#171717] dark:hover:text-[#d6d5cf]'
            }`}
          >
            [ {cat.name} ]
          </button>
        );
      })}
    </div>
  );
}
