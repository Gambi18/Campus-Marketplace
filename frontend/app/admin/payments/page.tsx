'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminApi';

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
  const [payments, setPayments] = useState<HeldPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch<{ payments: HeldPayment[] }>('/api/v1/admin/payments/held');
        setPayments(res.payments || []);
      } catch (e) {
        // Surface the failure instead of masquerading as an empty escrow.
        setError(e instanceof Error ? e.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      held: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      released: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`;
  };

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
                  <td className="p-4"><span className={statusBadge(p.status)}>{p.status}</span></td>
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
