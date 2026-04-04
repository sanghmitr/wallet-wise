import type { NextFunction, Request, Response } from 'express';
import { env, isFirebaseConfigured } from '../config/env.js';
import { getFirebaseAdminAuth } from '../lib/firebase.js';

function getBearerToken(request: Request) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length);
}

export async function attachUser(request: Request, response: Response, next: NextFunction) {
  const fallbackUserId =
    (request.headers['x-user-id'] as string | undefined) || env.defaultUserId;

  if (!isFirebaseConfigured()) {
    request.userId = fallbackUserId;
    next();
    return;
  }

  const token = getBearerToken(request);

  if (!token) {
    request.userId = fallbackUserId;
    next();
    return;
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    request.userId = decoded.uid;
    next();
  } catch (error) {
    response.status(401).json({
      message: 'Invalid Firebase auth token',
    });
  }
}
