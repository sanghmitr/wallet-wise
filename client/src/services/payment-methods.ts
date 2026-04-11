import { api, unwrapListResponse } from '@/services/api';
import type { PaymentMethod, PaymentMethodInput } from '@/types/domain';

export async function getPaymentMethods() {
  const { data } = await api.get<PaymentMethod[] | { paymentMethods?: PaymentMethod[] }>('/payment-methods');
  return unwrapListResponse<PaymentMethod>(data, ['paymentMethods']);
}

export async function createPaymentMethod(payload: PaymentMethodInput) {
  const { data } = await api.post<PaymentMethod>('/payment-methods', payload);
  return data;
}

export async function updatePaymentMethod(id: string, payload: PaymentMethodInput) {
  const { data } = await api.put<PaymentMethod>(`/payment-methods/${id}`, payload);
  return data;
}

export async function removePaymentMethod(id: string) {
  await api.delete(`/payment-methods/${id}`);
}
