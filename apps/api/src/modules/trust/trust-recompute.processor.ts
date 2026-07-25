import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";

import { PrismaService } from "../../database/prisma/prisma.service";

import { TrustEngineService } from "./trust-engine.service";
import { TRUST_RECOMPUTE_JOB, TRUST_RECOMPUTE_QUEUE_NAME } from "./trust-recompute.constants";

@Processor(TRUST_RECOMPUTE_QUEUE_NAME)
export class TrustRecomputeProcessor extends WorkerHost {
  private readonly logger = new Logger(TrustRecomputeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trustEngine: TrustEngineService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case TRUST_RECOMPUTE_JOB.RECOMPUTE_ALL_STARTUPS: {
        const startups = await this.prisma.startup.findMany({ where: { isPublic: true }, select: { id: true } });
        this.logger.log(`Recomputing Trust Score v2 for ${startups.length} public startups`);
        for (const startup of startups) {
          await this.trustEngine.computeAndPersistForStartupSafely(startup.id);
        }
        return;
      }
      default:
        throw new Error(`Unknown job "${job.name}" on the "${TRUST_RECOMPUTE_QUEUE_NAME}" queue`);
    }
  }
}
