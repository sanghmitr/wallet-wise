import { api } from '@/services/api';
import type { Budget, BudgetInput } from '@/types/domain';

export async function getBudgets(month?: string) {
  const { data } = await api.get<Budget[]>('/budgets', {
    params: month ? { month } : undefined,
  });
  return data;
}

export async function upsertBudget(payload: BudgetInput) {
  const { data } = await api.post<Budget>('/budgets', payload);
  return data;
}
