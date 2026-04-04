import { Router } from 'express';
import type { DataStore } from '../lib/data-store.js';
import { userSettingsInputSchema } from '../schemas/domain.js';

export function createSettingsRouter(store: DataStore, defaultUserId: string) {
  const router = Router();

  router.get('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const settings = await store.getSettings(userId);
      response.json(settings);
    } catch (error) {
      next(error);
    }
  });

  router.put('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = userSettingsInputSchema.parse(request.body);
      const settings = await store.updateSettings(userId, payload);
      response.json(settings);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
