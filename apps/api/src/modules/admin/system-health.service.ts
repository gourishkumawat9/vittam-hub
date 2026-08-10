import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Queue } from "bullmq";

import { PrismaService } from "../../database/prisma/prisma.service";
import { EMAIL_QUEUE_NAME } from "../jobs/email-queue.constants";

/** Cap on any single probe so one hung dependency can't stall the whole panel. */
const PROBE_TIMEOUT_MS = 3_000;

export type DependencyState = "OPERATIONAL" | "DEGRADED" | "NOT_CONFIGURED" | "DOWN";

export interface DependencyStatus {
  name: string;
  state: DependencyState;
  detail: string;
  /** True when the feature this powers is unavailable to users right now. */
  userFacingImpact: boolean;
}

/**
 * The operator's answer to "is VittamHub actually working?".
 *
 * Written after the API sat dead for two days without anyone noticing: Neon
 * became briefly unreachable, Prisma failed at boot, and there was no surface
 * anywhere that showed a dependency was down. Everything here is probed live
 * or read from configuration — nothing is assumed healthy.
 *
 * NOT_CONFIGURED is deliberately a distinct state from DOWN. Most of these
 * integrations are optional-by-design and degrade gracefully; conflating
 * "never set up" with "broken" is what let the storage and registry gaps stay
 * invisible for so long.
 */
@Injectable()
export class SystemHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue,
  ) {}

  async getStatus() {
    const [database, redis] = await Promise.all([this.probeDatabase(), this.probeRedis()]);

    const dependencies: DependencyStatus[] = [
      database,
      redis,
      this.checkEmail(),
      this.checkStorage(),
      this.checkCaptcha(),
      this.checkErrorMonitoring(),
      ...this.checkVerificationProviders(),
    ];

    // Only genuine outages of things users depend on should read as "unhealthy".
    const blocking = dependencies.filter((d) => d.userFacingImpact && (d.state === "DOWN" || d.state === "NOT_CONFIGURED"));
    const degraded = dependencies.filter((d) => d.state === "DEGRADED");

    return {
      checkedAt: new Date().toISOString(),
      overall: blocking.length > 0 ? "IMPAIRED" : degraded.length > 0 ? "DEGRADED" : "HEALTHY",
      blockingCount: blocking.length,
      dependencies,
    };
  }

  private async withTimeout<T>(work: Promise<T>): Promise<T> {
    return Promise.race([
      work,
      new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error("probe timed out")), PROBE_TIMEOUT_MS)),
    ]);
  }

  private async probeDatabase(): Promise<DependencyStatus> {
    const startedAt = Date.now();
    try {
      await this.withTimeout(this.prisma.$queryRaw`SELECT 1`);
      return {
        name: "PostgreSQL (Neon)",
        state: "OPERATIONAL",
        detail: `Responded in ${Date.now() - startedAt}ms`,
        userFacingImpact: false,
      };
    } catch (err) {
      return {
        name: "PostgreSQL (Neon)",
        state: "DOWN",
        detail: err instanceof Error ? (err.message.split("\n")[0] ?? err.message) : String(err),
        // Nothing works without the database — this is the one true outage.
        userFacingImpact: true,
      };
    }
  }

  private async probeRedis(): Promise<DependencyStatus> {
    try {
      // IRedisClient only declares the commands BullMQ itself issues; every
      // adapter implements PING.
      const client = (await this.emailQueue.client) as unknown as { ping: () => Promise<string> };
      await this.withTimeout(client.ping());
      return { name: "Redis (queues)", state: "OPERATIONAL", detail: "Queue backend responding", userFacingImpact: false };
    } catch (err) {
      return {
        name: "Redis (queues)",
        state: "DEGRADED",
        // Deliberately not user-facing: queue features degrade by design and
        // the API stays fully usable without Redis.
        detail: `Background jobs paused. ${err instanceof Error ? err.message : String(err)}`,
        userFacingImpact: false,
      };
    }
  }

  private checkEmail(): DependencyStatus {
    const configured = !!this.config.get<string>("RESEND_API_KEY");
    return {
      name: "Email (Resend)",
      state: configured ? "OPERATIONAL" : "NOT_CONFIGURED",
      detail: configured
        ? `Sending as ${this.config.get<string>("EMAIL_FROM") ?? "(no EMAIL_FROM set)"}`
        : "Verification and password-reset emails will not be delivered",
      userFacingImpact: !configured,
    };
  }

  private checkStorage(): DependencyStatus {
    const configured = !!this.config.get<string>("STORAGE_BUCKET") && !!this.config.get<string>("STORAGE_ACCESS_KEY_ID");
    return {
      name: "Object storage (R2)",
      state: configured ? "OPERATIONAL" : "NOT_CONFIGURED",
      detail: configured
        ? `Bucket ${this.config.get<string>("STORAGE_BUCKET")}`
        : "Logo, pitch-deck and document uploads cannot work until this is set",
      userFacingImpact: !configured,
    };
  }

  private checkCaptcha(): DependencyStatus {
    const configured = !!this.config.get<string>("CAPTCHA_SECRET_KEY");
    return {
      name: "Captcha (Turnstile)",
      state: configured ? "OPERATIONAL" : "NOT_CONFIGURED",
      detail: configured ? "Verifying signup and login" : "Signup/login captcha is skipped entirely",
      userFacingImpact: false,
    };
  }

  private checkErrorMonitoring(): DependencyStatus {
    const configured = !!this.config.get<string>("SENTRY_DSN");
    return {
      name: "Error monitoring (Sentry)",
      state: configured ? "OPERATIONAL" : "NOT_CONFIGURED",
      detail: configured ? "Reporting enabled" : "Production errors are only visible in raw logs",
      userFacingImpact: false,
    };
  }

  /**
   * Registry integrations are config-gated and return PENDING until a key
   * exists (CLAUDE.md §6/§8). Surfacing each one by name makes it obvious
   * that V3 verification is not actually live, rather than letting the Trust
   * Score quietly under-report forever.
   */
  private checkVerificationProviders(): DependencyStatus[] {
    const registries: Array<{ name: string; envKey: string }> = [
      { name: "MCA (company registry)", envKey: "MCA_API_KEY" },
      { name: "GSTIN", envKey: "GSTIN_API_KEY" },
      { name: "DPIIT (Startup India)", envKey: "DPIIT_API_KEY" },
      { name: "SEBI (investor registry)", envKey: "SEBI_API_KEY" },
      { name: "Patent Office", envKey: "PATENT_OFFICE_API_KEY" },
      { name: "UGC / AICTE (universities)", envKey: "UGC_AICTE_API_KEY" },
      { name: "ICAI / Bar Council", envKey: "ICAI_BAR_API_KEY" },
      { name: "DigiLocker", envKey: "DIGILOCKER_API_KEY" },
      { name: "AIM / DST (incubators)", envKey: "AIM_DST_INCUBATOR_API_KEY" },
    ];

    return registries.map(({ name, envKey }) => {
      const configured = !!this.config.get<string>(envKey);
      return {
        name: `V3 registry — ${name}`,
        state: configured ? "OPERATIONAL" : "NOT_CONFIGURED",
        detail: configured ? "Key present" : `Checks stay PENDING until ${envKey} is set`,
        userFacingImpact: false,
      };
    });
  }
}
