'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getMySales } from '../utils/paymentApi';
import type { Payment } from '../types/payment';

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const res = await getMySales();
        setSales(res.sales);
      } catch {
        setSales([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        <h1 className="text-2xl font-bold text-brand-neutral mb-6">My Sales</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">No sales yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-brand-neutral">{s.product_title}</h3>
                    <p className="text-sm text-text-muted mt-1">
                      Buyer: {s.buyer_name} &middot; {s.amount} XAF
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Fee: {s.platform_fee} XAF &middot; Net: {s.net_amount} XAF
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={statusBadge(s.status)}>{s.status}</span>
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
