import type { MentorBookingWithRelations } from "@vittamhub/api-client";
import { Avatar, Card } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { HeartHandshake } from "lucide-react";
import Link from "next/link";

import { PanelLink, PanelTitle } from "../PageHeader";
import { STAGE_LABEL } from "../founder/startup-labels";

import { formatSessionTime } from "./sessions";

interface FounderRelationship {
  founder: MentorBookingWithRelations["founder"];
  startup: MentorBookingWithRelations["startup"];
  /** Sessions marked done. */
  done: number;
  /** The next session with a time still ahead, if any. */
  nextAt: string | null;
  lastAt: string;
}

/** Accepted sessions grouped by founder: the mentor's ongoing relationships, newest first. */
function groupByFounder(bookings: MentorBookingWithRelations[]): FounderRelationship[] {
  const now = Date.now();
  const byFounder = new Map<string, FounderRelationship>();
  for (const booking of bookings) {
    const rel = byFounder.get(booking.founder.id) ?? { founder: booking.founder, startup: booking.startup, done: 0, nextAt: null, lastAt: booking.createdAt };
    if (booking.completedAt) rel.done += 1;
    if (booking.scheduledAt && !booking.completedAt && new Date(booking.scheduledAt).getTime() > now && (!rel.nextAt || booking.scheduledAt < rel.nextAt)) {
      rel.nextAt = booking.scheduledAt;
    }
    if (booking.createdAt > rel.lastAt) rel.lastAt = booking.createdAt;
    byFounder.set(booking.founder.id, rel);
  }
  return [...byFounder.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export function YourFoundersPanel({ accepted }: { accepted: MentorBookingWithRelations[] }) {
  const relationships = groupByFounder(accepted);

  return (
    <Card className="flex flex-col gap-4">
      <PanelTitle icon={HeartHandshake} title="Your founders" right={<PanelLink href="/mentors/bookings">All sessions</PanelLink>} />
      {relationships.length === 0 ? (
        <div className="flex flex-col gap-1 rounded-button bg-background-secondary p-4">
          <p className="body-5 text-text-primary">No founders yet</p>
          <p className="caption-5">When you accept a request, the founder appears here with your sessions together.</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {relationships.map((rel, index) => (
            <li key={rel.founder.id}>
              {index > 0 && <div className="h-px bg-border" aria-hidden="true" />}
              <div className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={rel.founder.fullName} src={rel.founder.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="body-5 truncate text-text-primary">{rel.founder.fullName}</p>
                    <p className="caption-5 truncate">
                      {rel.startup ? (
                        <Link href={`/startups/${rel.startup.slug}`} className="hover:text-text-primary hover:underline">
                          {rel.startup.name} · {STAGE_LABEL[rel.startup.stage] ?? rel.startup.stage}
                        </Link>
                      ) : (
                        "No startup profile yet"
                      )}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-numeric text-sm font-semibold text-text-primary">
                    {rel.done} session{rel.done === 1 ? "" : "s"} done
                  </p>
                  <p className="caption-5">{rel.nextAt ? `Next ${formatSessionTime(rel.nextAt, null)}` : `Latest request ${formatRelativeTime(rel.lastAt)}`}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
