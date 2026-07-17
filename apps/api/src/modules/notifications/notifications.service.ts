import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { NotificationType, type NotificationListFilters } from "@vittamhub/types";
import { buildPaginatedResult, paginationToOffset } from "@vittamhub/utils";

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

  async listForUser(userId: string, filters: NotificationListFilters) {
    const { skip, take } = paginationToOffset(filters.page, filters.pageSize);
    const [items, totalItems] = await Promise.all([
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip, take }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return buildPaginatedResult(items, totalItems, filters.page, filters.pageSize);
  }

  markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  /**
   * Polled every few seconds by the dashboard bell (see useUnreadNotificationCount)
   * — the pragmatic "real-time" for an MVP without websocket infra yet; swap
   * for a push/SSE channel later without changing this contract.
   */
  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
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

  @OnEvent("connection.info-requested")
  handleInfoRequested(payload: { requesterId: string; recipientName: string }) {
    return this.create({
      userId: payload.requesterId,
      type: "SYSTEM",
      title: "More information requested",
      body: `${payload.recipientName} asked for more information on your connect request.`,
    });
  }

  @OnEvent("meeting.scheduled")
  handleMeetingScheduled(payload: { userId: string; schedulerName: string }) {
    return this.create({
      userId: payload.userId,
      type: "MEETING_SCHEDULED",
      title: "Meeting scheduled",
      body: `${payload.schedulerName} proposed a meeting time.`,
    });
  }

  /** Emitted by VerificationEngineService once a profile's status automatically reaches VERIFIED — no admin action involved. */
  @OnEvent("profile.verified")
  handleProfileVerified(payload: { userId: string; entityType: string }) {
    return this.create({
      userId: payload.userId,
      type: "PROFILE_VERIFIED",
      title: "Profile verified",
      body: `Your ${payload.entityType.replace(/([A-Z])/g, " $1").trim().toLowerCase()} profile is now verified.`,
    });
  }

  @OnEvent("mentor.booking-requested")
  handleMentorBookingRequested(payload: { mentorId: string; founderName: string }) {
    return this.create({
      userId: payload.mentorId,
      type: "MENTOR_BOOKING_REQUESTED",
      title: "New session request",
      body: `${payload.founderName} requested a mentoring session.`,
    });
  }

  @OnEvent("mentor.booking-responded")
  handleMentorBookingResponded(payload: { founderId: string; mentorName: string; status: "ACCEPTED" | "DECLINED" }) {
    return this.create({
      userId: payload.founderId,
      type: "MENTOR_BOOKING_RESPONDED",
      title: payload.status === "ACCEPTED" ? "Session request accepted" : "Session request declined",
      body:
        payload.status === "ACCEPTED"
          ? `${payload.mentorName} accepted your session request.`
          : `${payload.mentorName} declined your session request.`,
    });
  }

  @OnEvent("hiring.applied")
  handleHiringApplied(payload: { founderId: string; applicantName: string; jobTitle: string }) {
    return this.create({
      userId: payload.founderId,
      type: "JOB_APPLICATION_RECEIVED",
      title: "New job application",
      body: `${payload.applicantName} applied to "${payload.jobTitle}".`,
    });
  }

  @OnEvent("hiring.application-responded")
  handleHiringApplicationResponded(payload: { applicantId: string; jobTitle: string; status: string }) {
    return this.create({
      userId: payload.applicantId,
      type: "JOB_APPLICATION_STATUS_CHANGED",
      title: "Application status updated",
      body: `Your application to "${payload.jobTitle}" is now ${payload.status.toLowerCase()}.`,
    });
  }

  /** Emitted by ProfileViewsService — throttled to at most once per investor per startup per day, so a founder never gets spammed by repeat views. */
  @OnEvent("startup.profile-viewed")
  handleProfileViewed(payload: { founderId: string; viewerName: string }) {
    return this.create({
      userId: payload.founderId,
      type: "PROFILE_VIEWED",
      title: "New profile view",
      body: `${payload.viewerName} viewed your startup profile.`,
    });
  }

  /** Only fires when someone else comments on your post — likes stay silent, too noisy for a notification. */
  @OnEvent("post.commented")
  handlePostCommented(payload: { userId: string; commenterName: string; postId: string }) {
    return this.create({
      userId: payload.userId,
      type: "POST_COMMENTED",
      title: "New comment",
      body: `${payload.commenterName} commented on your post.`,
      linkUrl: `/community?post=${payload.postId}`,
    });
  }

  @OnEvent("mentor.review-submitted")
  handleFounderReviewSubmitted(payload: { founderId: string; mentorName: string }) {
    return this.create({
      userId: payload.founderId,
      type: "FOUNDER_REVIEW_RECEIVED",
      title: "New review",
      body: `${payload.mentorName} left you a review after your session.`,
    });
  }

  @OnEvent("user.followed")
  handleNewFollower(payload: { followingId: string; followerName: string }) {
    return this.create({
      userId: payload.followingId,
      type: "NEW_FOLLOWER",
      title: "New follower",
      body: `${payload.followerName} started following you.`,
    });
  }
}
