import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Rate limit per signed-in account, not per IP address.
 *
 * The global ThrottlerGuard counts by IP, which stops one machine hammering
 * the API but not one account doing it from many addresses (or many people
 * behind one office address being limited together). Put this on a route next
 * to `@Throttle(...)` when the thing being protected belongs to the account:
 * guessing a 6-digit code, filling storage with uploads, flooding another
 * member with requests.
 *
 * Route guards run after the global ones, so the session has already been
 * read by the time this asks who is calling. On a public route there is no
 * account, and it falls back to the IP address.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as { sub?: string } | undefined;
    return user?.sub ? `user:${user.sub}` : String(req.ip ?? "unknown");
  }
}
