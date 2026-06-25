'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Clock, MapPin, MessageCircle, ShieldCheck, Smartphone } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import { formatPrice, formatTimeAgo } from '../../utils/format';
import { API_URL, postAPI } from '../../utils/api';
import { initiatePayment, checkPaymentStatus } from '../../utils/paymentApi';
import type { ProductCard } from '../../types';
import { useRouter } from 'next/navigation';

interface ProductDetail extends ProductCard {
  location: string;
}

const MOCK_PRODUCT: ProductDetail = {
  id: 'demo',
  seller_id: 'seller-1',
  seller_name: 'Ahmad Ibrahim',
  category_id: 3,
  category_name: 'Books',
  title: 'Engineering Textbooks Bundle (5 books)',
  description:
    'Complete set of 5 engineering textbooks for first and second year. All in good condition with minimal highlighting. Includes: Engineering Mathematics, Physics for Engineers, Materials Science, Circuit Analysis, and Thermodynamics. Perfect for students starting their engineering program.',
  price: '80000',
  image_url_1: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  status: 'available',
  created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  condition: 'Good',
  location: 'Library',
};

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductDetail>(MOCK_PRODUCT);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [isDev, setIsDev] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [hasPaid, setHasPaid] = useState(false);
  const [, setCheckingPayment] = useState(true);

  const router = useRouter();

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  const images = [product.image_url_1, product.image_url_2, product.image_url_3, product.image_url_4].filter((u): u is string => !!u);

  useEffect(() => {
    async function load() {
      if (id === 'demo') {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/v1/products/${id}`);
        if (res.ok) {
          const data: ProductCard = await res.json();
          if (data.status !== 'available') {
            router.push('/?sold=' + encodeURIComponent(data.title));
            return;
          }
          setProduct((prev) => ({
            ...prev,
            ...data,
          }));
          setSelectedImageIndex(0);
        }
      } catch {
        // keep mock on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Check if user already has an active payment for this product
  useEffect(() => {
    if (!id || id === 'demo' || !product.seller_id) return;
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/v1/conversations/${id}/${product.seller_id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!cancelled) setHasPaid(res.ok);
      } catch {
        if (!cancelled) setHasPaid(false);
      } finally {
        if (!cancelled) setCheckingPayment(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, product.seller_id]);

  useEffect(() => {
    if (!paymentRef || paymentStatus === 'SUCCESSFUL') return;
    const interval = setInterval(async () => {
      try {
        const res = await checkPaymentStatus(paymentRef);
        setPaymentStatus(res.status);
        if (res.status === 'SUCCESSFUL') {
          clearInterval(interval);
          setTimeout(() => router.push(`/conversations/${id}?user=${product.seller_id}`), 1500);
        }
      } catch {
        // retry
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentRef, paymentStatus, router]);

  const price = parseFloat(product.price) || 0;
  const commission = Math.round(price * 0.03);

  const handlePayToChat = async () => {
    if (!phoneNumber.trim() || paying) return;
    setPaying(true);
    setPaymentError(null);
    try {
      const fullNumber = phoneNumber.startsWith('237') ? phoneNumber : '237' + phoneNumber;
      const res = await initiatePayment({
        product_id: id,
        phone_number: fullNumber,
      });
      setPaymentRef(res.reference);
      setPaymentStatus('pending');
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-brand-primary mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Browse
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white aspect-square max-h-[520px] relative group">
              {images.length > 0 ? (
                <>
                  <Image
                    src={images[selectedImageIndex]}
                    alt={product.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-cover"
                    priority
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === 0 ? images.length - 1 : prev - 1,
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Previous image"
                        title="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === images.length - 1 ? 0 : prev + 1,
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Next image"
                        title="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-text-muted text-sm">
                  No image
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url, index) => (
                  <Button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${index === selectedImageIndex
                        ? 'border-brand-primary ring-1 ring-brand-primary'
                        : 'border-gray-200 hover:border-gray-400'
                      }`}
                  >
                    <Image
                      src={url}
                      alt={`${product.title} ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm relative">
              <div className="absolute top-6 right-6">
                <Badge>{product.condition}</Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-neutral pr-24">
                {product.title}
              </h1>
              <p className="text-3xl font-bold text-brand-primary mt-3">
                {formatPrice(product.price)}
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {product.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatTimeAgo(product.created_at || Date.now())}
                </span>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h2 className="text-sm font-semibold text-brand-neutral mb-2">Description</h2>
                <p className="text-sm text-text-muted leading-relaxed">{product.description}</p>
              </div>
              <span className="inline-block mt-4 px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                {product.category_name}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-4">
                Listed by
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
                  {product.seller_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-brand-neutral">{product.seller_name}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary bg-blue-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mt-0.5">Campus student</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  if (hasPaid) {
                    router.push(`/conversations/${id}?user=${product.seller_id}&name=${encodeURIComponent(product.seller_name || '')}`);
                  } else {
                    setShowPaymentModal(true);
                  }
                }}
                variant="outlined"
                fullWidth
                className="mt-4"
              >
                {hasPaid ? <MessageCircle className="w-4 h-4 mr-2" /> : <Smartphone className="w-4 h-4 mr-2" />}
                {hasPaid ? 'Chat with Seller' : `Pay to Chat (${formatPrice(price)})`}
              </Button>
            </div>

            {!isDev && (
              <div className="rounded-xl bg-amber-50/80 border border-amber-100 p-5 flex gap-3">
                <ShieldCheck className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-brand-neutral">Pay before you chat</h3>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">
                    You must pay before you can message the seller. A 3% platform fee applies on completion.
                    If you cancel, a 1% fee applies on the refund.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {isDev && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={async () => {
              try {
                // Create the escrow payment the pay-to-chat gate checks for.
                // With DEV_BYPASS_PAYMENT=true the backend auto-confirms it to
                // "held", so messaging unlocks and it shows in the admin escrow
                // page. The dummy MTN number satisfies operator detection.
                await postAPI('/api/v1/payments/initiate', {
                  product_id: id,
                  phone_number: '237670000000',
                });
                setHasPaid(true);
              } catch {
                // payment may already exist (product in escrow), navigate anyway
              }
              router.push(`/conversations/${id}?user=${product.seller_id}&name=${encodeURIComponent(product.seller_name || '')}`);
            }}
            className="bg-yellow-400 text-black text-xs font-bold px-3 py-2 rounded-lg shadow-lg hover:bg-yellow-300"
          >
            Bypass Payment (Dev)
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            {!paymentRef ? (
              <>
                <h3 className="text-lg font-bold text-brand-neutral mb-2">Pay to Chat</h3>
                <p className="text-sm text-text-muted mb-4">
                  Enter your MTN or Orange Money number to pay {formatPrice(price)}.
                  You will receive a USSD prompt on your phone to confirm.
                </p>

                <Input
                  label="Mobile Money Number"
                  name="phone"
                  placeholder="XXXXXXXXX (9-digit number)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />

                <p className="text-xs text-text-muted mt-2 mb-4">
                  A 3% commission ({formatPrice(commission)}) is deducted on completion.
                  You will receive a prompt on your phone to confirm payment.
                </p>

                {paymentError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">
                    {paymentError}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button variant="outlined" onClick={() => setShowPaymentModal(false)} fullWidth>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handlePayToChat} disabled={paying} fullWidth>
                    {paying ? 'Processing…' : `Pay ${formatPrice(price)}`}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-brand-primary" />
                </div>
                <h3 className="text-lg font-bold text-brand-neutral mb-2">Check your phone</h3>
                <p className="text-sm text-text-muted mb-2">
                  You will receive a USSD prompt on <strong>{phoneNumber}</strong>.
                  Confirm the payment to unlock the chat.
                </p>
                {paymentStatus === 'pending' && (
                  <p className="text-xs text-amber-600">Waiting for confirmation…</p>
                )}
                {paymentStatus === 'SUCCESSFUL' && (
                  <p className="text-sm text-green-600 font-semibold">Payment confirmed! Redirecting to chat…</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
