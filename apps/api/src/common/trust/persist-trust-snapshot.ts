import type { Prisma, TrustBand } from "@prisma/client";

type SnapshotClient = Pick<Prisma.TransactionClient, "trustScoreSnapshot">;

/** A score that hasn't moved is still recorded once a day, so the history shows it held steady. */
const UNCHANGED_SNAPSHOT_INTERVAL_MS = 24 * 60 * 60 * 1000;

interface TrustSnapshotInput {
  entityType: string;
  entityId: string;
  score: number;
  band: TrustBand;
  breakdown: Prisma.InputJsonValue;
}

/**
 * Adds a row to the trust-score history only when there is something to
 * record: no row yet, a score or band that changed, or a day since the last.
 *
 * Scores are recomputed whenever a profile or dashboard is opened, and every
 * recompute used to insert a row. A public investor profile wrote one per
 * page view, by anyone, signed in or not, so the table grew with traffic and
 * a simple loop of requests could fill the database.
 */
export async function persistTrustSnapshot(db: SnapshotClient, snapshot: TrustSnapshotInput): Promise<void> {
  const latest = await db.trustScoreSnapshot.findFirst({
    where: { entityType: snapshot.entityType, entityId: snapshot.entityId },
    orderBy: { computedAt: "desc" },
    select: { score: true, band: true, computedAt: true },
  });

  const unchanged = latest && latest.score === snapshot.score && latest.band === snapshot.band;
  if (unchanged && Date.now() - latest.computedAt.getTime() < UNCHANGED_SNAPSHOT_INTERVAL_MS) return;

  await db.trustScoreSnapshot.create({ data: snapshot });
}
