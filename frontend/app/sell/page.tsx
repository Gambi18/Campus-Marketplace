'use client';

import { useRouter } from 'next/navigation';
import { Lightbulb, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import InfoTipBox from '../components/listing/InfoTipBox';
import ListingBackLink from '../components/listing/ListingBackLink';
import ListingProgress from '../components/listing/ListingProgress';
import PhotoUploadGrid from '../components/listing/PhotoUploadGrid';
import { useListingForm } from '../context/ListingFormContext';

export default function SellUploadPage() {
  const router = useRouter();
  const { form, updateForm, primaryPhoto } = useListingForm();

  const handleContinue = () => {
    if (!primaryPhoto) return;
    router.push('/sell/details');
  };

  return (
    <>
      <ListingBackLink href="/" label="Back" />
      <ListingProgress currentStep={1} />

      <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-brand-neutral">Upload Photos</h2>
          <p className="text-sm text-text-muted mt-1">
            Add at least one photo of your item. Good photos help sell faster!
          </p>
        </div>

        <PhotoUploadGrid
          photos={form.photos}
          onPhotoChange={(index, dataUrl) => {
            const next = [...form.photos];
            next[index] = dataUrl;
            updateForm({ photos: next });
          }}
        />

        <Button variant="form" size="lg" disabled={!primaryPhoto} onClick={handleContinue}>
          Continue
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <InfoTipBox
          icon={<Lightbulb className="w-5 h-5" />}
          title="Photography Tip"
          description="Use natural lighting and a neutral background for best results."
        />
        <InfoTipBox
          icon={<ShieldCheck className="w-5 h-5" />}
          title="Stay Safe"
          description="Photos of the actual item help build trust with other students on campus."
        />
      </div>
    </>
  );
}
