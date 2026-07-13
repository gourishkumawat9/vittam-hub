import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-neutral-100 text-neutral-700",
      brand: "bg-brand-100 text-brand-700",
      success: "bg-success-50 text-success-700",
      warning: "bg-warning-50 text-warning-600",
      danger: "bg-danger-50 text-danger-600",
      info: "bg-info-50 text-info-600",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

/** Status/verification pill — e.g. VerificationStatus, ConnectionStatus, StartupStage. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />
));
Badge.displayName = "Badge";
