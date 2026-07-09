'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import { fetchAPI } from '../utils/api';
import { useApiResource } from '../../customHooks/useApiResource';

interface MyReport {
  id: string;
  product_title: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function MyReportsPage() {
  const router = useRouter();

  // /my-reports isn't in the middleware matcher, so it keeps a client-side guard.
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  const { data, loading } = useApiResource(
    () => fetchAPI<{ reports: MyReport[] }>('/api/v1/my-reports'),
    [],
  );
  const reports = data?.reports ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-surface-page">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-brand-neutral mb-6">My Reports</h1>
        {loading ? (
          <p className="text-text-muted">Loading...</p>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">No reports submitted.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-brand-neutral">{r.product_title || 'Product'}</h3>
                    <p className="text-sm text-text-muted mt-1">Reason: {r.reason}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
