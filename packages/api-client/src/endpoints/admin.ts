import type {
  AdminUserListFilters,
  AdminUserSummary,
  ConnectionAcceptanceRate,
  PaginatedResult,
  PlatformTotals,
  SignupBucket,
  SignupsFilters,
  VerificationFunnelStage,
  VerificationOverview,
} from "@vittamhub/types";

import { apiRequest } from "../http";

export const adminApi = {
  verificationOverview: () => apiRequest<VerificationOverview>("/v1/admin/verification-overview"),
  totals: () => apiRequest<PlatformTotals>("/v1/admin/analytics/totals"),
  signups: (filters: SignupsFilters) =>
    apiRequest<SignupBucket[]>(`/v1/admin/analytics/signups?bucket=${filters.bucket}&limit=${filters.limit}`),
  connectionAcceptanceRate: () => apiRequest<ConnectionAcceptanceRate>("/v1/admin/analytics/connection-acceptance-rate"),
  verificationFunnel: () => apiRequest<VerificationFunnelStage[]>("/v1/admin/analytics/verification-funnel"),
  listUsers: (filters: AdminUserListFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
      else params.set(key, String(value));
    });
    return apiRequest<PaginatedResult<AdminUserSummary>>(`/v1/admin/users?${params.toString()}`);
  },
};
