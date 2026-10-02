'use client';

// app/hippo/page.tsx — Admin Dashboard Overview (FlowMail layout)
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  FileText,
  Tags,
  Image as ImageIcon,
  Plus,
  ArrowUpRight,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { DashboardStats } from '@/backend/src/services/dashboard.service';

export default function HippoDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/dashboard')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setStats(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#e4e3ea] rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb > 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 max-w-[1120px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-[#86858f] mt-0.5">A real-time summary of your portfolio and content.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/hippo/projects/new"
            className="h-10 px-4 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[14px] font-medium rounded-[10px] flex items-center gap-2 transition-colors shadow-xs"
          >
            <Plus size={16} />
            <span>New project</span>
          </Link>
        </div>
      </div>

      {/* Stat Row (4 real DB count cards with inset wells) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects Card */}
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] p-4 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#4a4955] mb-3">
            <FolderGit2 size={16} className="text-[#5b4be0]" />
            <span>Projects</span>
          </div>
          <div className="bg-[#f6f5fa] rounded-[12px] p-3">
            <div className="text-[28px] font-semibold text-[#16151c] leading-none">
              {stats.projects.total}
            </div>
            <div className="text-[12px] text-[#86858f] mt-1.5 flex items-center gap-2">
              <span className="text-[#12874f] font-medium">{stats.projects.published} published</span>
              <span>·</span>
              <span>{stats.projects.draft} draft</span>
            </div>
          </div>
        </div>

        {/* Papers Card */}
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] p-4 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#4a4955] mb-3">
            <FileText size={16} className="text-[#5b4be0]" />
            <span>Papers</span>
          </div>
          <div className="bg-[#f6f5fa] rounded-[12px] p-3">
            <div className="text-[28px] font-semibold text-[#16151c] leading-none">
              {stats.papers_count}
            </div>
            <div className="text-[12px] text-[#86858f] mt-1.5">
              Articles and publications
            </div>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] p-4 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#4a4955] mb-3">
            <Tags size={16} className="text-[#5b4be0]" />
            <span>Categories</span>
          </div>
          <div className="bg-[#f6f5fa] rounded-[12px] p-3">
            <div className="text-[28px] font-semibold text-[#16151c] leading-none">
              {stats.categories_count}
            </div>
            <div className="text-[12px] text-[#86858f] mt-1.5">
              Active taxonomy tags
            </div>
          </div>
        </div>

        {/* Media Files Card */}
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] p-4 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#4a4955] mb-3">
            <ImageIcon size={16} className="text-[#5b4be0]" />
            <span>Media Assets</span>
          </div>
          <div className="bg-[#f6f5fa] rounded-[12px] p-3">
            <div className="text-[28px] font-semibold text-[#16151c] leading-none">
              {stats.media.total_files}
            </div>
            <div className="text-[12px] text-[#86858f] mt-1.5">
              {formatBytes(stats.media.total_bytes)} storage used
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Breakdown & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Projects by Category */}
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#16151c]">Projects by Category</h2>
            <Link href="/hippo/categories" className="text-[13px] text-[#5b4be0] hover:underline flex items-center gap-1">
              <span>Manage</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-4">
            {stats.projects_by_category.map((cat) => (
              <div key={cat.category_id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-[#16151c] capitalize">{cat.name}</span>
                  <span className="text-[#86858f]">{cat.count} items ({cat.percentage}%)</span>
                </div>
                <div className="h-2 w-full bg-[#f6f5fa] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5b4be0] rounded-full transition-all duration-300"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Updated */}
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold text-[#16151c]">Recently Updated</h2>
            <Link href="/hippo/projects" className="text-[13px] text-[#5b4be0] hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {stats.recently_updated.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-[#86858f]">No updates yet.</div>
          ) : (
            <div className="divide-y divide-[#e4e3ea]">
              {stats.recently_updated.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link
                      href={`/hippo/projects/${item.id}`}
                      className="text-[14px] font-medium text-[#16151c] hover:text-[#5b4be0] truncate block"
                    >
                      {item.title}
                    </Link>
                    <div className="text-[12px] text-[#86858f] flex items-center gap-2 mt-0.5">
                      <Clock size={12} />
                      <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                      item.status === 'published'
                        ? 'bg-[#e3f6ec] text-[#12874f]'
                        : 'bg-[#fff1dc] text-[#a35c00]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {item.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Needs Attention Card */}
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-[16px] p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] lg:col-span-2">
          <h2 className="text-[16px] font-semibold text-[#16151c] mb-4">Needs Attention</h2>
          {stats.needs_attention.length === 0 ? (
            <div className="flex items-center gap-2 text-[13px] text-[#12874f] py-2">
              <CheckCircle2 size={16} />
              <span>All projects are published with full media and summaries. Everything looks good!</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.needs_attention.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#f6f5fa] rounded-xl border border-[#e4e3ea] flex items-start justify-between gap-3"
                >
                  <div>
                    <Link
                      href={`/hippo/projects/${item.id}`}
                      className="text-[13px] font-semibold text-[#16151c] hover:text-[#5b4be0] block"
                    >
                      {item.title}
                    </Link>
                    <div className="text-[12px] text-[#a35c00] flex items-center gap-1.5 mt-1">
                      <AlertCircle size={13} />
                      <span>{item.issue}</span>
                    </div>
                  </div>
                  <Link
                    href={`/hippo/projects/${item.id}`}
                    className="text-[12px] text-[#5b4be0] font-medium hover:underline shrink-0"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
