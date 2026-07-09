import { type ProductCard } from "@/types";

export const Products: ProductCard[] = [
  {
    id: "default-1",
    title: "Premium Ergonomic Office Chair",
    description: "High-quality mesh office chair with adjustable lumbar support and 3D armrests. Perfect for long study sessions in the dorm. Only used for one semester.",
    price: "20000",
    seller_id: "seller-student-456",
    category_id: 4,
    category_name: "Furniture & Home",
    condition: "like_new",
    status: "available",
    image_url_1: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=600&auto=format&fit=crop&q=60",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "default-2",
    title: "M1 MacBook Air (2020) - 8GB RAM / 256GB SSD",
    description: "Great condition laptop, battery health is at 88%. Perfect for lectures, note-taking, and coding assignments. Comes with original brick and USB-C cable.",
    price: "450000",
    seller_id: "seller-student-112",
    category_id: 1,
    category_name: "Electronics",
    condition: "good",
    status: "available",
    image_url_1: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=60",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "default-3",
    title: "Calculus: Early Transcendentals (8th Edition)",
    description: "Hardcover textbook used for MAT101/102. No highlighting inside, minimal edge wear. I can drop it off directly at the main library campus.",
    price: "15000",
    seller_id: "seller-student-789",
    category_id: 3,
    category_name: "Academic Materials",
    condition: "good",
    status: "available",
    image_url_1: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=60",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: "default-4",
    title: "Instant Pot Duo 7-in-1 Cooker",
    description: "Life saver for cooking fast meals in the dorm room. 6-Quart capacity. Cleaned thoroughly, works perfectly, includes the steam rack accessory.",
    price: "35000",
    seller_id: "seller-student-204",
    category_id: 4,
    category_name: "Furniture & Home",
    condition: "like_new",
    status: "available",
    image_url_1: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=60",
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString()
  },
  {
    id: "default-5",
    title: "Anker Soundcore Life Q20 Bluetooth Headphones",
    description: "Active Noise Cancelling headphones. Kept me sane while studying in noisy campus coffee shops. Battery life still lasts for days.",
    price: "25000",
    seller_id: "seller-student-456",
    category_id: 1,
    category_name: "Electronics",
    condition: "fair",
    status: "available",
    image_url_1: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60",
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString()
  },
  {
    id: "default-6",
    title: "Single Speed Commuter Campus Bicycle",
    description: "Lightweight fixie/single speed bike. Perfect size for someone 5'7\" to 6'0\". Brake pads were just replaced last month. Will throw in the U-lock for free.",
    price: "65000",
    seller_id: "seller-student-991",
    category_id: 5,
    category_name: "Sports & Fitness",
    condition: "fair",
    status: "available",
    image_url_1: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=60",
    created_at: new Date(Date.now() - 518400000).toISOString(),
    updated_at: new Date(Date.now() - 518400000).toISOString()
  }
];
