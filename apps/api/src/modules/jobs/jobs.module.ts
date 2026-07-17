import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { EmailModule } from "../email/email.module";

import { EMAIL_QUEUE_NAME } from "./email-queue.constants";
import { EmailQueueProcessor } from "./email-queue.processor";
import { EmailQueueService } from "./email-queue.service";

@Module({
  imports: [BullModule.registerQueue({ name: EMAIL_QUEUE_NAME }), EmailModule],
  providers: [EmailQueueService, EmailQueueProcessor],
  exports: [EmailQueueService],
})
export class JobsModule {}
