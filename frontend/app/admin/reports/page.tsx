'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '../../utils/adminApi';

interface AdminReport {
  id: string;
  reporter_name: string;
  product_title: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem('admin_token')) {
      router.replace('/admin/login');
      return;
    }
    (async () => {
      try {
        const res = await adminFetch<{ reports: AdminReport[] }>('/api/v1/admin/reports');
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

  if (loading) {
    return <div className="p-8 text-text-muted text-sm">Loading reports...</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-brand-neutral">Reports & moderation</h2>
          <p className="text-sm text-text-muted mt-2">No reports to review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-brand-neutral mb-4">Reports</h2>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-semibold text-text-muted">Reporter</th>
              <th className="text-left p-4 font-semibold text-text-muted">Product</th>
              <th className="text-left p-4 font-semibold text-text-muted">Reason</th>
              <th className="text-left p-4 font-semibold text-text-muted">Status</th>
              <th className="text-left p-4 font-semibold text-text-muted">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-brand-neutral">{r.reporter_name}</td>
                <td className="p-4 text-text-muted">{r.product_title}</td>
                <td className="p-4 text-text-muted">{r.reason}</td>
                <td className="p-4"><span className={statusBadge(r.status)}>{r.status}</span></td>
                <td className="p-4 text-text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
