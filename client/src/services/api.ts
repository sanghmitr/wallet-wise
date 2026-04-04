import axios from 'axios';
import { env } from '@/config/env';
import {
  getAuthenticatedIdToken,
  getAuthenticatedUserId,
} from '@/lib/firebase-auth';

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const userId = await getAuthenticatedUserId();
  const idToken = await getAuthenticatedIdToken();

  config.headers.set('x-user-id', userId);
  if (idToken) {
    config.headers.set('Authorization', `Bearer ${idToken}`);
  }

  return config;
});

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Network request failed'
    );
  }

  return error instanceof Error ? error.message : 'Unexpected error';
}
