import express from 'express';
import { ZodError } from 'zod';
import { env, isFirebaseConfigured, validateRuntimeConfig } from './config/env.js';
import { AppError } from './lib/app-error.js';
import { createDataStore } from './lib/data-store.js';
import { applySecurityMiddleware } from './lib/security.js';
import { attachUser } from './middleware/auth.js';
import { createBudgetsRouter } from './routes/budgets.js';
import { createCategoriesRouter } from './routes/categories.js';
import { createChatRouter } from './routes/chat.js';
import { createExpensesRouter } from './routes/expenses.js';
import { createPaymentMethodsRouter } from './routes/payment-methods.js';
import { createSettingsRouter } from './routes/settings.js';

validateRuntimeConfig();

const store = createDataStore(
  env.dataProvider === 'firestore' && isFirebaseConfigured()
    ? 'firestore'
    : 'memory',
);

const app = express();

applySecurityMiddleware(app);
app.set('etag', false);
app.use(express.json({ limit: env.jsonBodyLimit }));
app.use('/api', (_request, response, next) => {
  response.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');
  response.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    provider:
      env.dataProvider === 'firestore' && isFirebaseConfigured()
        ? 'firestore'
        : 'memory',
  });
});

app.use('/api', attachUser);
app.use('/api/expenses', createExpensesRouter(store, env.defaultUserId));
app.use('/api/categories', createCategoriesRouter(store, env.defaultUserId));
app.use('/api/budgets', createBudgetsRouter(store, env.defaultUserId));
app.use('/api/payment-methods', createPaymentMethodsRouter(store, env.defaultUserId));
app.use('/api/settings', createSettingsRouter(store, env.defaultUserId));
app.use('/api/chat', createChatRouter(store, env.defaultUserId));

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Invalid request payload',
      issues: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  if (error instanceof Error) {
    console.error(error);
  }

  response.status(500).json({
    message:
      error instanceof Error && !env.isProduction
        ? error.message
        : 'Internal server error',
  });
});

app.listen(env.port, () => {
  console.log(
    `Wallet Wise server listening on http://localhost:${env.port} using ${
      env.dataProvider === 'firestore' && isFirebaseConfigured()
        ? 'firestore'
        : 'memory'
    } store`,
  );
});
