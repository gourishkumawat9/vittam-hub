import { isHttpUrl } from "@vittamhub/types";

/**
 * A link another member typed, ready to use as an `href`. Anything that isn't
 * `http://` or `https://` comes back `undefined`, so a `javascript:` or
 * `data:` address saved before the API started refusing them can never run
 * when someone clicks it.
 */
export function externalHref(url: string | null | undefined): string | undefined {
  return isHttpUrl(url) ? url.trim() : undefined;
}

/** Keeps only the links that are safe to render. */
export function externalHrefs(urls: readonly string[] | null | undefined): string[] {
  return (urls ?? []).filter(isHttpUrl).map((url) => url.trim());
}

/**
 * A path inside this site taken from the address bar (`?redirectTo=`,
 * `?from=`), safe to navigate to. It has to start with one `/` and nothing a
 * browser would read as another site: `//host`, `/\host`, or a control
 * character that gets stripped to make one. Everything else falls back.
 */
export function safeInternalPath(path: string | null | undefined, fallback = "/"): string {
  if (!path || path.length > 2048) return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  // Tabs and newlines are dropped by the URL parser, so "/\t/evil.example" would become "//evil.example".
  // eslint-disable-next-line no-control-regex -- matching control characters is the point
  if (/[\u0000-\u001f\u007f\\]/.test(path)) return fallback;
  try {
    const resolved = new URL(path, "https://vittamhub.invalid");
    if (resolved.origin !== "https://vittamhub.invalid") return fallback;
  } catch {
    return fallback;
  }
  return path;
}
