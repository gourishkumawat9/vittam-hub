/**
 * The page address Vercel Web Analytics is allowed to record. Some of ours
 * carry secrets: the password-reset link puts its token in `?token=`, and the
 * sign-in page reads a two-factor challenge from `#mfa=`. So everything after
 * a `?` or `#` is dropped before a page view leaves the browser, except the
 * campaign tags (`utm_source`, `utm_medium`, ...) the dashboard reports on.
 */
export function analyticsUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Not something we can clean, so don't send it as it is either.
    return "";
  }

  const kept = new URLSearchParams();
  parsed.searchParams.forEach((value, key) => {
    if (key.toLowerCase().startsWith("utm_")) kept.append(key, value);
  });

  parsed.search = kept.toString();
  parsed.hash = "";
  return parsed.toString();
}
