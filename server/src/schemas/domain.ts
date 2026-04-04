import { z } from 'zod';

export const expenseInputSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  source: z.enum(['credit', 'debit', 'upi', 'cash']),
  date: z.string().min(1),
  note: z.string().max(120).optional(),
  merchant: z.string().max(80).optional(),
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

export const chatRequestSchema = z.object({
  message: z.string().min(1),
});
