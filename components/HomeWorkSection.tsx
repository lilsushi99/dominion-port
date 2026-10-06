'use client';

// components/HomeWorkSection.tsx — Hierarchical Work Section with Papers 2-Level Browsing
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import { Category, ListItem } from '@/lib/types';
import { CategorySwitch } from './CategorySwitch';
import { ProjectRow } from './ProjectRow';

interface HomeWorkSectionProps {
  categories: Category[];
  paperCategories?: Category[];
  initialItems: ListItem[];
  allPapers?: any[];
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
      if (c && (c === 'papers' || categories.some((cat) => cat.slug === c))) {
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

      if (c && (c === 'papers' || categories.some((cat) => cat.slug === c))) {
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
      url.searchParams.delete('paper_cat');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Filter items by category: if papers is selected, filter papers; if project category, filter that; if null, show all
  const filteredItems = activeCategory
    ? initialItems.filter((item) => item.category_slug === activeCategory)
    : initialItems;

  return (
    <section id="work" className="pt-4 scroll-mt-20">
      {/* Section Heading with Strong Editorial Hierarchy */}
      <h2 className="text-[17px] sm:text-[18px] font-semibold text-[#000000] dark:text-[#eae9e4] tracking-[-0.01em] mb-6 transition-colors">
        {listHeading}
      </h2>

      {/* Interactive Category Filter Controls */}
      <CategorySwitch
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* UNIFIED WORK ITEMS LISTING */}
      <div
        className="space-y-2 mt-6"
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
          <div className="py-12 text-[14px] text-[#000000] dark:text-[#8f8e89]">
            no items found in this category.
          </div>
        )}
      </div>
    </section>
  );
}
