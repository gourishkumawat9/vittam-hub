import { BadRequestException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import * as argon2 from "argon2";

import { PrismaService } from "../../database/prisma/prisma.service";
import { revokeUserSessions } from "../auth/services/session-revocation";
import { MediaService } from "../media/media.service";

/** What every screen that still mentions a removed account shows in place of the person's name. */
export const DELETED_ACCOUNT_NAME = "Deleted account";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByOAuthAccount(provider: string, providerAccountId: string) {
    return this.prisma.user.findFirst({
      where: { oauthAccounts: { some: { provider, providerAccountId } } },
    });
  }

  markEmailVerified(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  }

  /**
   * Deleting an account removes the startup, the profile and everything the
   * person wrote, for good. A session alone shouldn't be enough for that: a
   * laptop left open, or a stolen cookie, could otherwise wipe someone out.
   * So an account with a password has to give it again. One that only signs
   * in through Google, GitHub or LinkedIn has no password, and its owner
   * confirms in the app instead.
   */
  async confirmPasswordForDeletion(userId: string, password: string | undefined): Promise<void> {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true, deletedAt: true } });
    if (!account || account.deletedAt) throw new UnauthorizedException();
    if (!account.passwordHash) return;
    if (!password) throw new BadRequestException("Enter your password to delete your account");
    if (!(await argon2.verify(account.passwordHash, password))) {
      throw new BadRequestException("That password is incorrect");
    }
  }

  /**
   * Deletes an account at its owner's request.
   *
   * The user row itself stays (soft delete, `deletedAt`) because other
   * people's history hangs off it: an investor's accepted connection and the
   * messages in it, a mentor's past session. Everything that is the person's
   * own goes, in one transaction:
   *
   * - every way to sign in: sessions, password, two-factor, linked Google /
   *   GitHub / LinkedIn accounts, outstanding codes and reset links;
   * - who they are: name, photo, phone-verified flag, the profile row;
   * - everything public: the startup (with its team, milestones, numbers and
   *   funding rounds) and the investor / mentor / incubator / university
   *   profile, along with their verification checks and trust scores;
   * - what they wrote in the community: posts, comments, likes, votes, RSVPs
   *   and bookmarks;
   * - their documents, and the files behind them and behind their pictures;
   * - their private working data: follows, saved startups, alerts, saved
   *   searches, pipeline, mandates, portfolio entries, notifications;
   * - reviews written about them, and connect requests nobody had answered
   *   yet (withdrawn).
   *
   * Before this, only the sessions and the email address were touched, so a
   * "deleted" founder's startup stayed listed and a "deleted" investor stayed
   * in the directory. Signing in with Google also still found the old account
   * and refused, which locked the person out of ever coming back.
   */
  async deleteAccount(userId: string): Promise<void> {
    const now = new Date();

    const storedFiles = await this.prisma.$transaction(async (tx) => {
      await revokeUserSessions(tx, userId);
      await tx.oAuthAccount.deleteMany({ where: { userId } });
      await tx.otpCode.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.mfaRecoveryCode.deleteMany({ where: { userId } });

      const [account, startup, investor, mentor, incubator, university, serviceProvider] = await Promise.all([
        tx.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } }),
        tx.startup.findUnique({
          where: { ownerId: userId },
          select: {
            id: true,
            logoUrl: true,
            teamMembers: { select: { photoUrl: true } },
            milestones: { select: { evidenceUrls: true } },
          },
        }),
        tx.investor.findUnique({ where: { ownerId: userId }, select: { id: true, logoUrl: true } }),
        tx.mentorProfile.findUnique({ where: { ownerId: userId }, select: { id: true } }),
        tx.incubatorProfile.findUnique({ where: { ownerId: userId }, select: { id: true, logoUrl: true } }),
        tx.universityProfile.findUnique({ where: { ownerId: userId }, select: { id: true, logoUrl: true } }),
        tx.serviceProviderProfile.findUnique({ where: { ownerId: userId }, select: { id: true } }),
      ]);

      const ownDocuments = await tx.document.findMany({ where: { userId }, select: { fileUrl: true } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.documentGrant.deleteMany({ where: { OR: [{ grantedToId: userId }, { grantedById: userId }] } });
      await tx.documentView.deleteMany({ where: { viewerId: userId } });

      // Verification checks, trust scores and "we backed / incubated them"
      // claims are keyed by profile type and id, not by a foreign key, so
      // nothing removes them when the profile goes. They hold registry lookups.
      const entities = [
        { type: "User", id: userId },
        ...(startup ? [{ type: "Startup", id: startup.id }] : []),
        ...(investor ? [{ type: "Investor", id: investor.id }] : []),
        ...(mentor ? [{ type: "MentorProfile", id: mentor.id }] : []),
        ...(incubator ? [{ type: "IncubatorProfile", id: incubator.id }] : []),
        ...(university ? [{ type: "UniversityProfile", id: university.id }] : []),
        ...(serviceProvider ? [{ type: "ServiceProviderProfile", id: serviceProvider.id }] : []),
      ];
      const asEntity = entities.map(({ type, id }) => ({ entityType: type, entityId: id }));
      await tx.verificationRecord.deleteMany({ where: { OR: asEntity } });
      await tx.trustScoreSnapshot.deleteMany({ where: { OR: asEntity } });
      await tx.relationshipClaim.deleteMany({
        where: {
          OR: [
            ...entities.map(({ type, id }) => ({ claimantType: type, claimantId: id })),
            ...entities.map(({ type, id }) => ({ targetType: type, targetId: id })),
          ],
        },
      });

      // The community: a post takes its comments, likes, votes and RSVPs with it.
      await tx.post.deleteMany({ where: { authorId: userId } });
      await tx.comment.deleteMany({ where: { authorId: userId } });
      await tx.like.deleteMany({ where: { userId } });
      await tx.pollVote.deleteMany({ where: { userId } });
      await tx.eventRsvp.deleteMany({ where: { userId } });
      await tx.postBookmark.deleteMany({ where: { userId } });

      // Reviews written about them. Ones they wrote about someone else stay, under "Deleted account".
      await tx.founderReview.deleteMany({ where: { founderId: userId } });
      await tx.mentorReview.deleteMany({ where: { mentorId: userId } });

      // The startup row is removed outright, and everything that belongs to it
      // goes with it (team, milestones, numbers, funding rounds, followers,
      // pipeline entries). Connections that mentioned it stay, without it.
      await tx.startup.deleteMany({ where: { ownerId: userId } });
      await tx.investor.deleteMany({ where: { ownerId: userId } });
      await tx.mentorProfile.deleteMany({ where: { ownerId: userId } });
      await tx.incubatorProfile.deleteMany({ where: { ownerId: userId } });
      await tx.universityProfile.deleteMany({ where: { ownerId: userId } });
      await tx.serviceProviderProfile.deleteMany({ where: { ownerId: userId } });
      await tx.jobSeekerProfile.deleteMany({ where: { ownerId: userId } });
      await tx.userProfile.deleteMany({ where: { userId } });

      await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });
      await tx.startupFollow.deleteMany({ where: { investorId: userId } });
      await tx.startupProfileView.deleteMany({ where: { investorId: userId } });
      await tx.watchlistTrigger.deleteMany({ where: { investorId: userId } });
      await tx.savedSearch.deleteMany({ where: { investorId: userId } });
      await tx.pipelineEntry.deleteMany({ where: { investorId: userId } });
      await tx.investmentMandate.deleteMany({ where: { investorId: userId } });
      await tx.investment.deleteMany({ where: { investorId: userId } });
      await tx.notification.deleteMany({ where: { userId } });

      await tx.connection.updateMany({
        where: { status: "PENDING", OR: [{ requesterId: userId }, { recipientId: userId }] },
        data: { status: "WITHDRAWN", respondedAt: now },
      });
      await tx.mentorBookingRequest.updateMany({
        where: { status: "PENDING", OR: [{ founderId: userId }, { mentorId: userId }] },
        data: { status: "DECLINED" },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          // Frees the address for a fresh sign-up.
          email: `deleted-${userId}@deleted.vittamhub.local`,
          fullName: DELETED_ACCOUNT_NAME,
          avatarUrl: null,
          passwordHash: null,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          emailVerifiedAt: null,
          phoneVerifiedAt: null,
        },
      });

      const pictures = [
        account?.avatarUrl,
        startup?.logoUrl,
        investor?.logoUrl,
        incubator?.logoUrl,
        university?.logoUrl,
        ...(startup?.teamMembers.map((member) => member.photoUrl) ?? []),
        ...(startup?.milestones.flatMap((milestone) => milestone.evidenceUrls) ?? []),
      ].filter((url): url is string => !!url);

      return { documents: ownDocuments.map((document) => document.fileUrl), pictures };
    });

    // The stored files go only once the rows are gone for certain. Best effort:
    // a storage hiccup must not undo, or fail, a deletion the person asked for.
    let removed = 0;
    for (const fileUrl of new Set(storedFiles.documents)) {
      const stillReferenced = await this.prisma.document.count({ where: { fileUrl } });
      if (stillReferenced > 0) continue;
      await this.mediaService.deleteByUrl(fileUrl);
      removed += 1;
    }
    // A picture field takes any link, so only files this account itself
    // uploaded are removed: nobody can delete another member's logo by
    // pasting its address into their own profile first.
    for (const fileUrl of new Set(storedFiles.pictures)) {
      if (!this.mediaService.wasUploadedBy(fileUrl, userId)) continue;
      await this.mediaService.deleteByUrl(fileUrl);
      removed += 1;
    }
    this.logger.log(`Account ${userId} deleted at its owner's request (${removed} stored file(s) removed).`);
  }
}
