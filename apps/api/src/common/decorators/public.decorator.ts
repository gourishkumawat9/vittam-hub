import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Marks a route as exempt from JwtAuthGuard — use for login/register/public profile reads. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
