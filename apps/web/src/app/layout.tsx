import type { Metadata, Viewport } from "next";

import { fontVariables } from "@/lib/fonts";

import { JsonLd } from "./json-ld";
import { Providers } from "./providers";

import "@/styles/globals.css";

const SITE_URL = "https://vittamhub.com";
const SITE_NAME = "VittamHub";
const SITE_DESCRIPTION =
  "VittamHub is the verified digital identity and discovery platform connecting startups with investors, mentors, incubators, universities, and strategic partners.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VittamHub — Visibility for Tomorrow's Unicorns",
    template: "%s · VittamHub",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "startup platform",
    "startup investor discovery",
    "startup digital identity",
    "startup verification",
    "investor matching",
    "startup ecosystem",
    "fundraising platform",
  ],
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "VittamHub — Visibility for Tomorrow's Unicorns",
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VittamHub — Visibility for Tomorrow's Unicorns",
    description: SITE_DESCRIPTION,
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontVariables}>
        <JsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
