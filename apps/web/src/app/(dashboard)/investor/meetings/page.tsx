"use client";

import { useCurrentUser, useMyMeetings } from "@vittamhub/api-client";
import { Card, EmptyState } from "@vittamhub/ui";
import { Calendar, Video } from "lucide-react";
import Link from "next/link";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";

export default function MeetingsPage() {
  const { data: meetings, isLoading } = useMyMeetings();
  const { data: user } = useCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Meetings</h1>

      {isLoading ? (
        <ListRowsSkeleton />
      ) : meetings && meetings.length > 0 ? (
        <div className="flex flex-col gap-3">
          {meetings.map((meeting) => {
            const otherParty =
              meeting.connection.requester.fullName === user?.fullName ? meeting.connection.recipient.fullName : meeting.connection.requester.fullName;
            return (
              <Card key={meeting.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {meeting.connection.startup?.name ?? otherParty}
                  </p>
                  <p className="text-xs text-text-secondary">{new Date(meeting.scheduledAt).toLocaleString()}</p>
                  {meeting.notes && <p className="mt-1 text-xs text-text-secondary">{meeting.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {meeting.videoCallUrl && (
                    <a href={meeting.videoCallUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline">
                      <Video className="h-3.5 w-3.5" /> Join
                    </a>
                  )}
                  <Link href={`/connections/${meeting.connection.id}`} className="text-xs font-medium text-brand-primary hover:underline">
                    View thread
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Calendar} title="No meetings scheduled" description="Propose a meeting from a connection request to see it here." />
      )}
    </div>
  );
}
