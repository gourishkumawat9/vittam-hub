import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  fundingStepSchema,
  marketStepSchema,
  preferencesStepSchema,
  productStepSchema,
  publishStartupInputSchema,
  startupInfoStepSchema,
  teamStepSchema,
  tractionStepSchema,
  verificationStepSchema,
  type StartupOnboardingDraft,
} from "@vittamhub/types";
import { slugify } from "@vittamhub/utils";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { applyPersonalDetails } from "./apply-personal-details";

/**
 * Step 10 "Publish" — validates the fully-accumulated wizard draft against
 * the strict (non-partial) per-step schemas and commits every table in one
 * transaction. See docs/11-onboarding-architecture.md for why autosave
 * writes to a JSON draft instead of these tables directly.
 */
@Injectable()
export class StartupPublisher {
  constructor(private readonly prisma: PrismaService) {}

  async publish(userId: string, rawDraft: StartupOnboardingDraft, confirmation: unknown) {
    const confirm = publishStartupInputSchema.safeParse(confirmation);
    if (!confirm.success) {
      throw new BadRequestException(confirm.error.issues.map((i) => i.message).join(", "));
    }

    const startupInfo = this.parseStep(startupInfoStepSchema, rawDraft.startupInfo, "Startup information");
    const product = productStepSchema.parse(rawDraft.product ?? {});
    const market = marketStepSchema.parse(rawDraft.market ?? {});
    const team = this.parseStep(teamStepSchema, rawDraft.team, "Team details");
    const traction = tractionStepSchema.parse(rawDraft.traction ?? {});
    const funding = fundingStepSchema.parse(rawDraft.funding ?? {});
    const verification = verificationStepSchema.parse(rawDraft.verification ?? {});
    const preferences = this.parseStep(preferencesStepSchema, rawDraft.preferences, "Preferences");

    const existing = await this.prisma.startup.findUnique({ where: { ownerId: userId } });
    if (existing?.publishedAt) {
      throw new ConflictException("This startup profile has already been published");
    }

    const slug = existing?.slug ?? (await this.generateUniqueSlug(startupInfo.name));

    return this.prisma.$transaction(async (tx) => {
      await applyPersonalDetails(tx, userId, rawDraft.personalDetails);

      const startupFields = {
        name: startupInfo.name,
        tagline: startupInfo.tagline,
        description: startupInfo.description,
        logoUrl: startupInfo.logoUrl,
        website: startupInfo.website,
        stage: startupInfo.stage,
        industry: startupInfo.industry,
        subIndustry: startupInfo.subIndustry,
        foundedYear: startupInfo.foundedYear,
        registrationStatus: startupInfo.registrationStatus,
        companyType: startupInfo.companyType,
        headquarters: startupInfo.headquarters,
        businessModelSummary: startupInfo.businessModelSummary,
        mission: startupInfo.mission,
        vision: startupInfo.vision,
        problemStatement: startupInfo.problemStatement,
        solution: startupInfo.solution,
        uniqueValueProposition: startupInfo.uniqueValueProposition,
        teamSize: team.teamSize,
        hiringStatus: team.hiringStatus,
        openRoles: team.openRoles,
        termsAcceptedAt: new Date(),
        publishedAt: new Date(),
      };

      const startup = await tx.startup.upsert({
        where: { ownerId: userId },
        create: { ownerId: userId, slug, location: startupInfo.headquarters, ...startupFields },
        update: startupFields,
      });

      await tx.startupTeamMember.deleteMany({ where: { startupId: startup.id } });
      if (team.members.length > 0) {
        await tx.startupTeamMember.createMany({
          data: team.members.map((member) => ({ ...member, startupId: startup.id })),
        });
      }

      await tx.startupProduct.upsert({
        where: { startupId: startup.id },
        create: { startupId: startup.id, ...product },
        update: product,
      });

      const marketData = {
        ...market,
        customerPersonas: market.customerPersonas as Prisma.InputJsonValue,
        competitors: market.competitors as Prisma.InputJsonValue,
      };
      await tx.startupMarket.upsert({
        where: { startupId: startup.id },
        create: { startupId: startup.id, ...marketData },
        update: marketData,
      });

      await tx.startupTraction.upsert({
        where: { startupId: startup.id },
        create: { startupId: startup.id, ...traction },
        update: traction,
      });

      await tx.startupFunding.upsert({
        where: { startupId: startup.id },
        create: { startupId: startup.id, ...funding },
        update: funding,
      });

      await tx.startupPreference.upsert({
        where: { startupId: startup.id },
        create: { startupId: startup.id, lookingFor: preferences.lookingFor },
        update: { lookingFor: preferences.lookingFor },
      });

      if (verification.documents.length > 0) {
        await tx.document.createMany({
          data: verification.documents.map((doc) => ({ ...doc, userId })),
        });
      }

      await tx.userProfile.update({
        where: { userId },
        data: { onboardingStatus: "COMPLETED", onboardingDraft: Prisma.JsonNull },
      });

      return startup;
    });
  }

  private parseStep<T>(schema: { parse: (input: unknown) => T }, value: unknown, label: string): T {
    try {
      return schema.parse(value ?? {});
    } catch {
      throw new BadRequestException(`${label} is incomplete — please finish this step before publishing.`);
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 1;
    while (await this.prisma.startup.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${++suffix}`;
    }
    return candidate;
  }
}
