import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@vittamhub/types";

export const ROLES_KEY = "roles";

/** Restricts a route to specific roles, checked by RolesGuard after JwtAuthGuard populates `request.user`. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
