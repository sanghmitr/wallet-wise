import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { env, isFirebaseConfigured } from './config/env.js';
import { createDataStore } from './lib/data-store.js';
import { attachUser } from './middleware/auth.js';
import { createBudgetsRouter } from './routes/budgets.js';
import { createCategoriesRouter } from './routes/categories.js';
import { createChatRouter } from './routes/chat.js';
import { createExpensesRouter } from './routes/expenses.js';
import { createPaymentMethodsRouter } from './routes/payment-methods.js';
import { createSettingsRouter } from './routes/settings.js';

const store = createDataStore(
  env.dataProvider === 'firestore' && isFirebaseConfigured()
    ? 'firestore'
    : 'memory',
);

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use('/api', attachUser);

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    provider:
      env.dataProvider === 'firestore' && isFirebaseConfigured()
        ? 'firestore'
        : 'memory',
  });
});

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

  response.status(500).json({
    message: error instanceof Error ? error.message : 'Internal server error',
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
