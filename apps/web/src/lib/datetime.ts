/**
 * `<input type="datetime-local">` hands back "2026-11-20T15:30": a wall-clock
 * time with no timezone. Sent as it is, the server reads it on its own clock
 * (UTC), so a 3:30 pm meeting picked in India was saved as 9:00 pm. Converting
 * here, in the browser that knows the person's timezone, keeps the moment they meant.
 */
export function localInputToIso(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** "Now", in the format a `datetime-local` input takes, for its `min`: no meetings or events in the past. */
export function nowForLocalInput(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

/** A saved moment, shown in the reader's own timezone: "20 Nov 2026, 3:30 pm". */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** A saved moment, in the format a `datetime-local` input takes, so an edit opens on the time already set. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
