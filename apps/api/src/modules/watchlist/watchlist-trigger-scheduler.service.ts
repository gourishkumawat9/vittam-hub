import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import type { Queue } from "bullmq";

import { WATCHLIST_TRIGGER_JOB, WATCHLIST_TRIGGER_QUEUE_NAME } from "./watchlist-trigger.constants";

const SCHEDULER_ID = "watchlist-trigger-evaluation-hourly";

/**
 * Same idempotent-scheduler pattern as TrustRecomputeService (Phase 3) —
 * `upsertJobScheduler` is safe to call on every boot. Hourly, not daily:
 * watchlist alerts ("funding round just opened") are meant to feel timely,
 * unlike the trust-score decay job which only needs to notice drift once a day.
 */
@Injectable()
export class WatchlistTriggerSchedulerService implements OnModuleInit {
  constructor(@InjectQueue(WATCHLIST_TRIGGER_QUEUE_NAME) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      { pattern: "0 * * * *" }, // hourly
      { name: WATCHLIST_TRIGGER_JOB.EVALUATE_ALL, data: {} },
    );
  }

  enqueueEvaluateNow() {
    return this.queue.add(WATCHLIST_TRIGGER_JOB.EVALUATE_ALL, {});
  }
}
