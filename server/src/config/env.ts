import dotenv from 'dotenv';

dotenv.config();

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parseNumber(value: string | undefined, defaultValue: number) {
  if (!value) {
    return defaultValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function parseCsv(value: string | undefined, fallback: string[]) {
  if (!value?.trim()) {
    return fallback;
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const defaultClientUrls = ['http://localhost:5173'];
const clientUrls = parseCsv(process.env.CLIENT_URL, defaultClientUrls);

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 4000),
  clientUrl: clientUrls[0] || defaultClientUrls[0],
  clientUrls,
  dataProvider:
    (process.env.DATA_PROVIDER as 'memory' | 'firestore' | undefined) || 'memory',
  firestoreTimeoutMs: Number(process.env.FIRESTORE_TIMEOUT_MS || 8000),
  defaultUserId: process.env.DEFAULT_USER_ID || 'demo-user',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  requireFirebaseAuth: parseBoolean(
    process.env.REQUIRE_FIREBASE_AUTH,
    isProduction,
  ),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, isProduction),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '100kb',
  apiRateLimitWindowMs: parseNumber(
    process.env.API_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
  ),
  apiRateLimitMax: parseNumber(
    process.env.API_RATE_LIMIT_MAX,
    isProduction ? 300 : 1000,
  ),
  chatRateLimitMax: parseNumber(
    process.env.CHAT_RATE_LIMIT_MAX,
    isProduction ? 30 : 250,
  ),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
};

export function isFirebaseConfigured() {
  return Boolean(
    env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey,
  );
}

export function validateRuntimeConfig() {
  if (env.isProduction && !process.env.CLIENT_URL?.trim()) {
    throw new Error(
      'Production deployments must set CLIENT_URL to the deployed frontend origin.',
    );
  }

  if (env.isProduction && env.dataProvider !== 'firestore') {
    throw new Error('Production deployments must use DATA_PROVIDER=firestore.');
  }

  if (env.requireFirebaseAuth && !isFirebaseConfigured()) {
    throw new Error(
      'REQUIRE_FIREBASE_AUTH needs Firebase Admin credentials configured on the server.',
    );
  }

  if (env.dataProvider === 'firestore' && env.isProduction && !isFirebaseConfigured()) {
    throw new Error(
      'Firestore production deployments need FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    );
  }

  if (!env.clientUrls.length) {
    throw new Error('CLIENT_URL must contain at least one allowed origin.');
  }
}
