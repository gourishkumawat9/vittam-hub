import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma/prisma.service";

// Prisma's generated `AuditLogUncheckedCreateInput` is the exact shape
// `create()` accepts for a scalar (non-relation) FK like `actorId` — reusing
// it instead of a hand-rolled interface keeps this in lockstep with the schema.
type RecordActionInput = Prisma.AuditLogUncheckedCreateInput;

/**
 * Append-only audit trail. Every admin action (verify/reject a startup,
 * change a role, refund a subscription) must call `record()` — this is
 * what compliance and incident response reach for, not application logs.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: RecordActionInput) {
    return this.prisma.auditLog.create({ data: input });
  }

  listForEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
    });
  }
}
