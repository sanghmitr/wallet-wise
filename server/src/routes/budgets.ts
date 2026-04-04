import { Router } from 'express';
import type { DataStore } from '../lib/data-store.js';
import { budgetInputSchema } from '../schemas/domain.js';

export function createBudgetsRouter(store: DataStore, defaultUserId: string) {
  const router = Router();

  router.get('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const month = request.query.month as string | undefined;
      const budgets = await store.listBudgets(userId, month);
      response.json(budgets);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = budgetInputSchema.parse(request.body);
      const budget = await store.upsertBudget(userId, payload);
      response.json(budget);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
