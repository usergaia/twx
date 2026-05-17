// Ollama LLM client. Stub for now
import { env } from "@/lib/env";

const base = env.NEXT_PUBLIC_OLLAMA_URL;

export const ollamaClient = {
  baseUrl: base,
  // generate({ model, prompt }), chat({ model, messages }), ...
};
