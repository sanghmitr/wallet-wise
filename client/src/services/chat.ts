import { api } from '@/services/api';
import type { ChatResponsePayload } from '@/types/domain';

export async function sendChatMessage(message: string) {
  const { data } = await api.post<ChatResponsePayload>('/chat', { message });
  return data;
}
