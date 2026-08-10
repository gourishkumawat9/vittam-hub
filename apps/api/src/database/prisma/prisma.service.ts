import { INestApplication, OnModuleDestroy, OnModuleInit , Injectable, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
    });
  }

  /**
   * Retry the initial connection with backoff instead of letting a single
   * failed attempt abort Nest's bootstrap.
   *
   * This is not theoretical: a transient Neon outage took the API down and it
   * stayed down. `$connect()` threw during onModuleInit, Nest aborted startup,
   * the process exited, and Railway's `restartPolicyMaxRetries: 3` was
   * exhausted within seconds — so the service sat dead long after the database
   * came back, needing a manual redeploy. Neon's serverless compute also
   * auto-suspends when idle and takes a moment to wake, which is exactly the
   * kind of blip this must ride out.
   *
   * Prisma reconnects on its own for queries after startup; this only covers
   * the boot-time window.
   */
  async onModuleInit() {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        this.logger.log(`Database connection established${attempt > 1 ? ` (attempt ${attempt})` : ""}`);
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message.split("\n")[0] : String(err);
        if (attempt === maxAttempts) {
          this.logger.error(`Could not reach the database after ${maxAttempts} attempts. Cause: ${message}`);
          throw err;
        }
        // 1s, 2s, 4s, 8s — ~15s total, comfortably covering a Neon cold start.
        const delayMs = 1000 * 2 ** (attempt - 1);
        this.logger.warn(`Database unreachable (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms. Cause: ${message}`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Registers a beforeExit hook so Nest can drain the connection pool on shutdown signals (SIGTERM/SIGINT). */
  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
