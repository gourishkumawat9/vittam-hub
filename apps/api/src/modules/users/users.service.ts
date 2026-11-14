import { Injectable, Logger } from "@nestjs/common";

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
   * Deletes an account at its owner's request.
   *
   * The user row itself stays (soft delete, `deletedAt`) because other
   * people's history hangs off it: an investor's accepted connection and the
   * messages in it, a mentor's past session, a thread someone replied to.
   * Everything that is the person's own goes, in one transaction:
   *
   * - every way to sign in: sessions, password, two-factor, linked Google /
   *   GitHub / LinkedIn accounts, outstanding codes and reset links;
   * - who they are: name, photo, phone-verified flag, the profile row;
   * - everything public: the startup leaves every listing and its page, and
   *   the investor / mentor / incubator / university profile is removed;
   * - their documents, and the files behind them;
   * - their private working data: follows, saved startups, alerts, saved
   *   searches, pipeline, mandates, portfolio entries, notifications;
   * - connect requests nobody had answered yet (withdrawn).
   *
   * Before this, only the sessions and the email address were touched, so a
   * "deleted" founder's startup stayed listed and a "deleted" investor stayed
   * in the directory. Signing in with Google also still found the old account
   * and refused, which locked the person out of ever coming back.
   */
  async deleteAccount(userId: string): Promise<void> {
    const now = new Date();

    const documents = await this.prisma.$transaction(async (tx) => {
      await revokeUserSessions(tx, userId);
      await tx.oAuthAccount.deleteMany({ where: { userId } });
      await tx.otpCode.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.mfaRecoveryCode.deleteMany({ where: { userId } });

      const ownDocuments = await tx.document.findMany({ where: { userId }, select: { fileUrl: true } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.documentGrant.deleteMany({ where: { OR: [{ grantedToId: userId }, { grantedById: userId }] } });

      await tx.startup.updateMany({ where: { ownerId: userId }, data: { deletedAt: now, isPublic: false } });
      await tx.investor.deleteMany({ where: { ownerId: userId } });
      await tx.mentorProfile.deleteMany({ where: { ownerId: userId } });
      await tx.incubatorProfile.deleteMany({ where: { ownerId: userId } });
      await tx.universityProfile.deleteMany({ where: { ownerId: userId } });
      await tx.serviceProviderProfile.deleteMany({ where: { ownerId: userId } });
      await tx.jobSeekerProfile.deleteMany({ where: { ownerId: userId } });
      await tx.userProfile.deleteMany({ where: { userId } });

      await tx.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } });
      await tx.startupFollow.deleteMany({ where: { investorId: userId } });
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

      return ownDocuments;
    });

    // The stored files go only once the rows are gone for certain. Best effort:
    // a storage hiccup must not undo, or fail, a deletion the person asked for.
    for (const document of documents) {
      const stillReferenced = await this.prisma.document.count({ where: { fileUrl: document.fileUrl } });
      if (stillReferenced === 0) await this.mediaService.deleteByUrl(document.fileUrl);
    }
    this.logger.log(`Account ${userId} deleted at its owner's request (${documents.length} stored file(s) removed).`);
  }
}
