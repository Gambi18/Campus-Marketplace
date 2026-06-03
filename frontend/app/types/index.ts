// Type definitions for the application

export interface ProductCard {
  id: string;
  title: string;
  description: string;
  price: number;
  seller_id: string;
  category: string;
  condition: 'New' | 'Like New' | 'Excellent' | 'Good' | 'Refurbished' | 'Fair';
  images: string[];
  created_at: number;
  updated_at: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  created_at: number;
  updated_at: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
