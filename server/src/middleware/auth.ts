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
  const devFallbackUserId =
    (request.headers['x-user-id'] as string | undefined) || env.defaultUserId;

  const token = getBearerToken(request);

  if (token && isFirebaseConfigured()) {
    try {
      const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
      request.userId = decoded.uid;
      next();
      return;
    } catch (error) {
      response.status(401).json({
        message: 'Invalid Firebase auth token',
      });
      return;
    }
  }

  if (env.requireFirebaseAuth) {
    response.status(401).json({
      message: 'Authentication required',
    });
    return;
  }

  if (!isFirebaseConfigured() && !env.isProduction) {
    request.userId = devFallbackUserId;
    next();
    return;
  }

  if (!env.isProduction) {
    request.userId = devFallbackUserId;
    next();
    return;
  }

  response.status(401).json({
    message: 'Authentication required',
  });
}
