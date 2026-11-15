import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { createIncubatorInputSchema } from "@vittamhub/types";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { applyPersonalDetails } from "./apply-personal-details";
import { issueMessages } from "./issue-messages";

@Injectable()
export class IncubatorPublisher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async publish(userId: string, draft: Record<string, unknown>) {
    const parsed = createIncubatorInputSchema.safeParse(draft.incubatorInfo ?? {});
    if (!parsed.success) {
      throw new BadRequestException(issueMessages(parsed.error));
    }
    const { programs, ...input } = parsed.data;

    const incubator = await this.prisma.$transaction(async (tx) => {
      await applyPersonalDetails(tx, userId, draft.personalDetails);

      const incubator = await tx.incubatorProfile.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, ...input },
        update: input,
      });

      await tx.incubatorProgram.deleteMany({ where: { incubatorId: incubator.id } });
      if (programs.length > 0) {
        await tx.incubatorProgram.createMany({
          data: programs.map((program) => ({
            incubatorId: incubator.id,
            name: program.name,
            description: program.description,
            durationWeeks: program.durationWeeks,
            applicationCycleStart: program.applicationCycleStart ? new Date(program.applicationCycleStart) : undefined,
            applicationCycleEnd: program.applicationCycleEnd ? new Date(program.applicationCycleEnd) : undefined,
            // These two were collected by the form and then dropped here.
            applicationUrl: program.applicationUrl,
            eligibilityCriteria: program.eligibilityCriteria,
          })),
        });
      }

      await tx.userProfile.update({
        where: { userId },
        data: { onboardingStatus: "COMPLETED", onboardingDraft: Prisma.JsonNull },
      });

      return incubator;
    });

    this.eventEmitter.emit("profile.upserted", { ownerId: userId });
    return incubator;
  }
}
