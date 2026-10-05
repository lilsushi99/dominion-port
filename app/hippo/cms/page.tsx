'use client';

// app/hippo/cms/page.tsx — CMS Content Management with Explicit Contact Save & Icon Options
import React, { useState, useEffect } from 'react';
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
  Layers,
  Sparkles,
  Mail,
  Linkedin,
  MessageCircle,
  Twitter,
  Instagram,
  Dribbble,
  Facebook,
  Github,
  Globe
} from 'lucide-react';
import { useHippoAuth } from '@/components/admin/HippoAuthProvider';
import { CtaLink, FooterSettings } from '@/backend/src/services/cms.service';

export default function HippoCmsPage() {
  const { csrfToken } = useHippoAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'intro' | 'cta' | 'footer'>('intro');

  // Home Intro & Sign-off & Section Heading
  const [introHtml, setIntroHtml] = useState('');
  const [signOff, setSignOff] = useState('');
  const [projectsHeading, setProjectsHeading] = useState('');

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [homeRes, settingsRes, ctaRes, footerRes] = await Promise.all([
          fetch('/api/v1/admin/cms/home'),
          fetch('/api/v1/admin/cms/settings'),
          fetch('/api/v1/admin/cms/cta'),
          fetch('/api/v1/admin/cms/footer')
        ]);

        const [homeJson, settingsJson, ctaJson, footerJson] = await Promise.all([
          homeRes.json(),
          settingsRes.json(),
          ctaRes.json(),
          footerRes.json()
        ]);

        if (!mounted) return;

        if (homeJson.data) {
          setIntroHtml(homeJson.data.body_html || '');
          setSignOff(homeJson.data.sign_off || '');
        }
        if (settingsJson.data) {
          setProjectsHeading(settingsJson.data.projects_heading || '');
        }
        if (ctaJson.data) {
          setCtaLinks(ctaJson.data);
        }
        if (footerJson.data) {
          setFooter(footerJson.data);
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
          body: JSON.stringify({ projects_heading: projectsHeading })
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
        showToast('Contact link added!');
      }
    } catch {
      alert('Failed to create contact link.');
    }
  };

  const handleUpdateCtaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCtaModal || !editCtaModal.label.trim() || !editCtaModal.url.trim()) return;

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
      alert('Failed to update contact link.');
    }
  };

  const handleDeleteCta = async (id: number) => {
    try {
      await fetch(`/api/v1/admin/cms/cta/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken }
      });
      setCtaLinks((prev) => prev.filter((c) => c.id !== id));
      showToast('Contact link deleted');
    } catch {
      alert('Failed to delete contact link.');
    }
  };

  const handleToggleCtaActive = (index: number) => {
    setCtaLinks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], is_active: !copy[index].is_active };
      return copy;
    });
    setCtaDirty(true);
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
          <p className="text-[13px] text-[#86858f] mt-0.5">Edit introductory letter, contact buttons, and footer settings.</p>
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

      {/* TAB 2: CONTACT LINKS (PHASES 7 & 8) */}
      {activeTab === 'cta' && (
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#e4e3ea]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#16151c]">Contact Links & Buttons</h2>
              <p className="text-[12px] text-[#86858f] mt-0.5">
                Manage contact options. Choose between text links or modern glass platform icons.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {ctaDirty && (
                <button
                  type="button"
                  onClick={saveCtaLinksBatch}
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-[#12874f] hover:bg-[#0f7242] text-white text-[12px] font-medium rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Save size={13} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setNewCtaModal(true)}
                className="px-3 py-1.5 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[12px] font-medium rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus size={14} />
                <span>Add link</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {ctaLinks.map((link, idx) => (
              <div
                key={link.id}
                className={`p-3.5 bg-[#f6f5fa] rounded-xl border transition-all flex items-center gap-3 ${
                  link.is_active ? 'border-[#e4e3ea]' : 'border-[#e4e3ea] opacity-60'
                }`}
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveCta(idx, 'up')}
                    className="p-0.5 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                    title="Move up"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    disabled={idx === ctaLinks.length - 1}
                    onClick={() => handleMoveCta(idx, 'down')}
                    className="p-0.5 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                    title="Move down"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#16151c] flex items-center gap-2">
                    <span>{link.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e4e3ea] text-[#4a4955] uppercase font-mono">
                      {link.presentation_mode === 'icon' ? `Icon: ${link.platform || 'link'}` : 'Text'}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#86858f] hover:text-[#5b4be0]"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="text-[11px] font-mono text-[#86858f] truncate mt-0.5">{link.url}</div>
                </div>

                {/* Active Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleCtaActive(idx)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    link.is_active ? 'bg-[#e3f6ec] text-[#12874f]' : 'bg-[#fde8ec] text-[#d92d4a]'
                  }`}
                >
                  {link.is_active ? 'Active' : 'Hidden'}
                </button>

                {/* Edit & Delete Controls */}
                <div className="flex items-center gap-1 border-l border-[#e4e3ea] pl-2">
                  <button
                    type="button"
                    onClick={() => setEditCtaModal(link)}
                    className="p-1.5 text-[#4a4955] hover:text-[#5b4be0] hover:bg-[#e4e3ea] rounded-lg transition-colors"
                    title="Edit contact link"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCta(link.id)}
                    className="p-1.5 text-[#d92d4a] hover:bg-[#fde8ec] rounded-lg transition-colors"
                    title="Delete contact link"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#e4e3ea] flex items-center justify-between">
            <span className="text-[12px] text-[#86858f]">
              {ctaDirty ? 'Unsaved changes in contact links list.' : 'All contact links saved.'}
            </span>
            <button
              type="button"
              onClick={saveCtaLinksBatch}
              disabled={saving}
              className="px-4 py-2 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white text-[13px] font-medium rounded-xl flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: FOOTER SETTINGS */}
      {activeTab === 'footer' && footer && (
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-6">
          <div>
            <h2 className="text-[16px] font-semibold text-[#16151c] pb-2 border-b border-[#e4e3ea]">
              Footer Configuration
            </h2>
            <p className="text-[12px] text-[#86858f] mt-1">
              Controls publication year, designer attribution, and hyperlinks. (Admin link has been removed).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
                Year Mode
              </label>
              <select
                value={footer.year_mode}
                onChange={(e) => setFooter({ ...footer, year_mode: e.target.value as 'auto' | 'fixed' })}
                className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              >
                <option value="fixed">Fixed Year (Publication Year)</option>
                <option value="auto">Automatic (Current Calendar Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
                Fixed Year
              </label>
              <input
                type="number"
                disabled={footer.year_mode === 'auto'}
                value={footer.fixed_year || 2026}
                onChange={(e) => setFooter({ ...footer, fixed_year: Number(e.target.value) })}
                className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none disabled:bg-[#f6f5fa]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
                Designed By Prefix Text
              </label>
              <input
                type="text"
                value={footer.designed_by_text}
                onChange={(e) => setFooter({ ...footer, designed_by_text: e.target.value })}
                placeholder="Designed by"
                className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
                Designer Name
              </label>
              <input
                type="text"
                value={footer.designer_name}
                onChange={(e) => setFooter({ ...footer, designer_name: e.target.value })}
                placeholder="Castiel"
                className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-[#4a4955] mb-1.5">
                Designer Hyperlink URL
              </label>
              <input
                type="url"
                value={footer.designer_url}
                onChange={(e) => setFooter({ ...footer, designer_url: e.target.value })}
                placeholder="https://dflamez.com.ng"
                className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#e4e3ea] flex justify-end">
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

      {/* NEW CTA MODAL */}
      {newCtaModal && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCta}
            className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[460px] w-full shadow-2xl space-y-4"
          >
            <h3 className="text-[17px] font-semibold text-[#16151c]">Add Contact Link / Button</h3>

            <div>
              <label className="block text-[12px] font-medium text-[#4a4955] mb-1">
                Label Text
              </label>
              <input
                type="text"
                required
                value={newCtaLabel}
                onChange={(e) => setNewCtaLabel(e.target.value)}
                placeholder="e.g. Email me, Text on LinkedIn, Find on X"
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
                placeholder="mailto:you@example.com or https://..."
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
                  <option value="twitter">X / Twitter</option>
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
                Add Link
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
                  <option value="twitter">X / Twitter</option>
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
