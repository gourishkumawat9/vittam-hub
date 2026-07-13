import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createJobSeekerInputSchema } from "@vittamhub/types";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { applyPersonalDetails } from "./apply-personal-details";

@Injectable()
export class JobSeekerPublisher {
  constructor(private readonly prisma: PrismaService) {}

  async publish(userId: string, draft: Record<string, unknown>) {
    const parsed = createJobSeekerInputSchema.safeParse(draft.jobSeekerInfo ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join(", "));
    }
    const { experience, education, ...input } = parsed.data;

    return this.prisma.$transaction(async (tx) => {
      await applyPersonalDetails(tx, userId, draft.personalDetails);

      const jobSeeker = await tx.jobSeekerProfile.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, ...input },
        update: input,
      });

      await tx.workExperienceEntry.deleteMany({ where: { jobSeekerId: jobSeeker.id } });
      if (experience.length > 0) {
        await tx.workExperienceEntry.createMany({
          data: experience.map((entry) => ({
            jobSeekerId: jobSeeker.id,
            company: entry.company,
            title: entry.title,
            description: entry.description,
            startDate: entry.startDate ? new Date(entry.startDate) : undefined,
            endDate: entry.endDate ? new Date(entry.endDate) : undefined,
          })),
        });
      }

      await tx.educationEntry.deleteMany({ where: { jobSeekerId: jobSeeker.id } });
      if (education.length > 0) {
        await tx.educationEntry.createMany({
          data: education.map((entry) => ({ ...entry, jobSeekerId: jobSeeker.id })),
        });
      }

      await tx.userProfile.update({
        where: { userId },
        data: { onboardingStatus: "COMPLETED", onboardingDraft: Prisma.JsonNull },
      });

      return jobSeeker;
    });
  }
}
