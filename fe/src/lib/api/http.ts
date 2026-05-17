export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function request<T>(url: string, init?: RequestOptions): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? 15000);

  const isFormData = init?.body instanceof FormData;

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(init?.headers ?? {}),
      },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(res.status, body, `${res.status} ${res.statusText}`);
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}
