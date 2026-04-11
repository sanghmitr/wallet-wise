import { api, unwrapListResponse } from '@/services/api';
import type { Expense, ExpenseFilters, ExpenseInput } from '@/types/domain';

export async function getExpenses(filters?: ExpenseFilters) {
  const { data } = await api.get<Expense[] | { expenses?: Expense[] }>('/expenses', {
    params: filters,
  });

  return unwrapListResponse<Expense>(data, ['expenses']);
}

export async function createExpense(payload: ExpenseInput) {
  const { data } = await api.post<Expense>('/expenses', payload);
  return data;
}

export async function updateExpense(id: string, payload: ExpenseInput) {
  const { data } = await api.put<Expense>(`/expenses/${id}`, payload);
  return data;
}

export async function removeExpense(id: string) {
  await api.delete(`/expenses/${id}`);
}
