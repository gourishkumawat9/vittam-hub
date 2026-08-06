import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job, Worker } from "bullmq";

import { RedisCircuitBreaker } from "../../common/queue/redis-circuit-breaker";
import { EmailService } from "../email/email.service";

import { EMAIL_JOB, EMAIL_QUEUE_NAME, type LoginAlertJobData } from "./email-queue.constants";

@Processor(EMAIL_QUEUE_NAME)
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);
  private readonly circuitBreaker = new RedisCircuitBreaker(this.logger, EMAIL_QUEUE_NAME);

  constructor(private readonly emailService: EmailService) {
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

  async process(job: Job<LoginAlertJobData>): Promise<void> {
    switch (job.name) {
      case EMAIL_JOB.LOGIN_ALERT: {
        const { email, deviceLabel, ipAddress, timestamp } = job.data;
        await this.emailService.sendLoginAlert(email, deviceLabel, ipAddress, timestamp);
        return;
      }
      default:
        throw new Error(`Unknown job "${job.name}" on the "${EMAIL_QUEUE_NAME}" queue`);
    }
  }
}
