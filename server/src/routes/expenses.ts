import { Router } from 'express';
import type { DataStore } from '../lib/data-store.js';
import { expenseInputSchema } from '../schemas/domain.js';
import type { ExpenseFilters } from '../types/domain.js';

export function createExpensesRouter(store: DataStore, defaultUserId: string) {
  const router = Router();

  router.get('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const filters: ExpenseFilters = {
        category: request.query.category as string | undefined,
        paymentMethodId: request.query.paymentMethodId as string | undefined,
        source: request.query.source as string | undefined,
        startDate: request.query.startDate as string | undefined,
        endDate: request.query.endDate as string | undefined,
      };

      const expenses = await store.listExpenses(userId, filters);
      response.json(expenses);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = expenseInputSchema.parse(request.body);
      const expense = await store.createExpense(userId, payload);
      response.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = expenseInputSchema.parse(request.body);
      const expense = await store.updateExpense(userId, request.params.id, payload);
      response.json(expense);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      await store.deleteExpense(userId, request.params.id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
