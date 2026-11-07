import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { fontVariables } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

import { JsonLd } from "./json-ld";
import { Providers } from "./providers";

import "@/styles/globals.css";

/** Search-engine ownership checks, set in the host's env (Vercel → Settings → Environment Variables). */
const verification: Metadata["verification"] = {
  ...(process.env.GOOGLE_SITE_VERIFICATION && { google: process.env.GOOGLE_SITE_VERIFICATION }),
  ...(process.env.BING_SITE_VERIFICATION && { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }),
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "VittamHub",
    "Vittam Hub",
    "startup platform India",
    "idea stage startup",
    "startup investor discovery",
    "find mentors for startups",
    "startup incubators India",
    "startup digital identity",
    "startup verification",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  // No site-wide canonical: a canonical set here is inherited by every page
  // that doesn't set its own, which told Google /about and /pricing were
  // copies of the home page. Each indexable page declares its own instead.
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification,
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
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
