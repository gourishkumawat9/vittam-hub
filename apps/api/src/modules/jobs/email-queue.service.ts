import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";

import { EMAIL_JOB, EMAIL_QUEUE_NAME, type LoginAlertJobData } from "./email-queue.constants";

/**
 * The one real BullMQ producer in this codebase — a working example of the
 * "Background Jobs" architecture the rest of the product can extend (queue
 * a doc-processing job, a digest email, etc.) without re-deriving the wiring.
 * Kept deliberately narrow: one job type, retried by BullMQ's defaults if the
 * email provider is briefly down, instead of the old silent `.catch()` drop.
 */
@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue(EMAIL_QUEUE_NAME) private readonly queue: Queue) {}

  enqueueLoginAlert(data: LoginAlertJobData) {
    return this.queue.add(EMAIL_JOB.LOGIN_ALERT, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 50,
    });
  }
}
