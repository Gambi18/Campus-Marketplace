'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fetchAPI } from '../utils/api';

interface MyReport {
  id: string;
  product_title: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function MyReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const res = await fetchAPI<{ reports: MyReport[] }>('/api/v1/my-reports');
        setReports(res.reports || []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-600',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
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
                  <span className={statusBadge(r.status)}>{r.status}</span>
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
