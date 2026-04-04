import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { AppError } from './app-error.js';
import { env } from '../config/env.js';

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  return env.clientUrls.includes(origin);
}

export function applySecurityMiddleware(app: Express) {
  if (env.trustProxy) {
    app.set('trust proxy', 1);
  }

  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.use((request: Request, _response: Response, next: NextFunction) => {
    const origin = request.headers.origin;

    if (!isAllowedOrigin(origin)) {
      next(new AppError(403, 'Origin not allowed'));
      return;
    }

    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        callback(null, isAllowedOrigin(origin));
      },
      credentials: true,
    }),
  );

  app.use(
    '/api',
    rateLimit({
      windowMs: env.apiRateLimitWindowMs,
      max: env.apiRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: 'Too many requests. Please try again shortly.',
      },
    }),
  );

  app.use(
    '/api/chat',
    rateLimit({
      windowMs: env.apiRateLimitWindowMs,
      max: env.chatRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: 'Chat rate limit exceeded. Please wait and try again.',
      },
    }),
  );
}
