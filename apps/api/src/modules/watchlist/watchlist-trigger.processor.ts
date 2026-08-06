import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job, Worker } from "bullmq";

import { RedisCircuitBreaker } from "../../common/queue/redis-circuit-breaker";

import { WatchlistTriggerEvaluatorService } from "./watchlist-trigger-evaluator.service";
import { WATCHLIST_TRIGGER_JOB, WATCHLIST_TRIGGER_QUEUE_NAME } from "./watchlist-trigger.constants";

@Processor(WATCHLIST_TRIGGER_QUEUE_NAME)
export class WatchlistTriggerProcessor extends WorkerHost {
  private readonly logger = new Logger(WatchlistTriggerProcessor.name);
  private readonly circuitBreaker = new RedisCircuitBreaker(this.logger, WATCHLIST_TRIGGER_QUEUE_NAME);

  constructor(private readonly evaluator: WatchlistTriggerEvaluatorService) {
    super();
  }

  @OnWorkerEvent("error")
  onError(err: Error) {
    this.circuitBreaker.onError(err, this.worker as Worker);
  }

  @OnWorkerEvent("drained")
  onDrained() {
    this.circuitBreaker.onHealthy();
  }

  @OnWorkerEvent("completed")
  onCompleted() {
    this.circuitBreaker.onHealthy();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case WATCHLIST_TRIGGER_JOB.EVALUATE_ALL: {
        const fired = await this.evaluator.evaluateAll();
        this.logger.log(`Watchlist trigger evaluation complete — ${fired} fired`);
        return;
      }
      default:
        throw new Error(`Unknown job "${job.name}" on the "${WATCHLIST_TRIGGER_QUEUE_NAME}" queue`);
    }
  }
}
