import type { MentorBookingWithRelations } from "@vittamhub/api-client";

/**
 * Where a mentor session stands, worked out from its fields:
 * - `request`: sent, waiting for the mentor's answer
 * - `declined`: the mentor said no
 * - `needs-time`: accepted, no time set yet
 * - `upcoming`: accepted, set for a time still ahead
 * - `wrap-up`: accepted, its time has passed, nobody has marked it done
 * - `done`: marked done by either side
 */
export type SessionPhase = "request" | "declined" | "needs-time" | "upcoming" | "wrap-up" | "done";

export function sessionPhase(booking: MentorBookingWithRelations, now = Date.now()): SessionPhase {
  if (booking.status === "PENDING") return "request";
  if (booking.status === "DECLINED") return "declined";
  if (booking.completedAt) return "done";
  if (!booking.scheduledAt) return "needs-time";
  return new Date(booking.scheduledAt).getTime() > now ? "upcoming" : "wrap-up";
}

/** Sessions that still need something: wrap-ups first (they're overdue), then ones without a time, then the rest soonest first. */
export function activeSessions(bookings: MentorBookingWithRelations[], now = Date.now()): MentorBookingWithRelations[] {
  const order: Partial<Record<SessionPhase, number>> = { "wrap-up": 0, "needs-time": 1, upcoming: 2 };
  return bookings
    .filter((booking) => order[sessionPhase(booking, now)] !== undefined)
    .sort((a, b) => {
      const byPhase = order[sessionPhase(a, now)]! - order[sessionPhase(b, now)]!;
      if (byPhase !== 0) return byPhase;
      return (a.scheduledAt ?? a.respondedAt ?? a.createdAt).localeCompare(b.scheduledAt ?? b.respondedAt ?? b.createdAt);
    });
}

/** "Tue, 2 Dec · 7:00 pm to 7:45 pm", in the reader's own time zone. */
export function formatSessionTime(iso: string, durationMinutes: number | null): string {
  const start = new Date(iso);
  const day = start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const time = (date: Date) => date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!durationMinutes) return `${day} · ${time(start)}`;
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return `${day} · ${time(start)} to ${time(end)}`;
}

/** "in 3 hours", "tomorrow", "in 5 days": how soon an upcoming session is. */
export function timeUntil(iso: string, now = Date.now()): string {
  const minutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (minutes < 60) return minutes <= 1 ? "starting now" : `in ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}

const ics = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (value: string) => value.replace(/\\/g, "\\\\").replace(/[;,]/g, (match) => `\\${match}`).replace(/\r?\n/g, "\\n");

/**
 * Saves the session as an .ics file, which every calendar app opens (Google,
 * Apple, Outlook). Built in the browser, so nothing about the session is sent
 * anywhere to make it.
 */
export function downloadCalendarFile(booking: MentorBookingWithRelations, withName: string): void {
  if (!booking.scheduledAt) return;
  const start = new Date(booking.scheduledAt);
  const end = new Date(start.getTime() + (booking.durationMinutes ?? 45) * 60_000);
  const details = [booking.message, booking.mentorNote, booking.meetingUrl].filter(Boolean).join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VittamHub//Mentor sessions//EN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@vittamhub.com`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(start)}`,
    `DTEND:${ics(end)}`,
    `SUMMARY:${icsText(`Mentor session with ${withName}`)}`,
    `DESCRIPTION:${icsText(details)}`,
    ...(booking.meetingUrl ? [`LOCATION:${icsText(booking.meetingUrl)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "vittamhub-session.ics";
  link.click();
  URL.revokeObjectURL(url);
}
