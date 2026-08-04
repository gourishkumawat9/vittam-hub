import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
  private readonly logger = new Logger(WatchlistTriggerSchedulerService.name);

  constructor(
    @InjectQueue(WATCHLIST_TRIGGER_QUEUE_NAME) private readonly queue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<boolean>("ENABLE_JOB_SCHEDULERS") ?? this.configService.get("NODE_ENV") === "production";
    if (!enabled) {
      this.logger.log("Watchlist-trigger scheduler disabled (set ENABLE_JOB_SCHEDULERS=true to enable outside production).");
      return;
    }

    // Same resilience contract as TrustRecomputeService: a Redis outage
    // disables watchlist-trigger evaluation, never the whole API.
    try {
      await this.queue.upsertJobScheduler(
        SCHEDULER_ID,
        { pattern: "0 * * * *" }, // hourly
        { name: WATCHLIST_TRIGGER_JOB.EVALUATE_ALL, data: {} },
      );
    } catch (err) {
      this.logger.warn(
        `Could not register the watchlist-trigger scheduler — Redis appears to be unavailable or over quota. Hourly watchlist alerts will not run until this is resolved and the service restarts. Cause: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  enqueueEvaluateNow() {
    return this.queue.add(WATCHLIST_TRIGGER_JOB.EVALUATE_ALL, {});
  }
}
