"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

export interface CardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
}

/**
 * Base surface. `interactive` adds a slight lift and a blue edge on hover
 * behavior — use it for clickable startup/investor cards, omit it for
 * static content containers (forms, stat panels).
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, interactive = false, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn(
      // Flat: a hairline border separates the card from the canvas, no drop shadow.
      "rounded-card border border-border bg-surface p-6 transition-colors duration-300 ease-base",
      interactive && "cursor-pointer hover:border-brand-300 dark:hover:border-brand-700",
      className,
    )}
    whileHover={interactive ? { y: -2 } : undefined}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
