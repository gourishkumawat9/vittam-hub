import { Injectable, NotFoundException } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import type { FollowStartupInput, UpdateWatchlistEntryInput } from "@vittamhub/types";

import { isDemoViewer } from "../../common/demo/demo-scope";
import { findListableStartup, listableStartupWhere } from "../../common/startups/startup-visibility";
import { PrismaService } from "../../database/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class WatchlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Only startups the investor could still find in discovery: one that went private or stealth leaves the list. */
  async listForInvestor(investorId: string) {
    return this.prisma.startupFollow.findMany({
      where: { investorId, startup: listableStartupWhere(await isDemoViewer(this.prisma, investorId)) },
      orderBy: { createdAt: "desc" },
      include: { startup: true },
    });
  }

  async follow(investorId: string, input: FollowStartupInput) {
    await findListableStartup(this.prisma, input.startupId, investorId);

    return this.prisma.startupFollow.upsert({
      where: { investorId_startupId: { investorId, startupId: input.startupId } },
      create: { investorId, startupId: input.startupId, notifyOnUpdate: input.notifyOnUpdate },
      update: { notifyOnUpdate: input.notifyOnUpdate },
    });
  }

  unfollow(investorId: string, startupId: string) {
    return this.prisma.startupFollow.deleteMany({ where: { investorId, startupId } });
  }

  async update(investorId: string, startupId: string, input: UpdateWatchlistEntryInput) {
    const existing = await this.prisma.startupFollow.findUnique({
      where: { investorId_startupId: { investorId, startupId } },
    });
    if (!existing) throw new NotFoundException("This startup is not on your watchlist");

    return this.prisma.startupFollow.update({
      where: { investorId_startupId: { investorId, startupId } },
      data: input,
    });
  }

  /** Investors watching this startup (notifyOnUpdate: true) — used to fan out milestone/update notifications. */
  listWatchersFor(startupId: string) {
    return this.prisma.startupFollow.findMany({ where: { startupId, notifyOnUpdate: true } });
  }

  /** Fans a new milestone out to every investor watching this startup — see MilestonesService for the emit side. */
  @OnEvent("startup.milestone.added")
  async handleMilestoneAdded(payload: { startupId: string; startupName: string; milestoneTitle: string }) {
    const watchers = await this.listWatchersFor(payload.startupId);
    await Promise.all(
      watchers.map((watcher) =>
        this.notificationsService.create({
          userId: watcher.investorId,
          type: "MILESTONE_ADDED",
          title: "New milestone",
          body: `${payload.startupName} just hit a new milestone: ${payload.milestoneTitle}`,
        }),
      ),
    );
  }
}
