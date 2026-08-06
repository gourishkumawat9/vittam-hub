import { InjectQueue } from "@nestjs/bullmq";
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";
import type { Queue } from "bullmq";

import { Public } from "./common/decorators/public.decorator";
import { PrismaService } from "./database/prisma/prisma.service";
import { EMAIL_QUEUE_NAME } from "./modules/jobs/email-queue.constants";

/** Cap on the Redis probe so a hung connection can never stall the health check (and therefore a deploy). */
const REDIS_PROBE_TIMEOUT_MS = 2_000;

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue,
  ) {}

  /**
   * Railway's `healthcheckPath` (railway.json) gates each deploy on this
   * endpoint, so what it asserts is deliberately scoped:
   *
   * - **Postgres is a hard dependency.** Without it essentially every route
   *   500s, so a failed probe returns 503 and correctly blocks the rollout,
   *   leaving the previous deployment serving traffic.
   * - **Redis is NOT.** Queue/cron features degrade gracefully by design
   *   (see RedisCircuitBreaker and the scheduler try/catch blocks) — the API
   *   is fully usable without it, so its state is reported for observability
   *   but never fails the check. Failing here would re-introduce exactly the
   *   "Redis outage takes the whole API down" behaviour we removed.
   */
  @Public()
  @Get("health")
  @ApiExcludeEndpoint()
  async health() {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      throw new ServiceUnavailableException({
        status: "error",
        service: "api",
        database: "unreachable",
        message: err instanceof Error ? err.message : String(err),
      });
    }

    return {
      status: "ok",
      service: "api",
      database: "ok",
      redis: await this.probeRedis(),
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  }

  /** Never throws and never hangs — a degraded Redis is reported, not fatal. */
  private async probeRedis(): Promise<"ok" | "degraded"> {
    try {
      // BullMQ's IRedisClient interface only declares the commands BullMQ
      // itself issues, so PING isn't on it — but every adapter (ioredis here)
      // implements it. Deliberately a real round-trip rather than reading
      // `client.status`: a connection can sit in "ready" while Redis rejects
      // every command (exactly what an exceeded Upstash quota looked like).
      const client = (await this.emailQueue.client) as unknown as { ping: () => Promise<string> };
      await Promise.race([
        client.ping(),
        new Promise((_resolve, reject) => setTimeout(() => reject(new Error("redis ping timed out")), REDIS_PROBE_TIMEOUT_MS)),
      ]);
      return "ok";
    } catch {
      return "degraded";
    }
  }
}
