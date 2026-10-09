'use client';

// app/hippo/media/page.tsx — Media Asset Library with Live Hostinger Storage Diagnostics
import React, { useState, useEffect } from 'react';
import { uploadMediaFile } from '@/lib/admin-upload';
import {
  Upload,
  Search,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Check,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useHippoAuth } from '@/components/admin/HippoAuthProvider';
import { MediaRecord } from '@/backend/src/services/media.service';

interface StorageDiagnostics {
  status: 'healthy' | 'warning' | 'critical';
  runtimeCwd: string;
  mediaStorageDir: string;
  publicUrlPrefix: string;
  isWritable: boolean;
  isInsideHbuilds: boolean;
  isInsidePublicHtml: boolean;
  isInsideAppTree: boolean;
  isPersistentSafe: boolean;
  stats: {
    imagesCount: number;
    videosCount: number;
    postersCount: number;
    totalFiles: number;
    totalBytes: number;
  };
  warnings: string[];
}

export default function HippoMediaPage() {
  const { csrfToken } = useHippoAuth();
  const [mediaList, setMediaList] = useState<MediaRecord[]>([]);
  const [kindFilter, setKindFilter] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Storage Diagnostics State
  const [storageInfo, setStorageInfo] = useState<StorageDiagnostics | null>(null);
  const [showStorageDetails, setShowStorageDetails] = useState(false);

  // Edit Alt Modal
  const [altModal, setAltModal] = useState<MediaRecord | null>(null);
  const [altText, setAltText] = useState('');

  // Delete Safe Modal
  const [deleteModal, setDeleteModal] = useState<MediaRecord | null>(null);
  const [inUseError, setInUseError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadMedia = () => {
    const kindParam = kindFilter !== 'all' ? `?kind=${kindFilter}` : '';
    fetch(`/api/v1/admin/media${kindParam}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setMediaList(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadStorageInfo = () => {
    fetch('/api/v1/admin/media/storage-status')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setStorageInfo(json.data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    let mounted = true;
    const kindParam = kindFilter !== 'all' ? `?kind=${kindFilter}` : '';
    fetch(`/api/v1/admin/media${kindParam}`)
      .then((res) => res.json())
      .then((json) => {
        if (mounted && json.data) setMediaList(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    loadStorageInfo();

    return () => {
      mounted = false;
    };
  }, [kindFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await uploadMediaFile(file, { csrfToken, alt: file.name.split('.')[0] || '', purpose: 'project' });
        count++;
      } catch (err: any) {
        console.error(err);
        alert(`${file.name}: ${err?.message || 'upload failed'}`);
      }
    }

    setUploading(false);
    loadMedia();
    loadStorageInfo();
    showToast(`${count} media file(s) uploaded!`);
  };

  const handleUpdateAlt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!altModal) return;

    try {
      const res = await fetch(`/api/v1/admin/media/${altModal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ alt: altText })
      });

      if (res.ok) {
        setMediaList((prev) =>
          prev.map((m) => (m.id === altModal.id ? { ...m, alt: altText } : m))
        );
        setAltModal(null);
        showToast('Alt text updated');
      }
    } catch {
      alert('Failed to update alt text.');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setInUseError(null);

    try {
      const res = await fetch(`/api/v1/admin/media/${deleteModal.id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken }
      });

      const json = await res.json();
      if (!res.ok) {
        if (json.error?.code === 'MEDIA_IN_USE') {
          setInUseError(json.error.message);
        } else {
          alert(json.error?.message || 'Failed to delete media.');
        }
        return;
      }

      setMediaList((prev) => prev.filter((m) => m.id !== deleteModal.id));
      setDeleteModal(null);
      loadStorageInfo();
      showToast('Media file deleted');
    } catch {
      alert('Network error deleting media.');
    }
  };

  const filteredMedia = mediaList.filter((m) =>
    m.original_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.alt && m.alt.toLowerCase().includes(search.toLowerCase()))
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 max-w-[1120px]">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#16151c] text-white px-4 py-2.5 rounded-xl shadow-lg text-[13px] flex items-center gap-2">
          <Check size={16} className="text-[#12874f]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">Media Library</h1>
          <p className="text-[13px] text-[#86858f] mt-0.5">Stored images and streaming videos with usage tracking.</p>
        </div>

        <label className="h-10 px-4 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[13px] font-medium rounded-xl flex items-center gap-2 transition-colors shadow-xs cursor-pointer shrink-0 self-start sm:self-auto">
          <Upload size={15} />
          <span>{uploading ? 'Uploading...' : 'Upload files'}</span>
          <input type="file" multiple onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {/* Hostinger Persistent Storage Diagnostics Card */}
      {storageInfo && (
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-4 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${storageInfo.isPersistentSafe ? 'bg-[#e3f6ec] text-[#12874f]' : 'bg-[#fff1dc] text-[#a35c00]'}`}>
                <HardDrive size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#16151c]">Persistent Storage</span>
                  {storageInfo.isPersistentSafe ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-[#e3f6ec] text-[#12874f] rounded-full">
                      <ShieldCheck size={12} />
                      Deployment-Safe (Outside hbuilds)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-[#fff1dc] text-[#a35c00] rounded-full">
                      <ShieldAlert size={12} />
                      Review Storage Path
                    </span>
                  )}
                </div>
                <div className="text-[12px] font-mono text-[#86858f] truncate max-w-[500px] mt-0.5" title={storageInfo.mediaStorageDir}>
                  {storageInfo.mediaStorageDir}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 text-[12px] text-[#4a4955] border-l border-[#e4e3ea] pl-4">
                <span>{storageInfo.stats.imagesCount} images</span>
                <span>·</span>
                <span>{storageInfo.stats.videosCount} videos</span>
                <span>·</span>
                <span className="font-semibold text-[#16151c]">{formatSize(storageInfo.stats.totalBytes)}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowStorageDetails(!showStorageDetails)}
                className="p-1.5 text-[#86858f] hover:text-[#16151c] hover:bg-[#f6f5fa] rounded-lg transition-colors"
                title="Toggle storage details"
              >
                {showStorageDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {showStorageDetails && (
            <div className="mt-3 pt-3 border-t border-[#e4e3ea] grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div className="bg-[#f6f5fa] p-2.5 rounded-xl space-y-1">
                <div className="text-[#86858f]">Node.js Runtime Working Directory:</div>
                <div className="font-mono text-[#16151c] break-all">{storageInfo.runtimeCwd}</div>
              </div>
              <div className="bg-[#f6f5fa] p-2.5 rounded-xl space-y-1">
                <div className="text-[#86858f]">Public Browser URL Prefix:</div>
                <div className="font-mono text-[#16151c]">{`${storageInfo.publicUrlPrefix}/* (Browser never receives internal OS paths)`}</div>
              </div>

              {storageInfo.warnings.length > 0 && (
                <div className="sm:col-span-2 p-2.5 bg-[#fff1dc] text-[#a35c00] rounded-xl flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {storageInfo.warnings.map((w, i) => (
                      <div key={i}>{w}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search files by filename or alt description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 px-3 pl-9 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] placeholder:text-[#86858f] outline-none"
          />
          <Search size={15} className="absolute left-3 top-3 text-[#86858f]" />
        </div>

        {/* Kind Segmented Control */}
        <div className="inline-flex bg-[#e4e3ea]/60 p-1 rounded-xl border border-[#e4e3ea] w-full sm:w-auto">
          <button
            onClick={() => setKindFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex-1 sm:flex-none ${
              kindFilter === 'all' ? 'bg-[#fdfcff] text-[#16151c] shadow-xs' : 'text-[#4a4955]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setKindFilter('image')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1 justify-center flex-1 sm:flex-none ${
              kindFilter === 'image' ? 'bg-[#fdfcff] text-[#16151c] shadow-xs' : 'text-[#4a4955]'
            }`}
          >
            <ImageIcon size={13} />
            <span>Images</span>
          </button>
          <button
            onClick={() => setKindFilter('video')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1 justify-center flex-1 sm:flex-none ${
              kindFilter === 'video' ? 'bg-[#fdfcff] text-[#16151c] shadow-xs' : 'text-[#4a4955]'
            }`}
          >
            <Video size={13} />
            <span>Videos</span>
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-[#86858f]">Loading media library...</div>
        ) : filteredMedia.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon size={32} className="mx-auto text-[#86858f] mb-2 opacity-50" />
            <h3 className="text-[15px] font-semibold text-[#16151c]">No media assets found</h3>
            <p className="text-[13px] text-[#86858f] mt-1">Upload images or videos to attach to your works.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="group bg-[#f6f5fa] rounded-xl border border-[#e4e3ea] overflow-hidden flex flex-col justify-between hover:border-[#cfcdd8] transition-all"
              >
                {/* Visual Preview */}
                <div className="relative aspect-video bg-[#16151c] flex items-center justify-center overflow-hidden">
                  {item.kind === 'video' ? (
                    <video
                      src={item.public_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.public_url}
                      alt={item.alt || item.original_name}
                      className="w-full h-full object-cover"
                    />
                  )}

                  <div className="absolute top-1.5 left-1.5 bg-[#16151c]/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                    {item.kind === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                    <span className="uppercase">{item.mime.split('/')[1] || item.kind}</span>
                  </div>

                  {item.usage_count !== undefined && item.usage_count > 0 && (
                    <div className="absolute top-1.5 right-1.5 bg-[#5b4be0] text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow-2xs">
                      {item.usage_count} {item.usage_count === 1 ? 'use' : 'uses'}
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-3 space-y-1.5">
                  <div className="text-[12px] font-semibold text-[#16151c] truncate" title={item.original_name}>
                    {item.original_name}
                  </div>
                  <div className="text-[11px] text-[#86858f] flex items-center justify-between">
                    <span>{formatSize(item.size_bytes)}</span>
                    {item.width && item.height && (
                      <span>
                        {item.width}×{item.height}
                      </span>
                    )}
                  </div>

                  {item.alt && (
                    <div className="text-[11px] text-[#4a4955] italic truncate" title={item.alt}>
                      &ldquo;{item.alt}&rdquo;
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#e4e3ea] flex items-center justify-between">
                    <a
                      href={item.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-[#86858f] hover:text-[#16151c] hover:bg-[#e4e3ea]/60"
                      title="Open public media URL"
                    >
                      <ExternalLink size={13} />
                    </a>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setAltModal(item);
                          setAltText(item.alt || '');
                        }}
                        className="p-1 rounded text-[#86858f] hover:text-[#16151c] hover:bg-[#e4e3ea]/60"
                        title="Edit Alt description"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteModal(item);
                          setInUseError(null);
                        }}
                        className="p-1 rounded text-[#86858f] hover:text-[#d92d4a] hover:bg-[#fde8ec]"
                        title="Delete media file"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Alt Modal */}
      {altModal && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateAlt}
            className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[440px] w-full shadow-xl space-y-4"
          >
            <h3 className="text-[17px] font-semibold text-[#16151c]">Edit Accessibility Alt Description</h3>
            <p className="text-[12px] text-[#86858f]">
              File: <span className="font-mono text-[#16151c]">{altModal.original_name}</span>
            </p>
            <textarea
              rows={3}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this media for accessibility and search..."
              className="w-full p-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAltModal(null)}
                className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-[13px] font-medium bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-lg shadow-xs"
              >
                Save description
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Safe Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <div className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[440px] w-full shadow-xl space-y-4">
            <h3 className="text-[17px] font-semibold text-[#16151c]">Delete Media File</h3>
            <p className="text-[13px] text-[#4a4955] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#16151c]">{deleteModal.original_name}</strong>?
            </p>

            {inUseError && (
              <div className="p-3 bg-[#fde8ec] border border-[#f5b8c4] rounded-xl text-[12px] text-[#d92d4a] flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Cannot delete media in use:</div>
                  <div className="mt-0.5">{inUseError}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModal(null);
                  setInUseError(null);
                }}
                className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-[13px] font-medium bg-[#d92d4a] hover:bg-[#c2203c] text-white rounded-lg shadow-xs"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
