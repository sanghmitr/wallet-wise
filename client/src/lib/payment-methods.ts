import type { PaymentSource } from '@/types/domain';

export const paymentMethodOptions: Array<{
  value: PaymentSource;
  label: string;
  icon: string;
  hint: string;
}> = [
  {
    value: 'credit_card',
    label: 'Credit Card',
    icon: 'credit_card',
    hint: 'Card nickname with billing cycle',
  },
  {
    value: 'debit_card',
    label: 'Debit Card',
    icon: 'payments',
    hint: 'Bank card nickname',
  },
  {
    value: 'upi',
    label: 'UPI ID',
    icon: 'qr_code_2',
    hint: 'UPI handle or label',
  },
  {
    value: 'cash',
    label: 'Cash',
    icon: 'wallet',
    hint: 'Wallet or cash bucket',
  },
];

export const paymentMethodIcons: Record<PaymentSource, string> = {
  credit_card: 'credit_card',
  debit_card: 'payments',
  upi: 'qr_code_2',
  cash: 'wallet',
};

export function getPaymentMethodMeta(type: PaymentSource) {
  return paymentMethodOptions.find((option) => option.value === type) ?? paymentMethodOptions[0];
}

export function getPaymentMethodTypeLabel(type: PaymentSource) {
  return getPaymentMethodMeta(type).label;
}
