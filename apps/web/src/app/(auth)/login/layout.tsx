import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Log in",
    description: "Log in to VittamHub to manage your startup profile, investor connect requests, and conversations.",
    path: "/login",
  }),
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
