import { Router } from 'express';
import type { DataStore } from '../lib/data-store.js';
import { paymentMethodInputSchema } from '../schemas/domain.js';

export function createPaymentMethodsRouter(
  store: DataStore,
  defaultUserId: string,
) {
  const router = Router();

  router.get('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const paymentMethods = await store.listPaymentMethods(userId);
      response.json(paymentMethods);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = paymentMethodInputSchema.parse(request.body);
      const paymentMethod = await store.createPaymentMethod(userId, payload);
      response.status(201).json(paymentMethod);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = paymentMethodInputSchema.parse(request.body);
      const paymentMethod = await store.updatePaymentMethod(
        userId,
        request.params.id,
        payload,
      );
      response.json(paymentMethod);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      await store.deletePaymentMethod(userId, request.params.id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
