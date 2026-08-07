"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiClientError, authApi } from "@vittamhub/api-client";
import { ToastProvider, useToast } from "@vittamhub/ui";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

import { setupHttpClient } from "@/lib/http-client-setup";

// Runs once per client bundle load, before any component mounts — the CSRF
// cookie-reading function must be registered before React Query can fire
// any mutation.
setupHttpClient();

/** Turns an unknown thrown value into something worth showing a person. */
function describeError(error: unknown): { title: string; description?: string } {
  if (error instanceof ApiClientError) {
    // 401 is handled by the auth redirect, not worth a toast.
    if (error.status === 403 && error.apiError.code === "FORBIDDEN") {
      return { title: "You don't have permission to do that", description: error.apiError.message };
    }
    if (error.status === 429) {
      return { title: "Too many attempts", description: "Give it a moment and try again." };
    }
    if (error.status >= 500) {
      return {
        title: "Something went wrong on our end",
        description: `Please try again. If it keeps happening, quote reference ${error.apiError.requestId}.`,
      };
    }
    return { title: error.apiError.message || "That didn't work" };
  }
  return { title: "That didn't work", description: "Check your connection and try again." };
}

/**
 * Owns the QueryClient. Lives inside ToastProvider on purpose: a single
 * MutationCache error handler here gives *every* mutation in the app
 * failure feedback, instead of relying on ~38 call sites each remembering
 * their own onError — which is precisely why so many actions previously
 * failed silently.
 */
function QueryProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

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
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => {
            // A mutation that defines its own onError opts out of the
            // default toast, so bespoke handling never double-reports.
            if (mutation.options.onError) return;
            const { title, description } = describeError(error);
            toast({ variant: "error", title, description });
          },
        }),
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * App-wide providers. Kept as a single client boundary so `app/layout.tsx`
 * can stay a server component. See docs/04-state-management.md for why
 * TanStack Query owns server state and Zustand stores stay client-only,
 * feature-scoped, and are created inside their own hooks (not here).
 */
export function Providers({ children }: { children: ReactNode }) {
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
      <ToastProvider>
        <QueryProvider>{children}</QueryProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
