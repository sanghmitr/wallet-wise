import { z } from 'zod';

export const expenseInputSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  paymentMethodId: z.string().min(1),
  paymentMethodName: z.string().min(1),
  source: z.enum(['credit_card', 'debit_card', 'upi', 'cash']),
  date: z.string().min(1),
  note: z.string().max(120).optional(),
  merchant: z.string().max(80).optional(),
});

export const paymentMethodInputSchema = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(['credit_card', 'debit_card', 'upi', 'cash']),
});

export const categoryInputSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
});

export const budgetInputSchema = z.object({
  category: z.string().min(1),
  limit: z.number().min(0),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const userSettingsInputSchema = z.object({
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED']),
  theme: z.enum(['light', 'dark', 'system']),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1),
});
