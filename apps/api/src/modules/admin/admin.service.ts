import { Injectable } from "@nestjs/common";
import { VerificationStatus } from "@vittamhub/types";

import { PrismaService } from "../../database/prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  listVerificationQueue() {
    return this.prisma.startup.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
  }

  async setStartupVerification(adminId: string, startupId: string, status: VerificationStatus) {
    const startup = await this.prisma.startup.update({ where: { id: startupId }, data: { verificationStatus: status } });
    await this.auditLog.record({
      actorId: adminId,
      action: `startup.${status.toLowerCase()}`,
      entityType: "Startup",
      entityId: startupId,
    });
    return startup;
  }
}
