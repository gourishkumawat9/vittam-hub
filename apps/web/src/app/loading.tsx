import { PillarLoader } from "@/components/PillarLoader";

/**
 * Root-level Suspense fallback. Route segments should generally ship their
 * own `loading.tsx` with a skeleton shaped like the real content — this one
 * is the last-resort fallback for the app shell itself. The animation is
 * CSS-only, so it plays from the streamed HTML before any JavaScript loads.
 */
export default function RootLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-6" role="status">
      <PillarLoader />
      <span className="sr-only">Loading VittamHub</span>
    </div>
  );
}
