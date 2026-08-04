import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
  private readonly logger = new Logger(TrustRecomputeService.name);

  constructor(
    @InjectQueue(TRUST_RECOMPUTE_QUEUE_NAME) private readonly queue: Queue,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get<boolean>("ENABLE_JOB_SCHEDULERS") ?? this.configService.get("NODE_ENV") === "production";
    if (!enabled) {
      this.logger.log("Trust-recompute scheduler disabled (set ENABLE_JOB_SCHEDULERS=true to enable outside production).");
      return;
    }

    // Redis being unreachable/over-quota must never block the HTTP server
    // from starting — trust-score auto-recompute degrades to "not scheduled"
    // instead of taking the whole API down.
    try {
      await this.queue.upsertJobScheduler(
        DAILY_SCHEDULER_ID,
        { pattern: "0 3 * * *" }, // 03:00 UTC daily
        { name: TRUST_RECOMPUTE_JOB.RECOMPUTE_ALL_STARTUPS, data: {} },
      );
    } catch (err) {
      this.logger.warn(
        `Could not register the trust-recompute scheduler — Redis appears to be unavailable or over quota. Daily trust-score recompute will not run until this is resolved and the service restarts. Cause: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Manual trigger — e.g. an admin "recompute now" action. */
  enqueueRecomputeAll() {
    return this.queue.add(TRUST_RECOMPUTE_JOB.RECOMPUTE_ALL_STARTUPS, {});
  }
}
