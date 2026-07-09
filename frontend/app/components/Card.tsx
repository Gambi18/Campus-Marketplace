import { ProductCard } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { formatPrice } from '../utils/format';

export const Product: ProductCard = {
  id: "default-1",
  title: "Premium Ergonomic Office Chair",
  description: "High-quality mesh office chair with adjustable lumbar support and 3D armrests. Perfect for long study sessions in the dorm. Only used for one semester.",
  price: "20000",
  seller_id: "seller-student-456",
  category_name: "Furniture",
  category_id: 1,
  condition: "Like New",
  status: "available",
  image_url_1: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=60",
  created_at: new Date(Date.now() - 86400000).toISOString(),
  updated_at: new Date(Date.now() - 86400000).toISOString()
};

interface ItemCardProps {
  item?: Partial<ProductCard>;
}

const CONDITION_LABELS: Record<string, string> = {
  'brand_new': 'Brand New',
  'like_new': 'Like New',
  'good': 'Good',
  'fair': 'Fair',
};

export default function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();
  const title = item?.title ?? Product.title;
  const price = item?.price ?? Product.price;
  const category = item?.category_name ?? Product.category_name;
  const condition = item?.condition ?? Product.condition;
  const id = item?.id ?? Product.id;
  const status = item?.status ?? Product.status;
  const createdAt = item?.created_at ?? Product.created_at;
  const [toast, setToast] = useState<string | null>(null);

  const handleCardClick = useCallback(() => {
    router.push(`/details/${id}`);
  }, [router, id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const displayImage = item?.image_url_1 && item.image_url_1.length > 0
    ? item.image_url_1
    : Product.image_url_1;

  const displayCondition = condition ? CONDITION_LABELS[condition.toLowerCase()] || condition : 'Good';

  const formattedDate = new Date(createdAt ?? Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
      role="link"
      tabIndex={0}
      className="group block bg-white rounded-lg border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 relative bg-clip-border w-full cursor-pointer"
    >
      <div className="w-full aspect-square bg-gray-50 relative overflow-hidden">

        <Image
          src={displayImage}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
          className="object-cover group-hover:scale-102 transition-transform duration-300"
        />

        <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 bg-white/95 backdrop-blur-xs text-[9px] font-bold text-gray-700 rounded-md shadow-xs uppercase tracking-wider">
          {displayCondition}
        </span>

        {status === 'available' && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/details/${id}`)
                .then(() => setToast('Link copied!'))
                .catch(() => setToast('Failed to copy'));
            }}
            className="absolute top-2.5 right-2.5 z-10 p-2.5 bg-white/95 backdrop-blur-xs rounded-full shadow-xs hover:bg-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Copy link"
            aria-label="Copy link"
          >
            <LinkIcon className="w-3.5 h-3.5 text-gray-600" />
          </button>
        )}

        {toast && (
          <div role="status" aria-live="polite" className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 bg-gray-900/85 text-white text-[10px] font-medium rounded-full whitespace-nowrap transition-opacity duration-200">
            {toast}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-blue-50/60 px-1.5 py-0.5 rounded-sm self-start">
          {category}
        </span>

        <h3 className="text-xs font-semibold text-brand-neutral line-clamp-2 group-hover:text-brand-primary transition-colors min-h-[32px] leading-snug">
          {title}
        </h3>

        <p className="text-sm font-bold text-brand-primary">
          {formatPrice(price)}
        </p>

        <div className="flex flex-col space-y-0.5 pt-1.5 border-t border-gray-50 text-[10px] text-text-muted font-medium">
          <div className="flex items-center space-x-1">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3 h-3 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="truncate">Campus Area</span>
          </div>

          <div className="flex items-center space-x-1">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3 h-3 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
