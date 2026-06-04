'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { formatPrice, formatTimeAgo } from '../../utils/format';
import { API_URL } from '../../utils/api';
import type { Product, ProductCondition } from '../../types';

interface ProductDetail extends Product {
  condition: ProductCondition | string;
  location: string;
  seller_rating: number;
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
  image_url:
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  status: 'available',
  created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  condition: 'Good',
  location: 'Library',
  seller_rating: 4.9,
};

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<ProductDetail>(MOCK_PRODUCT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id === 'demo') {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/v1/products/${id}`);
        if (res.ok) {
          const data: Product = await res.json();
          setProduct((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch {
        // keep mock on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const price = parseFloat(product.price);
  const deposit = price / 2;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar showBuyerSwitch />

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
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white aspect-square max-h-[520px]">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
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
                  {formatTimeAgo(product.created_at)}
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
                Seller Information
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
                  {product.seller_name?.charAt(0) ?? 'S'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-brand-neutral">{product.seller_name}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary bg-blue-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mt-0.5">
                    <span className="text-amber-500">★</span> {product.seller_rating} rating
                  </p>
                </div>
              </div>
              <Button variant="outlined" fullWidth className="mt-4">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Seller
              </Button>
            </div>

            <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-5 flex gap-3">
              <ShieldCheck className="w-6 h-6 text-brand-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-brand-neutral">Safe Transaction</h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  Pay 50% deposit to reserve. Meet on campus for verification via QR code scan.
                  Complete payment after verification.
                </p>
              </div>
            </div>

            <Button variant="form" size="lg">
              Reserve & Pay Deposit ({formatPrice(deposit)})
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
