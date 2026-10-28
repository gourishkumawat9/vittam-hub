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
  /** Called when a request was rejected as signed-out and the session couldn't be renewed. */
  onSessionExpired?: () => void;
}

let config: HttpClientConfig = { baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000" };

export function configureHttpClient(next: HttpClientConfig) {
  config = next;
}

export function getApiBaseUrl() {
  return config.baseUrl;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

// ─── API reachability ────────────────────────────────────────────────────
//
// The API runs on a free host that sleeps when idle and takes up to about a
// minute to wake. "slow" means a request has been waiting long enough that
// the person deserves an explanation; "unreachable" means the API couldn't
// be reached at all, even after retrying.

export type ApiStatus = "ok" | "slow" | "unreachable";

const SLOW_AFTER_MS = 3_000;
/**
 * A request that's merely slow while the API has been answering recently
 * isn't a wake-up, so it doesn't cover the page (polling a busy API would
 * otherwise flash the screen on and off).
 */
const RECENTLY_AWAKE_MS = 30_000;
/** Backoff for GETs while the API wakes up — about a minute in total. */
const WAKE_RETRY_DELAYS_MS = [2_000, 4_000, 8_000, 16_000, 30_000];
/**
 * No response at all (offline, DNS, the host's dead-app page without CORS
 * headers) is rarely a wake-up — a waking host holds the connection open
 * instead — so it only gets a short retry for a blip before showing the
 * outage screen.
 */
const NETWORK_RETRY_DELAYS_MS = [2_000, 4_000];
/** Responses a host's edge sends while the app behind it is starting or gone. */
const UNAVAILABLE_STATUSES = new Set([502, 503, 504]);

let apiStatus: ApiStatus = "ok";
let slowRequests = 0;
let lastAnsweredAt = 0;
const statusListeners = new Set<(status: ApiStatus) => void>();

function setApiStatus(next: ApiStatus) {
  if (next === apiStatus) return;
  apiStatus = next;
  statusListeners.forEach((listener) => listener(next));
}

export function getApiStatus(): ApiStatus {
  return apiStatus;
}

export function subscribeApiStatus(listener: (status: ApiStatus) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function unavailableError(requestId = "unknown"): ApiClientError {
  return new ApiClientError(503, {
    code: "SERVICE_UNAVAILABLE",
    message: "VittamHub is temporarily unavailable. Please try again in a minute.",
    requestId,
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Session renewal ─────────────────────────────────────────────────────
//
// The session cookie lives 15 minutes and the refresh cookie up to 30 days,
// but nothing ever called /v1/auth/refresh, so everyone was signed out after
// 15 minutes. A 401 now renews the session once and retries the request.

const NO_REFRESH_PATHS = ["/v1/auth/refresh", "/v1/auth/login", "/v1/auth/register", "/v1/auth/logout", "/v1/auth/mfa/challenge"];
/** After a failed renewal (signed-out visitor), don't try again on every 401 for a while. */
const REFRESH_COOLDOWN_MS = 60_000;
let refreshInFlight: Promise<boolean> | null = null;
let refreshBlockedUntil = 0;

function refreshSession(): Promise<boolean> {
  if (Date.now() < refreshBlockedUntil) return Promise.resolve(false);
  refreshInFlight ??= send("/v1/auth/refresh", { method: "POST" })
    .then((response) => {
      if (!response.ok) refreshBlockedUntil = Date.now() + REFRESH_COOLDOWN_MS;
      return response.ok;
    })
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function send(path: string, options: RequestOptions): Promise<Response> {
  const isMutation = options.method && options.method !== "GET";
  const csrfToken = config.getCsrfToken?.();
  return fetch(`${config.baseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(isMutation && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

/**
 * Sends the request, retrying GETs while the API is waking up or briefly
 * unreachable. Mutations are never retried — a POST that reached a waking
 * server may already have happened.
 */
async function sendWithWakeRetry(path: string, options: RequestOptions): Promise<Response> {
  const canRetry = (!options.method || options.method === "GET") && typeof window !== "undefined";
  for (let attempt = 0; ; attempt++) {
    let delay: number | undefined;
    try {
      const response = await send(path, options);
      delay = canRetry ? WAKE_RETRY_DELAYS_MS[attempt] : undefined;
      if (!UNAVAILABLE_STATUSES.has(response.status) || delay === undefined) return response;
    } catch (error) {
      // fetch only rejects when no response arrived at all.
      delay = canRetry ? NETWORK_RETRY_DELAYS_MS[attempt] : undefined;
      if (delay === undefined) throw error;
    }
    setApiStatus("slow");
    await sleep(delay);
  }
}

/**
 * Session auth travels as an httpOnly cookie (`credentials: "include"`), so
 * this client never touches access tokens directly — see docs/09.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let countedSlow = false;
  const slowTimer = setTimeout(() => {
    if (Date.now() - lastAnsweredAt < RECENTLY_AWAKE_MS) return;
    countedSlow = true;
    slowRequests += 1;
    setApiStatus("slow");
  }, SLOW_AFTER_MS);

  try {
    let response: Response;
    try {
      response = await sendWithWakeRetry(path, options);
      if (response.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
        if (await refreshSession()) response = await sendWithWakeRetry(path, options);
        else config.onSessionExpired?.();
      }
    } catch {
      setApiStatus("unreachable");
      throw unavailableError();
    }

    if (!UNAVAILABLE_STATUSES.has(response.status)) lastAnsweredAt = Date.now();

    if (path === "/v1/auth/login" || path === "/v1/auth/register" || path === "/v1/auth/mfa/challenge") {
      if (response.ok) refreshBlockedUntil = 0;
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { data?: unknown } & Partial<ApiError> & {
        error?: ApiError;
      } | null;
      const requestId = response.headers.get("x-request-id") ?? "unknown";
      // A 502/503/504 without our JSON error shape came from the hosting
      // provider, not the API — the API is down or still starting.
      if (!errorBody?.error && UNAVAILABLE_STATUSES.has(response.status)) {
        setApiStatus("unreachable");
        throw unavailableError(requestId);
      }
      if (apiStatus === "unreachable") setApiStatus("ok");
      const apiError: ApiError = errorBody?.error ?? {
        code: "UNKNOWN_ERROR",
        message: response.statusText || "Request failed",
        requestId,
      };
      throw new ApiClientError(response.status, apiError);
    }

    if (apiStatus === "unreachable") setApiStatus("ok");
    const json = (await response.json()) as { data: T };
    return json.data;
  } finally {
    clearTimeout(slowTimer);
    if (countedSlow) slowRequests -= 1;
    if (slowRequests === 0 && apiStatus === "slow") setApiStatus("ok");
  }
}

/**
 * Waits until the API answers its health check, for flows that send the
 * browser to the API directly (OAuth sign-in) and so can't show their own
 * loading state once they leave the page. Resolves false if it never does.
 */
export async function waitForApi({ timeoutMs = 90_000, signal }: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  let networkFailures = 0;
  for (let attempt = 0; Date.now() < deadline && !signal?.aborted; attempt++) {
    try {
      // A waking host holds this request open until the API is up, or
      // answers 502/503 — both mean "keep waiting".
      const response = await fetch(`${config.baseUrl}/health`, { signal, cache: "no-store" });
      if (response.ok) {
        setApiStatus("ok");
        return true;
      }
      networkFailures = 0;
    } catch {
      // No response at all, repeatedly, means down or offline rather than
      // waking — don't keep someone staring at a spinner for 90 seconds.
      networkFailures += 1;
      if (networkFailures >= NETWORK_RETRY_DELAYS_MS.length + 1) return false;
    }
    await sleep(Math.min(2_000 * 2 ** attempt, 10_000));
  }
  return false;
}
