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
  paperCategories = [],
  initialItems,
  allPapers = [],
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

  const [selectedPaperCategory, setSelectedPaperCategory] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('paper_cat') || null;
    }
    return null;
  });

  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);

  // Sync with browser history navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('c');
      const pCat = params.get('paper_cat');

      if (c && (c === 'papers' || categories.some((cat) => cat.slug === c))) {
        setActiveCategory(c);
      } else {
        setActiveCategory(null);
      }
      setSelectedPaperCategory(pCat || null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [categories]);

  const handleSelectCategory = (slug: string | null) => {
    setActiveCategory(slug);
    setSelectedPaperCategory(null); // Reset subcategory when switching top-level tabs

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

  const handleSelectPaperSubCategory = (subSlug: string | null) => {
    setSelectedPaperCategory(subSlug);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (subSlug) {
        url.searchParams.set('paper_cat', subSlug);
      } else {
        url.searchParams.delete('paper_cat');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const isPapersTab = activeCategory === 'papers';

  // Filter projects by category
  const filteredProjects = !isPapersTab
    ? activeCategory
      ? initialItems.filter((item) => item.category_slug === activeCategory && item.type === 'project')
      : initialItems
    : [];

  // Filter papers for Level 2
  const activePaperCatObj = paperCategories.find((pc) => pc.slug === selectedPaperCategory);
  const filteredPapersList = selectedPaperCategory
    ? allPapers.filter((p) => p.category_slug === selectedPaperCategory || p.category_id === activePaperCatObj?.id)
    : allPapers;

  return (
    <section id="work" className="pt-4 scroll-mt-20">
      {/* Section Heading with Strong Editorial Hierarchy (Phase 3) */}
      <h2 className="text-[17px] sm:text-[18px] font-semibold text-[#000000] dark:text-[#eae9e4] tracking-[-0.01em] mb-6 transition-colors">
        {listHeading}
      </h2>

      {/* Interactive Category Filter Controls (Phase 4 & 6) */}
      <CategorySwitch
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* IF PAPERS TAB IS ACTIVE: 2-LEVEL BROWSING FLOW (Phase 5) */}
      {isPapersTab ? (
        <div className="space-y-6 animate-fade-in">
          {/* LEVEL 1: Paper Categories (3-Column Clean Editorial Grid) */}
          {!selectedPaperCategory ? (
            <div className="space-y-4">
              <div className="text-[13px] text-[#75746f] dark:text-[#8f8e89] mb-4">
                Select a research topic to explore publications and technical papers:
              </div>

              {paperCategories.length === 0 ? (
                <div className="py-12 text-[14px] text-[#75746f]">
                  No paper categories found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {paperCategories.map((cat, idx) => (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => handleSelectPaperSubCategory(cat.slug)}
                      className="group p-5 bg-[#000000]/[0.03] dark:bg-[#ffffff]/[0.03] hover:bg-[#000000]/[0.06] dark:hover:bg-[#ffffff]/[0.06] border border-[#000000]/10 dark:border-[#ffffff]/10 rounded-xl text-left transition-all duration-200 flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-[#000000]/20 dark:hover:border-[#ffffff]/25 shadow-2xs"
                    >
                      <div>
                        <div className="text-[11px] font-mono text-[#75746f] dark:text-[#8f8e89] uppercase tracking-wider mb-2">
                          0{idx + 1} / Topic
                        </div>
                        <h3 className="text-[15px] font-semibold text-[#171717] dark:text-[#eae9e4] group-hover:text-[#5b4be0] dark:group-hover:text-white transition-colors capitalize">
                          {cat.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-[#000000]/5 dark:border-[#ffffff]/5 text-[12px] text-[#75746f] dark:text-[#8f8e89]">
                        <span>{cat.item_count || 0} {cat.item_count === 1 ? 'publication' : 'publications'}</span>
                        <span className="text-[#5b4be0] dark:text-[#d6d5cf] group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* LEVEL 2: Papers inside the selected category */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#000000]/10 dark:border-[#ffffff]/10">
                <button
                  type="button"
                  onClick={() => handleSelectPaperSubCategory(null)}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-[#75746f] dark:text-[#8f8e89] hover:text-[#171717] dark:hover:text-[#d6d5cf] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>All Paper Categories</span>
                </button>

                <span className="text-[13px] font-semibold text-[#171717] dark:text-[#eae9e4] capitalize">
                  {activePaperCatObj?.name || selectedPaperCategory}
                </span>
              </div>

              {/* Papers Listing inside Category */}
              <div className="divide-y divide-[#000000]/10 dark:divide-[#ffffff]/10">
                {filteredPapersList.map((paper) => (
                  <Link
                    key={paper.id}
                    href={`/papers/${paper.slug}`}
                    className="group block py-6 transition-all focus:outline-none"
                  >
                    <div className="grid grid-cols-[48px_1fr_120px] gap-6 items-start">
                      <div className="text-[13px] text-[#75746f] dark:text-[#8f8e89] font-mono select-none pt-0.5">
                        {paper.pub_year}
                      </div>

                      <div className="pr-4">
                        <h4 className="text-[15px] font-medium text-[#171717] dark:text-[#d6d5cf] group-hover:text-[#5b4be0] dark:group-hover:text-white transition-colors leading-snug flex items-center gap-1.5">
                          <span>{paper.title}</span>
                          <span className="text-[13px] text-[#75746f] group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </h4>
                        {paper.summary && (
                          <p className="mt-1.5 text-[13px] text-[#555555] dark:text-[#75746f] leading-[1.65]">
                            {paper.summary}
                          </p>
                        )}
                      </div>

                      {paper.cover_media ? (
                        <div className="relative justify-self-end w-[120px] h-[78px] z-10">
                          <div className="w-[120px] h-[78px] rounded-[6px] overflow-hidden bg-[#242424] border border-[#333333]/30 transition-transform duration-250 ease-out will-change-transform group-hover:scale-[1.8] group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.4)] group-hover:z-30 group-focus-within:scale-[1.8] group-focus-within:-translate-y-1 group-focus-within:shadow-[0_16px_32px_rgba(0,0,0,0.4)] group-focus-within:z-30 origin-right">
                            <Image
                              src={paper.cover_media.public_url || `/media/${paper.cover_media.relative_path}`}
                              alt={paper.cover_media.alt || paper.title}
                              fill
                              unoptimized
                              className="object-cover transition-transform duration-250 ease-out"
                              sizes="120px"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-[120px] h-[78px] rounded-[6px] bg-[#000000]/5 dark:bg-[#ffffff]/5 border border-[#000000]/10 dark:border-[#ffffff]/10 flex items-center justify-center text-[#75746f] shrink-0 justify-self-end">
                          <FileText size={18} />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}

                {filteredPapersList.length === 0 && (
                  <div className="py-12 text-[14px] text-[#75746f] text-center">
                    No papers published in this category yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD WORK ITEMS LISTING */
        <div
          className="space-y-2"
          onMouseLeave={() => setHoveredItemId(null)}
        >
          {filteredProjects.map((item) => (
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

          {filteredProjects.length === 0 && (
            <div className="py-12 text-[14px] text-[#75746f]">
              no items found in this category.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
