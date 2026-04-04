import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  dataProvider:
    (process.env.DATA_PROVIDER as 'memory' | 'firestore' | undefined) || 'memory',
  firestoreTimeoutMs: Number(process.env.FIRESTORE_TIMEOUT_MS || 8000),
  defaultUserId: process.env.DEFAULT_USER_ID || 'demo-user',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
};

export function isFirebaseConfigured() {
  return Boolean(
    env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey,
  );
}
