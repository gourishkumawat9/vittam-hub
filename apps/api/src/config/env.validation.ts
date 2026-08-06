import { z } from "zod";

/**
 * Fails fast at boot if a required env var is missing/malformed, instead of
 * surfacing a confusing runtime error the first time a route touches it.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  SESSION_COOKIE_NAME: z.string().default("vh_session"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  CAPTCHA_SITE_KEY: z.string().optional(),
  CAPTCHA_SECRET_KEY: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  // Was missing from this schema entirely despite being load-bearing:
  // DocumentsService builds its "is this our own storage object" guard from
  // it, and an undefined value turns that prefix into the literal
  // "undefined/". Validated as a URL so a malformed value fails at boot.
  STORAGE_PUBLIC_CDN_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  // BullMQ cron schedulers (trust-recompute, watchlist-trigger evaluation) are
  // noisy/unnecessary while developing locally — on by default in production,
  // off everywhere else unless explicitly opted into.
  ENABLE_JOB_SCHEDULERS: z.coerce.boolean().optional(),
}).superRefine((env, ctx) => {
  // The MFA challenge token is signed with JWT_REFRESH_SECRET precisely so it
  // cannot be replayed as a session cookie (see AuthService.mfaChallengeSecret).
  // If the two secrets are equal that protection silently evaporates.
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["JWT_REFRESH_SECRET"],
      message: "must differ from JWT_ACCESS_SECRET (MFA challenge tokens are signed with it and must not verify as session tokens)",
    });
  }

  if (env.NODE_ENV !== "production") return;

  // Without Resend configured in production, account-recovery and
  // verification emails are silently never delivered — users would be
  // unable to verify an address or reset a password at all.
  if (!env.RESEND_API_KEY) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["RESEND_API_KEY"], message: "is required in production" });
  }
  if (!env.EMAIL_FROM) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["EMAIL_FROM"], message: "is required in production" });
  }
});

export type Env = z.infer<typeof envSchema>;

/**
 * Settings that aren't hard-required (the app boots and degrades without
 * them) but whose absence in production means a real feature is silently
 * off. Surfaced loudly at boot rather than discovered by a confused user.
 */
const PRODUCTION_RECOMMENDED: Array<{ key: keyof Env; consequence: string }> = [
  { key: "CAPTCHA_SECRET_KEY", consequence: "captcha verification is skipped entirely on register/login" },
  { key: "STORAGE_BUCKET", consequence: "file uploads (logos, pitch decks, documents) cannot work" },
  { key: "STORAGE_PUBLIC_CDN_URL", consequence: "uploaded-document URL validation cannot work" },
  { key: "SENTRY_DSN", consequence: "no error monitoring — failures are only visible in raw logs" },
];

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }

  if (parsed.data.NODE_ENV === "production") {
    const missing = PRODUCTION_RECOMMENDED.filter(({ key }) => !parsed.data[key]);
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[env] Running in production without:\n${missing.map(({ key, consequence }) => `  - ${key}: ${consequence}`).join("\n")}`,
      );
    }
  }

  return parsed.data;
}
