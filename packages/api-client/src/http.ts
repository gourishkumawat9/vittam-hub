import type { ApiError } from "@vittamhub/types";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly apiError: ApiError,
  ) {
    super(apiError.message);
    this.name = "ApiClientError";
  }
}

export interface HttpClientConfig {
  baseUrl: string;
  /** Reads the CSRF token to attach as `X-CSRF-Token` on mutating requests — see docs/09-authentication-security.md. */
  getCsrfToken?: () => string | undefined;
}

let config: HttpClientConfig = { baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000" };

export function configureHttpClient(next: HttpClientConfig) {
  config = next;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Session auth travels as an httpOnly cookie (`credentials: "include"`), so
 * this client never touches access tokens directly — see docs/09.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isMutation = options.method && options.method !== "GET";
  const csrfToken = config.getCsrfToken?.();

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(isMutation && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { data?: unknown } & Partial<ApiError> & {
      error?: ApiError;
    } | null;
    const apiError: ApiError = errorBody?.error ?? {
      code: "UNKNOWN_ERROR",
      message: response.statusText || "Request failed",
      requestId: response.headers.get("x-request-id") ?? "unknown",
    };
    throw new ApiClientError(response.status, apiError);
  }

  const json = (await response.json()) as { data: T };
  return json.data;
}
