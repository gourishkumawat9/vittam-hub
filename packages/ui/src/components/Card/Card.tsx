"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

export interface CardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
}

/**
 * Base surface. `interactive` adds the spec's "cards lift slightly" hover
 * behavior — use it for clickable startup/investor cards, omit it for
 * static content containers (forms, stat panels).
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, interactive = false, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      "rounded-card border border-border bg-surface p-6 shadow-sm transition-shadow duration-150",
      interactive && "cursor-pointer hover:shadow-lg",
      className,
    )}
    whileHover={interactive ? { y: -4 } : undefined}
    transition={{ duration: 0.16 }}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col gap-1.5 pb-4", className)} {...props} />,
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-heading text-lg font-semibold text-text-primary", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-text-secondary", className)} {...props} />,
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center pt-4", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";
