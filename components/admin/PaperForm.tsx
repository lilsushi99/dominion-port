'use client';

// components/admin/PaperForm.tsx — Full Paper Editor Form with TipTap, Cover Media & Metadata
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Globe,
  Upload,
  Image as ImageIcon,
  Trash2,
  Calendar,
  Layers,
  Check,
  Eye,
  FileText
} from 'lucide-react';
import { useHippoAuth } from '@/components/admin/HippoAuthProvider';
import { TipTapEditor } from '@/components/admin/TipTapEditor';
import { PaperRecord, PaperPayload } from '@/backend/src/services/papers.service';
import { MediaRecord } from '@/backend/src/services/media.service';

interface PaperFormProps {
  paper?: PaperRecord;
  isNew?: boolean;
}

export function PaperForm({ paper, isNew = false }: PaperFormProps) {
  const { csrfToken } = useHippoAuth();
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState(paper?.title || '');
  const [slug, setSlug] = useState(paper?.slug || '');
  const [slugManual, setSlugManual] = useState(!isNew && Boolean(paper?.slug));
  const [pubYear, setPubYear] = useState<number>(paper?.pub_year || 2026);
  const [pubMonth, setPubMonth] = useState<number | ''>(paper?.pub_month || '');
  const [pubDay, setPubDay] = useState<number | ''>(paper?.pub_day || '');
  const [categoryId, setCategoryId] = useState<number | ''>(paper?.category_id || '');
  const [summary, setSummary] = useState(paper?.summary || '');
  const [coverMedia, setCoverMedia] = useState<MediaRecord | null>(paper?.cover_media || null);
  const [status, setStatus] = useState<'draft' | 'published'>(paper?.status || 'draft');

  // TipTap Content State
  const [contentJson, setContentJson] = useState<any>(paper?.content_json || { type: 'doc', content: [] });
  const [contentHtml, setContentHtml] = useState<string>(paper?.content_html || '');

  // Meta & Aux State
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Media Picker Modal for Cover
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/admin/categories?type=paper')
      .then((r) => r.json())
      .then((j) => {
        if (mounted && j.data) {
          setCategories(j.data);
          if (isNew && j.data.length > 0 && !categoryId) {
            setCategoryId(j.data[0].id);
          }
        }
      })
      .catch((e) => console.error(e));

    return () => {
      mounted = false;
    };
  }, [isNew, categoryId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleEditorChange = (json: any, html: string) => {
    setContentJson(json);
    setContentHtml(html);
    setIsDirty(true);
  };

  const validateForm = (targetStatus: 'draft' | 'published') => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!pubYear || isNaN(pubYear) || pubYear < 1900 || pubYear > 2100) errs.pubYear = 'Valid 4-digit year is required.';
    if (!categoryId) errs.categoryId = 'Category is required.';

    if (targetStatus === 'published') {
      if (!summary.trim()) errs.summary = 'Summary is required for published papers.';
      if (!contentHtml.trim() || contentHtml === '<p></p>') {
        errs.content = 'Paper content cannot be empty when publishing.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (targetStatus?: 'draft' | 'published') => {
    const finalStatus = targetStatus || status;
    if (!validateForm(finalStatus)) {
      showToast('Please fix required fields.');
      return;
    }

    setSaving(true);
    const payload: PaperPayload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      pub_year: Number(pubYear),
      pub_month: pubMonth !== '' ? Number(pubMonth) : null,
      pub_day: pubDay !== '' ? Number(pubDay) : null,
      category_id: Number(categoryId),
      summary: summary.trim() || null,
      cover_media_id: coverMedia?.id || null,
      content_json: contentJson,
      content_html: contentHtml,
      status: finalStatus,
    };

    try {
      const url = isNew ? '/api/v1/admin/papers' : `/api/v1/admin/papers/${paper?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error?.message || 'Failed to save paper.');
        return;
      }

      setIsDirty(false);
      setStatus(finalStatus);
      showToast(isNew ? 'Paper created!' : 'Paper saved successfully.');

      if (isNew && json.data?.id) {
        router.push(`/hippo/papers/${json.data.id}`);
      }
    } catch {
      showToast('Network error saving paper.');
    } finally {
      setSaving(false);
    }
  };

  const openMediaPicker = async () => {
    setMediaPickerOpen(true);
    try {
      const res = await fetch('/api/v1/admin/media?kind=image&limit=40');
      const json = await res.json();
      if (json.data) setMediaList(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', file.name.split('.')[0] || '');

    try {
      const res = await fetch('/api/v1/admin/media/upload', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
        body: formData,
      });
      const json = await res.json();
      if (json.data) {
        setCoverMedia(json.data);
        setIsDirty(true);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-[1020px] pb-32">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-50 bg-[#16151c] text-white px-4 py-2.5 rounded-xl shadow-lg text-[13px] flex items-center gap-2">
          <Check size={16} className="text-[#12874f]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Navigation Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/hippo/papers"
            className="p-2 bg-[#fdfcff] hover:bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[#4a4955] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">
              {isNew ? 'New Research Paper' : `Edit: ${paper?.title}`}
            </h1>
            <p className="text-[13px] text-[#86858f] mt-0.5">
              TipTap rich content editor with custom media nodes, equations & links.
            </p>
          </div>
        </div>

        {!isNew && paper?.slug && (
          <Link
            href={`/papers/${paper.slug}`}
            target="_blank"
            className="px-3.5 py-2 bg-[#fdfcff] border border-[#e4e3ea] hover:bg-[#f6f5fa] text-[#16151c] text-[13px] font-medium rounded-xl flex items-center gap-2 transition-colors self-start sm:self-auto shadow-2xs"
          >
            <Eye size={15} />
            <span>View live paper</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Main TipTap Editor & Summary (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Title Card */}
          <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-5 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#16151c] mb-1">
                Paper Title <span className="text-[#d92d4a]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setTitle(newTitle);
                  setIsDirty(true);
                  if (isNew && !slugManual) {
                    const autoSlug = newTitle
                      .toLowerCase()
                      .trim()
                      .replace(/[^\w\s-]/g, '')
                      .replace(/[\s_-]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setSlug(autoSlug);
                  }
                }}
                placeholder="e.g. Planetary Microclimate Telemetry: High-Density Sensor Compression"
                className="w-full h-11 px-3.5 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-xl text-[15px] font-medium text-[#16151c] outline-none transition-all"
              />
              {errors.title && <p className="text-[12px] text-[#d92d4a] mt-1">{errors.title}</p>}
            </div>

            {/* URL Slug */}
            <div>
              <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                URL Slug (auto-generated from title, logs 301 on change)
              </label>
              <div className="flex items-center gap-1 text-[13px] text-[#86858f] bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl px-3 h-10">
                <span>/papers/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManual(true);
                    setIsDirty(true);
                  }}
                  placeholder="microclimate-telemetry-compression"
                  className="bg-transparent flex-1 text-[#16151c] font-mono text-[12px] outline-none"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-[13px] font-semibold text-[#16151c] mb-1">
                Summary / Abstract
              </label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Brief abstract describing the methodology, results, and architectural implications..."
                className="w-full p-3 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-xl text-[13px] text-[#16151c] leading-relaxed outline-none"
              />
              {errors.summary && <p className="text-[12px] text-[#d92d4a] mt-1">{errors.summary}</p>}
            </div>
          </div>

          {/* TipTap Full Editor Card */}
          <div>
            <label className="block text-[13px] font-semibold text-[#16151c] mb-2 flex items-center gap-2">
              <FileText size={16} className="text-[#5b4be0]" />
              <span>Full Paper Editorial Content</span>
            </label>
            <TipTapEditor
              initialJson={paper?.content_json}
              initialHtml={paper?.content_html}
              onChange={handleEditorChange}
              csrfToken={csrfToken}
            />
            {errors.content && <p className="text-[12px] text-[#d92d4a] mt-1">{errors.content}</p>}
          </div>
        </div>

        {/* RIGHT COLUMN: Metadata, Date, Cover & Taxonomy (1 col) */}
        <div className="space-y-6">
          {/* Publication Date Card */}
          <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-5 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#16151c] border-b border-[#e4e3ea] pb-2.5">
              <Calendar size={15} className="text-[#5b4be0]" />
              <span>Publication Date</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-[#86858f] mb-1">Year *</label>
                <input
                  type="number"
                  value={pubYear}
                  onChange={(e) => {
                    setPubYear(Number(e.target.value));
                    setIsDirty(true);
                  }}
                  className="w-full h-9 px-2 text-center font-mono text-[13px] bg-[#fdfcff] border border-[#e4e3ea] rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#86858f] mb-1">Month</label>
                <select
                  value={pubMonth}
                  onChange={(e) => {
                    setPubMonth(e.target.value ? Number(e.target.value) : '');
                    setIsDirty(true);
                  }}
                  className="w-full h-9 px-1 text-[12px] bg-[#fdfcff] border border-[#e4e3ea] rounded-lg outline-none"
                >
                  <option value="">None</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#86858f] mb-1">Day</label>
                <select
                  value={pubDay}
                  disabled={pubMonth === ''}
                  onChange={(e) => {
                    setPubDay(e.target.value ? Number(e.target.value) : '');
                    setIsDirty(true);
                  }}
                  className="w-full h-9 px-1 text-[12px] bg-[#fdfcff] border border-[#e4e3ea] rounded-lg outline-none disabled:opacity-40"
                >
                  <option value="">None</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.pubYear && <p className="text-[12px] text-[#d92d4a]">{errors.pubYear}</p>}
          </div>

          {/* Taxonomy / Category Card */}
          <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-5 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#16151c] border-b border-[#e4e3ea] pb-2.5">
              <Layers size={15} className="text-[#5b4be0]" />
              <span>Category Taxonomy</span>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4a4955] mb-1.5">
                Assigned Category <span className="text-[#d92d4a]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(Number(e.target.value));
                  setIsDirty(true);
                }}
                className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              >
                <option value="">Select paper category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-[12px] text-[#d92d4a] mt-1">{errors.categoryId}</p>}
            </div>
          </div>

          {/* Cover Media Card */}
          <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-5 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#e4e3ea] pb-2.5">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#16151c]">
                <ImageIcon size={15} className="text-[#5b4be0]" />
                <span>Cover / Hero Visual</span>
              </div>
              {coverMedia && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverMedia(null);
                    setIsDirty(true);
                  }}
                  className="text-[11px] text-[#d92d4a] hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            {coverMedia ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-[#e4e3ea] bg-[#16151c]">
                <img src={coverMedia.public_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-[#16151c]/80 text-white text-[11px] px-2 py-0.5 rounded">
                  Media #{coverMedia.id}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-[#cfcdd8] rounded-xl p-6 text-center bg-[#f6f5fa] space-y-2">
                <ImageIcon size={28} className="mx-auto text-[#86858f]" />
                <div className="text-[12px] text-[#4a4955] font-medium">Select or upload cover visual</div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={openMediaPicker}
                    className="px-3 py-1 bg-[#fdfcff] border border-[#e4e3ea] hover:bg-[#e4e3ea] rounded-lg text-[12px] text-[#16151c]"
                  >
                    Select library
                  </button>
                  <label className="px-3 py-1 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-lg text-[12px] cursor-pointer">
                    <span>Upload</span>
                    <input type="file" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#fdfcff] border-t border-[#e4e3ea] px-6 py-3.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px]">
          <span
            className={`w-2 h-2 rounded-full ${
              isDirty ? 'bg-[#e58514]' : 'bg-[#12874f]'
            }`}
          />
          <span className="text-[#86858f]">
            {isDirty ? 'Unsaved changes' : 'All changes saved to database'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/hippo/papers"
            className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-xl transition-colors"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-[#16151c] bg-[#f6f5fa] hover:bg-[#e4e3ea] border border-[#e4e3ea] rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-4 py-2 text-[13px] font-medium text-white bg-[#5b4be0] hover:bg-[#4d3ed1] rounded-xl flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            <Globe size={15} />
            <span>{saving ? 'Saving...' : status === 'published' ? 'Update Published' : 'Publish Paper'}</span>
          </button>
        </div>
      </div>

      {/* Media Picker Modal for Cover */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <div className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[680px] w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#e4e3ea]">
              <div>
                <h3 className="text-[17px] font-semibold text-[#16151c]">Select Cover Image</h3>
                <p className="text-[12px] text-[#86858f] mt-0.5">Choose an asset from your media library.</p>
              </div>
            </div>

            <div className="py-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {mediaList.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setCoverMedia(m);
                      setIsDirty(true);
                      setMediaPickerOpen(false);
                    }}
                    className="p-2 bg-[#f6f5fa] rounded-xl border border-[#e4e3ea] hover:border-[#5b4be0] transition-all text-left flex flex-col"
                  >
                    <div className="aspect-video w-full bg-[#16151c] rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={m.public_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-2 text-[11px] font-medium text-[#16151c] truncate w-full" title={m.original_name}>
                      {m.original_name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#e4e3ea] flex justify-end">
              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
