import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
   * Soft delete (existing `deletedAt` column) rather than a hard delete, so
   * FK history (audit logs, past connections/messages) survives — see
   * docs/09-authentication-security.md. Email is anonymized so the address
   * frees up for reuse, and every refresh token is revoked to force logout
   * everywhere immediately.
   */
  async softDelete(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      return tx.user.update({
        where: { id: userId },
        data: { deletedAt: new Date(), email: `deleted-${userId}@deleted.vittamhub.local` },
      });
    });
  }
}
