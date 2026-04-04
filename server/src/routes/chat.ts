import { Router } from 'express';
import type { DataStore } from '../lib/data-store.js';
import { chatRequestSchema } from '../schemas/domain.js';
import { handleAssistantMessage } from '../services/ai/assistant.js';

export function createChatRouter(store: DataStore, defaultUserId: string) {
  const router = Router();

  router.post('/', async (request, response, next) => {
    try {
      const userId = request.userId || defaultUserId;
      const payload = chatRequestSchema.parse(request.body);
      const result = await handleAssistantMessage(store, userId, payload.message);
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
