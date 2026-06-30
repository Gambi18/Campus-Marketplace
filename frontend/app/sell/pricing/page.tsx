'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import ListingBackLink from '../../components/listing/ListingBackLink';
import ListingProgress from '../../components/listing/ListingProgress';
import ReviewSummary from '../../components/listing/ReviewSummary';
import Select from '../../components/Select';
import Toast from '../../components/Toast';
import { useListingForm } from '../../context/ListingFormContext';
import { API_URL } from '../../utils/api';

const LOCATION_OPTIONS = [
  { value: 'Main Campus', label: 'Main Campus' },
  { value: 'Library', label: 'Library' },
  { value: 'Student Center', label: 'Student Center' },
  { value: 'North Hall', label: 'North Hall' },
  { value: 'Sports Complex', label: 'Sports Complex' },
];

export default function SellPricingPage() {
  const router = useRouter();
  const { form, updateForm, resetForm, primaryPhoto, hydrated } = useListingForm();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const publishTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (publishTimeoutRef.current) clearTimeout(publishTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    // Wait for the draft to load before deciding whether to bounce back to step 1,
    // otherwise a fresh reload of /sell/pricing redirects away from a valid draft.
    if (hydrated && !form.title) router.replace('/sell/details');
  }, [hydrated, form.title, router]);

  // Number() (unlike parseFloat) rejects "5abc", so partial-numeric input can't pass.
  const priceNum = Number(form.price);
  const canPublish = form.price.trim() !== '' && Number.isFinite(priceNum) && priceNum > 0;

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  };

  const CONDITION_MAP: Record<string, string> = {
    'Brand New': 'brand_new',
    'Like New': 'like_new',
    'Good': 'good',
    'Fair': 'fair',
  };

  const handlePublish = async () => {
    if (!canPublish || !primaryPhoto) return;
    setPublishing(true);
    setError(null);

    try {
      const body = new FormData();
      body.append('title', form.title);
      body.append('description', form.description);
      body.append('price', form.price);
      body.append('category_id', form.categoryId);
      body.append('condition', CONDITION_MAP[form.condition] || 'good');

      const file = await dataUrlToFile(primaryPhoto, 'listing-photo.jpg');
      body.append('image_1', file);

      for (let i = 1; i < form.photos.length; i++) {
        const photo = form.photos[i];
        if (photo) {
          const f = await dataUrlToFile(photo, `listing-photo-${i + 1}.jpg`);
          body.append(`image_${i + 1}`, f);
        }
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/api/v1/products`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not publish listing. Sign in and try again.');
      }

      resetForm();
      setToastVisible(true);
      publishTimeoutRef.current = setTimeout(() => router.push('/mylistings'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish listing');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <ListingBackLink href="/sell/details" />
      <ListingProgress currentStep={3} />

      <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
        <h2 className="text-lg font-bold text-brand-neutral">Pricing & Location</h2>

        <Input
          label="Price (FCFA)"
          name="price"
          type="number"
          required
          placeholder="0.00"
          value={form.price}
          helperText={`A 3% platform commission (${form.price ? Math.round(parseFloat(form.price) * 0.03).toLocaleString() : '0'} FCFA) is deducted from your sale. You will receive ${form.price ? Math.round(parseFloat(form.price) * 0.97).toLocaleString() : '0'} FCFA.`}
          onChange={(e) => updateForm({ price: e.target.value })}
        />

        <Select
          label="Meetup Location"
          name="location"
          value={form.location}
          options={LOCATION_OPTIONS}
          onChange={(e) => updateForm({ location: e.target.value })}
        />
      </div>

      <div className="mt-6">
        <ReviewSummary form={form} />
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
        <Button variant="outlined" size="lg" fullWidth={false} onClick={() => router.push('/sell/details')}>
          Back
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth={false}
          disabled={!canPublish || publishing}
          onClick={handlePublish}
          className="sm:flex-1"
        >
          <Check className="w-5 h-5 mr-2" />
          {publishing ? 'Publishing…' : 'Publish Listing'}
        </Button>
      </div>

      <Toast
        message="Listing published successfully!"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}
