'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { fetchAPI, API_URL } from '../../utils/api';

const CATEGORY_OPTIONS = [
  { value: '1', label: 'Electronics' },
  { value: '2', label: 'Fashion & Accessories' },
  { value: '3', label: 'Academic Materials' },
  { value: '4', label: 'Furniture & Home' },
  { value: '5', label: 'Sports & Fitness' },
  { value: '6', label: 'Others' },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const product = await fetchAPI<any>(`/api/v1/products/${id}`);
        setTitle(product.title || '');
        setDescription(product.description || '');
        setPrice(product.price?.toString() || '');
        setCategoryId(product.category_id?.toString() || '');
      } catch {
        setError('Could not load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !price || !categoryId) return;
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/v1/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          description,
          price,
          category_id: parseInt(categoryId),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update product');
      }
      router.push(`/details/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-text-muted">Loading...</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-brand-neutral mb-6">Edit Product</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <Input label="Title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <div>
            <label className="block text-sm font-semibold text-brand-neutral mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-brand-primary"
            />
          </div>
          <Input label="Price (FCFA)" name="price" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          <Select
            label="Category"
            name="category"
            required
            placeholder="Select category"
            value={categoryId}
            options={CATEGORY_OPTIONS}
            onChange={(e) => setCategoryId(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outlined" onClick={() => router.push(`/details/${id}`)}>
              Cancel
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
