import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { createUniversityInputSchema } from "@vittamhub/types";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { applyPersonalDetails } from "./apply-personal-details";
import { issueMessages } from "./issue-messages";

@Injectable()
export class UniversityPublisher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async publish(userId: string, draft: Record<string, unknown>) {
    const parsed = createUniversityInputSchema.safeParse(draft.universityInfo ?? {});
    if (!parsed.success) {
      throw new BadRequestException(issueMessages(parsed.error));
    }
    const input = parsed.data;

    const university = await this.prisma.$transaction(async (tx) => {
      await applyPersonalDetails(tx, userId, draft.personalDetails);

      const university = await tx.universityProfile.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, ...input },
        update: input,
      });

      await tx.userProfile.update({
        where: { userId },
        data: { onboardingStatus: "COMPLETED", onboardingDraft: Prisma.JsonNull },
      });

      return university;
    });

    // Every other publisher announced this; universities were the one profile
    // whose automatic checks and verification status never ran.
    this.eventEmitter.emit("profile.upserted", { ownerId: userId });
    return university;
  }
}
