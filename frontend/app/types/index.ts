// Type definitions for the application

export type ProductCondition = 'Brand New' | 'Like New' | 'Good' | 'Fair';

export interface Product {
  id: string;
  seller_id: string;
  seller_name?: string;
  category_id: number;
  category_name?: string;
  title: string;
  description: string;
  price: string;
  image_url: string;
  status: 'available' | 'sold' | 'removed';
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface ListingFormData {
  photos: (string | null)[];
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  condition: ProductCondition;
  price: string;
  location: string;
}

export const DEFAULT_LISTING_FORM: ListingFormData = {
  photos: [null, null, null, null],
  title: '',
  description: '',
  categoryId: '',
  categoryName: '',
  condition: 'Like New',
  price: '',
  location: 'Main Campus',
};

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
