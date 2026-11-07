import type { Metadata, Viewport } from "next";

import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { fontVariables } from "@/lib/fonts";
import { HOME_TITLE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

import { Providers } from "./providers";

import "@/styles/globals.css";

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.BING_SITE_VERIFICATION;

/**
 * Site-wide defaults. Deliberately no `alternates.canonical` here: a
 * canonical set on the root layout is inherited by every page that doesn't
 * override it, which told search engines /about and /pricing were copies of
 * the home page. Each public page sets its own via `pageMetadata()`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: HOME_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "business",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Ownership tokens for Google Search Console / Bing Webmaster Tools, set as
  // Vercel environment variables so verifying needs no code change. Either
  // can stay unset (e.g. when the domain is verified through DNS instead).
  verification: {
    google: googleVerification,
    other: bingVerification ? { "msvalidate.01": bingVerification } : undefined,
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
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
