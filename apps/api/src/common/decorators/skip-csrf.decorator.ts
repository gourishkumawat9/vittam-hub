import { SetMetadata } from "@nestjs/common";

export const SKIP_CSRF_KEY = "skipCsrf";

/** Marks a route as exempt from CsrfGuard — use only for server-to-server endpoints protected by their own signature verification (e.g. the Stripe webhook), never for anything a browser calls. */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
