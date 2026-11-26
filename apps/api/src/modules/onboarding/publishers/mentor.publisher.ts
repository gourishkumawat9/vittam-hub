import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { createMentorInputSchema, mentorFeeLabel, MentorFeeType } from "@vittamhub/types";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { applyPersonalDetails } from "./apply-personal-details";
import { issueMessages } from "./issue-messages";

@Injectable()
export class MentorPublisher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async publish(userId: string, draft: Record<string, unknown>) {
    const parsed = createMentorInputSchema.safeParse(draft.mentorInfo ?? {});
    if (!parsed.success) {
      throw new BadRequestException(issueMessages(parsed.error));
    }
    const paid = parsed.data.feeType === MentorFeeType.PAID;
    const input = {
      ...parsed.data,
      // A free mentor has no fee; one left over from switching to free must not linger.
      sessionFeeAmount: paid ? parsed.data.sessionFeeAmount : null,
      firstSessionFree: paid ? parsed.data.firstSessionFree : false,
      groupFeePerFounder: paid ? (parsed.data.groupFeePerFounder ?? null) : null,
      freeForIdeaStage: paid ? parsed.data.freeForIdeaStage : false,
      sponsoredSessions: paid ? parsed.data.sponsoredSessions : false,
    };
    // The directory and profile show this text, worked out from the choices so every fee reads the same way.
    const pricingModel = mentorFeeLabel(input);

    const mentor = await this.prisma.$transaction(async (tx) => {
      await applyPersonalDetails(tx, userId, draft.personalDetails);

      const mentor = await tx.mentorProfile.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, ...input, pricingModel },
        update: { ...input, pricingModel },
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
