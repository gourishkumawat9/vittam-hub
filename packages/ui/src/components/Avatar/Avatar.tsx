"use client";

import * as RadixAvatar from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

const avatarVariants = cva("relative inline-flex shrink-0 overflow-hidden rounded-full bg-brand-100", {
  variants: {
    size: {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-14 w-14 text-lg",
    },
  },
  defaultVariants: { size: "md" },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string | null;
  name: string;
  className?: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

/** Falls back to initials-on-brand when `src` is missing or fails to load — never a broken image icon. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(({ src, name, size, className }, ref) => (
  <RadixAvatar.Root ref={ref} className={cn(avatarVariants({ size, className }))}>
    <RadixAvatar.Image src={src ?? undefined} alt={name} className="h-full w-full object-cover" />
    <RadixAvatar.Fallback
      className="flex h-full w-full items-center justify-center font-medium text-brand-700"
      delayMs={src ? 400 : 0}
    >
      {getInitials(name)}
    </RadixAvatar.Fallback>
  </RadixAvatar.Root>
));
Avatar.displayName = "Avatar";
