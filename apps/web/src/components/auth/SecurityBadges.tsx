import { Lock, ShieldCheck } from "lucide-react";

export function SecurityBadges() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex items-center gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          256-bit encryption
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Verified profiles only
        </span>
      </div>
      <p className="max-w-xs text-xs text-text-secondary">
        We never share your data without permission. Read our{" "}
        <a href="#" className="underline hover:text-text-primary">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
