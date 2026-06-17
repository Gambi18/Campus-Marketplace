'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import Button from '../../components/Button';
import ConditionGrid from '../../components/listing/ConditionGrid';
import InfoTipBox from '../../components/listing/InfoTipBox';
import ListingBackLink from '../../components/listing/ListingBackLink';
import ListingProgress from '../../components/listing/ListingProgress';
import Select from '../../components/Select';
import Textarea from '../../components/Textarea';
import Input from '../../components/Input';
import { useListingForm } from '../../context/ListingFormContext';

const CATEGORY_OPTIONS = [
  { value: '1', label: 'Electronics' },
  { value: '2', label: 'Fashion & Accessories' },
  { value: '3', label: 'Academic Materials' },
  { value: '4', label: 'Furniture & Home' },
  { value: '5', label: 'Sports & Fitness' },
  { value: '6', label: 'Others' },
];

export default function SellDetailsPage() {
  const router = useRouter();
  const { form, updateForm, primaryPhoto } = useListingForm();

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    if (!primaryPhoto) router.replace('/sell');
  }, [primaryPhoto, router]);

  const canContinue =
    form.title.trim() && form.description.trim() && form.categoryId;

  const handleContinue = () => {
    if (!canContinue) return;
    router.push('/sell/pricing');
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = CATEGORY_OPTIONS.find((c) => c.value === e.target.value);
    updateForm({
      categoryId: e.target.value,
      categoryName: selected?.label ?? '',
    });
  };

  return (
    <>
      <ListingBackLink href="/sell" />
      <ListingProgress currentStep={2} />

      <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
        <Input
          label="Title"
          name="title"
          required
          placeholder="e.g., Study Desk in Good Condition"
          value={form.title}
          onChange={(e) => updateForm({ title: e.target.value })}
        />

        <Textarea
          label="Description"
          name="description"
          required
          placeholder="Describe your item, including condition, features, and any flaws..."
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
        />

        <Select
          label="Category"
          name="category"
          required
          placeholder="Select category"
          value={form.categoryId}
          options={CATEGORY_OPTIONS}
          onChange={handleCategoryChange}
        />

        <ConditionGrid
          value={form.condition}
          onChange={(condition) => updateForm({ condition })}
        />

        <div className="flex flex-col gap-3 pt-2">
          <Button variant="form" size="lg" disabled={!canContinue} onClick={handleContinue}>
            Continue
          </Button>
          <Button variant="outlined" size="lg" fullWidth onClick={() => router.push('/sell')}>
            Back
          </Button>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <InfoTipBox
          icon={<Shield className="w-5 h-5" />}
          title="Safety First"
          description="We recommend meeting in public campus areas for exchanges."
        />
        <InfoTipBox
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
            </svg>
          }
          title="Price Insights"
          description="Items with clear photos and descriptions sell 2x faster."
        />
      </div>
    </>
  );
}
