import { Injectable, NotFoundException } from "@nestjs/common";
import UAParser from "ua-parser-js";

import { PrismaService } from "../../../database/prisma/prisma.service";

import { revokeUserSessions } from "./session-revocation";

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** "Chrome on macOS", "Safari on iPhone", etc. — falls back gracefully for unrecognized/absent user agents. */
  parseDeviceLabel(userAgent: string | undefined): string {
    if (!userAgent) return "Unknown device";
    const { browser, os } = new UAParser(userAgent).getResult();
    const browserName = browser.name ?? "Unknown browser";
    const osName = os.name ?? "Unknown OS";
    return `${browserName} on ${osName}`;
  }

  async listActiveSessions(userId: string, currentTokenHash: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceLabel: session.deviceLabel,
      ipAddress: session.ipAddress,
      lastUsedAt: session.lastUsedAt,
      createdAt: session.createdAt,
      isCurrent: session.tokenHash === currentTokenHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    // Looked up by id *and* owner, so someone else's session id is simply "not found"
    // rather than a different answer that confirms the id exists.
    const session = await this.prisma.refreshToken.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException("Session not found");

    await this.prisma.refreshToken.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Signs out everywhere except the current session — the "log out all other devices" action. */
  async revokeAllOtherSessions(userId: string, currentTokenHash: string): Promise<void> {
    await revokeUserSessions(this.prisma, userId, currentTokenHash || undefined);
  }
}
