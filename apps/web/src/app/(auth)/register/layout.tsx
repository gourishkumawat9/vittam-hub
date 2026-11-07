import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

/** The page itself is a client component, so its metadata lives here. */
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Create your free account",
    description:
      "Join VittamHub free as a founder, investor, mentor or incubator. Build your startup's digital identity and connect with the ecosystem.",
    path: "/register",
  }),
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
