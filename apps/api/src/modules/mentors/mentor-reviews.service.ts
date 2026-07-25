import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import type { CreateMentorReviewInput } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * The founder's review of a mentor — spec §5's actual mentor-trust
 * mechanism ("reputation is earned"). Mirrors FounderReviewsService exactly,
 * direction reversed: gated on the booking being ACCEPTED, one review per
 * booking (unique constraint), and it's the founder — not the mentor — who
 * calls `create()` here.
 */
@Injectable()
export class MentorReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(founderId: string, bookingId: string, input: CreateMentorReviewInput) {
    const booking = await this.prisma.mentorBookingRequest.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking request not found");
    if (booking.founderId !== founderId) throw new ForbiddenException("Not your booking to review");
    if (booking.status !== "ACCEPTED") throw new ConflictException("Only accepted bookings can be reviewed");

    try {
      const review = await this.prisma.mentorReview.create({
        data: {
          mentorId: booking.mentorId,
          founderId,
          bookingRequestId: bookingId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      const founder = await this.prisma.user.findUniqueOrThrow({ where: { id: founderId } });
      this.eventEmitter.emit("founder.mentor-review-submitted", { mentorId: booking.mentorId, founderName: founder.fullName });

      return review;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("This booking has already been reviewed");
      }
      throw error;
    }
  }

  listForMentor(mentorId: string) {
    return this.prisma.mentorReview.findMany({
      where: { mentorId },
      orderBy: { createdAt: "desc" },
      include: { founder: { select: { fullName: true, avatarUrl: true } } },
    });
  }
}
