import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * Day-bucketed view log — first real use of the `PROFILE_VIEWED` notification
 * type (defined since the platform's early schema, never wired to anything
 * until now). `viewDate` is the throttle: repeat same-day views from the
 * same investor just increment `viewCount`, and only the first view of a new
 * day emits a notification, so a founder never gets spammed by one investor
 * refreshing the page.
 */
@Injectable()
export class ProfileViewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async recordView(investorId: string, startupId: string) {
    const viewDate = new Date();
    viewDate.setUTCHours(0, 0, 0, 0);

    const existing = await this.prisma.startupProfileView.findUnique({
      where: { startupId_investorId_viewDate: { startupId, investorId, viewDate } },
    });

    if (existing) {
      return this.prisma.startupProfileView.update({
        where: { id: existing.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    const view = await this.prisma.startupProfileView.create({ data: { startupId, investorId, viewDate } });

    const startup = await this.prisma.startup.findUniqueOrThrow({ where: { id: startupId } });
    const investor = await this.prisma.user.findUniqueOrThrow({ where: { id: investorId } });
    this.eventEmitter.emit("startup.profile-viewed", {
      founderId: startup.ownerId,
      viewerName: investor.fullName,
    });

    return view;
  }

  listRecentForStartup(startupId: string, limit = 10) {
    return this.prisma.startupProfileView.findMany({
      where: { startupId },
      orderBy: { viewDate: "desc" },
      take: limit,
      include: {
        investor: {
          select: { fullName: true, avatarUrl: true, investorProfile: { select: { firmName: true } } },
        },
      },
    });
  }
}
