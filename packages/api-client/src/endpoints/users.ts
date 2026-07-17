import { apiRequest } from "../http";

export const usersApi = {
  deleteMe: () => apiRequest<void>("/v1/users/me", { method: "DELETE" }),
};
