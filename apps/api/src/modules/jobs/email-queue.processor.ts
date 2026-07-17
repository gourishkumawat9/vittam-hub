import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";

import { EmailService } from "../email/email.service";

import { EMAIL_JOB, EMAIL_QUEUE_NAME, type LoginAlertJobData } from "./email-queue.constants";

@Processor(EMAIL_QUEUE_NAME)
export class EmailQueueProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
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
