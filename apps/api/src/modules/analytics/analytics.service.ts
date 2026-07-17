import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * Every chart here is a straight aggregate over the investor's own real
 * pipeline/portfolio/connections — never a fabricated or placeholder number.
 * An investor with no activity yet gets empty arrays, not sample data.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getForInvestor(investorId: string) {
    const [portfolio, pipeline, connections] = await Promise.all([
      this.prisma.investment.findMany({ where: { investorId }, include: { startup: true } }),
      this.prisma.pipelineEntry.findMany({ where: { investorId }, include: { startup: true } }),
      this.prisma.connection.findMany({ where: { recipientId: investorId } }),
    ]);

    const byIndustry = this.countBy(portfolio, (p) => p.startup.industry);
    const byGeography = this.countBy(portfolio, (p) => p.startup.headquarters ?? p.startup.location);
    const byStage = this.countBy(portfolio, (p) => p.startup.stage);
    const pipelineByStage = this.countBy(pipeline, (p) => p.stage);

    const meetings = await this.prisma.meeting.count({
      where: { connection: { OR: [{ requesterId: investorId }, { recipientId: investorId }] } },
    });
    const acceptedConnections = await this.prisma.connection.count({
      where: { recipientId: investorId, status: "ACCEPTED" },
    });

    return {
      industries: byIndustry,
      investmentDistribution: byIndustry,
      geography: byGeography,
      stage: byStage,
      pipeline: pipelineByStage,
      meetingConversion: { meetings, acceptedConnections },
      totalInvestments: portfolio.length,
      totalPipelineEntries: pipeline.length,
      connectionsReceived: connections.length,
    };
  }

  private countBy<T>(items: T[], key: (item: T) => string): { label: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const item of items) {
      const label = key(item);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
  }
}
