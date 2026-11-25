import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { CreateMentorBookingInput, MentorBookingResponseAction } from "@vittamhub/types";

import { inSameSandbox } from "../../common/demo/demo-scope";
import { PrismaService } from "../../database/prisma/prisma.service";

const RESPONSE_ACTION_TO_STATUS: Record<MentorBookingResponseAction, "ACCEPTED" | "DECLINED"> = {
  ACCEPT: "ACCEPTED",
  DECLINE: "DECLINED",
};

/** The most booking requests one list call returns. */
const MAX_LISTED = 200;

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

  listForUser(userId: string) {
    return this.prisma.mentorBookingRequest.findMany({
      where: { OR: [{ founderId: userId }, { mentorId: userId }] },
      orderBy: { createdAt: "desc" },
      take: MAX_LISTED,
      include: {
        founder: { select: { id: true, fullName: true, avatarUrl: true } },
        mentor: { select: { id: true, fullName: true, avatarUrl: true } },
        startup: { select: { id: true, name: true, slug: true, logoUrl: true, stage: true, tagline: true } },
      },
    });
  }
}
