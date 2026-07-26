import type {
  CreateWatchlistTriggerInput,
  FollowStartupInput,
  StartupFollow,
  Startup,
  UpdateWatchlistEntryInput,
  WatchlistTrigger,
} from "@vittamhub/types";

import { apiRequest } from "../http";

export interface StartupFollowWithStartup extends StartupFollow {
  startup: Startup;
}

export interface WatchlistTriggerWithStartup extends WatchlistTrigger {
  startup: { id: string; name: string; logoUrl: string | null; slug: string };
}

export const watchlistApi = {
  list: () => apiRequest<StartupFollowWithStartup[]>("/v1/watchlist"),
  follow: (input: FollowStartupInput) => apiRequest<StartupFollow>("/v1/watchlist", { method: "POST", body: input }),
  unfollow: (startupId: string) => apiRequest<void>(`/v1/watchlist/${startupId}`, { method: "DELETE" }),
  update: (startupId: string, input: UpdateWatchlistEntryInput) =>
    apiRequest<StartupFollow>(`/v1/watchlist/${startupId}`, { method: "PATCH", body: input }),
  listTriggers: () => apiRequest<WatchlistTriggerWithStartup[]>("/v1/watchlist/triggers"),
  createTrigger: (input: CreateWatchlistTriggerInput) =>
    apiRequest<WatchlistTrigger>("/v1/watchlist/triggers", { method: "POST", body: input }),
  removeTrigger: (id: string) => apiRequest<void>(`/v1/watchlist/triggers/${id}`, { method: "DELETE" }),
};
