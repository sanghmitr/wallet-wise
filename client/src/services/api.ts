import axios from 'axios';
import { env } from '@/config/env';
import {
  getAuthenticatedIdToken,
  getAuthenticatedUserId,
} from '@/lib/firebase-auth';

const wakeUpAwareStatusCodes = new Set([408, 425, 429, 500, 502, 503, 504]);
const healthCheckTimeoutMs = 5000;
const healthCheckPollIntervalMs = 3000;
const healthCheckMaxWaitMs = 90000;

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

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function requestApiHealth(timeout = healthCheckTimeoutMs) {
  await axios.get('/health', {
    baseURL: env.apiBaseUrl,
    timeout,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function checkApiHealth(timeout = healthCheckTimeoutMs) {
  await requestApiHealth(timeout);
}

export function isServerWakeUpCandidate(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const statusCode = error.response?.status;

  if (typeof statusCode === 'number' && wakeUpAwareStatusCodes.has(statusCode)) {
    return true;
  }

  return error.code === 'ECONNABORTED' || !error.response;
}

interface WaitForApiReadyOptions {
  onWakingServerChange?: (isWaking: boolean) => void;
  maxWaitMs?: number;
  pollIntervalMs?: number;
  requestTimeoutMs?: number;
}

export async function waitForApiReady({
  onWakingServerChange,
  maxWaitMs = healthCheckMaxWaitMs,
  pollIntervalMs = healthCheckPollIntervalMs,
  requestTimeoutMs = healthCheckTimeoutMs,
}: WaitForApiReadyOptions = {}) {
  try {
    await requestApiHealth(requestTimeoutMs);
    onWakingServerChange?.(false);
    return;
  } catch (error) {
    if (!isServerWakeUpCandidate(error)) {
      throw error;
    }

    onWakingServerChange?.(true);

    const deadline = Date.now() + maxWaitMs;
    let lastError: unknown = error;

    while (Date.now() < deadline) {
      await delay(pollIntervalMs);

      try {
        await requestApiHealth(requestTimeoutMs);
        onWakingServerChange?.(false);
        return;
      } catch (retryError) {
        if (!isServerWakeUpCandidate(retryError)) {
          throw retryError;
        }

        lastError = retryError;
      }
    }

    onWakingServerChange?.(false);
    throw lastError;
  }
}

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

export function unwrapListResponse<T>(
  data: unknown,
  expectedKeys: string[] = [],
): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;

    for (const key of [...expectedKeys, 'items', 'data', 'results']) {
      const candidate = record[key];

      if (Array.isArray(candidate)) {
        return candidate as T[];
      }
    }
  }

  return [];
}
