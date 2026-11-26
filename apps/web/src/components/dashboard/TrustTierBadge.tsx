import { cn } from "@/lib/utils";

export type TrustTier = "V0" | "V1" | "V2" | "V3";

/**
 * The verification framework's four levels. A label always names the level,
 * so colour is never the only signal. "Verified" on VittamHub today means the
 * required details and documents are present (CLAUDE.md §7a); nothing is
 * checked against a registry yet, so V2 and V3 are not shown as earned.
 */
export const TRUST_TIERS: Record<TrustTier, { label: string; description: string; className: string }> = {
  V0: {
    label: "Self declared",
    description: "Entered by the member, not yet backed by a document.",
    className: "bg-trust-v0-bg text-trust-v0-text",
  },
  V1: {
    label: "Document supported",
    description: "Backed by a document the member uploaded.",
    className: "bg-trust-v1-bg text-trust-v1-text",
  },
  V2: {
    label: "Corroborated",
    description: "Confirmed by an independent source. Not automated yet.",
    className: "bg-trust-v2-bg text-trust-v2-text",
  },
  V3: {
    label: "Registry matched",
    description: "Matched against an official registry. Not automated yet.",
    className: "bg-trust-v3-bg text-trust-v3-text",
  },
};

export function TrustTierBadge({ tier, showLabel = true, className }: { tier: TrustTier; showLabel?: boolean; className?: string }) {
  const meta = TRUST_TIERS[tier];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", meta.className, className)}
      title={meta.description}
    >
      {tier}
      {showLabel && <span className="font-medium">{meta.label}</span>}
    </span>
  );
}
