import type { ApiResponse } from "./types";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_URL) {
  console.error(
    "[api] NEXT_PUBLIC_API_URL is not set — API requests will fail in production",
  );
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3001";

export class ApiClientError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let payload: ApiResponse<T> | unknown = null;
  try {
    payload = text ? (JSON.parse(text) as ApiResponse<T> | unknown) : null;
  } catch {
    throw new ApiClientError("Invalid response from server", res.status, text);
  }

  if (!res.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      `Request failed (${res.status})`;
    throw new ApiClientError(message, res.status, payload);
  }

  // Unwrap ApiResponseDto<T>
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiResponse<T>).data;
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, json?: unknown) =>
    request<T>(path, { method: "POST", json }),
  patch: <T>(path: string, json?: unknown) =>
    request<T>(path, { method: "PATCH", json }),
  delete: <T = void>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};
