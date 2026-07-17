"use client";

import {
  useConnections,
  useFollowStartup,
  useRequestMoreInfo,
  useRespondToConnection,
  useScheduleMeeting,
  type ConnectionWithRelations,
} from "@vittamhub/api-client";
import { Button, Card, Dialog, EmptyState, Input, Textarea } from "@vittamhub/ui";
import { formatUsd, formatRelativeTime } from "@vittamhub/utils";
import { Bookmark, Calendar, FileText, HelpCircle, Inbox, MessageCircle, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ConnectionStatusBadge } from "@/components/connections/ConnectionStatusBadge";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";

interface MeetingFormValues {
  scheduledAt: string;
  notes?: string;
  videoCallUrl?: string;
}

function ScheduleMeetingDialog({ connectionId, open, onOpenChange }: { connectionId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const scheduleMeeting = useScheduleMeeting(connectionId);
  const { register, handleSubmit, reset } = useForm<MeetingFormValues>();

  const onSubmit = handleSubmit(async (data) => {
    await scheduleMeeting.mutateAsync(data);
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Propose a meeting"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} isLoading={scheduleMeeting.isPending}>
            Propose
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Date & time" type="datetime-local" {...register("scheduledAt", { required: true })} />
        <Input label="Video call link (optional)" placeholder="https://…" {...register("videoCallUrl")} />
        <Textarea label="Notes (optional)" rows={2} {...register("notes")} />
      </form>
    </Dialog>
  );
}

function PendingRequestCard({ connection }: { connection: ConnectionWithRelations }) {
  const respond = useRespondToConnection();
  const followStartup = useFollowStartup();
  const requestMoreInfo = useRequestMoreInfo();
  const [actioning, setActioning] = useState<"ACCEPT" | "DECLINE" | "IGNORE" | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);

  const act = async (action: "ACCEPT" | "DECLINE" | "IGNORE") => {
    setActioning(action);
    try {
      await respond.mutateAsync({ id: connection.id, action });
    } finally {
      setActioning(null);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">{connection.startup?.name ?? connection.requester.fullName}</h3>
          <p className="text-xs text-text-secondary">{connection.startup?.tagline}</p>
        </div>
        <span className="text-xs text-text-secondary">{formatRelativeTime(connection.createdAt)}</span>
      </div>

      {connection.introduction && <p className="text-sm text-text-secondary">{connection.introduction}</p>}

      <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
        {connection.fundingRequirementUsd != null && (
          <span>Raising {formatUsd(connection.fundingRequirementUsd)}</span>
        )}
        {connection.pitchDeckUrl && (
          <a href={connection.pitchDeckUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-primary hover:underline">
            <FileText className="h-3.5 w-3.5" /> Pitch deck
          </a>
        )}
        {connection.executiveSummaryUrl && (
          <a href={connection.executiveSummaryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-primary hover:underline">
            <FileText className="h-3.5 w-3.5" /> One-pager
          </a>
        )}
        {connection.demoLinkUrl && (
          <a href={connection.demoLinkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-primary hover:underline">
            <PlayCircle className="h-3.5 w-3.5" /> Demo
          </a>
        )}
      </div>

      {connection.infoRequestedAt && <p className="text-xs text-warning-600">You asked for more information on this request.</p>}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex flex-wrap gap-1">
          {connection.startup && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => followStartup.mutate({ startupId: connection.startup!.id, notifyOnUpdate: false })}
              isLoading={followStartup.isPending}
            >
              <Bookmark className="h-3.5 w-3.5" /> Save
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setMeetingOpen(true)}>
            <Calendar className="h-3.5 w-3.5" /> Meeting
          </Button>
          {!connection.infoRequestedAt && (
            <Button size="sm" variant="ghost" onClick={() => requestMoreInfo.mutate(connection.id)} isLoading={requestMoreInfo.isPending}>
              <HelpCircle className="h-3.5 w-3.5" /> More info
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" isLoading={actioning === "IGNORE"} onClick={() => act("IGNORE")}>
            Ignore
          </Button>
          <Button size="sm" variant="secondary" isLoading={actioning === "DECLINE"} onClick={() => act("DECLINE")}>
            Reject
          </Button>
          <Button size="sm" isLoading={actioning === "ACCEPT"} onClick={() => act("ACCEPT")}>
            Accept
          </Button>
        </div>
      </div>

      <ScheduleMeetingDialog connectionId={connection.id} open={meetingOpen} onOpenChange={setMeetingOpen} />
    </Card>
  );
}

export default function ConnectionRequestsPage() {
  const { data: connectionsResult, isLoading } = useConnections({ page: 1, pageSize: 100 });
  const connections = connectionsResult?.items;

  const pending = connections?.filter((c) => c.status === "PENDING") ?? [];
  const history = connections?.filter((c) => c.status !== "PENDING") ?? [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Connection requests</h1>

      <section className="flex flex-col gap-4">
        {isLoading ? (
          <CardGridSkeleton count={2} />
        ) : pending.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {pending.map((connection) => (
              <PendingRequestCard key={connection.id} connection={connection} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Inbox} title="No pending requests" description="Founders' connect requests will show up here." />
        )}
      </section>

      {history.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold text-text-primary">History</h2>
          <div className="flex flex-col divide-y divide-border rounded-card border border-border">
            {history.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{connection.startup?.name ?? connection.requester.fullName}</p>
                  <p className="text-xs text-text-secondary">Responded {formatRelativeTime(connection.respondedAt ?? connection.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ConnectionStatusBadge status={connection.status} />
                  {connection.status === "ACCEPTED" && (
                    <Link
                      href={`/connections/${connection.id}`}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Message
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
