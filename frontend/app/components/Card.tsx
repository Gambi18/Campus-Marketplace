
import { ProductCard } from '@/types';
import Link from 'next/link';



export const Product: ProductCard = {
  id: "default-1",
  title: "Premium Ergonomic Office Chair",
  description: "High-quality mesh office chair with adjustable lumbar support and 3D armrests. Perfect for long study sessions in the dorm. Only used for one semester.",
  price: 20000,
  seller_id: "seller-student-456",
  category: "Furniture",
  condition: "Like New",
  images: ["https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=60"],
  created_at: 1716912476000,
  updated_at: 1716912476000
};

interface ItemCardProps {
  item?: Partial<ProductCard>;
}

export default function ItemCard({ item }: ItemCardProps) {
  const title = item?.title ?? Product.title;
  const price = item?.price ?? Product.price;
  const category = item?.category ?? Product.category;
  const condition = item?.condition ?? Product.condition;
  const id = item?.id ?? Product.id;
  const createdAt = item?.created_at ?? Product.created_at;

  const displayImage = item?.images && item.images.length > 0
    ? item.images[0]
    : Product.images?.[0];

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'XAF',
  }).format(price);

  const formattedDate = new Date(createdAt ?? Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Link
      href={`/details/${id}`}
      className="group block bg-white rounded-lg border border-gray-100 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 relative bg-clip-border max-w-[280px] w-full"
    >
      <div className="w-full aspect-square bg-gray-50 relative overflow-hidden">

        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />

        <span className="absolute top-2.5 left-2.5 px-1.5 py-0.5 bg-white/95 backdrop-blur-xs text-[9px] font-bold text-gray-700 rounded-md shadow-xs uppercase tracking-wider">
          {condition}
        </span>
      </div>

      <div className="p-3 flex flex-col space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary bg-blue-50/60 px-1.5 py-0.5 rounded-sm self-start">
          {category}
        </span>

        <h3 className="text-xs font-semibold text-brand-neutral line-clamp-2 group-hover:text-brand-primary transition-colors min-h-[32px] leading-snug">
          {title}
        </h3>

        <p className="text-sm font-bold text-brand-primary">
          {formattedPrice}
        </p>

        <div className="flex flex-col space-y-0.5 pt-1.5 border-t border-gray-50 text-[10px] text-text-muted font-medium">
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3 h-3 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="truncate">Campus Area</span>
          </div>

          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3 h-3 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}