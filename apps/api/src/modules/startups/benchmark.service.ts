import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

const MIN_PEER_SAMPLE = 3; // below this, a percentile claim would be fabricated precision off noise — CLAUDE.md §2

/**
 * "Your growth is top 22% of seed fintech in India" (spec §"founder
 * dashboard... benchmark vs peers"). Computed live from real peer traction
 * data, same industry + stage, never a canned/sample number. Below
 * MIN_PEER_SAMPLE real peers with a growth rate on file, this returns
 * `percentile: null` with a reason instead of a number — a 1-peer
 * "percentile" would be a fabricated-precision claim, not a real statistic.
 */
@Injectable()
export class BenchmarkService {
  constructor(private readonly prisma: PrismaService) {}

  async growthPercentile(startupId: string) {
    const startup = await this.prisma.startup.findUnique({ where: { id: startupId }, select: { industry: true, stage: true } });
    if (!startup) throw new NotFoundException("Startup not found");

    const mine = await this.prisma.startupTraction.findUnique({ where: { startupId }, select: { growthRatePercent: true } });
    if (mine?.growthRatePercent == null) {
      return { percentile: null, sampleSize: 0, industry: startup.industry, stage: startup.stage, reason: "No growth rate on file yet" };
    }

    const peers = await this.prisma.startupTraction.findMany({
      where: {
        growthRatePercent: { not: null },
        startupId: { not: startupId },
        startup: { industry: startup.industry, stage: startup.stage, isPublic: true },
      },
      select: { growthRatePercent: true },
    });
    const peerRates = peers.map((p) => Number(p.growthRatePercent));

    if (peerRates.length < MIN_PEER_SAMPLE) {
      return {
        percentile: null,
        sampleSize: peerRates.length,
        industry: startup.industry,
        stage: startup.stage,
        reason: `Only ${peerRates.length} comparable peer${peerRates.length === 1 ? "" : "s"} on file — need at least ${MIN_PEER_SAMPLE}`,
      };
    }

    const mineNum = Number(mine.growthRatePercent);
    const below = peerRates.filter((r) => r < mineNum).length;
    const percentile = Math.round((below / peerRates.length) * 100);

    return { percentile, sampleSize: peerRates.length, industry: startup.industry, stage: startup.stage };
  }
}
