import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { CreateMentorBookingInput, MentorBookingResponseAction } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

const RESPONSE_ACTION_TO_STATUS: Record<MentorBookingResponseAction, "ACCEPTED" | "DECLINED"> = {
  ACCEPT: "ACCEPTED",
  DECLINE: "DECLINED",
};

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
    if (!mentorProfile) throw new NotFoundException("Mentor not found");

    const startup = await this.prisma.startup.findUnique({ where: { ownerId: founderId } });

    const booking = await this.prisma.mentorBookingRequest.create({
      data: {
        founderId,
        mentorId: mentorProfile.ownerId,
        startupId: startup?.id,
        sessionType: input.sessionType,
        message: input.message,
        preferredTimes: input.preferredTimes,
      },
    });

    const founder = await this.prisma.user.findUniqueOrThrow({ where: { id: founderId } });
    this.eventEmitter.emit("mentor.booking-requested", { mentorId: mentorProfile.ownerId, founderName: founder.fullName });

    return booking;
  }

  async respond(bookingId: string, mentorId: string, action: MentorBookingResponseAction) {
    const booking = await this.prisma.mentorBookingRequest.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking request not found");
    if (booking.mentorId !== mentorId) throw new ForbiddenException("Not your booking request to respond to");
    if (booking.status !== "PENDING") throw new ConflictException("This booking request has already been responded to");

    const status = RESPONSE_ACTION_TO_STATUS[action];
    const updated = await this.prisma.mentorBookingRequest.update({
      where: { id: bookingId },
      data: { status, respondedAt: new Date() },
    });

    const mentor = await this.prisma.user.findUniqueOrThrow({ where: { id: mentorId } });
    this.eventEmitter.emit("mentor.booking-responded", { founderId: booking.founderId, mentorName: mentor.fullName, status });

    return updated;
  }

  listForUser(userId: string) {
    return this.prisma.mentorBookingRequest.findMany({
      where: { OR: [{ founderId: userId }, { mentorId: userId }] },
      orderBy: { createdAt: "desc" },
      include: {
        founder: { select: { id: true, fullName: true, avatarUrl: true } },
        mentor: { select: { id: true, fullName: true, avatarUrl: true } },
        startup: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });
  }
}
