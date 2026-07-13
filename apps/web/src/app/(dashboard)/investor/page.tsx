"use client";

import { useConnections, useRespondToConnection, type ConnectionWithRelations } from "@vittamhub/api-client";
import { Button, Card, EmptyState } from "@vittamhub/ui";
import { formatUsd, formatRelativeTime } from "@vittamhub/utils";
import { FileText, Inbox, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConnectionStatusBadge } from "@/components/connections/ConnectionStatusBadge";

function PendingRequestCard({ connection }: { connection: ConnectionWithRelations }) {
  const respond = useRespondToConnection();
  const [actioning, setActioning] = useState<"ACCEPT" | "DECLINE" | "IGNORE" | null>(null);

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
            <FileText className="h-3.5 w-3.5" /> Executive summary
          </a>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button size="sm" variant="ghost" isLoading={actioning === "IGNORE"} onClick={() => act("IGNORE")}>
          Ignore
        </Button>
        <Button size="sm" variant="secondary" isLoading={actioning === "DECLINE"} onClick={() => act("DECLINE")}>
          Decline
        </Button>
        <Button size="sm" isLoading={actioning === "ACCEPT"} onClick={() => act("ACCEPT")}>
          Accept
        </Button>
      </div>
    </Card>
  );
}

export default function InvestorDashboardPage() {
  const { data: connections, isLoading } = useConnections();

  const pending = connections?.filter((c) => c.status === "PENDING") ?? [];
  const history = connections?.filter((c) => c.status !== "PENDING") ?? [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Investor dashboard</h1>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-text-primary">Connect requests</h2>
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading…</p>
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
