'use client';

// components/admin/ProjectForm.tsx — Full Project Editor
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  ArrowLeft,
  X
} from 'lucide-react';
import { useHippoAuth } from './HippoAuthProvider';
import { ProjectRecord } from '@/backend/src/services/projects.service';

interface ProjectFormProps {
  initialProject?: ProjectRecord | null;
  isNew?: boolean;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function ProjectForm({ initialProject, isNew = false }: ProjectFormProps) {
  const router = useRouter();
  const { csrfToken } = useHippoAuth();

  // Basic Info
  const [title, setTitle] = useState(initialProject?.title || '');
  const [slug, setSlug] = useState(initialProject?.slug || '');
  const [pubYear, setPubYear] = useState<number>(initialProject?.pub_year || 2026);
  const [pubMonth, setPubMonth] = useState<number | ''>(initialProject?.pub_month || '');
  const [pubDay, setPubDay] = useState<number | ''>(initialProject?.pub_day || '');
  const [categoryId, setCategoryId] = useState<number>(initialProject?.category_id || 1);
  const [categories, setCategories] = useState<any[]>([]);

  // Links & Summary
  const [projectUrl, setProjectUrl] = useState(initialProject?.project_url || '');
  const [linkLabel, setLinkLabel] = useState(initialProject?.link_label || 'view live project');
  const [summary, setSummary] = useState(initialProject?.summary || '');

  // 3 Justified Paragraphs
  const [p1, setP1] = useState(initialProject?.paragraph_1 || '');
  const [p2, setP2] = useState(initialProject?.paragraph_2 || '');
  const [p3, setP3] = useState(initialProject?.paragraph_3 || '');

  // Media
  const [primaryType, setPrimaryType] = useState<'image' | 'video'>(
    initialProject?.primary_media?.kind === 'video' ? 'video' : 'image'
  );
  const [primaryMediaId, setPrimaryMediaId] = useState<number | null>(initialProject?.primary_media_id || null);
  const [primaryMediaUrl, setPrimaryMediaUrl] = useState<string | null>(initialProject?.primary_media?.public_url || null);
  const [primaryAlt, setPrimaryAlt] = useState<string>(initialProject?.primary_media?.alt || '');

  const [posterMediaId, setPosterMediaId] = useState<number | null>(initialProject?.poster_media_id || null);
  const [posterMediaUrl, setPosterMediaUrl] = useState<string | null>(initialProject?.poster_media?.public_url || null);

  // Gallery
  const [gallery, setGallery] = useState<Array<{
    media_id: number;
    url: string;
    caption: string;
    alt: string;
  }>>((initialProject?.gallery || []).map((g: any) => ({
    media_id: g.media_id,
    url: g.media?.public_url || '',
    caption: g.caption || '',
    alt: g.media?.alt || ''
  })));

  // State & Loading
  const [status, setStatus] = useState<'draft' | 'published'>(initialProject?.status || 'published');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch('/api/v1/admin/categories?type=project')
      .then((r) => r.json())
      .then((j) => {
        if (j.data && j.data.length > 0) {
          setCategories(j.data);
          if (!initialProject && j.data[0]) {
            setCategoryId(j.data[0].id);
          }
        }
      });
  }, [initialProject]);

  // Auto-slugify if new project
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setDirty(true);
    if (isNew) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const uploadFile = async (file: File, alt = ''): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', alt);

    setUploading(true);
    setUploadProgress(20);

    const res = await fetch('/api/v1/admin/media/upload', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
      body: formData,
    });

    setUploadProgress(100);
    setUploading(false);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'File upload failed');
    }

    const json = await res.json();
    return json.data;
  };

  const handlePrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const media = await uploadFile(file, primaryAlt || title);
      setPrimaryMediaId(media.id);
      setPrimaryMediaUrl(media.public_url);
      setDirty(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const media = await uploadFile(file, `${title} video poster`);
      setPosterMediaId(media.id);
      setPosterMediaUrl(media.public_url);
      setDirty(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (gallery.length + files.length > 10) {
      alert('Maximum 10 gallery images allowed per project.');
      return;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const media = await uploadFile(file, `${title} gallery figure`);
        setGallery((prev) => [
          ...prev,
          {
            media_id: media.id,
            url: media.public_url,
            caption: '',
            alt: media.alt || ''
          }
        ]);
      }
      setDirty(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSave = async (targetStatus: 'draft' | 'published') => {
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!slug.trim()) {
      setError('Slug is required.');
      return;
    }
    if (!pubYear) {
      setError('Publication year is required.');
      return;
    }
    if (!summary.trim()) {
      setError('Summary is required.');
      return;
    }

    if (targetStatus === 'published') {
      if (!p1.trim() || !p2.trim() || !p3.trim()) {
        setError('All three justified description paragraphs are required to publish a project.');
        return;
      }
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      pub_year: Number(pubYear),
      pub_month: pubMonth !== '' ? Number(pubMonth) : null,
      pub_day: pubDay !== '' ? Number(pubDay) : null,
      category_id: Number(categoryId),
      primary_media_id: primaryMediaId,
      poster_media_id: primaryType === 'video' ? posterMediaId : null,
      project_url: projectUrl.trim() || null,
      link_label: linkLabel.trim() || null,
      summary: summary.trim(),
      paragraph_1: p1.trim(),
      paragraph_2: p2.trim(),
      paragraph_3: p3.trim(),
      status: targetStatus,
      gallery: gallery.map((g, idx) => ({
        media_id: g.media_id,
        caption: g.caption.trim() || null,
        sort_order: idx + 1
      }))
    };

    try {
      const url = isNew ? '/api/v1/admin/projects' : `/api/v1/admin/projects/${initialProject!.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || 'Failed to save project.');
        setSaving(false);
        return;
      }

      setDirty(false);
      setStatus(targetStatus);
      setToast('Project saved successfully!');
      setTimeout(() => {
        router.push('/hippo/projects');
      }, 1000);
    } catch {
      setError('Network error saving project.');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[760px] space-y-8 pb-28">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/hippo/projects')}
          className="p-1.5 rounded-lg border border-[#e4e3ea] hover:bg-[#f6f5fa] text-[#4a4955]"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">
            {isNew ? 'Create Project' : `Edit "${title || 'Project'}"`}
          </h1>
          <p className="text-[13px] text-[#86858f]">
            {isNew ? 'Fill in project details, media, and 3 description paragraphs.' : 'Update project copy, media, or gallery.'}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#fde8ec] border border-[#d92d4a]/20 rounded-xl text-[13px] text-[#d92d4a]">
          {error}
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 bg-[#16151c] text-white px-4 py-2.5 rounded-xl shadow-lg text-[13px] flex items-center gap-2">
          <Check size={16} className="text-[#12874f]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Section 1: Basic Metadata */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
        <h2 className="text-[16px] font-semibold text-[#16151c] pb-2 border-b border-[#e4e3ea]">
          1. Basic Details
        </h2>

        <div>
          <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
            Project Title <span className="text-[#d92d4a]">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. Northwind Logistics Engine"
            className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-[10px] text-[14px] text-[#16151c] outline-none"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
            Slug URL <span className="text-[#d92d4a]">*</span>
            <span className="text-[#86858f] font-normal ml-2">(Used in /work/[slug])</span>
          </label>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setDirty(true);
            }}
            placeholder="e.g. northwind-logistics"
            className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-[10px] text-[14px] font-mono text-[#16151c] outline-none"
          />
        </div>

        {/* Date Row: Month, Day, Year */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
              Month (Optional)
            </label>
            <select
              value={pubMonth}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                setPubMonth(val);
                if (val === '') setPubDay('');
                setDirty(true);
              }}
              className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-[10px] text-[13px] text-[#16151c] outline-none"
            >
              <option value="">None</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
              Day (Optional)
            </label>
            <select
              disabled={pubMonth === ''}
              value={pubDay}
              onChange={(e) => {
                setPubDay(e.target.value === '' ? '' : Number(e.target.value));
                setDirty(true);
              }}
              className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-[10px] text-[13px] text-[#16151c] outline-none disabled:bg-[#f6f5fa] disabled:cursor-not-allowed"
            >
              <option value="">None</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
              Year <span className="text-[#d92d4a]">*</span>
            </label>
            <input
              type="number"
              required
              min={2000}
              max={2099}
              value={pubYear}
              onChange={(e) => {
                setPubYear(Number(e.target.value));
                setDirty(true);
              }}
              className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-[10px] text-[14px] text-[#16151c] outline-none"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
            Category <span className="text-[#d92d4a]">*</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(Number(e.target.value));
              setDirty(true);
            }}
            className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-[10px] text-[13px] text-[#16151c] outline-none capitalize"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 2: Links & Summary */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
        <h2 className="text-[16px] font-semibold text-[#16151c] pb-2 border-b border-[#e4e3ea]">
          2. Live Links & Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
              Live Project URL
            </label>
            <input
              type="url"
              value={projectUrl}
              onChange={(e) => {
                setProjectUrl(e.target.value);
                setDirty(true);
              }}
              placeholder="https://example.com"
              className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-[10px] text-[13px] text-[#16151c] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
              Link Button Label
            </label>
            <input
              type="text"
              value={linkLabel}
              onChange={(e) => {
                setLinkLabel(e.target.value);
                setDirty(true);
              }}
              placeholder="view live project"
              className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-[10px] text-[13px] text-[#16151c] outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[13px] font-medium text-[#4a4955]">
              Project Summary <span className="text-[#d92d4a]">*</span>
            </label>
            <span className="text-[11px] text-[#86858f]">{summary.length} characters</span>
          </div>
          <textarea
            required
            rows={2}
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              setDirty(true);
            }}
            placeholder="One or two sentences explaining what the project solves..."
            className="w-full p-3 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-[10px] text-[13px] text-[#16151c] outline-none resize-y"
          />
        </div>
      </div>

      {/* Section 3: Primary Media */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#e4e3ea]">
          <h2 className="text-[16px] font-semibold text-[#16151c]">3. Primary Media</h2>
          
          {/* Segmented Control: Image | Video */}
          <div className="inline-flex bg-[#f6f5fa] p-0.5 rounded-[10px] border border-[#e4e3ea]">
            <button
              type="button"
              onClick={() => {
                setPrimaryType('image');
                setDirty(true);
              }}
              className={`px-3 py-1 text-[12px] font-medium rounded-lg transition-colors ${
                primaryType === 'image' ? 'bg-[#fdfcff] text-[#16151c] shadow-xs' : 'text-[#86858f]'
              }`}
            >
              Image
            </button>
            <button
              type="button"
              onClick={() => {
                setPrimaryType('video');
                setDirty(true);
              }}
              className={`px-3 py-1 text-[12px] font-medium rounded-lg transition-colors ${
                primaryType === 'video' ? 'bg-[#fdfcff] text-[#16151c] shadow-xs' : 'text-[#86858f]'
              }`}
            >
              Video
            </button>
          </div>
        </div>

        {/* Primary Media Preview / Dropzone */}
        {primaryMediaUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-[#e4e3ea] bg-[#16151c] max-h-[300px] flex items-center justify-center">
              {primaryType === 'video' ? (
                <video src={primaryMediaUrl} controls className="max-h-[300px] w-full object-contain" />
              ) : (
                <img src={primaryMediaUrl} alt="" className="max-h-[300px] w-full object-contain" />
              )}
              <button
                type="button"
                onClick={() => {
                  setPrimaryMediaId(null);
                  setPrimaryMediaUrl(null);
                  setDirty(true);
                }}
                className="absolute top-2 right-2 p-1.5 bg-[#16151c]/80 text-white hover:bg-[#d92d4a] rounded-lg transition-colors"
                title="Remove media"
              >
                <X size={15} />
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                Alt Text (Accessibility)
              </label>
              <input
                type="text"
                value={primaryAlt}
                onChange={(e) => {
                  setPrimaryAlt(e.target.value);
                  setDirty(true);
                }}
                placeholder="Describe this visual for screen readers..."
                className="w-full h-9 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-lg text-[13px] text-[#16151c] outline-none"
              />
            </div>
          </div>
        ) : (
          <label className="border-2 border-dashed border-[#cfcdd8] hover:border-[#5b4be0] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#fdfcff]">
            <Upload size={24} className="text-[#5b4be0] mb-2" />
            <span className="text-[13px] font-medium text-[#16151c]">
              Drop {primaryType === 'video' ? 'a video file' : 'an image file'} or click to browse
            </span>
            <span className="text-[11px] text-[#86858f] mt-0.5">
              {primaryType === 'video' ? 'MP4, WebM or MOV up to 200 MB' : 'JPG, PNG or WebP up to 10 MB'}
            </span>
            <input
              type="file"
              accept={primaryType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/svg+xml'}
              onChange={handlePrimaryUpload}
              className="hidden"
            />
          </label>
        )}

        {/* Poster Image Sub-uploader for Video */}
        {primaryType === 'video' && (
          <div className="pt-3 border-t border-[#e4e3ea] space-y-2">
            <label className="block text-[12px] font-medium text-[#4a4955]">
              Video Poster Image (Optional)
            </label>
            {posterMediaUrl ? (
              <div className="flex items-center gap-3 p-2 bg-[#f6f5fa] rounded-lg border border-[#e4e3ea]">
                <img src={posterMediaUrl} alt="" className="w-16 h-10 object-cover rounded" />
                <span className="text-[12px] text-[#16151c] flex-1 truncate">Poster attached</span>
                <button
                  type="button"
                  onClick={() => {
                    setPosterMediaId(null);
                    setPosterMediaUrl(null);
                    setDirty(true);
                  }}
                  className="text-[12px] text-[#d92d4a] hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#e4e3ea] hover:bg-[#f6f5fa] rounded-lg text-[12px] text-[#4a4955] cursor-pointer">
                <ImageIcon size={14} />
                <span>Upload poster image</span>
                <input type="file" accept="image/*" onChange={handlePosterUpload} className="hidden" />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Exactly Three Justified Paragraphs */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#16151c]">
            4. Editorial Body (3 Justified Paragraphs) <span className="text-[#d92d4a]">*</span>
          </h2>
          <p className="text-[12px] text-[#86858f] mt-0.5">
            Per the portfolio design constitution, published projects require three fully written narrative sections.
          </p>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
            Paragraph 1 (The Problem & Context) <span className="text-[#d92d4a]">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={p1}
            onChange={(e) => {
              setP1(e.target.value);
              setDirty(true);
            }}
            placeholder="Discuss the initial state, operational challenge, or client context..."
            className="w-full p-3 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-[10px] text-[13px] text-[#16151c] outline-none resize-y"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
            Paragraph 2 (Engineering & Architectural Approach) <span className="text-[#d92d4a]">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={p2}
            onChange={(e) => {
              setP2(e.target.value);
              setDirty(true);
            }}
            placeholder="Discuss technical choices, data pipeline, design system, or performance..."
            className="w-full p-3 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-[10px] text-[13px] text-[#16151c] outline-none resize-y"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
            Paragraph 3 (Outcomes & Real Impact) <span className="text-[#d92d4a]">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={p3}
            onChange={(e) => {
              setP3(e.target.value);
              setDirty(true);
            }}
            placeholder="Discuss measured results, operational gains, search rankings, or feedback..."
            className="w-full p-3 bg-[#fdfcff] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-[10px] text-[13px] text-[#16151c] outline-none resize-y"
          />
        </div>
      </div>

      {/* Section 5: Gallery (Up to 10 items) */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#e4e3ea]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#16151c]">5. Gallery Images</h2>
            <p className="text-[12px] text-[#86858f]">Optional visual attachments (up to 10 images with italic captions)</p>
          </div>
          <span className="text-[12px] font-medium text-[#5b4be0]">{gallery.length} of 10</span>
        </div>

        {gallery.length > 0 && (
          <div className="space-y-3">
            {gallery.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#f6f5fa] rounded-xl border border-[#e4e3ea] flex items-center gap-3"
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const copy = [...gallery];
                      const temp = copy[idx];
                      copy[idx] = copy[idx - 1];
                      copy[idx - 1] = temp;
                      setGallery(copy);
                      setDirty(true);
                    }}
                    className="p-1 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === gallery.length - 1}
                    onClick={() => {
                      const copy = [...gallery];
                      const temp = copy[idx];
                      copy[idx] = copy[idx + 1];
                      copy[idx + 1] = temp;
                      setGallery(copy);
                      setDirty(true);
                    }}
                    className="p-1 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>

                {/* Thumbnail */}
                <img src={item.url} alt="" className="w-16 h-12 object-cover rounded-lg border border-[#e4e3ea] shrink-0" />

                {/* Caption Field */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => {
                      const copy = [...gallery];
                      copy[idx].caption = e.target.value;
                      setGallery(copy);
                      setDirty(true);
                    }}
                    placeholder="Caption (italicized on public page)..."
                    className="w-full h-8 px-2.5 bg-[#fdfcff] border border-[#e4e3ea] rounded-md text-[12px] text-[#16151c] outline-none"
                  />
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => {
                    setGallery(gallery.filter((_, i) => i !== idx));
                    setDirty(true);
                  }}
                  className="p-1.5 text-[#d92d4a] hover:bg-[#fde8ec] rounded-lg"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {gallery.length < 10 && (
          <label className="border-2 border-dashed border-[#cfcdd8] hover:border-[#5b4be0] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#fdfcff]">
            <Plus size={18} className="text-[#5b4be0] mb-1" />
            <span className="text-[12px] font-medium text-[#16151c]">Add Gallery Image</span>
            <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#fdfcff] border-t border-[#e4e3ea] py-3 px-6 shadow-md flex items-center justify-between">
        <div className="text-[12px] text-[#86858f]">
          {dirty ? '• Unsaved changes' : 'All changes saved'}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/hippo/projects')}
            className="px-4 py-2 border border-[#e4e3ea] hover:bg-[#f6f5fa] rounded-lg text-[13px] font-medium text-[#4a4955]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('draft')}
            className="px-4 py-2 border border-[#e4e3ea] bg-[#f6f5fa] hover:bg-[#e4e3ea] rounded-lg text-[13px] font-medium text-[#16151c]"
          >
            Save as draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('published')}
            className="px-5 py-2 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-lg text-[13px] font-medium shadow-xs flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <span>Publish project</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
