'use client';

// app/hippo/categories/page.tsx — Category Management
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Check,
  FolderGit2,
  FileText
} from 'lucide-react';
import { useHippoAuth } from '@/components/admin/HippoAuthProvider';
import { Category } from '@/backend/src/services/categories.service';

export default function HippoCategoriesPage() {
  const { csrfToken } = useHippoAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formType, setFormType] = useState<'project' | 'paper'>('project');
  const [formActive, setFormActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/v1/admin/categories');
      const json = await res.json();
      if (json.data) setCategories(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/admin/categories')
      .then((res) => res.json())
      .then((json) => {
        if (mounted && json.data) setCategories(json.data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormType('project');
    setFormActive(true);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormType(cat.content_type);
    setFormActive(cat.is_active);
    setError(null);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      const slugified = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormSlug(slugified);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      setError('Name and slug are required.');
      return;
    }

    try {
      const url = editingCategory
        ? `/api/v1/admin/categories/${editingCategory.id}`
        : '/api/v1/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          name: formName.trim(),
          slug: formSlug.trim(),
          content_type: formType,
          is_active: formActive,
          sort_order: editingCategory?.sort_order ?? categories.length + 1
        })
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || 'Failed to save category.');
        return;
      }

      setModalOpen(false);
      fetchCategories();
      showToast(editingCategory ? 'Category updated' : 'Category created');
    } catch {
      setError('Network error saving category.');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.item_count && cat.item_count > 0) {
      alert(`Cannot delete category "${cat.name}": ${cat.item_count} items are currently assigned to it. Reassign or delete them first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/admin/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken }
      });

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        showToast('Category deleted');
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to delete category.');
      }
    } catch {
      alert('Network error deleting category.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const copy = [...categories];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setCategories(copy);

    await fetch('/api/v1/admin/categories/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ ordered_ids: copy.map((c) => c.id) })
    });
    showToast('Categories reordered');
  };

  return (
    <div className="max-w-[760px] space-y-6">
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
          <h1 className="text-[22px] font-semibold text-[#16151c] tracking-tight">Categories</h1>
          <p className="text-[13px] text-[#86858f] mt-0.5">Manage portfolio categories and paper taxonomy tags.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-xl text-[13px] font-medium flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Plus size={15} />
          <span>New category</span>
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-[#fdfcff] border border-[#e4e3ea] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(22,21,28,0.04)]">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-[#86858f]">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[#86858f]">No categories found.</div>
        ) : (
          <div className="divide-y divide-[#e4e3ea]">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[#f6f5fa] transition-colors"
              >
                {/* Reorder Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-0.5 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    disabled={idx === categories.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-0.5 rounded hover:bg-[#e4e3ea] text-[#86858f] disabled:opacity-20"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#16151c] capitalize">
                      {cat.name}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f6f5fa] border border-[#e4e3ea] text-[#4a4955]">
                      {cat.content_type === 'project' ? <FolderGit2 size={11} /> : <FileText size={11} />}
                      <span>{cat.content_type}</span>
                    </span>
                  </div>
                  <div className="text-[12px] font-mono text-[#86858f] mt-0.5">
                    /{cat.slug} · <span className="font-sans font-medium text-[#4a4955]">{cat.item_count || 0} items</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      cat.is_active ? 'bg-[#e3f6ec] text-[#12874f]' : 'bg-[#fde8ec] text-[#d92d4a]'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </span>

                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg border border-[#e4e3ea] hover:bg-[#f6f5fa] text-[#4a4955]"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg border border-[#e4e3ea] hover:bg-[#fde8ec] text-[#d92d4a]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#16151c]/40 flex items-center justify-center p-4">
          <div className="bg-[#fdfcff] rounded-2xl border border-[#e4e3ea] p-6 max-w-[440px] w-full shadow-xl">
            <h3 className="text-[18px] font-semibold text-[#16151c]">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h3>

            {error && (
              <div className="mt-3 p-3 bg-[#fde8ec] border border-[#d92d4a]/20 rounded-xl text-[12px] text-[#d92d4a]">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. web development"
                  className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                  Slug URL
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. web-development"
                  className="w-full h-10 px-3 font-mono bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#4a4955] mb-1">
                  Content Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as 'project' | 'paper')}
                  className="w-full h-10 px-3 bg-[#fdfcff] border border-[#e4e3ea] rounded-xl text-[13px] text-[#16151c] outline-none"
                >
                  <option value="project">Project Category</option>
                  <option value="paper">Paper Category</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[#e4e3ea] text-[#5b4be0] focus:ring-[#5b4be0]"
                />
                <label htmlFor="activeCheck" className="text-[13px] text-[#16151c] cursor-pointer">
                  Category is active and visible in switcher
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e4e3ea]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-[13px] font-medium text-[#4a4955] hover:bg-[#f6f5fa] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-[13px] font-medium bg-[#5b4be0] hover:bg-[#4d3ed1] text-white rounded-lg shadow-xs"
                >
                  {editingCategory ? 'Save changes' : 'Create category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
