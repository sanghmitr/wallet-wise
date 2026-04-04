import OpenAI from 'openai';
import { env } from '../config/env.js';

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!env.openAiApiKey) {
    return null;
  }

  client ??= new OpenAI({ apiKey: env.openAiApiKey });
  return client;
}
