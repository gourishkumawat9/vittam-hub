import { handlePreviewRequest } from "./handler";
import { PREVIEW_API_BASE } from "./mode";

let installed = false;

/**
 * Answers every request to PREVIEW_API_BASE in the browser, so nothing in
 * preview mode ever reaches a real server. Other requests (the site's own
 * pages and assets) go through untouched.
 */
export function installPreviewFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.origin !== PREVIEW_API_BASE) return realFetch(input, init);

    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    let body: unknown = undefined;
    if (typeof init?.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }

    // A short pause, so loading states show for a moment as they would on the live site.
    await new Promise((resolve) => setTimeout(resolve, 150));
    const { status, data } = handlePreviewRequest(method, url, body);
    const payload =
      status >= 400
        ? { error: { code: "NOT_FOUND", message: "Not available in the preview", requestId: "preview" } }
        : { data, requestId: "preview" };
    return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
  };
}
