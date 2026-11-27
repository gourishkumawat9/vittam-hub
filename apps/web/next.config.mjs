const isProduction = process.env.NODE_ENV === "production";

/** The origin of a URL, or null when it isn't one. */
function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** A list of origins from an environment variable (commas or spaces between them). */
function originsFrom(value) {
  return (value ?? "").split(/[\s,]+/).filter(Boolean);
}

// The API the browser talks to. In dev that is http://localhost:4000, not the production domain — without it,
// the browser's CSP silently blocks every fetch() to the API and every request just rejects with a generic
// "Failed to fetch". Read from NEXT_PUBLIC_API_URL, which is what the app itself calls, so the two can't disagree.
const apiConnectSrc = [
  // Same fallback as src/lib/http-client-setup.ts: a build with the variable unset calls localhost:4000.
  ...new Set([originOf(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"), isProduction ? "https://api.vittamhub.com" : null].filter(Boolean)),
].join(" ");

// A file goes from the browser straight to object storage on a pre-signed URL, never through the API, so that
// origin has to be allowed too or every upload fails with "Failed to fetch". Cloudflare R2 is the store named in
// docs/10-deployment-infrastructure.md; set NEXT_PUBLIC_UPLOAD_ORIGINS for any other S3-compatible one.
const uploadConnectSrc = (originsFrom(process.env.NEXT_PUBLIC_UPLOAD_ORIGINS).length
  ? originsFrom(process.env.NEXT_PUBLIC_UPLOAD_ORIGINS)
  : ["https://*.r2.cloudflarestorage.com"]
).join(" ");

// Pictures: the media CDN, plus the profile photo a Google, GitHub or LinkedIn sign-in brings with it
// (those were blocked, so every such account showed a broken image).
const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https://media.vittamhub.com",
  ...originsFrom(process.env.NEXT_PUBLIC_MEDIA_ORIGINS),
  "https://lh3.googleusercontent.com",
  "https://avatars.githubusercontent.com",
  "https://media.licdn.com",
].join(" ");

// Cloudflare Turnstile, the CAPTCHA the auth pages load when CAPTCHA_SITE_KEY is set on the API. Its script and
// its frame were both blocked here, so switching the CAPTCHA on would have made signing up and logging in impossible.
const TURNSTILE = "https://challenges.cloudflare.com";

// Vercel Web Analytics. In production its script and reports use this site's own origin (/_vercel/insights), which
// 'self' already covers. Only the dev server loads a debug copy from Vercel's CDN, which records nothing.
const VERCEL_ANALYTICS_DEV = isProduction ? "" : " https://va.vercel-scripts.com";

/** Canonical host — www redirects here so the app is served from exactly one origin. */
const CANONICAL_HOST = "vittamhub.com";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  // HSTS: forces HTTPS for a year, covering api./www. subdomains (both
  // already serve valid certs). Deliberately no `preload` — submission to
  // the browser preload list is effectively irreversible, so that's a
  // decision to make deliberately once the domain setup has been stable in
  // production for a while, not on day one.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is only for the dev server's hot reload; a production build never needs it.
      // 'unsafe-inline' stays until scripts carry nonces (Next.js writes inline ones).
      `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} ${TURNSTILE}${VERCEL_ANALYTICS_DEV}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src ${imgSrc}`,
      "font-src 'self' data:",
      `connect-src 'self' ${apiConnectSrc} ${uploadConnectSrc}`,
      `frame-src ${TURNSTILE}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@vittamhub/ui", "@vittamhub/tokens", "@vittamhub/types", "@vittamhub/utils", "@vittamhub/api-client"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "media.vittamhub.com" }],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["@vittamhub/ui"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /**
   * One canonical origin. Both hostnames resolve to Vercel and both hold
   * valid certificates, so without this the entire app is reachable at two
   * addresses — duplicate content for crawlers, and session cookies scoped
   * to whichever host the user happened to land on.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: `www.${CANONICAL_HOST}` }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
      // Plans aren't sold yet (CLAUDE.md §5), so the pricing page is off the
      // site for now. Not permanent, so it can come back at the same address.
      { source: "/pricing", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
