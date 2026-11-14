import { Injectable } from "@nestjs/common";
import { ThrottlerGuard, type ThrottlerRequest } from "@nestjs/throttler";

/**
 * The name of the per-account limit. Routes set it with
 * `@Throttle({ [ACCOUNT_THROTTLER]: { limit, ttl } })` next to
 * `@UseGuards(UserThrottlerGuard)`.
 */
export const ACCOUNT_THROTTLER = "account";

/**
 * Rate limit per signed-in account, not per IP address.
 *
 * The global guard counts by IP, which stops one machine hammering the API
 * but not one account doing it from many addresses. And an IP limit tight
 * enough to stop one account would also stop a whole incubator or campus
 * sharing one address after the first few people. So the two are separate
 * limits with separate numbers: "default" is per IP and enforced everywhere
 * by IpThrottlerGuard; "account" is per account and enforced only here, on
 * the routes that opt in. Use it when the thing being protected belongs to
 * the account: guessing a 6-digit code, filling storage with uploads,
 * flooding another member with requests.
 *
 * Route guards run after the global ones, so the session has already been
 * read by the time this asks who is calling. On a public route there is no
 * account, and it falls back to the IP address.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    if (requestProps.throttler.name !== ACCOUNT_THROTTLER) return true;
    return super.handleRequest(requestProps);
  }

  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as { sub?: string } | undefined;
    return user?.sub ? `user:${user.sub}` : String(req.ip ?? "unknown");
  }
}

/** The app-wide guard: every limit except the per-account one, counted by IP address. */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  protected override async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    if (requestProps.throttler.name === ACCOUNT_THROTTLER) return true;
    return super.handleRequest(requestProps);
  }
}
