import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { CreateMentorBookingInput, MentorBookingResponseAction, ScheduleMentorSessionInput } from "@vittamhub/types";

import { inSameSandbox } from "../../common/demo/demo-scope";
import { PrismaService } from "../../database/prisma/prisma.service";

const RESPONSE_ACTION_TO_STATUS: Record<MentorBookingResponseAction, "ACCEPTED" | "DECLINED"> = {
  ACCEPT: "ACCEPTED",
  DECLINE: "DECLINED",
};

/** The most booking requests one list call returns. */
const MAX_LISTED = 200;

/** How far ahead a session can be set. */
const MAX_SCHEDULE_AHEAD_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * A founder requesting time with a mentor — deliberately not a Connection:
 * no monthly quota, repeatable per pair, no messaging/meeting gate (see
 * MentorBookingRequest in schema.prisma for the full rationale).
 */
@Injectable()
export class MentorBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async book(founderId: string, mentorProfileId: string, input: CreateMentorBookingInput) {
    const mentorProfile = await this.prisma.mentorProfile.findUnique({ where: { id: mentorProfileId } });
    // Demo and real accounts never interact (common/demo/demo-scope.ts).
    if (!mentorProfile || !(await inSameSandbox(this.prisma, founderId, mentorProfile.ownerId))) throw new NotFoundException("Mentor not found");
    const mentorId = mentorProfile.ownerId;
    if (mentorId === founderId) throw new BadRequestException("You can't book a session with yourself");

    // Repeatable per pair, but one at a time: every request notifies the
    // mentor, and nothing stopped a founder sending the same one fifty times.
    // The lock makes "is one already waiting?" and the insert a single step.
    const booking = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`mentor-booking:${founderId}:${mentorId}`}))`;

      const waiting = await tx.mentorBookingRequest.findFirst({
        where: { founderId, mentorId, status: "PENDING" },
        select: { id: true },
      });
      if (waiting) {
        throw new ConflictException("You already have a request waiting with this mentor. You can send another once they reply.");
      }

      const startup = await tx.startup.findUnique({ where: { ownerId: founderId }, select: { id: true } });
      return tx.mentorBookingRequest.create({
        data: {
          founderId,
          mentorId,
          startupId: startup?.id,
          sessionType: input.sessionType,
          message: input.message,
          preferredTimes: input.preferredTimes,
        },
      });
    });

    const founder = await this.prisma.user.findUniqueOrThrow({ where: { id: founderId } });
    this.eventEmitter.emit("mentor.booking-requested", { mentorId, founderName: founder.fullName });

    return booking;
  }

  async respond(bookingId: string, mentorId: string, action: MentorBookingResponseAction) {
    const booking = await this.prisma.mentorBookingRequest.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking request not found");
    if (booking.mentorId !== mentorId) throw new ForbiddenException("Not your booking request to respond to");

    const status = RESPONSE_ACTION_TO_STATUS[action];
    // Answered only if it is still waiting at the moment of the write, so two taps can't both land.
    const answered = await this.prisma.mentorBookingRequest.updateMany({
      where: { id: bookingId, status: "PENDING" },
      data: { status, respondedAt: new Date() },
    });
    if (answered.count === 0) throw new ConflictException("This booking request has already been responded to");

    const mentor = await this.prisma.user.findUniqueOrThrow({ where: { id: mentorId } });
    this.eventEmitter.emit("mentor.booking-responded", { founderId: booking.founderId, mentorName: mentor.fullName, status });

    return this.prisma.mentorBookingRequest.findUniqueOrThrow({ where: { id: bookingId } });
  }

  /**
   * The mentor sets when an accepted session happens, and where. Setting it
   * again changes it, so this is also how a session is moved.
   */
  async schedule(bookingId: string, mentorId: string, input: ScheduleMentorSessionInput) {
    const booking = await this.prisma.mentorBookingRequest.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Session not found");
    if (booking.mentorId !== mentorId) throw new ForbiddenException("Not your session to schedule");
    if (booking.status !== "ACCEPTED") throw new ConflictException("Accept the request before setting a time");
    if (booking.completedAt) throw new ConflictException("This session is already marked done");

    const scheduledAt = new Date(input.scheduledAt);
    const now = Date.now();
    if (scheduledAt.getTime() <= now) throw new BadRequestException("Pick a time that hasn't passed yet");
    if (scheduledAt.getTime() - now > MAX_SCHEDULE_AHEAD_MS) throw new BadRequestException("Pick a time within the next year");

    const updated = await this.prisma.mentorBookingRequest.update({
      where: { id: bookingId },
      data: {
        scheduledAt,
        durationMinutes: input.durationMinutes,
        meetingUrl: input.meetingUrl ?? null,
        mentorNote: input.note ?? null,
      },
    });

    const mentor = await this.prisma.user.findUniqueOrThrow({ where: { id: mentorId } });
    this.eventEmitter.emit("mentor.session-scheduled", {
      founderId: booking.founderId,
      mentorName: mentor.fullName,
      rescheduled: booking.scheduledAt !== null,
    });

    return updated;
  }

  /**
   * Either side marks an accepted session done once it has happened. A
   * session with a time can't be marked done before that time.
   */
  async complete(bookingId: string, userId: string) {
    const booking = await this.prisma.mentorBookingRequest.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Session not found");
    if (booking.mentorId !== userId && booking.founderId !== userId) throw new ForbiddenException("Not your session");
    if (booking.status !== "ACCEPTED") throw new ConflictException("Only an accepted session can be marked done");
    if (booking.scheduledAt && booking.scheduledAt.getTime() > Date.now()) {
      throw new ConflictException("This session hasn't happened yet");
    }

    // Done only if it isn't already, so two taps (or both sides at once) land once.
    const marked = await this.prisma.mentorBookingRequest.updateMany({
      where: { id: bookingId, status: "ACCEPTED", completedAt: null },
      data: { completedAt: new Date() },
    });
    if (marked.count === 0) throw new ConflictException("This session is already marked done");

    const byMentor = booking.mentorId === userId;
    const marker = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    this.eventEmitter.emit("mentor.session-completed", {
      notifyUserId: byMentor ? booking.founderId : booking.mentorId,
      markedByName: marker.fullName,
      notifyIsFounder: byMentor,
    });

    return this.prisma.mentorBookingRequest.findUniqueOrThrow({ where: { id: bookingId } });
  }

  /**
   * Every booking the user is on, sent or received. `reviewedByMe` says
   * whether the caller has already reviewed the other side for it; whether
   * the other side reviewed them is not shared.
   */
  async listForUser(userId: string) {
    const bookings = await this.prisma.mentorBookingRequest.findMany({
      where: { OR: [{ founderId: userId }, { mentorId: userId }] },
      orderBy: { createdAt: "desc" },
      take: MAX_LISTED,
      include: {
        founder: { select: { id: true, fullName: true, avatarUrl: true } },
        mentor: { select: { id: true, fullName: true, avatarUrl: true } },
        startup: { select: { id: true, name: true, slug: true, logoUrl: true, stage: true, tagline: true } },
        review: { select: { id: true } },
        mentorReview: { select: { id: true } },
      },
    });
    return bookings.map(({ review, mentorReview, ...booking }) => ({
      ...booking,
      reviewedByMe: booking.mentorId === userId ? review !== null : mentorReview !== null,
    }));
  }
}
