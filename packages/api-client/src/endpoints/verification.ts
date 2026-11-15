import type { VerificationProgress } from "@vittamhub/types";

import { apiRequest } from "../http";

export const verificationApi = {
  /** What the signed-in account's profile has, and still needs, for the Verified badge. Null before a profile exists. */
  mine: () => apiRequest<VerificationProgress | null>("/v1/verification/mine"),
};
