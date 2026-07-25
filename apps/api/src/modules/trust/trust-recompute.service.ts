import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import type { Queue } from "bullmq";

import { TRUST_RECOMPUTE_JOB, TRUST_RECOMPUTE_QUEUE_NAME } from "./trust-recompute.constants";

const DAILY_SCHEDULER_ID = "trust-recompute-daily";

/**
 * Schedules the recurring Trust Score v2 recompute — the mechanism that makes
 * freshness/dormancy actually decay over time (trust-model.ts's
 * profileFresh30d/metricsFresh45d/dormantOver180d are date-window checks, so a
 * startup's score drifts down on its own if the founder goes quiet, not only
 * when they happen to view their dashboard). `upsertJobScheduler` is
 * idempotent — safe to call on every boot without stacking duplicate schedules.
 */
@Injectable()
export class TrustRecomputeService implements OnModuleInit {
  constructor(@InjectQueue(TRUST_RECOMPUTE_QUEUE_NAME) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      DAILY_SCHEDULER_ID,
      { pattern: "0 3 * * *" }, // 03:00 UTC daily
      { name: TRUST_RECOMPUTE_JOB.RECOMPUTE_ALL_STARTUPS, data: {} },
    );
  }

  /** Manual trigger — e.g. an admin "recompute now" action. */
  enqueueRecomputeAll() {
    return this.queue.add(TRUST_RECOMPUTE_JOB.RECOMPUTE_ALL_STARTUPS, {});
  }
}
