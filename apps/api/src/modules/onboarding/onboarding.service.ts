import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { UserRole, type SaveOnboardingDraftInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

import { IncubatorPublisher } from "./publishers/incubator.publisher";
import { InvestorPublisher } from "./publishers/investor.publisher";
import { JobSeekerPublisher } from "./publishers/job-seeker.publisher";
import { MentorPublisher } from "./publishers/mentor.publisher";
import { ServiceProviderPublisher } from "./publishers/service-provider.publisher";
import { StartupPublisher } from "./publishers/startup.publisher";
import { UniversityPublisher } from "./publishers/university.publisher";

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly startupPublisher: StartupPublisher,
    private readonly investorPublisher: InvestorPublisher,
    private readonly mentorPublisher: MentorPublisher,
    private readonly incubatorPublisher: IncubatorPublisher,
    private readonly universityPublisher: UniversityPublisher,
    private readonly serviceProviderPublisher: ServiceProviderPublisher,
    private readonly jobSeekerPublisher: JobSeekerPublisher,
  ) {}

  async getState(userId: string) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    return {
      status: profile.onboardingStatus,
      step: profile.onboardingStep,
      draft: (profile.onboardingDraft as Record<string, unknown> | null) ?? null,
    };
  }

  /**
   * Merges one section's answers into the stored draft rather than replacing
   * it wholesale — saving step 3 must never lose step 2's already-saved
   * answers. See docs/11-onboarding-architecture.md.
   */
  async saveDraft(userId: string, input: SaveOnboardingDraftInput) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const existingDraft = (profile.onboardingDraft as Record<string, unknown> | null) ?? {};

    const nextDraft = { ...existingDraft, [input.section]: input.data };

    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        onboardingDraft: nextDraft as Prisma.InputJsonValue,
        onboardingStep: input.step,
        onboardingStatus: "IN_PROGRESS",
      },
    });

    return { saved: true, step: input.step };
  }

  async publish(userId: string, role: string, body: Record<string, unknown>) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const draft = (profile.onboardingDraft as Record<string, unknown> | null) ?? {};

    switch (role) {
      case UserRole.FOUNDER:
        return this.startupPublisher.publish(userId, draft as never, body);
      case UserRole.INVESTOR:
        return this.investorPublisher.publish(userId, draft);
      case UserRole.MENTOR:
        return this.mentorPublisher.publish(userId, draft);
      case UserRole.INCUBATOR:
        return this.incubatorPublisher.publish(userId, draft);
      case UserRole.UNIVERSITY:
        return this.universityPublisher.publish(userId, draft);
      case UserRole.SERVICE_PROVIDER:
        return this.serviceProviderPublisher.publish(userId, draft);
      case UserRole.JOB_SEEKER:
        return this.jobSeekerPublisher.publish(userId, draft);
      default:
        throw new BadRequestException(`No onboarding flow for role ${role}`);
    }
  }
}
