import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createIncubatorInputSchema } from "@vittamhub/types";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { applyPersonalDetails } from "./apply-personal-details";

@Injectable()
export class IncubatorPublisher {
  constructor(private readonly prisma: PrismaService) {}

  async publish(userId: string, draft: Record<string, unknown>) {
    const parsed = createIncubatorInputSchema.safeParse(draft.incubatorInfo ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join(", "));
    }
    const { programs, ...input } = parsed.data;

    return this.prisma.$transaction(async (tx) => {
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
          })),
        });
      }

      await tx.userProfile.update({
        where: { userId },
        data: { onboardingStatus: "COMPLETED", onboardingDraft: Prisma.JsonNull },
      });

      return incubator;
    });
  }
}
