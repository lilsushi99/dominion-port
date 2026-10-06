'use client';

// components/CategorySwitch.tsx — Category Filter Buttons with Modest Radius & Clean Theme States
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
  const isAllActive = activeCategory === null;

  return (
    <div
      role="group"
      aria-label="Filter portfolio items by category"
      className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-10 text-[13px] font-sans"
    >
      {/* ALL Filter Button */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        aria-pressed={isAllActive}
        className={`cursor-pointer px-3.5 py-2 min-h-[40px] rounded-[8px] border transition-colors duration-150 text-[13px] font-medium select-none capitalize focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#000000] dark:focus-visible:outline-[#8f8e89] ${
          isAllActive
            ? 'bg-black text-white border-black dark:bg-[#eae9e4] dark:text-[#16151c] dark:border-[#eae9e4]'
            : 'bg-transparent text-black border-black hover:bg-black/5 dark:text-[#8f8e89] dark:border-[#444444]/60 dark:hover:text-[#eae9e4] dark:hover:border-[#666666]'
        }`}
        style={{
          backgroundColor: isAllActive ? 'var(--btn-active-bg)' : 'transparent',
          color: isAllActive ? 'var(--btn-active-text)' : 'var(--btn-inactive-text)',
          borderColor: isAllActive ? 'var(--btn-active-bg)' : 'var(--btn-inactive-border)',
        }}
      >
        All
      </button>

      {/* Dynamic Project Categories + Papers */}
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        return (
          <button
            key={cat.id || cat.slug}
            type="button"
            onClick={() => onSelectCategory(cat.slug)}
            aria-pressed={isActive}
            className={`cursor-pointer px-3.5 py-2 min-h-[40px] rounded-[8px] border transition-colors duration-150 text-[13px] font-medium select-none capitalize focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#000000] dark:focus-visible:outline-[#8f8e89] ${
              isActive
                ? 'bg-black text-white border-black dark:bg-[#eae9e4] dark:text-[#16151c] dark:border-[#eae9e4]'
                : 'bg-transparent text-black border-black hover:bg-black/5 dark:text-[#8f8e89] dark:border-[#444444]/60 dark:hover:text-[#eae9e4] dark:hover:border-[#666666]'
            }`}
            style={{
              backgroundColor: isActive ? 'var(--btn-active-bg)' : 'transparent',
              color: isActive ? 'var(--btn-active-text)' : 'var(--btn-inactive-text)',
              borderColor: isActive ? 'var(--btn-active-bg)' : 'var(--btn-inactive-border)',
            }}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
