import Image from "next/image";

import { cn } from "@/lib/utils";

export interface ProductShotImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** The page's path, shown in the browser frame's address bar. */
  path: string;
  /** `phone` shows a phone-size capture in a light phone frame instead of a browser window. */
  device?: "browser" | "phone";
}

const demoTag = "rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700";

/**
 * A real VittamHub screen in a light browser (or phone) frame: the site's
 * pictures are the product itself. Every screen is taken on a demo account,
 * whose names all say "Demo", and the frame carries a "Demo data" tag, so
 * nothing reads as a live member (CLAUDE.md §2). The files are pre-sized
 * WebP, served as they are (`unoptimized`) like the logo, so they never use
 * up image optimisation quota.
 */
export function ProductShot({
  image,
  className,
  priority = false,
  sizes,
}: {
  image: ProductShotImage;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const picture = (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      unoptimized
      className="block h-auto w-full"
    />
  );

  if (image.device === "phone") {
    return (
      <figure className={cn("relative mx-auto w-full max-w-[290px]", className)}>
        <div className="overflow-hidden rounded-[2.25rem] border-[9px] border-white bg-white shadow-2xl ring-1 ring-border dark:border-slate-700 dark:bg-slate-700">
          <div aria-hidden="true" className="mx-auto mb-1 mt-1 h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-500" />
          <div className="overflow-hidden rounded-[1.6rem]">{picture}</div>
        </div>
        <span className={cn(demoTag, "absolute -bottom-3 left-1/2 -translate-x-1/2 shadow-sm")}>Demo data</span>
      </figure>
    );
  }

  return (
    <figure className={cn("overflow-hidden rounded-card border border-border bg-surface shadow-xl", className)}>
      <div className="flex items-center gap-1.5 border-b border-border bg-background-secondary px-4 py-2.5">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#F87171]/70" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#FBBF24]/70" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[#34D399]/70" />
        <span className="ml-3 min-w-0 truncate rounded-sm bg-surface px-2.5 py-0.5 text-[11px] text-text-secondary">
          vittamhub.com{image.path}
        </span>
        <span className={cn(demoTag, "ml-auto shrink-0")}>Demo data</span>
      </div>
      {picture}
    </figure>
  );
}
