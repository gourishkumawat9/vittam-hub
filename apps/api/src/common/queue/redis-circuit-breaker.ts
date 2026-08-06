import { Logger } from "@nestjs/common";
import type { Worker } from "bullmq";

const ERROR_THRESHOLD = 3;
const INITIAL_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60_000;
const BACKOFF_MULTIPLIER = 2;

/**
 * BullMQ's own retry-with-delay (WorkerOptions.runRetryDelay, 15s default)
 * only applies to genuine connection failures. For a Redis command that
 * fails with an application-level reply error instead (e.g. Upstash's "max
 * requests limit exceeded" — the connection stays open, Redis just rejects
 * the command), Worker.retryIfFailed() classifies it as isNotConnectionError
 * and, since the main job-fetch loop passes `onlyEmitError: true`, retries
 * with NO delay at all (bullmq/dist/cjs/classes/worker.js:874-885). Left
 * alone, a persistently-rejecting Redis becomes an uncapped tight retry
 * loop — hundreds of requests per second, heavy log volume, real CPU cost.
 *
 * This wraps a Worker's 'error' event with a small circuit breaker: after a
 * few consecutive failures it pauses the worker outright (no more fetch
 * attempts at all) and probes for recovery on an exponential backoff,
 * logging only on state transitions instead of once per failed request.
 */
export class RedisCircuitBreaker {
  private consecutiveErrors = 0;
  private tripped = false;
  private backoffMs = INITIAL_BACKOFF_MS;
  private resumeTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly label: string,
  ) {}

  /** Call from the worker's @OnWorkerEvent('error') handler. */
  onError(err: Error, worker: Worker): void {
    this.consecutiveErrors += 1;

    if (this.tripped) {
      // A resume probe just failed again — back off further and stay paused.
      // No per-attempt log here; the warning already logged when we tripped.
      this.backoffMs = Math.min(this.backoffMs * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
      this.scheduleResume(worker);
      return;
    }

    if (this.consecutiveErrors < ERROR_THRESHOLD) return;

    this.tripped = true;
    void worker.pause();
    this.logger.warn(
      `${this.label}: pausing after ${this.consecutiveErrors} consecutive Redis errors — will probe again in ${Math.round(this.backoffMs / 1000)}s. Cause: ${err.message}`,
    );
    this.scheduleResume(worker);
  }

  /** Call on any confirmed-successful queue interaction (e.g. 'drained'/'completed') to fully reset the breaker. */
  onHealthy(): void {
    if (this.resumeTimer) {
      clearTimeout(this.resumeTimer);
      this.resumeTimer = null;
    }
    if (this.tripped) {
      this.logger.log(`${this.label}: Redis recovered — resuming normal operation.`);
    }
    this.consecutiveErrors = 0;
    this.tripped = false;
    this.backoffMs = INITIAL_BACKOFF_MS;
  }

  private scheduleResume(worker: Worker): void {
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      this.consecutiveErrors = 0;
      void worker.resume();
    }, this.backoffMs);
    this.resumeTimer.unref();
  }
}
