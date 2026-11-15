/**
 * How a score is worded and coloured on the founder's own dashboard.
 *
 * A new profile starts low because little has been added yet, not because
 * something is wrong, so the lowest band is a calm "Getting started" in
 * neutral tones. Red is kept for real problems (a failed upload, an error).
 */
const BANDS: Record<string, { label: string; badge: "success" | "brand" | "neutral" }> = {
  EXCELLENT: { label: "Excellent", badge: "success" },
  HIGH: { label: "Strong", badge: "success" },
  MEDIUM: { label: "Building", badge: "brand" },
  LOW: { label: "Getting started", badge: "neutral" },
};

export function scoreBand(band: string): { label: string; badge: "success" | "brand" | "neutral" } {
  return BANDS[band] ?? { label: band, badge: "neutral" };
}

export function scoreColor(score: number): string {
  if (score >= 70) return "text-success-600";
  if (score >= 40) return "text-brand-700";
  return "text-text-primary";
}
