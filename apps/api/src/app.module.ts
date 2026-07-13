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
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BillingModule } from "./modules/billing/billing.module";
import { ConnectionsModule } from "./modules/connections/connections.module";
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { InvestorsModule } from "./modules/investors/investors.module";
import { MediaModule } from "./modules/media/media.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { StartupsModule } from "./modules/startups/startups.module";
import { UsersModule } from "./modules/users/users.module";

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
