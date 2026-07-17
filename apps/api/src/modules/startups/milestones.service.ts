import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { CreateMilestoneInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/** The founder-curated timeline shown on the public startup profile — "Idea Created" through "Product Launch". */
@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  listForStartup(startupId: string) {
    return this.prisma.startupMilestone.findMany({
      where: { startupId },
      orderBy: { achievedAt: "asc" },
    });
  }

  async addForOwner(ownerId: string, input: CreateMilestoneInput) {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId } });
    if (!startup) throw new BadRequestException("Complete your startup profile before adding milestones.");

    const milestone = await this.prisma.startupMilestone.create({
      data: {
        startupId: startup.id,
        type: input.type,
        title: input.title,
        description: input.description,
        achievedAt: new Date(input.achievedAt),
        evidenceUrls: input.evidenceUrls,
      },
    });

    if (input.shareToCommunity) {
      await this.prisma.post.create({
        data: {
          authorId: ownerId,
          startupId: startup.id,
          type: "STARTUP_UPDATE",
          body: input.description ? `${milestone.title}\n\n${input.description}` : milestone.title,
          mediaUrls: input.evidenceUrls,
        },
      });
    }

    this.eventEmitter.emit("startup.milestone.added", {
      startupId: startup.id,
      startupName: startup.name,
      milestoneTitle: milestone.title,
    });

    return milestone;
  }
}
