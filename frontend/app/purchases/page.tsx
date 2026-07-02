'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';
import { MessageCircle } from 'lucide-react';
import { getMyPurchases, confirmDelivery, rejectDelivery, getReceipt } from '../utils/paymentApi';
import { useApiResource } from '../../customHooks/useApiResource';

export default function PurchasesPage() {
  const router = useRouter();
  const { data, loading, refetch } = useApiResource(() => getMyPurchases(), []);
  const purchases = data?.purchases ?? [];
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const handleConfirm = async (id: string) => {
    try {
      await confirmDelivery(id);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm delivery');
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectTarget(id);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectReason.trim() || rejecting) return;
    setRejecting(true);
    try {
      await rejectDelivery(rejectTarget, rejectReason.trim());
      setShowRejectModal(false);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject delivery');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-page">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-brand-neutral mb-6">My Purchases</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent"></div>
          </div>
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
                    {p.status === 'refunded' && p.rejection_reason && (
                      <p className="text-xs text-red-600 mt-2">
                        Reason: {p.rejection_reason}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {p.status === 'held' && (
                    <>
                      <Button variant="outlined" size="md" onClick={() => router.push(`/conversations/${p.product_id}?user=${p.seller_id}&name=${encodeURIComponent(p.seller_name || '')}&paymentId=${p.id}`)}>
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                      <Button variant="primary" size="md" onClick={() => handleConfirm(p.id)}>
                        Confirm Received
                      </Button>
                      <Button variant="outlined" size="md" onClick={() => handleRejectClick(p.id)}>
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

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-brand-neutral mb-2">Cancel & Refund</h3>
            <p className="text-sm text-text-muted mb-4">
              A 1% platform fee applies on refunds. Please tell us why you&apos;re cancelling:
            </p>
            <Input
              label="Reason for cancellation"
              name="reason"
              placeholder="e.g. Seller didn't respond, item not as described..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <Button variant="outlined" onClick={() => setShowRejectModal(false)} fullWidth disabled={rejecting}>
                Go Back
              </Button>
              <Button variant="primary" onClick={handleConfirmReject} fullWidth disabled={rejecting || !rejectReason.trim()}>
                {rejecting ? 'Processing…' : 'Confirm Refund'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
