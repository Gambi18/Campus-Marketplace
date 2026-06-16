export interface InitiatePaymentRequest {
  product_id: string;
  phone_number: string;
}

export interface Payment {
  id: string;
  buyer_id: string;
  buyer_name?: string;
  seller_id: string;
  seller_name?: string;
  product_id: string;
  product_title?: string;
  amount: string;
  platform_fee: string;
  net_amount: string;
  phone_number: string;
  operator: string;
  reference: string;
  withdraw_reference: string;
  status: 'pending' | 'held' | 'released' | 'refunded';
  receipt_number: string;
  receipt_pdf_url: string;
  created_at: string;
}

export interface InitiatePaymentResponse {
  message: string;
  reference: string;
  payment: Payment;
}

export interface PaymentStatusResponse {
  payment_id: string;
  reference: string;
  status: string;
  amount: string;
  operator: string;
}

export interface ConfirmDeliveryResponse {
  message: string;
  receipt_number: string;
  receipt_url: string;
  payment: Payment;
}

export interface PaymentListResponse {
  purchases: Payment[];
  count: number;
}

export interface SalesListResponse {
  sales: Payment[];
  count: number;
}
