'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import { getMyPurchases, confirmDelivery, rejectDelivery, getReceipt } from '../../utils/paymentApi';
import type { Payment } from '../../types/payment';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await getMyPurchases();
      setPurchases(res.purchases);
    } catch {
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async (id: string) => {
    try {
      await confirmDelivery(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm delivery');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Cancelling incurs a 1% fee. The remaining amount will be refunded. Continue?')) return;
    try {
      await rejectDelivery(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject delivery');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      held: 'bg-blue-100 text-blue-800',
      released: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return `px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-brand-neutral mb-6">My Purchases</h1>
        {loading ? (
          <p className="text-text-muted">Loading…</p>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted mb-4">No purchases yet.</p>
            <Link href="/">
              <Button variant="primary">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-brand-neutral">{p.product_title}</h3>
                    <p className="text-sm text-text-muted mt-1">
                      Seller: {p.seller_name} &middot; {p.amount} XAF
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={statusBadge(p.status)}>{p.status}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  {p.status === 'held' && (
                    <>
                      <Button variant="primary" size="md" onClick={() => handleConfirm(p.id)}>
                        Confirm Received
                      </Button>
                      <Button variant="outlined" size="md" onClick={() => handleReject(p.id)}>
                        Cancel & Refund
                      </Button>
                    </>
                  )}
                  {(p.status === 'released' || p.status === 'refunded') && (
                    <Button
                      variant="outlined"
                      size="md"
                      onClick={async () => {
                        try {
                          const receipt = await getReceipt(p.id);
                          if (receipt.receipt_pdf_url) window.open(receipt.receipt_pdf_url, '_blank');
                        } catch { /* ignore */ }
                      }}
                    >
                      View Receipt
                    </Button>
                  )}
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
