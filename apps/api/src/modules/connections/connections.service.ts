import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { Prisma } from "@prisma/client";
import type {
  ConnectionListFilters,
  ConnectionResponseAction,
  CreateConnectionInput,
  CreateMessageInput,
  ScheduleMeetingInput,
} from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { PlanLimitsService } from "../plan-limits/plan-limits.service";

const RESPONSE_ACTION_TO_STATUS: Record<ConnectionResponseAction, "ACCEPTED" | "DECLINED" | "IGNORED"> = {
  ACCEPT: "ACCEPTED",
  DECLINE: "DECLINED",
  IGNORE: "IGNORED",
};

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimits: PlanLimitsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * The only way a founder can reach an investor — see docs/12-connect-requests.md.
   * `startupId` always comes from the requester's own (single) startup, never
   * from the request body, so a founder can never impersonate another startup.
   */
  async create(requesterId: string, input: CreateConnectionInput) {
    const startup = await this.prisma.startup.findUnique({ where: { ownerId: requesterId } });
    if (!startup) {
      throw new BadRequestException("Complete your startup profile before sending connect requests.");
    }

    const recipient = await this.prisma.user.findUnique({ where: { id: input.recipientId } });
    if (!recipient) throw new NotFoundException("Investor not found");
    if (recipient.role !== "INVESTOR") {
      throw new BadRequestException("Connect requests can only be sent to investors.");
    }

    await this.assertUnderMonthlyQuota(requesterId);

    try {
      const connection = await this.prisma.connection.create({
        data: {
          requesterId,
          recipientId: input.recipientId,
          startupId: startup.id,
          introduction: input.introduction,
          fundingRequirementUsd: input.fundingRequirementUsd,
          pitchDeckUrl: input.pitchDeckUrl,
          executiveSummaryUrl: input.executiveSummaryUrl,
          demoLinkUrl: input.demoLinkUrl,
        },
      });

      const requester = await this.prisma.user.findUniqueOrThrow({ where: { id: requesterId } });
      this.eventEmitter.emit("connection.requested", {
        recipientId: recipient.id,
        requesterName: requester.fullName,
        startupName: startup.name,
      });

      return connection;
    } catch {
      throw new ConflictException("A connection request already exists between these users");
    }
  }

  private async assertUnderMonthlyQuota(founderId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId: founderId } });
    const plan = subscription?.plan ?? "FREE";
    const limit = await this.planLimits.getMonthlyConnectRequestLimit(plan);
    if (limit === null) return; // unlimited

    const sentThisMonth = await this.prisma.connection.count({
      where: { requesterId: founderId, createdAt: { gte: startOfCurrentMonth() } },
    });
    if (sentThisMonth >= limit) {
      throw new ForbiddenException(
        `You've reached your ${limit} connect request${limit === 1 ? "" : "s"} this month on the ${plan} plan. Upgrade to send more.`,
      );
    }
  }

  async respond(connectionId: string, recipientId: string, action: ConnectionResponseAction) {
    const connection = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection) throw new NotFoundException("Connection request not found");
    if (connection.recipientId !== recipientId) throw new ForbiddenException("Not your connection request to respond to");
    if (connection.status !== "PENDING") throw new ConflictException("This connection request has already been responded to");

    const status = RESPONSE_ACTION_TO_STATUS[action];
    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status, respondedAt: new Date() },
    });

    if (status === "ACCEPTED") {
      const recipient = await this.prisma.user.findUniqueOrThrow({ where: { id: recipientId } });
      this.eventEmitter.emit("connection.accepted", {
        requesterId: connection.requesterId,
        recipientName: recipient.fullName,
      });
    }

    await this.auditLog.record({
      actorId: recipientId,
      action: `connection.${status.toLowerCase()}`,
      entityType: "Connection",
      entityId: connectionId,
      metadata: { action },
    });

    return updated;
  }

  async listForUser(userId: string, filters: ConnectionListFilters) {
    const where: Prisma.ConnectionWhereInput = {
      OR: [{ requesterId: userId }, { recipientId: userId }],
      ...(filters.status?.length ? { status: { in: filters.status } } : {}),
    };

    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          startup: { select: { id: true, name: true, slug: true, logoUrl: true, tagline: true } },
          requester: { select: { id: true, fullName: true, avatarUrl: true } },
          recipient: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      this.prisma.connection.count({ where }),
    ]);

    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  /** Doesn't change status — just flags to the founder that the investor wants more detail before deciding. */
  async requestMoreInfo(connectionId: string, recipientId: string) {
    const connection = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection) throw new NotFoundException("Connection request not found");
    if (connection.recipientId !== recipientId) throw new ForbiddenException("Not your connection request");

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { infoRequestedAt: new Date() },
    });

    const recipient = await this.prisma.user.findUniqueOrThrow({ where: { id: recipientId } });
    this.eventEmitter.emit("connection.info-requested", {
      requesterId: connection.requesterId,
      recipientName: recipient.fullName,
    });

    return updated;
  }

  /** Either party can propose a time — allowed before acceptance too (an intro call can happen ahead of a formal Accept). */
  async scheduleMeeting(connectionId: string, callerId: string, input: ScheduleMeetingInput) {
    const connection = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection) throw new NotFoundException("Connection not found");
    if (connection.requesterId !== callerId && connection.recipientId !== callerId) {
      throw new ForbiddenException("You're not part of this connection");
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        connectionId,
        scheduledAt: new Date(input.scheduledAt),
        notes: input.notes,
        videoCallUrl: input.videoCallUrl,
      },
    });

    const otherPartyId = connection.requesterId === callerId ? connection.recipientId : connection.requesterId;
    const caller = await this.prisma.user.findUniqueOrThrow({ where: { id: callerId } });
    this.eventEmitter.emit("meeting.scheduled", { userId: otherPartyId, schedulerName: caller.fullName });

    return meeting;
  }

  listMeetings(connectionId: string) {
    return this.prisma.meeting.findMany({ where: { connectionId }, orderBy: { scheduledAt: "asc" } });
  }

  /** Every meeting across every one of the caller's connections — backs the dashboard card and the Meetings page. */
  listMyMeetings(userId: string) {
    return this.prisma.meeting.findMany({
      where: { connection: { OR: [{ requesterId: userId }, { recipientId: userId }] } },
      orderBy: { scheduledAt: "asc" },
      include: {
        connection: {
          select: {
            id: true,
            requester: { select: { fullName: true } },
            recipient: { select: { fullName: true } },
            startup: { select: { name: true, logoUrl: true } },
          },
        },
      },
    });
  }

  async getQuota(founderId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId: founderId } });
    const plan = subscription?.plan ?? "FREE";
    const limit = await this.planLimits.getMonthlyConnectRequestLimit(plan);
    const used = await this.prisma.connection.count({
      where: { requesterId: founderId, createdAt: { gte: startOfCurrentMonth() } },
    });
    return { plan, limit, used, remaining: limit === null ? null : Math.max(limit - used, 0) };
  }

  // ─── Messaging — unlocked only once the connection is ACCEPTED ──────────

  private async assertCanMessage(connectionId: string, callerId: string) {
    const connection = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    if (!connection) throw new NotFoundException("Connection not found");
    if (connection.requesterId !== callerId && connection.recipientId !== callerId) {
      throw new ForbiddenException("You're not part of this conversation");
    }
    if (connection.status !== "ACCEPTED") {
      throw new ForbiddenException("You can only message after the connect request is accepted");
    }
    return connection;
  }

  async listMessages(connectionId: string, callerId: string) {
    await this.assertCanMessage(connectionId, callerId);
    return this.prisma.message.findMany({ where: { connectionId }, orderBy: { createdAt: "asc" } });
  }

  async sendMessage(connectionId: string, senderId: string, input: CreateMessageInput) {
    const connection = await this.assertCanMessage(connectionId, senderId);
    const message = await this.prisma.message.create({
      data: { connectionId, senderId, body: input.body, attachmentUrl: input.attachmentUrl },
    });

    const sender = await this.prisma.user.findUniqueOrThrow({ where: { id: senderId } });
    const recipientId = connection.requesterId === senderId ? connection.recipientId : connection.requesterId;
    this.eventEmitter.emit("message.sent", { recipientId, senderName: sender.fullName, connectionId });

    return message;
  }
}
