'use client';

// app/papers/page.tsx — Dedicated Public Papers Index Page with Search, Category Buttons & Grid
import React, { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, FileText, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { Footer } from '@/components/Footer';

interface Category {
  id: number;
  slug: string;
  name: string;
  item_count?: number;
}

interface PaperItem {
  id: number;
  slug: string;
  title: string;
  pub_year: number;
  pub_month?: number | null;
  pub_day?: number | null;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  summary: string | null;
  cover_media?: {
    public_url?: string;
    relative_path?: string;
    alt?: string | null;
  } | null;
  published_at: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function PapersPage({
  searchParams: searchParamsPromise
}: {
  searchParams?: Promise<{ category?: string; search?: string; page?: string }>;
}) {
  const resolvedSearchParams = searchParamsPromise ? use(searchParamsPromise) : {};
  const initialCategory = resolvedSearchParams?.category || 'all';
  const initialSearch = resolvedSearchParams?.search || '';
  const initialPage = Number(resolvedSearchParams?.page) || 1;

  const [categories, setCategories] = useState<Category[]>([]);
  const [papers, setPapers] = useState<PaperItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(true);
  const [footer, setFooter] = useState<any>({
    year: 2026,
    copyright_text: '',
    designed_by_text: 'Designed by',
    designer_name: 'Castiel',
    designer_url: 'https://dflamez.com.ng'
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [catRes, papRes, profileRes] = await Promise.all([
          fetch('/api/v1/categories?type=paper'),
          fetch('/api/v1/papers'),
          fetch('/api/v1/profile')
        ]);

        const [catJson, papJson, profJson] = await Promise.all([
          catRes.json(),
          papRes.json(),
          profileRes.json()
        ]);

        if (!mounted) return;

        if (catJson.data) {
          // Exclude main parent 'papers' slug if present
          const subCats = catJson.data.filter((c: Category) => c.slug !== 'papers');
          setCategories(subCats);
        }

        if (papJson.data) {
          setPapers(papJson.data);
        }

        if (profJson.data?.footer) {
          setFooter(profJson.data.footer);
        }
      } catch (err) {
        console.error('Failed to load papers index data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter papers by selected category and search query
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        p.category_slug === selectedCategory;

      // Search query filter (title, summary, category)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.summary && p.summary.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [papers, selectedCategory, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedPapers = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredPapers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPapers, currentPageSafe]);

  const handleCategorySelect = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setCurrentPage(1);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (catSlug !== 'all') {
        url.searchParams.set('category', catSlug);
      } else {
        url.searchParams.delete('category');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="w-full max-w-[820px] mx-auto px-6 sm:px-0 pt-[72px] sm:pt-[110px] pb-[80px] flex-1 flex flex-col justify-between">
        <div>
          {/* Back Navigation */}
          <div className="mb-8">
            <Link
              href="/#work"
              className="inline-flex items-center gap-1.5 text-[13px] text-[#6f6e69] dark:text-[#8f8e89] hover:text-[#16151c] dark:hover:text-[#eae9e4] font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to home</span>
            </Link>
          </div>

          {/* Page Header & Subtext */}
          <header className="mb-10">
            <h1 className="text-[28px] sm:text-[32px] font-semibold text-[#16151c] dark:text-[#eae9e4] tracking-tight leading-none mb-2">
              Papers
            </h1>
            <p className="text-[15px] text-[#6f6e69] dark:text-[#8f8e89] italic font-serif">
              Sometimes I do write
            </p>
          </header>

          {/* Search Bar & Category Filters */}
          <div className="space-y-6 mb-10">
            {/* Search Input */}
            <div className="relative w-full max-w-[480px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#75746f] dark:text-[#8f8e89] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search published research & technical papers..."
                className="w-full h-10 pl-10 pr-4 rounded-[10px] bg-[#000000]/[0.03] dark:bg-[#ffffff]/[0.03] border border-[#000000]/10 dark:border-[#ffffff]/10 text-[13px] text-[#16151c] dark:text-[#eae9e4] placeholder:text-[#8f8e89] outline-none focus:border-[#16151c] dark:focus:border-[#eae9e4] transition-colors"
              />
            </div>

            {/* Category Filter Rounded Buttons (No square brackets, No underline links) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCategorySelect('all')}
                aria-pressed={selectedCategory === 'all'}
                className={`min-h-[40px] px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#16151c] text-[#eae9e4] dark:bg-[#eae9e4] dark:text-[#16151c] shadow-xs'
                    : 'bg-transparent border border-[#000000]/12 dark:border-[#ffffff]/12 text-[#6f6e69] dark:text-[#8f8e89] hover:text-[#16151c] dark:hover:text-[#eae9e4] hover:border-[#000000]/25 dark:hover:border-[#ffffff]/25'
                }`}
              >
                All
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => handleCategorySelect(cat.slug)}
                    aria-pressed={isActive}
                    className={`min-h-[40px] px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 cursor-pointer capitalize ${
                      isActive
                        ? 'bg-[#16151c] text-[#eae9e4] dark:bg-[#eae9e4] dark:text-[#16151c] shadow-xs'
                        : 'bg-transparent border border-[#000000]/12 dark:border-[#ffffff]/12 text-[#6f6e69] dark:text-[#8f8e89] hover:text-[#16151c] dark:hover:text-[#eae9e4] hover:border-[#000000]/25 dark:hover:border-[#ffffff]/25'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paper Listing Grid (2 Columns × 5 Rows = 10 per page default) */}
          {loading ? (
            <div className="py-20 text-center text-[13px] text-[#8f8e89]">
              Loading research index...
            </div>
          ) : paginatedPapers.length === 0 ? (
            <div className="py-20 text-center text-[14px] text-[#8f8e89] border border-dashed border-[#000000]/10 dark:border-[#ffffff]/10 rounded-2xl p-8">
              No published papers found matching your selection.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {paginatedPapers.map((paper) => {
                const categorySlug = paper.category_slug || 'research-papers';
                const paperHref = `/papers/${categorySlug}/${paper.slug}`;
                const coverUrl =
                  paper.cover_media?.public_url ||
                  (paper.cover_media?.relative_path
                    ? `/media/${paper.cover_media.relative_path}`
                    : null);

                return (
                  <Link
                    key={paper.id}
                    href={paperHref}
                    className="group flex flex-col justify-between p-5 bg-[#000000]/[0.02] dark:bg-[#ffffff]/[0.02] hover:bg-[#000000]/[0.05] dark:hover:bg-[#ffffff]/05 border border-[#000000]/10 dark:border-[#ffffff]/10 hover:border-[#000000]/20 dark:hover:border-[#ffffff]/20 rounded-xl transition-all duration-200"
                  >
                    <div>
                      {/* Optional Cover Image */}
                      {coverUrl ? (
                        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#202020] mb-4 border border-[#000000]/10 dark:border-[#ffffff]/10">
                          <Image
                            src={coverUrl}
                            alt={paper.cover_media?.alt || paper.title}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 400px"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-lg bg-[#000000]/[0.03] dark:bg-[#ffffff]/[0.03] border border-[#000000]/05 dark:border-[#ffffff]/05 mb-4 flex items-center justify-center text-[#8f8e89]">
                          <FileText size={22} />
                        </div>
                      )}

                      {/* Date & Category */}
                      <div className="flex items-center justify-between text-[12px] font-mono text-[#75746f] dark:text-[#8f8e89] mb-2">
                        <span>{paper.pub_year}</span>
                        {paper.category_name && (
                          <span className="capitalize">{paper.category_name}</span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-[16px] font-semibold text-[#16151c] dark:text-[#eae9e4] group-hover:text-[#5b4be0] dark:group-hover:text-white transition-colors leading-snug mb-2">
                        {paper.title}
                      </h2>

                      {/* Excerpt / Summary */}
                      {paper.summary && (
                        <p className="text-[13px] text-[#555555] dark:text-[#8f8e89] leading-[1.6] line-clamp-3">
                          {paper.summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#000000]/05 dark:border-[#ffffff]/05 flex items-center justify-between text-[12px] font-medium text-[#16151c] dark:text-[#eae9e4]">
                      <span>Read paper</span>
                      <span className="text-[#8f8e89] group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#000000]/10 dark:border-[#ffffff]/10 pt-6">
              <button
                type="button"
                disabled={currentPageSafe <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#000000]/10 dark:border-[#ffffff]/10 text-[13px] font-medium text-[#6f6e69] dark:text-[#8f8e89] hover:text-[#16151c] dark:hover:text-[#eae9e4] disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors"
              >
                <ChevronLeft size={15} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1.5 text-[13px] font-mono text-[#6f6e69] dark:text-[#8f8e89]">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                      pg === currentPageSafe
                        ? 'bg-[#16151c] text-[#eae9e4] dark:bg-[#eae9e4] dark:text-[#16151c]'
                        : 'hover:bg-[#000000]/05 dark:hover:bg-[#ffffff]/05 text-[#6f6e69] dark:text-[#8f8e89]'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPageSafe >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#000000]/10 dark:border-[#ffffff]/10 text-[13px] font-medium text-[#6f6e69] dark:text-[#8f8e89] hover:text-[#16151c] dark:hover:text-[#eae9e4] disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer
          year={footer.year}
          copyrightText={footer.copyright_text}
          designedByText={footer.designed_by_text}
          designerName={footer.designer_name}
          designerUrl={footer.designer_url}
        />
      </div>
    </main>
  );
}
