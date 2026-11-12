"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Fixed steps, not the theme variable: white text needs 600 (6.4:1) in light and 500 (4.9:1) in dark.
        primary: "bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600",
        secondary: "bg-surface text-text-primary border border-border hover:bg-background-secondary",
        outline: "border border-brand-primary text-brand-primary hover:bg-brand-primary/10",
        ghost: "text-text-primary hover:bg-background-secondary",
        danger: "bg-danger-600 text-white hover:bg-danger-700",
        link: "text-brand-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends HTMLMotionProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  // Framer's `children` type also permits MotionValue (for animatable text
  // content), which isn't valid JSX ReactNode — narrow it back for callers.
  children?: React.ReactNode;
}

/**
 * Base interactive primitive. Buttons respond with colour, not movement: the
 * trust-blue redesign dropped the hover/tap scale for a steadier, more
 * institutional feel. It stays a `motion.button` so callers can still pass
 * motion props.
 *
 * `asChild` renders a plain Radix `Slot` (e.g. to style a Next.js `<Link>` as
 * a button), since the child element owns its own root DOM node.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      return (
        <Slot ref={ref} className={classes} aria-busy={isLoading}>
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
