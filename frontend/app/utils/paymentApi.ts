import { postAPI, fetchAPI } from './api';
import type {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentStatusResponse,
  ConfirmDeliveryResponse,
  PaymentListResponse,
  SalesListResponse,
  Payment,
} from '../types/payment';

export async function initiatePayment(data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
  return postAPI<InitiatePaymentResponse>('/api/v1/payments/initiate', data);
}

export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  return fetchAPI<PaymentStatusResponse>(`/api/v1/payments/${paymentId}/status`);
}

export async function confirmDelivery(paymentId: string): Promise<ConfirmDeliveryResponse> {
  return postAPI<ConfirmDeliveryResponse>(`/api/v1/payments/${paymentId}/confirm`);
}

export async function rejectDelivery(paymentId: string): Promise<ConfirmDeliveryResponse> {
  return postAPI<ConfirmDeliveryResponse>(`/api/v1/payments/${paymentId}/reject`);
}

export async function getMyPurchases(): Promise<PaymentListResponse> {
  return fetchAPI<PaymentListResponse>('/api/v1/my-purchases');
}

export async function getMySales(): Promise<SalesListResponse> {
  return fetchAPI<SalesListResponse>('/api/v1/my-sales');
}

export async function getReceipt(paymentId: string): Promise<{ receipt_number: string; receipt_pdf_url: string; status: string }> {
  return fetchAPI<{ receipt_number: string; receipt_pdf_url: string; status: string }>(`/api/v1/payments/${paymentId}/receipt`);
}
