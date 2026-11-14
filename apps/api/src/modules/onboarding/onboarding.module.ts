import { Module } from "@nestjs/common";

import { MediaModule } from "../media/media.module";

import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";
import { IncubatorPublisher } from "./publishers/incubator.publisher";
import { InvestorPublisher } from "./publishers/investor.publisher";
import { JobSeekerPublisher } from "./publishers/job-seeker.publisher";
import { MentorPublisher } from "./publishers/mentor.publisher";
import { ServiceProviderPublisher } from "./publishers/service-provider.publisher";
import { StartupPublisher } from "./publishers/startup.publisher";
import { UniversityPublisher } from "./publishers/university.publisher";

@Module({
  imports: [MediaModule],
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    StartupPublisher,
    InvestorPublisher,
    MentorPublisher,
    IncubatorPublisher,
    UniversityPublisher,
    ServiceProviderPublisher,
    JobSeekerPublisher,
  ],
})
export class OnboardingModule {}
