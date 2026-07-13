import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { NotificationType } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

interface NotifyPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: NotifyPayload) {
    return this.prisma.notification.create({ data: payload });
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  }

  markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
  }

  /** Other modules emit domain events (`this.eventEmitter.emit("connection.requested", ...)`); this module just listens and persists + fans out to email/push. */
  @OnEvent("connection.requested")
  handleConnectionRequested(payload: { recipientId: string; requesterName: string; startupName: string }) {
    return this.create({
      userId: payload.recipientId,
      type: "CONNECTION_REQUEST",
      title: "New connect request",
      body: `${payload.requesterName} (${payload.startupName}) wants to connect with you.`,
    });
  }

  @OnEvent("connection.accepted")
  handleConnectionAccepted(payload: { requesterId: string; recipientName: string }) {
    return this.create({
      userId: payload.requesterId,
      type: "CONNECTION_ACCEPTED",
      title: "Connect request accepted",
      body: `${payload.recipientName} accepted your connect request — you can now message them.`,
    });
  }

  @OnEvent("message.sent")
  handleMessageSent(payload: { recipientId: string; senderName: string; connectionId: string }) {
    return this.create({
      userId: payload.recipientId,
      type: "NEW_MESSAGE",
      title: "New message",
      body: `${payload.senderName} sent you a message.`,
      linkUrl: `/connections/${payload.connectionId}`,
    });
  }
}
