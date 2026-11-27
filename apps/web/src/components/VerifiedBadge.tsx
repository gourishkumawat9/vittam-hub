import { Badge } from "@vittamhub/ui";
import { BadgeCheck } from "@vittamhub/ui/icons";

/**
 * The Verified badge beside a profile's name. Directories list every
 * published profile, so this is what tells a verified one from the rest;
 * a profile without it shows nothing (never an "unverified" label).
 */
export function VerifiedBadge({ status, className }: { status?: string | null; className?: string }) {
  if (status !== "VERIFIED") return null;
  return (
    <Badge variant="success" className={className}>
      <BadgeCheck className="h-3 w-3" aria-hidden />
      Verified
    </Badge>
  );
}
