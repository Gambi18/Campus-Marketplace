// Type definitions for the application

export type ProductCondition = 'Brand New' | 'Like New' | 'Good' | 'Fair';

/** Browse-grid card shape (may differ from API `Product`). */
export interface ProductCard {
  id: string;
  title: string;
  description?: string;
  price: string;
  seller_id?: string;
  seller_name?: string;
   category_id?: number;
   category_name?: string;
  condition?: ProductCondition | string;
  status: 'available' | 'sold' | 'removed' | 'in_escrow';
  image_url_1: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  created_at?: string;
  updated_at?: string;
}

// export interface Product {
//   id: string;
//   /** API field: user who posted the listing (display as "Listed by", not "seller"). */
//   seller_id: string;
//   seller_name?: string;
//   category_id: number;
//   category_name?: string;
//   title: string;
//   description: string;
//   price: string;
//   image_url: string;
//   status: 'available' | 'sold' | 'removed' ;
//   created_at: string;
// }

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

//
export interface Message {
  id: string | number;
  text: string;
  sender: 'self' | 'other';
  time: string;
}

export interface ProductItem {
  title: string;
  price: string;
}

export interface Conversation {
  id: string;
  userName: string;
  itemTitle: string;
  lastMessage: string;
  timestamp: string;
}

export interface ChatThread {
  userName: string;
  sellerId?: string;
  buyerId?: string;
  productId?: string;
  item: ProductItem;
  messages: Message[];
}

export interface ReportPayload {
  conversationId: string;
  sellerId: string;
  buyerId: string;
  productId: string;
  productName: string;
  reason: 'prohibited' | 'scam' | 'behavior' | 'misleading' | 'other' | string;
  details: string;
}
//
export interface ConversationItem {
  id: string | number;
  userName: string;
  avatarUrl?: string;
  itemTitle: string;
  lastMessage: string;
  timestamp: string;
  unread?: boolean;
}

export interface BackendConversation {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  /** Conversation partner relative to the requesting user, computed by the API. */
  other_user_id: string;
  product_id: string;
  product_title: string;
  product_image: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface BackendMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  product_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}