/** Display labels for a startup's stage and verification status, shared by the founder home. */

export { STAGE_LABEL } from "@/lib/startup-options";

export const VERIFICATION_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "danger",
  UNVERIFIED: "neutral",
};
