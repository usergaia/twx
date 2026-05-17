// Future-ownership notes (Week 3+ when Laravel lands):
// - ROUTE_OPTIONS will become a `GET /api/routes` fetch from Laravel (routes table, Week 7+).
// - DriverInput.{name, location} will be derived from a Laravel Driver record (Week 3 CRUD);
//   a separate types/driver-record.ts will hold the canonical Laravel-owned shape.
// - WEATHER_OPTIONS, DriverStatus, EvaluationResult stay here — UI taxonomy and AI-service wire format.

export type DriverStatus = "safe" | "caution" | "danger";
export type Weather = "clear" | "rain" | "fog";

export const ROUTE_OPTIONS = [
  { value: "none", label: "—" },
  { value: "routeA", label: "Route A (high traffic)" },
  { value: "routeB", label: "Route B (medium traffic)" },
  { value: "routeC", label: "Route C (low traffic)" },
] as const;

export const WEATHER_OPTIONS: { value: Weather; label: string }[] = [
  { value: "clear", label: "Clear" },
  { value: "rain", label: "Rain" },
  { value: "fog", label: "Fog" },
];

export interface DriverInput {
  name: string;
  location: string;
  speed: number;
  route: string;
  weather: Weather;
  fuel: number;
  temperature: number;
  fatigue: number;
}

export interface EvaluationResult {
  name: string;
  location: string;
  alerts: string[];
  score: number;
  status: DriverStatus;
  timestamp: string;
}

export interface UploadResponse {
  filename: string;
  row_count: number;
}
