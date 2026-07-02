'use client';

import { adminFetch } from '../../utils/adminApi';
import StatusBadge from '../../components/StatusBadge';
import { useApiResource } from '../../../customHooks/useApiResource';

interface HeldPayment {
  id: string;
  buyer_name: string;
  seller_name: string;
  product_title: string;
  amount: string;
  status: string;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const { data, loading, error } = useApiResource(
    () => adminFetch<{ payments: HeldPayment[] }>('/api/v1/admin/payments/held?limit=100&offset=0'),
    [],
  );
  const payments = data?.payments ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-neutral">Held Payments (Escrow)</h2>
        <p className="text-sm text-text-muted mt-1">
          Funds currently held in escrow across the platform, awaiting buyer confirmation.
        </p>
      </div>

      {loading ? (
        <p className="text-text-muted">Loading...</p>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-muted">No payments in escrow.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-text-muted">Product</th>
                <th className="text-left p-4 font-semibold text-text-muted">Buyer</th>
                <th className="text-left p-4 font-semibold text-text-muted">Seller</th>
                <th className="text-left p-4 font-semibold text-text-muted">Amount</th>
                <th className="text-left p-4 font-semibold text-text-muted">Status</th>
                <th className="text-left p-4 font-semibold text-text-muted">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-brand-neutral">{p.product_title}</td>
                  <td className="p-4 text-text-muted">{p.buyer_name}</td>
                  <td className="p-4 text-text-muted">{p.seller_name}</td>
                  <td className="p-4 text-text-muted">{p.amount} XAF</td>
                  <td className="p-4"><StatusBadge status={p.status} /></td>
                  <td className="p-4 text-text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
