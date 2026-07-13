"use client";

import { useRef } from "react";
import type { MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Wraps a CTA with a soft radial highlight that follows the cursor — pointer devices only, via CSS custom properties (cheap, no re-renders). */
export function CursorGlow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    ref.current?.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
    ref.current?.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden [--glow-x:50%] [--glow-y:50%]",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(160px circle at var(--glow-x) var(--glow-y), rgba(255,255,255,0.25), transparent 70%)",
        }}
      />
      {children}
    </div>
  );
}
