'use client';

// app/hippo/papers/page.tsx — Papers Management Table
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  ExternalLink,
  FileText,
  Check,
  Eye
} from 'lucide-react';
import { useHippoAuth } from '@/components/admin/HippoAuthProvider';
import { PaperRecord } from '@/backend/src/services/papers.service';

export default function HippoPapersPage() {
  const { csrfToken } = useHippoAuth();
  const [papers, setPapers] = useState<PaperRecord[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<PaperRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/admin/categories?type=paper')
      .then((r) => r.json())
      .then((j) => {
        if (mounted && j.data) setCategories(j.data);
      })
      .catch((err) => console.error(err));

    return () => {
      mounted = false;
    };
  }, []);

  const loadPapers = useCallback(() => {
    const query = selectedCategory ? `?category=${selectedCategory}` : '';
    fetch(`/api/v1/admin/papers${query}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setPapers(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  useEffect(() => {
    let mounted = true;
    const query = selectedCategory ? `?category=${selectedCategory}` : '';
    fetch(`/api/v1/admin/papers${query}`)
      .then((res) => res.json())
      .then((json) => {
        if (mounted && json.data) setPapers(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedCategory]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusToggle = async (paper: PaperRecord) => {
    const newStatus = paper.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/v1/admin/papers/${paper.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setPapers((prev) =>
          prev.map((p) => (p.id === paper.id ? { ...p, status: newStatus } : p))
        );
        showToast(`Paper updated to ${newStatus}`);
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to update status.');
      }
    } catch {
      alert('Network error updating status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      const res = await fetch(`/api/v1/admin/papers/${deleteModal.id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken },
      });

      if (res.ok) {
        setPapers((prev) => prev.filter((p) => p.id !== deleteModal.id));
        setDeleteModal(null);
        showToast('Paper deleted successfully');
      } else {
        alert('Failed to delete paper.');
      }
    } catch {
      alert('Network error deleting paper.');
    }
  };

  const filteredPapers = papers.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.summary && p.summary.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-[1120px]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#16151c] text-white px-4 py-2.5 rounded-xl shadow-lg text-[13px] flex items-center gap-2">
          <Check size={16} className="text-[#12874f]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">Research & Papers</h1>
          <p className="text-[13px] text-[#86858f] mt-0.5">
            Technical writing, research articles, and documentation with rich TipTap editorial blocks.
          </p>
        </div>
        <Link
          href="/hippo/papers/new"
          className="h-10 px-4 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[14px] font-medium rounded-[10px] flex items-center gap-2 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>New paper</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search papers by title or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 px-3 pl-9 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-[10px] text-[13px] text-[#16151c] placeholder:text-[#86858f] outline-none transition-all"
          />
          <Search size={15} className="absolute left-3 top-3 text-[#86858f]" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-[10px] text-[13px] text-[#16151c] outline-none w-full sm:w-auto"
        >
          <option value="">All Paper Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] overflow-hidden shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-[#86858f]">Loading papers...</div>
        ) : filteredPapers.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="mx-auto text-[#86858f] mb-2 opacity-50" />
            <h3 className="text-[15px] font-semibold text-[#16151c]">No papers found</h3>
            <p className="text-[13px] text-[#86858f] mt-1">Get started by creating your first research paper.</p>
            <Link
              href="/hippo/papers/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#5b4be0] text-white text-[13px] font-medium rounded-lg shadow-xs"
            >
              <Plus size={14} />
              <span>Create paper</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[#e4e3ea] bg-[#fdfcff] text-[#86858f] text-[12px] font-medium h-10">
                  <th className="px-4">Title & Summary</th>
                  <th className="px-4 w-36">Category</th>
                  <th className="px-4 w-20">Year</th>
                  <th className="px-4 w-28 text-center">Status</th>
                  <th className="px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e3ea]">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-[#f6f5fa] transition-colors">
                    {/* Title & Summary */}
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/hippo/papers/${paper.id}`}
                        className="font-semibold text-[#16151c] hover:text-[#5b4be0] block"
                      >
                        {paper.title}
                      </Link>
                      <p className="text-[12px] text-[#86858f] line-clamp-1 mt-0.5">
                        {paper.summary || 'No summary entered.'}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-[#f6f5fa] border border-[#e4e3ea] text-[12px] text-[#4a4955] capitalize">
                        {paper.category_name || 'papers'}
                      </span>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3.5 text-[#4a4955] font-mono text-[12px]">
                      {paper.pub_year}
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleStatusToggle(paper)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-colors ${
                          paper.status === 'published'
                            ? 'bg-[#e3f6ec] text-[#12874f] hover:bg-[#d0f0df]'
                            : 'bg-[#fff1dc] text-[#a35c00] hover:bg-[#fee7c5]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {paper.status === 'published' ? 'Published' : 'Draft'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/papers/${paper.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-[#e4e3ea] hover:bg-[#f6f5fa] text-[#4a4955]"
                          title="Preview public paper"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <Link
                          href={`/hippo/papers/${paper.id}`}
                          className="p-1.5 rounded-lg border border-[#e4e3ea] hover:bg-[#f6f5fa] text-[#4a4955]"
                          title="Edit paper"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => setDeleteModal(paper)}
                          className="p-1.5 rounded-lg border border-[#e4e3ea] hover:bg-[#fde8ec] text-[#d92d4a]"
                          title="Delete paper"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <div className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[440px] w-full shadow-xl">
            <h3 className="text-[18px] font-semibold text-[#16151c]">Delete Research Paper</h3>
            <p className="text-[13px] text-[#4a4955] mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#16151c]">&ldquo;{deleteModal.title}&rdquo;</strong>? This will permanently remove the paper, its TipTap editorial blocks, and slug redirect history.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-[13px] font-medium bg-[#d92d4a] hover:bg-[#c2203c] text-white rounded-lg"
              >
                Delete paper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
