function read(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

export const env = {
  NEXT_PUBLIC_N8N_URL: read("NEXT_PUBLIC_N8N_URL", "http://localhost:5678"),
  NEXT_PUBLIC_AI_URL: read("NEXT_PUBLIC_AI_URL", "http://localhost:8001"),

  // placeholders for future clients; not yet wired to anything
  NEXT_PUBLIC_LARAVEL_URL: read(
    "NEXT_PUBLIC_LARAVEL_URL",
    "http://localhost:8000",
  ),
  NEXT_PUBLIC_OLLAMA_URL: read(
    "NEXT_PUBLIC_OLLAMA_URL",
    "http://localhost:11434",
  ),
} as const;
