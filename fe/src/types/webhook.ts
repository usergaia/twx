export interface EmailFormPayload {
  name: string;
  email: string;
  order: string;
}

export interface WebhookResponse {
  status: "success" | "error";
  message: string;
}
