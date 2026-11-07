/**
 * Score change when a user's vote on one target goes from `previous` to
 * `next` (each -1, 0 or 1, where 0 means "no vote"). Kept pure so the
 * denormalised `score` counter logic is unit-tested without a database.
 */
export function voteDelta(previous: -1 | 0 | 1, next: -1 | 0 | 1): number {
  return next - previous;
}
