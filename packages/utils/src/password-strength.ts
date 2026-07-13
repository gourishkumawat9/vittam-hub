export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordStrengthResult {
  score: number; // 0-4
  strength: PasswordStrength;
  label: string;
}

const STRENGTH_LABELS: Record<PasswordStrength, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

/**
 * Cheap heuristic scorer — mirrors the server's actual policy (packages/types
 * passwordSchema: length + case + digit) plus a few extra signals (symbols,
 * length tiers) so the meter still gives useful feedback beyond the pass/fail
 * line the server enforces.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, strength: "weak", label: STRENGTH_LABELS.weak };

  let score = 0;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const clamped = Math.min(score, 4);
  const strength: PasswordStrength = clamped <= 1 ? "weak" : clamped === 2 ? "fair" : clamped === 3 ? "good" : "strong";

  return { score: clamped, strength, label: STRENGTH_LABELS[strength] };
}
