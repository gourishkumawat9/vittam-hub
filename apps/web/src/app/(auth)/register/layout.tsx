import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Create your free account",
    description:
      "Join VittamHub free as a founder, investor, mentor, incubator, university, or service provider. Founders can start at the idea stage.",
    path: "/register",
  }),
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
