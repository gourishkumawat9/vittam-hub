import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

/** The page itself is a client component, so its metadata lives here. Indexable so "VittamHub login" finds it. */
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Log in",
    description: "Log in to VittamHub to manage your startup or investor profile, connect requests and conversations.",
    path: "/login",
  }),
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
