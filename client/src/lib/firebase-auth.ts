import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  setPersistence,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

export const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let authReadyPromise: Promise<User | null> | null = null;

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

export async function initializeFirebaseAuth() {
  if (!authReadyPromise) {
    authReadyPromise = (async (): Promise<User | null> => {
      await withTimeout(trySetPersistence(), 2000, undefined);

      try {
        const redirectResult = await withTimeout(
          getRedirectResult(firebaseAuth),
          1500,
          null,
        );

        if (redirectResult?.user) {
          return redirectResult.user;
        }
      } catch (error) {
        console.error('Firebase redirect sign-in failed', error);
      }

      if (firebaseAuth.currentUser) {
        return firebaseAuth.currentUser;
      }

      return null;
    })().catch((error) => {
      console.error('Firebase auth initialization failed', error);
      return firebaseAuth.currentUser ?? null;
    });

    authReadyPromise = withTimeout(authReadyPromise, 2500, firebaseAuth.currentUser ?? null);
  }

  return authReadyPromise;
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

  const shouldRedirect =
    window.matchMedia('(max-width: 768px)').matches ||
    /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);

  if (shouldRedirect) {
    await signInWithRedirect(firebaseAuth, googleProvider);
    return null;
  }

  const credential = await signInWithPopup(firebaseAuth, googleProvider);
  authReadyPromise = Promise.resolve(credential.user);
  return credential.user;
}

export async function signInAsGuest() {
  await trySetPersistence();
  const credential = await signInAnonymously(firebaseAuth);
  authReadyPromise = Promise.resolve(credential.user);
  return credential.user;
}

export async function signOutFirebaseUser() {
  await signOut(firebaseAuth);
  authReadyPromise = Promise.resolve(null);
}
