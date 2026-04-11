import { api, unwrapListResponse } from '@/services/api';
import type { Category, CategoryInput } from '@/types/domain';

export async function getCategories() {
  const { data } = await api.get<Category[] | { categories?: Category[] }>('/categories');
  return unwrapListResponse<Category>(data, ['categories']);
}

export async function createCategory(payload: CategoryInput) {
  const { data } = await api.post<Category>('/categories', payload);
  return data;
}

export async function updateCategory(id: string, payload: CategoryInput) {
  const { data } = await api.put<Category>(`/categories/${id}`, payload);
  return data;
}

export async function removeCategory(id: string) {
  await api.delete(`/categories/${id}`);
}
