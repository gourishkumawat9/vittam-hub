// In dev the API runs on http://localhost:4000, not the production domain — without this,
// the browser's CSP silently blocks every fetch() to the API and every request just
// rejects with a generic "Failed to fetch" (no visible error unless you check the console).
const apiConnectSrc = process.env.NODE_ENV === "production" ? "https://api.vittamhub.com" : "http://localhost:4000";

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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // tighten with nonces once CSP is finalized
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://media.vittamhub.com",
      "font-src 'self' data:",
      `connect-src 'self' ${apiConnectSrc}`,
      "frame-ancestors 'none'",
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
    optimizePackageImports: ["lucide-react", "@vittamhub/ui"],
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
    ];
  },
};

export default nextConfig;
