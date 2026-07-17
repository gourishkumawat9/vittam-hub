import type { FollowStartupInput, StartupFollow, Startup, UpdateWatchlistEntryInput } from "@vittamhub/types";

import { apiRequest } from "../http";

export interface StartupFollowWithStartup extends StartupFollow {
  startup: Startup;
}

export const watchlistApi = {
  list: () => apiRequest<StartupFollowWithStartup[]>("/v1/watchlist"),
  follow: (input: FollowStartupInput) => apiRequest<StartupFollow>("/v1/watchlist", { method: "POST", body: input }),
  unfollow: (startupId: string) => apiRequest<void>(`/v1/watchlist/${startupId}`, { method: "DELETE" }),
  update: (startupId: string, input: UpdateWatchlistEntryInput) =>
    apiRequest<StartupFollow>(`/v1/watchlist/${startupId}`, { method: "PATCH", body: input }),
};
