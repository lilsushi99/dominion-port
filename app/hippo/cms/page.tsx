'use client';

// app/hippo/cms/page.tsx — CMS Content Management
import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Sliders,
  Home,
  Share2
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
  const [newCtaModal, setNewCtaModal] = useState(false);
  const [newCtaLabel, setNewCtaLabel] = useState('');
  const [newCtaUrl, setNewCtaUrl] = useState('');

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

  const loadData = async () => {
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

      if (homeJson.data) {
        setIntroHtml(homeJson.data.body_html || '');
        setSignOff(homeJson.data.sign_off || 'love,\ndominion');
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
      setLoading(false);
    }
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
          setSignOff(homeJson.data.sign_off || 'love,\ndominion');
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
        body: JSON.stringify({ label: newCtaLabel, url: newCtaUrl })
      });
      const json = await res.json();
      if (json.data) {
        setCtaLinks((prev) => [...prev, json.data]);
        setNewCtaModal(false);
        setNewCtaLabel('');
        setNewCtaUrl('');
        showToast('CTA button created!');
      }
    } catch {
      alert('Failed to create CTA button.');
    }
  };

  const handleDeleteCta = async (id: number) => {
    try {
      await fetch(`/api/v1/admin/cms/cta/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken }
      });
      setCtaLinks((prev) => prev.filter((c) => c.id !== id));
      showToast('CTA button deleted');
    } catch {
      alert('Failed to delete CTA link.');
    }
  };

  const handleToggleCtaActive = async (link: CtaLink) => {
    try {
      const updated = { ...link, is_active: !link.is_active };
      await fetch(`/api/v1/admin/cms/cta/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(updated)
      });
      setCtaLinks((prev) => prev.map((c) => (c.id === link.id ? updated : c)));
      showToast(`CTA link ${updated.is_active ? 'activated' : 'deactivated'}`);
    } catch {
      alert('Failed to toggle active state.');
    }
  };

  const handleMoveCta = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= ctaLinks.length) return;

    const copy = [...ctaLinks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setCtaLinks(copy);

    await fetch('/api/v1/admin/cms/cta/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ ordered_ids: copy.map((c) => c.id) })
    });
    showToast('CTA links reordered');
  };

  if (loading) {
    return <div className="p-8 text-center text-[13px] text-[#86858f]">Loading CMS content...</div>;
  }

  return (
    <div className="max-w-[760px] space-y-6">
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
            <p className="text-[12px] text-[#86858f] mb-3">
              Paragraphs, bold emphasis (e.g. &lt;strong&gt;product design&lt;/strong&gt;), and company links (e.g. &lt;a href=&quot;https://stripe.com&quot; target=&quot;_blank&quot;&gt;stripe&lt;/a&gt;).
            </p>
            <textarea
              rows={8}
              value={introHtml}
              onChange={(e) => setIntroHtml(e.target.value)}
              className="w-full p-3 font-mono text-[12px] leading-relaxed bg-[#f6f5fa] border border-[#e4e3ea] focus:border-[#5b4be0] rounded-xl text-[#16151c] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#16151c] mb-1">
              Sign-Off Lines
            </label>
            <p className="text-[12px] text-[#86858f] mb-2">Each line appears stacked tightly below the letter.</p>
            <textarea
              rows={2}
              value={signOff}
              onChange={(e) => setSignOff(e.target.value)}
              className="w-full p-3 text-[13px] bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[#16151c] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#16151c] mb-1">
              Projects List Section Heading
            </label>
            <input
              type="text"
              value={projectsHeading}
              onChange={(e) => setProjectsHeading(e.target.value)}
              placeholder="p.s. things i've made and written…"
              className="w-full h-10 px-3 text-[13px] bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[#16151c] outline-none"
            />
          </div>

          {/* Live Preview */}
          <div className="pt-4 border-t border-[#e4e3ea]">
            <h3 className="text-[12px] font-semibold text-[#86858f] uppercase tracking-wider mb-3">
              Live Output Preview
            </h3>
            <div className="p-4 bg-[#16151c] text-[#b9b8b2] rounded-xl text-[14px] leading-relaxed space-y-3">
              <div
                dangerouslySetInnerHTML={{ __html: introHtml }}
                className="[&_a]:text-[#d6d5cf] [&_a]:underline [&_strong]:text-[#eae9e4]"
              />
              <div className="text-[14px] text-[#b9b8b2] whitespace-pre-line mt-3">
                {signOff}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveIntro}
              disabled={saving}
              className="px-5 py-2.5 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-xl text-[13px] font-medium flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save size={15} />
              <span>Save Intro & Heading</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CTA LINKS */}
      {activeTab === 'cta' && (
        <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl p-6 shadow-[0_1px_2px_rgba(22,21,28,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#e4e3ea]">
            <div>
              <h2 className="text-[16px] font-semibold text-[#16151c]">Contact Links</h2>
              <p className="text-[12px] text-[#86858f]">Manage the plain-text clickable contact links on the homepage.</p>
            </div>
            <button
              onClick={() => setNewCtaModal(true)}
              className="px-3 py-1.5 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-lg text-[12px] font-medium flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>Add link</span>
            </button>
          </div>

          <div className="space-y-2">
            {ctaLinks.map((link, idx) => (
              <div
                key={link.id}
                className="p-3 bg-[#f6f5fa] rounded-xl border border-[#e4e3ea] flex items-center gap-3"
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveCta(idx, 'up')}
                    className="p-0.5 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    disabled={idx === ctaLinks.length - 1}
                    onClick={() => handleMoveCta(idx, 'down')}
                    className="p-0.5 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#16151c] flex items-center gap-2">
                    <span>{link.label}</span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#86858f] hover:text-[#5b4be0]"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="text-[11px] font-mono text-[#86858f] truncate">{link.url}</div>
                </div>

                {/* Active Toggle Switch */}
                <button
                  onClick={() => handleToggleCtaActive(link)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    link.is_active ? 'bg-[#e3f6ec] text-[#12874f]' : 'bg-[#fde8ec] text-[#d92d4a]'
                  }`}
                >
                  {link.is_active ? 'Active' : 'Hidden'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteCta(link.id)}
                  className="p-1.5 text-[#d92d4a] hover:bg-[#fde8ec] rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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
              Controls publication year, designer attribution, and hyperlinks.
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

          {/* Footer Live Preview */}
          <div className="pt-4 border-t border-[#e4e3ea]">
            <h3 className="text-[12px] font-semibold text-[#86858f] uppercase tracking-wider mb-2">
              Public Footer Output Preview
            </h3>
            <div className="p-4 bg-[#16151c] text-[#75746f] rounded-xl text-[13px]">
              <span>© {footer.year_mode === 'fixed' ? (footer.fixed_year || 2026) : new Date().getFullYear()} — {footer.designed_by_text} </span>
              <a href={footer.designer_url} target="_blank" rel="noopener noreferrer" className="text-[#d6d5cf] underline">
                {footer.designer_name}
              </a>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveFooter}
              disabled={saving}
              className="px-5 py-2.5 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-xl text-[13px] font-medium flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Save size={15} />
              <span>Save Footer Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* New CTA Link Modal */}
      {newCtaModal && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <div className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[440px] w-full shadow-xl">
            <h3 className="text-[18px] font-semibold text-[#16151c]">Add Contact Button</h3>
            <form onSubmit={handleCreateCta} className="space-y-4 mt-4">
              <div>
                <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. email me"
                  value={newCtaLabel}
                  onChange={(e) => setNewCtaLabel(e.target.value)}
                  className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                  URL / Target
                </label>
                <input
                  type="text"
                  required
                  placeholder="mailto:dominion@example.com or https://..."
                  value={newCtaUrl}
                  onChange={(e) => setNewCtaUrl(e.target.value)}
                  className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                />
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
                  Add button
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
