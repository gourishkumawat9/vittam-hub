import { ApiClientError, apiRequest, configureHttpClient, getApiStatus } from "@vittamhub/api-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("apiRequest", () => {
  beforeEach(() => configureHttpClient({ baseUrl: "https://api.test" }));
  afterEach(() => vi.unstubAllGlobals());

  it("renews an expired session once and retries the request", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(401, { error: { code: "UNAUTHORIZED", message: "expired", requestId: "1" } }))
      .mockResolvedValueOnce(json(200, { data: { refreshed: true } }))
      .mockResolvedValueOnce(json(200, { data: { id: "me" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/v1/auth/me")).resolves.toEqual({ id: "me" });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://api.test/v1/auth/me",
      "https://api.test/v1/auth/refresh",
      "https://api.test/v1/auth/me",
    ]);
  });

  it("reports a host error page as the API being unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>Bad gateway</html>", { status: 502 })));

    // Mutations aren't retried, so this fails straight away.
    const error = await apiRequest("/v1/startups", { method: "POST", body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    expect((error as ApiClientError).apiError.code).toBe("SERVICE_UNAVAILABLE");
    expect(getApiStatus()).toBe("unreachable");
  });

  it("reports a network failure as the API being unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await apiRequest("/v1/startups", { method: "POST", body: {} }).catch((e: unknown) => e);
    expect((error as ApiClientError).apiError.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("keeps the API's own error responses as they are", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(404, { error: { code: "NOT_FOUND", message: "Not found", requestId: "2" } })));

    const error = (await apiRequest("/v1/startups/missing").catch((e: unknown) => e)) as ApiClientError;
    expect(error.status).toBe(404);
    expect(error.apiError.code).toBe("NOT_FOUND");
    expect(getApiStatus()).toBe("ok");
  });
});
