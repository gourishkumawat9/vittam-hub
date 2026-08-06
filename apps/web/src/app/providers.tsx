"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authApi } from "@vittamhub/api-client";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

import { setupHttpClient } from "@/lib/http-client-setup";

// Runs once per client bundle load, before any component mounts — the CSRF
// cookie-reading function must be registered before React Query can fire
// any mutation.
setupHttpClient();

/**
 * App-wide providers. Kept as a single client boundary so `app/layout.tsx`
 * can stay a server component. See docs/04-state-management.md for why
 * TanStack Query owns server state and Zustand stores stay client-only,
 * feature-scoped, and are created inside their own hooks (not here).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  // Guarantees the csrf_token cookie exists before the user can possibly
  // submit a mutating request (login/register included) — see
  // docs/09-authentication-security.md §CSRF.
  useEffect(() => {
    authApi.csrfBootstrap().catch(() => {
      // Best-effort — a normal GET elsewhere in the app will also set the
      // cookie via csrfCookieMiddleware if this one fails for any reason.
    });
  }, []);

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
