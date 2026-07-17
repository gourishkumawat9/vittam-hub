import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./database/prisma/prisma.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { CommunityModule } from "./modules/community/community.module";
import { ConnectionsModule } from "./modules/connections/connections.module";
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { FollowsModule } from "./modules/follows/follows.module";
import { FutureModulesModule } from "./modules/future-modules/future-modules.module";
import { HiringModule } from "./modules/hiring/hiring.module";
import { IncubatorsModule } from "./modules/incubators/incubators.module";
import { InvestorsModule } from "./modules/investors/investors.module";
import { MediaModule } from "./modules/media/media.module";
import { MentorsModule } from "./modules/mentors/mentors.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { PipelineModule } from "./modules/pipeline/pipeline.module";
import { PortfolioModule } from "./modules/portfolio/portfolio.module";
import { SearchModule } from "./modules/search/search.module";
import { ServiceProvidersModule } from "./modules/service-providers/service-providers.module";
import { StartupsModule } from "./modules/startups/startups.module";
import { UniversitiesModule } from "./modules/universities/universities.module";
import { UsersModule } from "./modules/users/users.module";
import { VerificationModule } from "./modules/verification/verification.module";
import { WatchlistModule } from "./modules/watchlist/watchlist.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
        limit: Number(process.env.RATE_LIMIT_MAX ?? 100),
      },
    ]),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({ connection: { url: process.env.REDIS_URL } }),
    PrismaModule,

    // Domain modules — see docs/07-backend-architecture.md for the module
    // boundary rules (no module reaches into another's Prisma models directly;
    // cross-module reads go through the other module's exported service).
    UsersModule,
    AuthModule,
    StartupsModule,
    InvestorsModule,
    OnboardingModule,
    ConnectionsModule,
    DiscoveryModule,
    NotificationsModule,
    BillingModule,
    MediaModule,
    AuditLogModule,
    AdminModule,
    FutureModulesModule,
    WatchlistModule,
    PipelineModule,
    PortfolioModule,
    AnalyticsModule,
    DocumentsModule,
    VerificationModule,
    MentorsModule,
    IncubatorsModule,
    HiringModule,
    CommunityModule,
    UniversitiesModule,
    ServiceProvidersModule,
    FollowsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    // Order matters: rate-limit first, then authenticate, then authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
