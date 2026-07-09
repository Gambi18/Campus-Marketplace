'use client';

import { adminFetch } from '../../utils/adminApi';
import StatusBadge from '../../components/StatusBadge';
import { useApiResource } from '../../../customHooks/useApiResource';

interface AdminReport {
  id: string;
  reporter_name: string;
  product_title: string;
  reason: string;
  details?: string;
  status: string;
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  fake_listing: 'Fake / Prohibited Listing',
  wrong_price: 'Misleading Price',
  scam: 'Scam / Fraud',
  inappropriate: 'Inappropriate Behavior',
  other: 'Other',
};

export default function AdminReportsPage() {
  // Admin auth is enforced centrally by AdminGuard in app/admin/layout.tsx.
  const { data, loading } = useApiResource(
    () => adminFetch<{ reports: AdminReport[] }>('/api/v1/admin/reports?limit=100&offset=0'),
    [],
  );
  const reports = data?.reports ?? [];

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
              <th className="text-left p-4 font-semibold text-text-muted">Details</th>
              <th className="text-left p-4 font-semibold text-text-muted">Status</th>
              <th className="text-left p-4 font-semibold text-text-muted">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-brand-neutral">{r.reporter_name}</td>
                <td className="p-4 text-text-muted">{r.product_title}</td>
                <td className="p-4 text-text-muted">{REASON_LABELS[r.reason] || r.reason}</td>
                <td className="p-4 text-text-muted max-w-xs whitespace-pre-wrap break-words">
                  {r.details?.trim() ? r.details : <span className="text-gray-300">—</span>}
                </td>
                <td className="p-4"><StatusBadge status={r.status} /></td>
                <td className="p-4 text-text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
