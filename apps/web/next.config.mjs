const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
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
      "connect-src 'self' https://api.vittamhub.com",
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
};

export default nextConfig;
