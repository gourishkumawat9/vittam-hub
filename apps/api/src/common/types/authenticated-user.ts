import { UserRole } from "@vittamhub/types";

/** JWT access-token payload shape, attached to `request.user` by JwtStrategy. */
export interface AuthenticatedUser {
  sub: string; // user id
  email: string;
  role: UserRole;
}
