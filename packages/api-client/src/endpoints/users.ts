import type { DeleteAccountInput } from "@vittamhub/types";

import { apiRequest } from "../http";

export const usersApi = {
  deleteMe: (input: DeleteAccountInput) => apiRequest<void>("/v1/users/me", { method: "DELETE", body: input }),
};
