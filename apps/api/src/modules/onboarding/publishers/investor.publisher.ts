import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createInvestorInputSchema } from "@vittamhub/types";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { applyPersonalDetails } from "./apply-personal-details";

@Injectable()
export class InvestorPublisher {
  constructor(private readonly prisma: PrismaService) {}

  async publish(userId: string, draft: Record<string, unknown>) {
    const parsed = createInvestorInputSchema.safeParse(draft.investorInfo ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join(", "));
    }
    const input = parsed.data;

    return this.prisma.$transaction(async (tx) => {
      await applyPersonalDetails(tx, userId, draft.personalDetails);

      const investor = await tx.investor.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, ...input },
        update: input,
      });

      await tx.userProfile.update({
        where: { userId },
        data: { onboardingStatus: "COMPLETED", onboardingDraft: Prisma.JsonNull },
      });

      return investor;
    });
  }
}
