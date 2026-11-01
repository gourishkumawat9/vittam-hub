import { Logo } from "@/components/Logo";

/**
 * Root-level Suspense fallback. Route segments should generally ship their
 * own `loading.tsx` with a skeleton shaped like the real content — this one
 * is the last-resort fallback for the app shell itself.
 */
export default function RootLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background" role="status">
      <Logo height={36} className="animate-pulse" />
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary" />
      <span className="sr-only">Loading VittamHub</span>
    </div>
  );
}
