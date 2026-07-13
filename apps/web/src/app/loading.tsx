/**
 * Root-level Suspense fallback. Route segments should generally ship their
 * own `loading.tsx` with a skeleton shaped like the real content — this one
 * is the last-resort fallback for the app shell itself.
 */
export default function RootLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand-primary" />
    </div>
  );
}
