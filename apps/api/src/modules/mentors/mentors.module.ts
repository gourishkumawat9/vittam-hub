import { Module } from "@nestjs/common";

import { FounderReviewsService } from "./founder-reviews.service";
import { MentorBookingService } from "./mentor-booking.service";
import { MentorReputationService } from "./mentor-reputation.service";
import { MentorReviewsService } from "./mentor-reviews.service";
import { MentorsController } from "./mentors.controller";
import { MentorsService } from "./mentors.service";

@Module({
  controllers: [MentorsController],
  providers: [MentorsService, MentorBookingService, FounderReviewsService, MentorReviewsService, MentorReputationService],
  exports: [MentorsService],
})
export class MentorsModule {}
