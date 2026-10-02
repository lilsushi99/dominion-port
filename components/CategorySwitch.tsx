'use client';

// components/CategorySwitch.tsx
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
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-10 text-[14px]">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`cursor-pointer transition-colors duration-150 py-1 ${
          activeCategory === null
            ? 'text-[#d6d5cf] font-medium underline underline-offset-[4px]'
            : 'text-[#75746f] hover:text-[#b9b8b2]'
        }`}
      >
        all
      </button>

      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.slug)}
            className={`cursor-pointer transition-colors duration-150 py-1 ${
              isActive
                ? 'text-[#d6d5cf] font-medium underline underline-offset-[4px]'
                : 'text-[#75746f] hover:text-[#b9b8b2]'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
