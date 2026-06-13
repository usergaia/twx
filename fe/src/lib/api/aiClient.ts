import type {
  DriverInput,
  EvaluationResult,
  IncidentReport,
  ReportRequest,
  TextAnalysis,
  UploadResponse,
} from "@/types";
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

  // LLM call — long timeout because the first Ollama request loads the model.
  analyzeText: (text: string) =>
    request<TextAnalysis>(`${base}/analyze`, {
      method: "POST",
      body: JSON.stringify({ text }),
      timeoutMs: 120000,
    }),

  // LLM call — narrates a driver_eval result into a written incident report.
  generateReport: (payload: ReportRequest) =>
    request<IncidentReport>(`${base}/report`, {
      method: "POST",
      body: JSON.stringify(payload),
      timeoutMs: 120000,
    }),

  // optimizeRoute(...)
  // agentDecision(...)
};
