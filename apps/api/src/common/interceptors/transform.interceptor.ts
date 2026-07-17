import { randomUUID } from "node:crypto";

import { CallHandler, ExecutionContext, NestInterceptor , Injectable } from "@nestjs/common";
import { Observable , map } from "rxjs";

/**
 * Never serialize these to an HTTP client, at any nesting depth. They live on
 * the User model and are needed internally (e.g. login verifies passwordHash),
 * but must never leave the server. Stripping happens here — the single envelope
 * every successful response already passes through — so no individual endpoint
 * can leak them by returning a raw Prisma object.
 */
const SENSITIVE_KEYS = new Set(["passwordHash", "twoFactorSecret"]);

/** Returns a copy of `value` with SENSITIVE_KEYS removed. Recurses through plain
 * objects and arrays only; Dates and class instances are passed through untouched. */
function stripSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSensitive);
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key)) continue;
      out[key] = stripSensitive(val);
    }
    return out;
  }
  return value;
}

/** Wraps every successful response as `{ data, requestId }` — the mirror image of HttpExceptionFilter's error shape. */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { data: unknown; requestId: string }> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<{ data: unknown; requestId: string }> {
    const requestId = randomUUID();
    return next.handle().pipe(map((data) => ({ data: stripSensitive(data), requestId })));
  }
}
