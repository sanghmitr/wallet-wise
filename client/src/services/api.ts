import axios from 'axios';
import { env } from '@/config/env';
import {
  getAuthenticatedIdToken,
  getAuthenticatedUserId,
} from '@/lib/firebase-auth';

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (config.method?.toLowerCase() === 'get') {
    const currentParams =
      config.params && typeof config.params === 'object'
        ? Object.entries(config.params as Record<string, unknown>).reduce<
            Record<string, unknown>
          >((accumulator, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              accumulator[key] = value;
            }

            return accumulator;
          }, {})
        : {};

    config.params = {
      ...currentParams,
      _ts: Date.now(),
    };
    config.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    config.headers.set('Pragma', 'no-cache');
    config.headers.set('Expires', '0');
  }

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
