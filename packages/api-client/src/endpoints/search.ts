import type { GlobalSearchFilters, Startup } from "@vittamhub/types";

import { apiRequest } from "../http";

import type { IncubatorWithPrograms } from "./incubators";
import type { InvestorWithOwner } from "./investors";
import type { JobWithStartup } from "./hiring";
import type { MentorWithOwner } from "./mentors";

/** Raw `StartupsService.search` rows — no Trust/Match Score here, those are only computed on the full Discover Startups endpoint. */
export interface GlobalSearchStartupItem extends Startup {
  owner: { fullName: string };
}

export interface GlobalSearchResults {
  startups: GlobalSearchStartupItem[];
  investors: InvestorWithOwner[];
  mentors: MentorWithOwner[];
  incubators: IncubatorWithPrograms[];
  jobs: JobWithStartup[];
}

export const searchApi = {
  search: (filters: GlobalSearchFilters) => apiRequest<GlobalSearchResults>(`/v1/search?query=${encodeURIComponent(filters.query)}`),
};
