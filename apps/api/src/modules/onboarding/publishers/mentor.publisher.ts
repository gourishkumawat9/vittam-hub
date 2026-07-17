import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { createMentorInputSchema } from "@vittamhub/types";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { applyPersonalDetails } from "./apply-personal-details";

@Injectable()
export class MentorPublisher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async publish(userId: string, draft: Record<string, unknown>) {
    const parsed = createMentorInputSchema.safeParse(draft.mentorInfo ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join(", "));
    }
    const input = parsed.data;

    const mentor = await this.prisma.$transaction(async (tx) => {
      await applyPersonalDetails(tx, userId, draft.personalDetails);

      const mentor = await tx.mentorProfile.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, ...input },
        update: input,
      });

      await tx.userProfile.update({
        where: { userId },
        data: { onboardingStatus: "COMPLETED", onboardingDraft: Prisma.JsonNull },
      });

      return mentor;
    });

    this.eventEmitter.emit("profile.upserted", { ownerId: userId });
    return mentor;
  }
}
