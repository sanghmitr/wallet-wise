import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '../config/env.js';

function getPrivateKey() {
  const trimmed = env.firebasePrivateKey.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted.replace(/\\n/g, '\n');
}

export function getFirestoreClient() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: getPrivateKey(),
      }),
    });
  }

  const firestore = getFirestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  return firestore;
}

export function getFirebaseAdminAuth() {
  if (!getApps().length) {
    getFirestoreClient();
  }

  return getAuth();
}
