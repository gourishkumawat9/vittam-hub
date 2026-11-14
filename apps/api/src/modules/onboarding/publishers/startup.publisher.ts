import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import {
  fundingStepSchema,
  marketStepSchema,
  productStepSchema,
  publishStartupInputSchema,
  startupInfoStepSchema,
  teamStepPublishSchema,
  preferencesStepPublishSchema,
  tractionStepSchema,
  verificationStepSchema,
  type StartupOnboardingDraft,
} from "@vittamhub/types";
import { slugify } from "@vittamhub/utils";
import { ZodError } from "zod";

import { PrismaService } from "../../../database/prisma/prisma.service";
import { MediaService } from "../../media/media.service";
import { recordTractionObservations } from "../../startups/metric-observations.util";
import { deriveOverallStage } from "../../startups/stage.util";

import { applyPersonalDetails } from "./apply-personal-details";

/**
 * Step 10 "Publish" — validates the fully-accumulated wizard draft against
 * the strict (non-partial) per-step schemas and commits every table in one
 * transaction. See docs/11-onboarding-architecture.md for why autosave
 * writes to a JSON draft instead of these tables directly.
 */
@Injectable()
export class StartupPublisher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mediaService: MediaService,
  ) {}

  async publish(userId: string, rawDraft: StartupOnboardingDraft, confirmation: unknown) {
    const confirm = publishStartupInputSchema.safeParse(confirmation);
    if (!confirm.success) {
      throw new BadRequestException(confirm.error.issues.map((i) => i.message).join(", "));
    }

    // Only the startup's own identity is genuinely required to go live —
    // Core Rule 3: "Every profile section is OPTIONAL. Skipping never blocks
    // access, it only lowers the Trust Score." Team and Preferences used to
    // hard-block publishing, which meant a founder had to reach step 9 before
    // they could have a profile at all, and an untouched step produced an
    // "incomplete" error naming a section they had deliberately skipped.
    const startupInfo = this.parseStep(startupInfoStepSchema, rawDraft.startupInfo, "Startup information");
    // An untouched section parses to its defaults. One that holds something
    // invalid (a half-typed link saved by autosave, say) has to come back as a
    // message naming the field: a bare `.parse()` here threw a ZodError that
    // reached the founder as "something went wrong" on the very last step.
    const product = this.parseStep(productStepSchema, rawDraft.product, "Product", true);
    const market = this.parseStep(marketStepSchema, rawDraft.market, "Market", true);
    const team = this.parseLenient(teamStepPublishSchema, rawDraft.team);
    const traction = this.parseStep(tractionStepSchema, rawDraft.traction, "Traction", true);
    const funding = this.parseStep(fundingStepSchema, rawDraft.funding, "Funding", true);
    const verification = this.parseStep(verificationStepSchema, rawDraft.verification, "Verification", true);
    const preferences = this.parseLenient(preferencesStepPublishSchema, rawDraft.preferences);

    // The draft is free-form JSON, so the file links in it are whatever the
    // browser sent. Only keep documents this founder uploaded themselves.
    for (const document of verification.documents) {
      if (!this.mediaService.isOwnedBy(document.fileUrl, userId)) {
        throw new BadRequestException(`"${document.fileName}" isn't a file uploaded from your account. Please remove it and upload it again.`);
      }
    }

    const existing = await this.prisma.startup.findUnique({ where: { ownerId: userId } });
    if (existing?.publishedAt) {
      throw new ConflictException("This startup profile has already been published");
    }

    const slug = existing?.slug ?? (await this.generateUniqueSlug(startupInfo.name));

    const startup = await this.prisma.$transaction(async (tx) => {
      await applyPersonalDetails(tx, userId, rawDraft.personalDetails);

      const startupFields = {
        name: startupInfo.name,
        tagline: startupInfo.tagline,
        description: startupInfo.description,
        logoUrl: startupInfo.logoUrl,
        website: startupInfo.website,
        stage: deriveOverallStage(startupInfo.productStatus, startupInfo.revenueStatus, startupInfo.fundingStatus),
        declaredStage: startupInfo.stage,
        productStatus: startupInfo.productStatus,
        revenueStatus: startupInfo.revenueStatus,
        fundingStatus: startupInfo.fundingStatus,
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
      await recordTractionObservations(tx, startup.id, traction, "INR", "self-declared:onboarding");

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

    this.eventEmitter.emit("profile.upserted", { ownerId: userId });
    return startup;
  }

  /**
   * Publish-time parse for an optional section: keep whatever the founder
   * actually filled in, fall back to the schema's defaults for anything they
   * skipped, and never throw. A half-finished optional step lowers the Trust
   * Score rather than blocking the profile.
   */
  private parseLenient<T>(schema: { safeParse: (input: unknown) => { success: boolean; data?: T } }, value: unknown): T {
    const attempt = schema.safeParse(value ?? {});
    if (attempt.success && attempt.data !== undefined) return attempt.data;
    // Still invalid even with defaults applied (e.g. a malformed team member
    // row) — fall back to a clean empty section rather than failing publish.
    return schema.safeParse({}).data as T;
  }

  /** `optional` is for a section a founder may skip: an empty one is fine, only a wrong value in it stops publishing. */
  private parseStep<T>(schema: { parse: (input: unknown) => T }, value: unknown, label: string, optional = false): T {
    try {
      return schema.parse(value ?? {});
    } catch (err) {
      // The bare `catch` here previously discarded the Zod issue entirely, so
      // every failure read as an identical "incomplete" message with no
      // indication of which field was wrong — or, worse, that the section was
      // missing from the saved draft altogether. Naming the fields makes the
      // difference between "you left a field blank" and "this step never
      // reached the server" visible to both the user and the logs.
      const fields =
        err instanceof ZodError
          ? [...new Set(err.issues.map((issue) => issue.path.join(".")).filter(Boolean))].slice(0, 5)
          : [];
      const detail =
        value === undefined || value === null
          ? " We don't have any saved answers for this step — please reopen it and continue."
          : fields.length > 0
            ? ` Check: ${fields.join(", ")}.`
            : "";
      if (optional) {
        throw new BadRequestException(`Something in the ${label} step isn't valid — please correct it before publishing.${detail}`);
      }
      throw new BadRequestException(`${label} is incomplete — please finish this step before publishing.${detail}`);
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
