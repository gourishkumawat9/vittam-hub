import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="font-numeric text-6xl font-bold text-brand-primary">404</p>
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Page not found</h1>
      <p className="max-w-md text-text-secondary">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link
        href="/"
        className="rounded-button bg-brand-primary px-6 py-3 font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Back to home
      </Link>
    </div>
  );
}
