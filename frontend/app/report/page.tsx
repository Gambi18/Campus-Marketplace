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
  const [selectedReason, setSelectedReason] = useState<ReportPayload['reason']>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const reasons = [
    { id: 'prohibited', label: 'Prohibited Item' },
    { id: 'scam', label: 'Scam/Fraud' },
    { id: 'behavior', label: 'Inappropriate Behavior' },
    { id: 'misleading', label: 'Misleading Listing' },
    { id: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    setIsSubmitting(true);

    try {
      await postAPI('/api/v1/reports', {
        reason: selectedReason,
        details: additionalDetails,
      });
      setIsSubmitting(false);
      alert('Report submitted successfully.');
      router.push('/');
    } catch (err) {
      setIsSubmitting(false);
      alert(err instanceof Error ? err.message : 'Failed to submit report');
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
              <h3 className="text-sm font-bold text-gray-900">{sellerName}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Seller since 2023 • 4.8 Rating</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="block text-[9px] uppercase font-bold text-gray-400">Reported ID</span>
                <span className="text-xs font-mono font-bold text-gray-700">R-98201</span>
              </div>
              <div className="w-5 h-5 border rounded bg-white"></div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-3">Reason for Reporting</label>
              <div className="space-y-2.5">
                {reasons.map((reason) => (
                  <label 
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-xs font-medium cursor-pointer transition ${
                      selectedReason === reason.id ? 'border-blue-600 bg-blue-50/20 text-blue-700' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{reason.label}</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedReason === reason.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                      {selectedReason === reason.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Additional Details</label>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                maxLength={250}
                placeholder="Provide context..."
                required
                rows={4}
                className="w-full text-xs p-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none text-gray-800"
              />
            </div>
            {/* <Textarea 
              label='Additional Details' placeholder="Provide context..."  value={additionalDetails}
            /> */}

            <div className="flex items-center justify-center gap-8 pt-2">
              <button type="button" onClick={() => router.back()} className="text-xs font-bold text-gray-500">
                Cancel
              </button>
              <Button type="submit" disabled={!selectedReason || isSubmitting}>
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