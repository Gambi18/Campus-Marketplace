'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import { adminFetch } from '../../utils/adminApi';
import { fetchAPI } from '../../utils/api';
import { useApiResource } from '../../../customHooks/useApiResource';
import type { AdminCategory } from '../../types/admin';

const emptyForm = { name: '', description: '' };

export default function AdminCategoriesPage() {
  const { data, loading, error: loadError, refetch } = useApiResource(
    () => fetchAPI<{ categories: AdminCategory[] }>('/api/v1/categories'),
    [],
  );
  const categories = data?.categories ?? [];
  const [actionError, setActionError] = useState<string | null>(null);
  const error = actionError ?? loadError;
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (cat: AdminCategory) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description ?? '' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      if (editingId) {
        await adminFetch(`/api/v1/admin/categories/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await adminFetch('/api/v1/admin/categories', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      closeForm();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? Products using it may be affected.`)) return;
    setActionError(null);
    try {
      await adminFetch(`/api/v1/admin/categories/${id}`, { method: 'DELETE' });
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete category');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-neutral">Categories</h2>
          <p className="text-sm text-text-muted mt-1">
            Create, update, or remove product categories used across the marketplace.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add category
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4"
        >
          <h3 className="font-semibold text-brand-neutral">
            {editingId ? 'Edit category' : 'New category'}
          </h3>
          <Input
            label="Name"
            name="name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outlined" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {loading ? (
          <p className="p-8 text-center text-text-muted text-sm">Loading categories…</p>
        ) : categories.length === 0 ? (
          <p className="p-8 text-center text-text-muted text-sm">No categories yet.</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-semibold text-brand-neutral">{cat.name}</p>
                {cat.description && (
                  <p className="text-sm text-text-muted mt-0.5">{cat.description}</p>
                )}
                <p className="text-xs text-text-muted mt-1">ID: {cat.id}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="p-2 text-text-muted hover:text-brand-primary rounded-lg hover:bg-gray-50"
                  aria-label={`Edit ${cat.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-2 text-text-muted hover:text-red-600 rounded-lg hover:bg-red-50"
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
