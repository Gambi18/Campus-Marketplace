'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '../../components/Button';
import { adminFetch } from '../../utils/adminApi';

interface AdminReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  product_id: string;
  product_title: string;
  seller_id: string;
  product_seller_name: string;
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

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem('admin_token')) {
      router.replace('/admin/login');
      return;
    }
    loadReports();
  }, [router]);

  const loadReports = async () => {
    try {
      const res = await adminFetch<{ reports: AdminReport[] }>('/api/v1/admin/reports');
      setReports(res.reports || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const markSeen = async (reportId: string) => {
    setActionId(reportId);
    setError(null);
    try {
      await adminFetch(`/api/v1/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'resolved' }),
      });
      setSelected(null);
      await loadReports();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update report');
    } finally {
      setActionId(null);
    }
  };

  const blockSeller = async (userId: string) => {
    setActionId(userId);
    setError(null);
    try {
      await adminFetch(`/api/v1/admin/users/${userId}/block`, { method: 'PATCH' });
      setSelected(null);
      await loadReports();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to block user');
    } finally {
      setActionId(null);
    }
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

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">{error}</p>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 font-semibold text-text-muted">Reporter</th>
              <th className="text-left p-4 font-semibold text-text-muted">Product</th>
              <th className="text-left p-4 font-semibold text-text-muted">Seller</th>
              <th className="text-left p-4 font-semibold text-text-muted">Reason</th>
              <th className="text-left p-4 font-semibold text-text-muted">Details</th>
              <th className="text-left p-4 font-semibold text-text-muted">Status</th>
              <th className="text-left p-4 font-semibold text-text-muted">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelected(r)}
              >
                <td className="p-4 font-medium text-brand-neutral">{r.reporter_name}</td>
                <td className="p-4 text-text-muted">{r.product_title}</td>
                <td className="p-4 text-text-muted">{r.product_seller_name}</td>
                <td className="p-4 text-text-muted">{REASON_LABELS[r.reason] || r.reason}</td>
                <td className="p-4 text-text-muted max-w-xs whitespace-pre-wrap break-words">
                  {r.details?.trim() ? r.details : <span className="text-gray-300">—</span>}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-brand-neutral">Report details</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-text-muted hover:text-brand-neutral text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-text-muted">Reported by</span>
                <span className="font-medium text-brand-neutral">{selected.reporter_name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-text-muted">Reported seller</span>
                <span className="font-medium text-brand-neutral">{selected.product_seller_name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-text-muted">Product</span>
                <span className="font-medium text-brand-neutral">{selected.product_title}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-text-muted">Reason</span>
                <span className="font-medium text-brand-neutral">{REASON_LABELS[selected.reason] || selected.reason}</span>
              </div>
              <div className="border-b border-gray-100 pb-2">
                <span className="text-text-muted block mb-1">Details</span>
                <p className="text-brand-neutral whitespace-pre-wrap break-words">
                  {selected.details?.trim() || <span className="text-gray-300">No additional details</span>}
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[selected.status] || 'bg-gray-100 text-gray-600'}`}>
                  {selected.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              {selected.status !== 'resolved' && (
                <Button
                  size="sm"
                  variant="primary"
                  disabled={actionId === selected.id}
                  onClick={() => markSeen(selected.id)}
                >
                  Seen
                </Button>
              )}
              <Button
                size="sm"
                variant="outlined"
                disabled={actionId === selected.seller_id}
                onClick={() => blockSeller(selected.seller_id)}
                className="!text-red-600 !border-red-200 hover:!bg-red-50"
              >
                Block seller
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
