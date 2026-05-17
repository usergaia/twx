import type { DriverInput, EvaluationResult, UploadResponse } from "@/types";
import { env } from "@/lib/env";
import { request } from "./http";

const base = env.NEXT_PUBLIC_AI_URL;

export const aiClient = {
  health: () => request<{ status: string }>(`${base}/health`),

  evaluate: (driver: DriverInput) =>
    request<EvaluationResult>(`${base}/evaluate`, {
      method: "POST",
      body: JSON.stringify(driver),
    }),

  uploadDriversBatch: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<UploadResponse>(`${base}/drivers/batch`, {
      method: "POST",
      body: fd,
    });
  },

  getDriversBatch: () => request<DriverInput[]>(`${base}/drivers/batch`),

  evaluateDriversBatch: () =>
    request<EvaluationResult[]>(`${base}/drivers/batch/evaluate`, {
      method: "POST",
    }),

  // optimizeRoute(...)
  // agentDecision(...)
};
