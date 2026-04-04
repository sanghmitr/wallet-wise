import { api } from '@/services/api';
import type { UserSettings, UserSettingsInput } from '@/types/domain';

export async function getSettings() {
  const { data } = await api.get<UserSettings>('/settings');
  return data;
}

export async function updateSettings(payload: UserSettingsInput) {
  const { data } = await api.put<UserSettings>('/settings', payload);
  return data;
}
