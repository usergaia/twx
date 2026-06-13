// Wire format for the AI Text Analyzer. Must stay in sync with the Pydantic
// models in ai/text_analyzer/api.py.

import type { DriverStatus } from "./driver";

export type RiskLevel = "safe" | "moderate_risk" | "high_risk";

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  safe: "Safe",
  moderate_risk: "Moderate Risk",
  high_risk: "High Risk",
};

export interface TextAnalysis {
  risk_level: RiskLevel;
  explanation: string;
  risk_factors: string[];
  model: string;
  timestamp: string;
}

// /report — narrates a driver_eval result into a written incident report.
// Sent to POST /report (driver_eval result + telemetry).
export interface ReportRequest {
  name: string;
  location: string;
  speed?: number;
  route?: string;
  weather?: string;
  fuel?: number;
  temperature?: number;
  fatigue?: number;
  alerts: string[];
  score: number;
  status: DriverStatus;
}

export interface IncidentReport {
  summary: string;
  recommendations: string[];
  model: string;
  timestamp: string;
}
