'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import Footer from '@/components/Footer';
import { ReportPayload } from '@/types';
import { postAPI } from '../utils/api';


function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sellerName = searchParams.get('sellerName') || 'Rose Sharon';
  const productId = searchParams.get('productId') || '';
  const [selectedReason, setSelectedReason] = useState<ReportPayload['reason']>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reasons: { id: ReportPayload['reason']; label: string }[] = [
    { id: 'fake_listing', label: 'Fake / Prohibited Listing' },
    { id: 'wrong_price', label: 'Misleading Price' },
    { id: 'scam', label: 'Scam / Fraud' },
    { id: 'inappropriate', label: 'Inappropriate Behavior' },
    { id: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!selectedReason) return;
    if (!productId) {
      setSubmitError('Missing product reference. Please start the report from the chat.');
      return;
    }
    setIsSubmitting(true);

    try {
      await postAPI('/api/v1/reports', {
        product_id: productId,
        reason: selectedReason,
        details: additionalDetails,
      });
      router.push('/');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-xl mx-auto my-8 sm:my-12 px-4 sm:px-6 w-full flex-1">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Report Seller</h1>
          <p className="text-xs text-gray-500 mt-1">We take marketplace safety seriously. Tell us what happened.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 bg-blue-50/30 border-b border-gray-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold border" aria-hidden="true">
              {(sellerName?.trim()?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{sellerName}</p>
              <p className="text-xs text-gray-500 mt-0.5">Seller since 2023 • 4.8 Rating</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="block text-xs uppercase font-bold text-gray-500">Reported ID</span>
                <span className="text-xs font-mono font-bold text-gray-700">R-98201</span>
              </div>
              <div className="w-5 h-5 border rounded bg-white"></div>
            </div>

            <fieldset>
              <legend className="block text-xs uppercase font-bold text-gray-500 mb-3">Reason for Reporting</legend>
              <div className="space-y-2.5">
                {reasons.map((reason) => (
                  <label
                    key={reason.id}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm font-medium cursor-pointer transition focus-within:ring-2 focus-within:ring-blue-100 ${
                      selectedReason === reason.id ? 'border-blue-600 bg-blue-50/20 text-blue-700' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{reason.label}</span>
                    <input
                      type="radio"
                      name="reason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={() => setSelectedReason(reason.id)}
                      className="sr-only"
                    />
                    <span aria-hidden="true" className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedReason === reason.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                      {selectedReason === reason.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="report-details" className="block text-xs uppercase font-bold text-gray-500 mb-2">Additional Details</label>
              <textarea
                id="report-details"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                maxLength={250}
                placeholder="Provide context..."
                required
                rows={4}
                className="w-full text-base md:text-sm p-3.5 border border-gray-200 rounded-xl outline-none focus:border-brand-primary focus:ring-4 focus:ring-blue-100 resize-none text-gray-800"
              />
              <p className="mt-1 text-xs text-gray-500 text-right">{additionalDetails.length}/250</p>
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-red-600 text-center">{submitError}</p>
            )}

            <div className="flex items-center justify-center gap-8 pt-2">
              <button type="button" onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-gray-700 cursor-pointer">
                Cancel
              </button>
              <Button type="submit" loading={isSubmitting} disabled={!selectedReason}>
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}