import type { EmailFormPayload, WebhookResponse } from "@/types";
import { request } from "./http";

export const n8nClient = {
  submitEmailForm: (payload: EmailFormPayload) =>
    request<WebhookResponse>(`/api/n8n/email`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // triggerDispatch(...) — also proxy via /api/n8n/...
  // notifyDriver(...)
};
