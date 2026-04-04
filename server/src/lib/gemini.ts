import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

let client: GoogleGenAI | null = null;

export function getGeminiClient() {
  if (!env.geminiApiKey) {
    return null;
  }

  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}
