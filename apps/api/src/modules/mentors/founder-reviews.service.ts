import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import type { CreateFounderReviewInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * A mentor's review of a founder — gated on the booking being ACCEPTED
 * (there's no real session-datetime field to gate a genuine "completed"
 * state on yet; accepting already means the mentor consented to engage).
 * Feeds FounderReputationService. See FounderReview in schema.prisma.
 */
@Injectable()
export class FounderReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(mentorId: string, bookingId: string, input: CreateFounderReviewInput) {
    const booking = await this.prisma.mentorBookingRequest.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking request not found");
    if (booking.mentorId !== mentorId) throw new ForbiddenException("Not your booking to review");
    if (booking.status !== "ACCEPTED") throw new ConflictException("Only accepted bookings can be reviewed");

    try {
      const review = await this.prisma.founderReview.create({
        data: {
          mentorId,
          founderId: booking.founderId,
          bookingRequestId: bookingId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      const mentor = await this.prisma.user.findUniqueOrThrow({ where: { id: mentorId } });
      this.eventEmitter.emit("mentor.review-submitted", { founderId: booking.founderId, mentorName: mentor.fullName });

      return review;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("This booking has already been reviewed");
      }
      throw error;
    }
  }

  listForFounder(founderId: string) {
    return this.prisma.founderReview.findMany({
      where: { founderId },
      orderBy: { createdAt: "desc" },
      include: { mentor: { select: { fullName: true, avatarUrl: true } } },
    });
  }
}
