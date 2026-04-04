import { Router } from 'express';
import type { DataStore } from '../lib/data-store.js';
import { categoryInputSchema } from '../schemas/domain.js';

export function createCategoriesRouter(store: DataStore, defaultUserId: string) {
  const router = Router();

  router.get('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const categories = await store.listCategories(userId);
      response.json(categories);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = categoryInputSchema.parse(request.body);
      const category = await store.createCategory(userId, payload);
      response.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = categoryInputSchema.parse(request.body);
      const category = await store.updateCategory(userId, request.params.id, payload);
      response.json(category);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      await store.deleteCategory(userId, request.params.id);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
