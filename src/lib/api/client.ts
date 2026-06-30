export const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, init);
  const payload = await parsePayload<ApiEnvelope<T>>(response);

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message ?? `API request failed: ${response.status}`);
  }

  if (payload && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

async function parsePayload<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("API response was not valid JSON");
  }
}
