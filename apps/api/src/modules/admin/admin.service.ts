import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma/prisma.service";

/**
 * Read-only observability into verificationStatus across every profile
 * type — there is no approve/reject action anywhere in this module.
 * Status transitions are fully automated by VerificationEngineService
 * (see modules/verification); this is support/visibility only, per CLAUDE.md §6.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getVerificationOverview() {
    const [startupCounts, investorCounts, mentorCounts, incubatorCounts, pendingStartups, pendingInvestors, pendingMentors, pendingIncubators] =
      await Promise.all([
        this.prisma.startup.groupBy({ by: ["verificationStatus"], _count: true }),
        this.prisma.investor.groupBy({ by: ["verificationStatus"], _count: true }),
        this.prisma.mentorProfile.groupBy({ by: ["verificationStatus"], _count: true }),
        this.prisma.incubatorProfile.groupBy({ by: ["verificationStatus"], _count: true }),
        this.prisma.startup.findMany({ where: { verificationStatus: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, createdAt: true } }),
        this.prisma.investor.findMany({ where: { verificationStatus: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true, firmName: true, createdAt: true } }),
        this.prisma.mentorProfile.findMany({ where: { verificationStatus: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true, headline: true, createdAt: true } }),
        this.prisma.incubatorProfile.findMany({ where: { verificationStatus: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true, organizationName: true, createdAt: true } }),
      ]);

    return {
      counts: {
        startup: startupCounts.map((c) => ({ status: c.verificationStatus, count: c._count })),
        investor: investorCounts.map((c) => ({ status: c.verificationStatus, count: c._count })),
        mentorProfile: mentorCounts.map((c) => ({ status: c.verificationStatus, count: c._count })),
        incubatorProfile: incubatorCounts.map((c) => ({ status: c.verificationStatus, count: c._count })),
      },
      pending: {
        startup: pendingStartups,
        investor: pendingInvestors,
        mentorProfile: pendingMentors,
        incubatorProfile: pendingIncubators,
      },
    };
  }
}
