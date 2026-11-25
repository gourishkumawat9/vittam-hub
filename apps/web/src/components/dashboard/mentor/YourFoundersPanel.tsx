import type { MentorBookingWithRelations } from "@vittamhub/api-client";
import { Avatar, Card } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { HeartHandshake } from "lucide-react";
import Link from "next/link";

import { PanelLink, PanelTitle } from "../PageHeader";
import { STAGE_LABEL } from "../founder/startup-labels";

interface FounderRelationship {
  founder: MentorBookingWithRelations["founder"];
  startup: MentorBookingWithRelations["startup"];
  sessions: number;
  lastAt: string;
}

/** Accepted sessions grouped by founder: the mentor's ongoing relationships, newest first. */
function groupByFounder(bookings: MentorBookingWithRelations[]): FounderRelationship[] {
  const byFounder = new Map<string, FounderRelationship>();
  for (const booking of bookings) {
    const existing = byFounder.get(booking.founder.id);
    if (existing) {
      existing.sessions += 1;
      if (booking.createdAt > existing.lastAt) existing.lastAt = booking.createdAt;
    } else {
      byFounder.set(booking.founder.id, { founder: booking.founder, startup: booking.startup, sessions: 1, lastAt: booking.createdAt });
    }
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
          <p className="caption-5">When you accept a request, the founder appears here with how often you have met.</p>
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
                    {rel.sessions} session{rel.sessions === 1 ? "" : "s"}
                  </p>
                  <p className="caption-5">Latest request {formatRelativeTime(rel.lastAt)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
