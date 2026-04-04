import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import type { AuthProfile } from '@/types/domain';

export const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const REDIRECT_SIGN_IN_KEY = 'wallet-wise-google-redirect';
const REDIRECT_PENDING_TIMEOUT_MS = 45_000;

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let authReadyPromise: Promise<User | null> | null = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

function setRedirectSignInPending() {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(
    REDIRECT_SIGN_IN_KEY,
    String(Date.now()),
  );
}

function clearRedirectSignInPending() {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(REDIRECT_SIGN_IN_KEY);
}

function isRedirectSignInPending() {
  if (!isBrowser()) {
    return false;
  }

  const raw = window.sessionStorage.getItem(REDIRECT_SIGN_IN_KEY);

  if (!raw) {
    return false;
  }

  const startedAt = Number(raw);

  if (!Number.isFinite(startedAt)) {
    clearRedirectSignInPending();
    return false;
  }

  if (Date.now() - startedAt > REDIRECT_PENDING_TIMEOUT_MS) {
    clearRedirectSignInPending();
    return false;
  }

  return true;
}

export function isFirebaseRedirectPending() {
  return isRedirectSignInPending();
}

async function trySetPersistence() {
  try {
    await withTimeout(
      setPersistence(firebaseAuth, browserLocalPersistence),
      1500,
      undefined,
    );
  } catch (error) {
    console.error('Firebase persistence setup failed', error);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T) {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), timeoutMs);
    }),
  ]);
}

async function waitForAuthState(timeoutMs = 4000) {
  if (firebaseAuth.currentUser) {
    return firebaseAuth.currentUser;
  }

  return withTimeout(
    new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        unsubscribe();
        resolve(user);
      });
    }),
    timeoutMs,
    firebaseAuth.currentUser ?? null,
  );
}

export function createAuthProfile(user: User | null): AuthProfile | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

export async function initializeFirebaseAuth() {
  if (!authReadyPromise) {
    authReadyPromise = (async (): Promise<User | null> => {
      const redirectPending = isRedirectSignInPending();
      const redirectTimeoutMs = redirectPending ? 10000 : 1500;
      const authStateTimeoutMs = redirectPending ? 10000 : 4000;

      await withTimeout(trySetPersistence(), 2000, undefined);

      try {
        const redirectResult = await withTimeout(
          getRedirectResult(firebaseAuth),
          redirectTimeoutMs,
          null,
        );

        if (redirectResult?.user) {
          clearRedirectSignInPending();
          return redirectResult.user;
        }
      } catch (error) {
        console.error('Firebase redirect sign-in failed', error);
        clearRedirectSignInPending();
      }

      if (firebaseAuth.currentUser) {
        clearRedirectSignInPending();
        return firebaseAuth.currentUser;
      }

      const user = await waitForAuthState(authStateTimeoutMs);

      if (user) {
        clearRedirectSignInPending();
      }

      return user;
    })().catch((error) => {
      console.error('Firebase auth initialization failed', error);
      return firebaseAuth.currentUser ?? null;
    });

    authReadyPromise = withTimeout(
      authReadyPromise,
      isRedirectSignInPending() ? 12000 : 5000,
      firebaseAuth.currentUser ?? null,
    );
  }

  return authReadyPromise;
}

export function subscribeToAuthChanges(
  callback: (user: User | null) => void,
) {
  return onAuthStateChanged(firebaseAuth, (user) => {
    if (!user && isRedirectSignInPending()) {
      return;
    }

    if (user) {
      clearRedirectSignInPending();
    }

    authReadyPromise = Promise.resolve(user);
    callback(user);
  });
}

export async function getAuthenticatedUser() {
  return initializeFirebaseAuth();
}

export async function getAuthenticatedUserId() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('No authenticated Firebase user');
  }

  return user.uid;
}

export async function getAuthenticatedIdToken() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('No authenticated Firebase user');
  }

  return user.getIdToken();
}

export async function signInWithGoogle() {
  await trySetPersistence();

  try {
    const credential = await signInWithPopup(firebaseAuth, googleProvider);
    clearRedirectSignInPending();
    authReadyPromise = Promise.resolve(credential.user);
    return credential.user;
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : '';

    const shouldFallbackToRedirect = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
    ].includes(code);

    if (!shouldFallbackToRedirect) {
      throw error;
    }

    setRedirectSignInPending();
    await signInWithRedirect(firebaseAuth, googleProvider);
    return null;
  }
}

export async function signInAsGuest() {
  await trySetPersistence();
  const credential = await signInAnonymously(firebaseAuth);
  authReadyPromise = Promise.resolve(credential.user);
  return credential.user;
}

export async function signOutFirebaseUser() {
  clearRedirectSignInPending();
  await signOut(firebaseAuth);
  authReadyPromise = Promise.resolve(null);
}
