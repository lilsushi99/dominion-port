'use client';

// app/hippo/cms/page.tsx — CMS Content Management with Profile Images, Intro, Contact Links & Footer
import React, { useState, useEffect, useRef } from 'react';
import { uploadMediaFile } from '@/lib/admin-upload';
import {
  Save,
  Check,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Sliders,
  Home,
  Share2,
  Upload,
  Image as ImageIcon,
  Mail,
  Linkedin,
  MessageCircle,
  Twitter,
  Instagram,
  Dribbble,
  Facebook,
  Github,
  Globe,
  X
} from 'lucide-react';
import { useHippoAuth } from '@/components/admin/HippoAuthProvider';
import { CtaLink, FooterSettings, ProfileImageItem } from '@/backend/src/services/cms.service';
import { MediaRecord } from '@/backend/src/services/media.service';

export default function HippoCmsPage() {
  const { csrfToken } = useHippoAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'intro' | 'cta' | 'footer'>('intro');

  // Home Intro & Sign-off & Section Heading
  const [introHtml, setIntroHtml] = useState('');
  const [signOff, setSignOff] = useState('');
  const [projectsHeading, setProjectsHeading] = useState('');
  const [backgroundMode, setBackgroundMode] = useState<'black' | 'off_black'>('off_black');

  // Profile Pictures
  const [profileImages, setProfileImages] = useState<ProfileImageItem[]>([]);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [libraryMedia, setLibraryMedia] = useState<MediaRecord[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CTA Links
  const [ctaLinks, setCtaLinks] = useState<CtaLink[]>([]);
  const [ctaDirty, setCtaDirty] = useState(false);

  // New CTA Modal
  const [newCtaModal, setNewCtaModal] = useState(false);
  const [newCtaLabel, setNewCtaLabel] = useState('');
  const [newCtaUrl, setNewCtaUrl] = useState('');
  const [newCtaMode, setNewCtaMode] = useState<'text' | 'icon'>('text');
  const [newCtaPlatform, setNewCtaPlatform] = useState<string>('email');

  // Edit CTA Modal
  const [editCtaModal, setEditCtaModal] = useState<CtaLink | null>(null);

  // Footer Settings
  const [footer, setFooter] = useState<FooterSettings | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProfileImages = async () => {
    try {
      const res = await fetch('/api/v1/admin/cms/profile-images');
      const json = await res.json();
      if (json.data) {
        setProfileImages(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch profile images:', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [homeRes, settingsRes, ctaRes, footerRes, profRes] = await Promise.all([
          fetch('/api/v1/admin/cms/home'),
          fetch('/api/v1/admin/cms/settings'),
          fetch('/api/v1/admin/cms/cta'),
          fetch('/api/v1/admin/cms/footer'),
          fetch('/api/v1/admin/cms/profile-images')
        ]);

        const [homeJson, settingsJson, ctaJson, footerJson, profJson] = await Promise.all([
          homeRes.json(),
          settingsRes.json(),
          ctaRes.json(),
          footerRes.json(),
          profRes.json()
        ]);

        if (!mounted) return;

        if (homeJson.data) {
          setIntroHtml(homeJson.data.body_html || '');
          setSignOff(homeJson.data.sign_off || '');
        }
        if (settingsJson.data) {
          setProjectsHeading(settingsJson.data.projects_heading || '');
          setBackgroundMode(settingsJson.data.background_mode === 'black' ? 'black' : 'off_black');
        }
        if (ctaJson.data) {
          setCtaLinks(ctaJson.data);
        }
        if (footerJson.data) {
          setFooter(footerJson.data);
        }
        if (profJson.data) {
          setProfileImages(profJson.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUploadProfilePicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProfilePic(true);

    try {
      const media = await uploadMediaFile(file, { csrfToken, alt: 'Dominion profile picture', purpose: 'profile' });

      const addRes = await fetch('/api/v1/admin/cms/profile-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ media_id: media.id })
      });

      if (!addRes.ok) {
        let msg = `Saving the profile picture failed (HTTP ${addRes.status}).`;
        try { msg = (await addRes.json()).error?.message || msg; } catch {}
        throw new Error(msg);
      }
      showToast('Profile picture uploaded!');
      await fetchProfileImages();
    } catch (err: any) {
      alert(err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingProfilePic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenMediaPicker = async () => {
    setMediaPickerOpen(true);
    setLibraryLoading(true);
    try {
      const res = await fetch('/api/v1/admin/media?kind=image&limit=40');
      const json = await res.json();
      if (json.data?.items) {
        setLibraryMedia(json.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleSelectMediaForProfile = async (media: MediaRecord) => {
    try {
      const res = await fetch('/api/v1/admin/cms/profile-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ media_id: media.id })
      });
      if (res.ok) {
        showToast('Profile picture added!');
        setMediaPickerOpen(false);
        await fetchProfileImages();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add profile picture');
    }
  };

  const handleDeleteProfileImage = async (id: number) => {
    if (!confirm('Remove this profile picture?')) return;
    try {
      const res = await fetch(`/api/v1/admin/cms/profile-images/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken }
      });
      if (res.ok) {
        showToast('Profile picture removed');
        setProfileImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch {
      alert('Failed to delete profile picture.');
    }
  };

  const handleMoveProfileImage = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= profileImages.length) return;

    const copy = [...profileImages];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setProfileImages(copy);

    try {
      const orderedIds = copy.map((img) => img.id);
      await fetch('/api/v1/admin/cms/profile-images/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ ordered_ids: orderedIds })
      });
      showToast('Profile pictures reordered!');
    } catch {
      alert('Failed to save order.');
    }
  };

  const saveIntro = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch('/api/v1/admin/cms/home', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ body_html: introHtml, sign_off: signOff })
        }),
        fetch('/api/v1/admin/cms/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify({ projects_heading: projectsHeading, background_mode: backgroundMode })
        })
      ]);
      showToast('Home content and heading saved!');
    } catch {
      alert('Failed to save home content.');
    } finally {
      setSaving(false);
    }
  };

  const saveCtaLinksBatch = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/cms/cta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ links: ctaLinks })
      });
      const json = await res.json();
      if (json.data) {
        setCtaLinks(json.data);
        setCtaDirty(false);
        showToast('All contact links saved successfully!');
      }
    } catch {
      alert('Failed to save contact links.');
    } finally {
      setSaving(false);
    }
  };

  const saveFooter = async () => {
    if (!footer) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/cms/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(footer)
      });
      if (res.ok) {
        showToast('Footer settings saved!');
      }
    } catch {
      alert('Failed to save footer.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCtaLabel.trim() || !newCtaUrl.trim()) return;

    try {
      const res = await fetch('/api/v1/admin/cms/cta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          label: newCtaLabel.trim(),
          url: newCtaUrl.trim(),
          presentation_mode: newCtaMode,
          platform: newCtaPlatform
        })
      });
      const json = await res.json();
      if (json.data) {
        setCtaLinks((prev) => [...prev, json.data]);
        setNewCtaModal(false);
        setNewCtaLabel('');
        setNewCtaUrl('');
        setNewCtaMode('text');
        setNewCtaPlatform('email');
        showToast('Contact link created!');
      }
    } catch {
      alert('Failed to create link.');
    }
  };

  const handleUpdateCtaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCtaModal) return;

    try {
      const res = await fetch(`/api/v1/admin/cms/cta/${editCtaModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(editCtaModal)
      });
      const json = await res.json();
      if (json.data) {
        setCtaLinks((prev) => prev.map((c) => (c.id === editCtaModal.id ? json.data : c)));
        setEditCtaModal(null);
        showToast('Contact link updated!');
      }
    } catch {
      alert('Failed to update link.');
    }
  };

  const handleDeleteCta = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    try {
      const res = await fetch(`/api/v1/admin/cms/cta/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken }
      });
      if (res.ok) {
        setCtaLinks((prev) => prev.filter((c) => c.id !== id));
        showToast('Contact link removed');
      }
    } catch {
      alert('Failed to delete link.');
    }
  };

  const handleMoveCta = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ctaLinks.length) return;

    const copy = [...ctaLinks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    copy.forEach((c, i) => {
      c.sort_order = i + 1;
    });

    setCtaLinks(copy);
    setCtaDirty(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-[13px] text-[#86858f]">Loading CMS content...</div>;
  }

  return (
    <div className="max-w-[760px] space-y-6 pb-20">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#16151c] text-white px-4 py-2.5 rounded-xl shadow-lg text-[13px] flex items-center gap-2">
          <Check size={16} className="text-[#12874f]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">CMS & Site Content</h1>
          <p className="text-[13px] text-[#86858f] mt-0.5">Edit profile pictures, introductory letter, contact buttons, and footer settings.</p>
        </div>

        {/* Tabs */}
        <div className="inline-flex bg-[#e4e3ea]/60 p-1 rounded-xl border border-[#e4e3ea]">
          <button
            onClick={() => setActiveTab('intro')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'intro' ? 'bg-[#fdfcff] text-[#16151c] shadow-xs' : 'text-[#4a4955]'
            }`}
          >
            <Home size={14} />
            <span>Intro & Hero</span>
          </button>
          <button
            onClick={() => setActiveTab('cta')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'cta' ? 'bg-[#fdfcff] text-[#16151c] shadow-xs' : 'text-[#4a4955]'
            }`}
          >
            <Share2 size={14} />
            <span>Contact Links</span>
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'footer' ? 'bg-[#fdfcff] text-[#16151c] shadow-xs' : 'text-[#4a4955]'
            }`}
          >
            <Sliders size={14} />
            <span>Footer</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTRO & HERO */}
      {activeTab === 'intro' && (
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-6">
          {/* PAGE BACKGROUND (dark theme) */}
          <div className="pb-6 border-b border-[#e4e3ea] space-y-3">
            <div>
              <h2 className="text-[15px] font-semibold text-[#16151c]">Page Background (dark mode)</h2>
              <p className="text-[12px] text-[#86858f] mt-0.5">
                Applies to the public site in dark mode. Save with the button below.
              </p>
            </div>
            <div role="radiogroup" aria-label="Background mode" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                { value: 'off_black', label: 'Off-black / Noise', hint: 'Dark grey with the subtle noise texture', swatch: '#2a2a2a' },
                { value: 'black', label: 'Black', hint: 'Pure #000000, no texture', swatch: '#000000' }
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={backgroundMode === opt.value}
                  onClick={() => setBackgroundMode(opt.value)}
                  className={`flex items-center gap-3 text-left p-3 rounded-xl border transition-colors ${
                    backgroundMode === opt.value ? 'border-[#5b4be0] bg-[#ece9fd]' : 'border-[#e4e3ea] bg-[#fdfcff] hover:bg-[#f6f5fa]'
                  }`}
                >
                  <span className="w-9 h-9 rounded-lg border border-[#cfcdd8] shrink-0" style={{ background: opt.swatch }} />
                  <span>
                    <span className="block text-[13px] font-medium text-[#16151c]">{opt.label}</span>
                    <span className="block text-[12px] text-[#86858f]">{opt.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* PROFILE PICTURES SECTION */}
          <div className="pb-6 border-b border-[#e4e3ea] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-[#16151c]">Profile Pictures (Hero Avatar)</h2>
                <p className="text-[12px] text-[#86858f] mt-0.5">
                  Upload multiple pictures. On public site, desktop hover and mobile tap smoothly cycle between them.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleUploadProfilePicture}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingProfilePic}
                  className="px-3 py-1.5 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[12px] font-medium rounded-lg flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Upload size={13} />
                  <span>{uploadingProfilePic ? 'Uploading...' : 'Upload Picture'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenMediaPicker}
                  className="px-3 py-1.5 bg-[#f6f5fa] hover:bg-[#ecebf2] text-[#4a4955] border border-[#e4e3ea] text-[12px] font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <ImageIcon size={13} />
                  <span>From Library</span>
                </button>
              </div>
            </div>

            {/* Profile pictures list */}
            {profileImages.length > 0 ? (
              <div className="space-y-2.5">
                {profileImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="p-3 bg-[#f6f5fa] rounded-xl border border-[#e4e3ea] flex items-center gap-3"
                  >
                    {/* Reorder up/down */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveProfileImage(idx, 'up')}
                        className="p-1 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                        title="Move up"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === profileImages.length - 1}
                        onClick={() => handleMoveProfileImage(idx, 'down')}
                        className="p-1 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                        title="Move down"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    {/* Thumbnail preview */}
                    <img
                      src={img.url}
                      alt={img.alt || 'Profile picture'}
                      className="w-12 h-12 rounded-[16px] object-cover border border-[#e4e3ea] shrink-0"
                    />

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#16151c] truncate">
                        Profile Picture #{idx + 1} {idx === 0 ? '(Default View)' : `(Hover/Tap #${idx + 1})`}
                      </div>
                      <div className="text-[11px] text-[#86858f] font-mono truncate">{img.url}</div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteProfileImage(img.id)}
                      className="p-1.5 text-[#d92d4a] hover:bg-[#fde8ec] rounded-lg transition-colors"
                      title="Remove profile picture"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-[#e4e3ea] text-center text-[12px] text-[#86858f]">
                No profile picture uploaded. The intro will display without an avatar.
              </div>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#16151c] mb-1">
              Introduction Letter (Rich HTML Content)
            </label>
            <p className="text-[12px] text-[#86858f] mb-2">
              HTML formatting with paragraph tags, strong tags for skills, and link anchors.
            </p>
            <textarea
              rows={8}
              value={introHtml}
              onChange={(e) => setIntroHtml(e.target.value)}
              className="w-full p-3 font-mono text-[12px] bg-[#f6f5fa] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-xl text-[#16151c] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#16151c] mb-1">
              Sign-Off Lines (Optional)
            </label>
            <p className="text-[12px] text-[#86858f] mb-2">
              Optional stacked sign-off lines (e.g. <code>love,&#92;ndominion</code>). <strong>Leave blank to hide sign-off entirely.</strong>
            </p>
            <textarea
              rows={3}
              value={signOff}
              onChange={(e) => setSignOff(e.target.value)}
              placeholder="e.g. love,&#10;dominion (leave blank for none)"
              className="w-full p-3 bg-[#f6f5fa] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-xl text-[13px] text-[#16151c] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#16151c] mb-1">
              Projects / Work Section Heading
            </label>
            <p className="text-[12px] text-[#86858f] mb-2">
              The heading text introducing the projects list on the homepage.
            </p>
            <input
              type="text"
              value={projectsHeading}
              onChange={(e) => setProjectsHeading(e.target.value)}
              placeholder="p.s. things i've made and written…"
              className="w-full h-10 px-3.5 bg-[#f6f5fa] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-xl text-[13px] font-medium text-[#16151c] outline-none"
            />
          </div>

          <div className="pt-2 border-t border-[#e4e3ea] flex justify-end">
            <button
              type="button"
              onClick={saveIntro}
              disabled={saving}
              className="px-4 py-2 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[13px] font-medium rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : 'Save Intro & Heading'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CONTACT LINKS */}
      {activeTab === 'cta' && (
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#e4e3ea]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#16151c]">Contact Links & Buttons</h2>
              <p className="text-[12px] text-[#86858f] mt-0.5">
                Configure contact actions. Choose between text links or glass icons.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewCtaModal(true)}
              className="px-3.5 py-1.5 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[12px] font-medium rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Add Link</span>
            </button>
          </div>

          {/* Contact Links List */}
          <div className="space-y-3">
            {ctaLinks.map((cta, index) => (
              <div
                key={cta.id}
                className="p-3.5 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveCta(index, 'up')}
                      className="p-1 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={index === ctaLinks.length - 1}
                      onClick={() => handleMoveCta(index, 'down')}
                      className="p-1 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#16151c] truncate">{cta.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                        cta.presentation_mode === 'icon' ? 'bg-[#5b4be0]/10 text-[#5b4be0]' : 'bg-[#e4e3ea] text-[#4a4955]'
                      }`}>
                        {cta.presentation_mode === 'icon' ? `Icon: ${cta.platform || 'glass'}` : 'Text'}
                      </span>
                      {!cta.is_active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#d92d4a]/10 text-[#d92d4a] rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#86858f] font-mono truncate">{cta.url}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditCtaModal(cta)}
                    className="p-1.5 text-[#4a4955] hover:bg-[#e4e3ea] rounded-lg"
                    title="Edit link"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCta(cta.id)}
                    className="p-1.5 text-[#d92d4a] hover:bg-[#fde8ec] rounded-lg"
                    title="Delete link"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {ctaDirty && (
            <div className="pt-3 border-t border-[#e4e3ea] flex justify-end">
              <button
                type="button"
                onClick={saveCtaLinksBatch}
                disabled={saving}
                className="px-4 py-2 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[13px] font-medium rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Reordered Links'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FOOTER SETTINGS */}
      {activeTab === 'footer' && footer && (
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-6">
          <div className="pb-3 border-b border-[#e4e3ea]">
            <h2 className="text-[16px] font-semibold text-[#16151c]">Footer & Branding Configuration</h2>
            <p className="text-[12px] text-[#86858f] mt-0.5">
              Customize copyright year, designer credits, and links.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                Year Display Mode
              </label>
              <select
                value={footer.year_mode}
                onChange={(e) => setFooter({ ...footer, year_mode: e.target.value as 'auto' | 'fixed' })}
                className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              >
                <option value="auto">Auto (Current Calendar Year)</option>
                <option value="fixed">Fixed Year (Custom specified year)</option>
              </select>
            </div>

            {footer.year_mode === 'fixed' && (
              <div>
                <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                  Fixed Year Value
                </label>
                <input
                  type="number"
                  value={footer.fixed_year || 2026}
                  onChange={(e) => setFooter({ ...footer, fixed_year: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                Designer Name
              </label>
              <input
                type="text"
                value={footer.designer_name}
                onChange={(e) => setFooter({ ...footer, designer_name: e.target.value })}
                className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                Designer URL
              </label>
              <input
                type="url"
                value={footer.designer_url}
                onChange={(e) => setFooter({ ...footer, designer_url: e.target.value })}
                className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#e4e3ea] flex justify-end">
            <button
              type="button"
              onClick={saveFooter}
              disabled={saving}
              className="px-4 py-2 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[13px] font-medium rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : 'Save Footer Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MEDIA PICKER MODAL FOR PROFILE PICTURE */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <div className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[620px] w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e4e3ea]">
              <div>
                <h3 className="text-[17px] font-semibold text-[#16151c]">Choose Profile Picture</h3>
                <p className="text-[12px] text-[#86858f]">Select an uploaded image from your media library.</p>
              </div>
              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="p-1.5 text-[#86858f] hover:text-[#16151c] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {libraryLoading ? (
              <div className="py-12 text-center text-[13px] text-[#86858f]">Loading media library...</div>
            ) : libraryMedia.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-[#86858f]">
                No images found in library. Upload an image above.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto p-1">
                {libraryMedia.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMediaForProfile(m)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-[#e4e3ea] bg-[#f6f5fa] hover:border-[#5b4be0] hover:scale-105 transition-all cursor-pointer"
                  >
                    <img src={m.public_url} alt={m.alt || ''} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#5b4be0]/0 group-hover:bg-[#5b4be0]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[11px] font-medium">
                      Select
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW CTA MODAL */}
      {newCtaModal && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCta}
            className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[460px] w-full shadow-2xl space-y-4"
          >
            <h3 className="text-[17px] font-semibold text-[#16151c]">Add New Contact Link</h3>

            <div>
              <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                Label Text
              </label>
              <input
                type="text"
                required
                value={newCtaLabel}
                onChange={(e) => setNewCtaLabel(e.target.value)}
                placeholder="e.g. text me on linkedin"
                className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                Destination URL
              </label>
              <input
                type="text"
                required
                value={newCtaUrl}
                onChange={(e) => setNewCtaUrl(e.target.value)}
                placeholder="mailto:..., https://wa.me/..., etc."
                className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                  Presentation Mode
                </label>
                <select
                  value={newCtaMode}
                  onChange={(e) => setNewCtaMode(e.target.value as 'text' | 'icon')}
                  className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                >
                  <option value="text">Option A — Text Link</option>
                  <option value="icon">Option B — Glass Icon</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                  Platform Icon
                </label>
                <select
                  value={newCtaPlatform}
                  onChange={(e) => setNewCtaPlatform(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                >
                  <option value="email">Email</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="twitter">X</option>
                  <option value="instagram">Instagram</option>
                  <option value="dribbble">Dribbble</option>
                  <option value="behance">Behance</option>
                  <option value="facebook">Facebook</option>
                  <option value="github">GitHub</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNewCtaModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-[13px] font-medium bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-lg shadow-xs"
              >
                Create Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT CTA MODAL */}
      {editCtaModal && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateCtaItem}
            className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[460px] w-full shadow-2xl space-y-4"
          >
            <h3 className="text-[17px] font-semibold text-[#16151c]">Edit Contact Link</h3>

            <div>
              <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                Label Text
              </label>
              <input
                type="text"
                required
                value={editCtaModal.label}
                onChange={(e) => setEditCtaModal({ ...editCtaModal, label: e.target.value })}
                className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                Destination URL
              </label>
              <input
                type="text"
                required
                value={editCtaModal.url}
                onChange={(e) => setEditCtaModal({ ...editCtaModal, url: e.target.value })}
                className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                  Presentation Mode
                </label>
                <select
                  value={editCtaModal.presentation_mode || 'text'}
                  onChange={(e) => setEditCtaModal({ ...editCtaModal, presentation_mode: e.target.value as 'text' | 'icon' })}
                  className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                >
                  <option value="text">Option A — Text Link</option>
                  <option value="icon">Option B — Glass Icon</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                  Platform Icon
                </label>
                <select
                  value={editCtaModal.platform || 'email'}
                  onChange={(e) => setEditCtaModal({ ...editCtaModal, platform: e.target.value })}
                  className="w-full h-10 px-3 bg-[#f6f5fa] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                >
                  <option value="email">Email</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="twitter">X</option>
                  <option value="instagram">Instagram</option>
                  <option value="dribbble">Dribbble</option>
                  <option value="behance">Behance</option>
                  <option value="facebook">Facebook</option>
                  <option value="github">GitHub</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[13px] text-[#16151c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editCtaModal.is_active}
                  onChange={(e) => setEditCtaModal({ ...editCtaModal, is_active: e.target.checked })}
                  className="rounded text-[#5b4be0]"
                />
                <span>Active and visible on public website</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditCtaModal(null)}
                className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-[13px] font-medium bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-lg shadow-xs"
              >
                Update Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
