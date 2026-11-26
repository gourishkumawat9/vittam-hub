import type { IncubatorProgramRecord } from "@vittamhub/api-client";

import { INDUSTRY_LABEL } from "@/lib/startup-options";

export const KIND_LABEL: Record<string, string> = {
  INCUBATOR: "Incubator",
  ACCELERATOR: "Accelerator",
};

export type ProgrammeState = "open" | "upcoming" | "closed" | "undated";

export interface ProgrammeStatus {
  state: ProgrammeState;
  /** Short badge text, e.g. "Applications open". */
  label: string;
  /** The date that matters next, e.g. "Closes 20 Dec". */
  hint?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Where a programme's application window stands today, from its own dates.
 * The closing date counts as a whole day, so a call that closes today still
 * reads as open.
 */
export function programmeStatus(programme: Pick<IncubatorProgramRecord, "applicationCycleStart" | "applicationCycleEnd">, now = Date.now()): ProgrammeStatus {
  const start = programme.applicationCycleStart ? new Date(programme.applicationCycleStart).getTime() : null;
  const end = programme.applicationCycleEnd ? new Date(programme.applicationCycleEnd).getTime() + DAY_MS : null;

  if (start === null && end === null) return { state: "undated", label: "Dates not listed" };
  if (start !== null && now < start) return { state: "upcoming", label: "Opens soon", hint: `Opens ${shortDate(programme.applicationCycleStart!)}` };
  if (end !== null && now >= end) return { state: "closed", label: "Applications closed", hint: `Closed ${shortDate(programme.applicationCycleEnd!)}` };
  return {
    state: "open",
    label: "Applications open",
    hint: programme.applicationCycleEnd ? `Closes ${shortDate(programme.applicationCycleEnd)}` : "No closing date listed",
  };
}

export const STATUS_BADGE: Record<ProgrammeState, "success" | "brand" | "neutral"> = {
  open: "success",
  upcoming: "brand",
  closed: "neutral",
  undated: "neutral",
};

/** Programmes in the order a founder cares about: open calls first, then upcoming, then the rest. */
export function sortProgrammes<T extends Pick<IncubatorProgramRecord, "applicationCycleStart" | "applicationCycleEnd">>(programmes: T[]): T[] {
  const rank: Record<ProgrammeState, number> = { open: 0, upcoming: 1, undated: 2, closed: 3 };
  return [...programmes].sort((a, b) => rank[programmeStatus(a).state] - rank[programmeStatus(b).state]);
}

export function openCallCount(programmes: Pick<IncubatorProgramRecord, "applicationCycleStart" | "applicationCycleEnd">[]) {
  return programmes.filter((programme) => programmeStatus(programme).state === "open").length;
}

/** "FINTECH" → "Fintech"; free-text industries pass through unchanged. */
export function industryLabel(value: string) {
  return INDUSTRY_LABEL[value] ?? value;
}
