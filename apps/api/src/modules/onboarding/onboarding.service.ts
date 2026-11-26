import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  DEFAULT_PERSONA_FOR_ROLE,
  ONBOARDING_DRAFT_SECTIONS,
  ONBOARDING_SECTION_MAX_BYTES,
  profileStrength,
  UserRole,
  type SaveOnboardingDraftInput,
} from "@vittamhub/types";

import { discardProfileEditDraft } from "../../common/onboarding/discard-edit-draft";
import { PrismaService } from "../../database/prisma/prisma.service";

import { draftFromPublishedProfile, draftFromSignUp } from "./profile-draft";
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

  /**
   * What the wizard opens on. While onboarding, that is the saved draft. Once
   * the profile is live there is no draft, so it is rebuilt from the profile:
   * the same wizard is how a profile gets edited.
   */
  async getState(userId: string, role: string) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const published = profile.onboardingStatus === "COMPLETED";
    const stored = this.storedDraft(profile.onboardingDraft);
    const persona = profile.persona ?? DEFAULT_PERSONA_FOR_ROLE[role as UserRole] ?? null;
    // `pendingEdits`: the profile is live and the wizard holds changes to it
    // that were started but never saved. The wizard says so, and offers to
    // save or discard them.
    if (stored) return { status: profile.onboardingStatus, step: profile.onboardingStep, draft: stored, pendingEdits: published, persona };

    if (published) {
      return {
        status: profile.onboardingStatus,
        step: 0,
        draft: await draftFromPublishedProfile(this.prisma, userId, role),
        pendingEdits: false,
        persona,
      };
    }
    // Not started yet: open on what sign-up already asked, so nothing is typed twice.
    return {
      status: profile.onboardingStatus,
      step: profile.onboardingStep,
      draft: await draftFromSignUp(this.prisma, userId, role),
      pendingEdits: false,
      persona,
    };
  }

  /**
   * Profile strength for the dashboards. A live profile is measured as it is
   * published (unsaved edits don't count yet); before that, the sign-up
   * answers plus whatever the wizard has saved so far.
   */
  async getStrength(userId: string, role: string) {
    const [user, profile, documents] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } }),
      this.prisma.userProfile.findUniqueOrThrow({ where: { userId } }),
      this.prisma.document.findMany({ where: { userId }, select: { type: true } }),
    ]);
    const draft =
      profile.onboardingStatus === "COMPLETED"
        ? await draftFromPublishedProfile(this.prisma, userId, role)
        : { ...((await draftFromSignUp(this.prisma, userId, role)) ?? {}), ...(this.storedDraft(profile.onboardingDraft) ?? {}) };
    return profileStrength({
      role,
      persona: profile.persona ?? DEFAULT_PERSONA_FOR_ROLE[role as UserRole] ?? null,
      email: user.email,
      draft,
      documentTypes: documents.map((document) => document.type),
    });
  }

  /** "Discard changes" while editing a live profile: the wizard goes back to what is published. */
  async discardEdits(userId: string) {
    await discardProfileEditDraft(this.prisma, userId);
    return { discarded: true };
  }

  /** The saved draft, limited to the sections the wizards use, or null when there isn't one. */
  private storedDraft(raw: Prisma.JsonValue | null): Record<string, unknown> | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    // Only the known sections are carried forward, so a key written before
    // the section list existed can't ride along in the draft forever.
    const known = Object.fromEntries(
      Object.entries(raw).filter(([section]) => (ONBOARDING_DRAFT_SECTIONS as readonly string[]).includes(section)),
    );
    return Object.keys(known).length > 0 ? known : null;
  }

  /**
   * The draft a save or a publish starts from. For someone editing a live
   * profile with no draft yet, that is the profile itself: otherwise saving
   * one step would leave a draft holding that step alone, and publishing it
   * would blank every section they hadn't opened.
   */
  private async workingDraft(userId: string, role: string, profile: { onboardingStatus: string; onboardingDraft: Prisma.JsonValue | null }) {
    const stored = this.storedDraft(profile.onboardingDraft);
    if (stored) return stored;
    return profile.onboardingStatus === "COMPLETED" ? draftFromPublishedProfile(this.prisma, userId, role) : {};
  }

  /**
   * Merges one section's answers into the stored draft rather than replacing
   * it wholesale — saving step 3 must never lose step 2's already-saved
   * answers. See docs/11-onboarding-architecture.md.
   */
  async saveDraft(userId: string, role: string, input: SaveOnboardingDraftInput) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const nextDraft = { ...(await this.workingDraft(userId, role, profile)), [input.section]: input.data };

    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        onboardingDraft: nextDraft as Prisma.InputJsonValue,
        onboardingStep: input.step,
        // Editing a published profile re-uses the wizard; that must not put
        // a finished account back into "still onboarding".
        ...(profile.onboardingStatus === "COMPLETED" ? {} : { onboardingStatus: "IN_PROGRESS" as const }),
      },
    });

    return { saved: true, step: input.step };
  }

  /**
   * Publishes the draft. Sections sent along with the request are laid over
   * the saved ones first: autosave is debounced, so the last thing typed on
   * the final step may not have reached the server when Publish is pressed.
   * Each section is still validated by its publisher, whichever way it came.
   */
  async publish(userId: string, role: string, body: Record<string, unknown>) {
    const profile = await this.prisma.userProfile.findUniqueOrThrow({ where: { userId } });
    const submitted = Object.fromEntries(
      Object.entries(body ?? {}).filter(
        ([section, value]) =>
          (ONBOARDING_DRAFT_SECTIONS as readonly string[]).includes(section) &&
          !!value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          JSON.stringify(value).length <= ONBOARDING_SECTION_MAX_BYTES,
      ),
    );
    const draft: Record<string, unknown> = { ...(await this.workingDraft(userId, role, profile)), ...submitted };

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
