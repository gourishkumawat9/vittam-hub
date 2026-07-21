import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ThrottlerStorage, type ThrottlerStorageRecord } from "@nestjs/throttler";
import cookieParser from "cookie-parser";

import { AppModule } from "../../src/app.module";

export interface BuildTestAppOptions {
  /** Leave the real rate limiter in place. Off by default so functional tests aren't throttled. */
  throttle?: boolean;
}

/**
 * A ThrottlerStorage that never records a hit, so the guard never blocks.
 * `overrideGuard(ThrottlerGuard)` has no effect on APP_GUARD-registered guards
 * (a known Nest limitation), so we disable throttling at the storage layer —
 * which the guard *does* inject and which overrideProvider can replace.
 */
const NO_THROTTLE_STORAGE: ThrottlerStorage = {
  async increment(): Promise<ThrottlerStorageRecord> {
    return { totalHits: 1, timeToExpire: 60, isBlocked: false, timeToBlockExpire: 0 };
  },
};

/**
 * Boots the full application the way main.ts does — cookie parsing + the global
 * ValidationPipe, plus every APP_GUARD/INTERCEPTOR/FILTER wired in AppModule.
 * The rate limiter is neutralized unless a test explicitly opts in, so the
 * shared per-IP throttle window can't bleed 429s across unrelated tests.
 */
export async function buildTestApp(options: BuildTestAppOptions = {}): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  if (!options.throttle) {
    builder.overrideProvider(ThrottlerStorage).useValue(NO_THROTTLE_STORAGE);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
