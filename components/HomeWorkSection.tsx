'use client';

// components/HomeWorkSection.tsx
import React, { useState, useEffect } from 'react';
import { Category, ListItem } from '@/lib/types';
import { CategorySwitch } from './CategorySwitch';
import { ProjectRow } from './ProjectRow';

interface HomeWorkSectionProps {
  categories: Category[];
  initialItems: ListItem[];
  listHeading: string;
}

export function HomeWorkSection({
  categories,
  initialItems,
  listHeading
}: HomeWorkSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('c');
      if (c && categories.some((cat) => cat.slug === c)) {
        return c;
      }
    }
    return null;
  });
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);

  // Sync with browser history navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('c');
      if (c && categories.some((cat) => cat.slug === c)) {
        setActiveCategory(c);
      } else {
        setActiveCategory(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [categories]);

  const handleSelectCategory = (slug: string | null) => {
    setActiveCategory(slug);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (slug) {
        url.searchParams.set('c', slug);
      } else {
        url.searchParams.delete('c');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const filteredItems = activeCategory
    ? initialItems.filter((item) => item.category_slug === activeCategory)
    : initialItems;

  return (
    <section className="pt-2">
      {/* Section lead-in */}
      <h2 className="text-[15px] text-[#b9b8b2] mb-6">
        {listHeading}
      </h2>

      {/* Category switcher */}
      <CategorySwitch
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* Project list with generous spacing and sibling dim on hover */}
      <div
        className="space-y-4"
        onMouseLeave={() => setHoveredItemId(null)}
      >
        {filteredItems.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            onMouseEnter={() => setHoveredItemId(item.id)}
          >
            <ProjectRow
              item={item}
              isHoveredElsewhere={hoveredItemId !== null && hoveredItemId !== item.id}
            />
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="py-12 text-[14px] text-[#75746f]">
            no items found in this category.
          </div>
        )}
      </div>
    </section>
  );
}
