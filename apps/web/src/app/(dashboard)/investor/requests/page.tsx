"use client";

import { useConnections } from "@vittamhub/api-client";
import { EmptyState } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Inbox, MessageCircle } from "lucide-react";
import Link from "next/link";

import { ConnectionStatusBadge } from "@/components/connections/ConnectionStatusBadge";
import { CardGridSkeleton } from "@/components/dashboard/CardGridSkeleton";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PendingRequestCard } from "@/components/dashboard/investor/PendingRequestCard";

export default function ConnectionRequestsPage() {
  const { data: connectionsResult, isLoading } = useConnections({ page: 1, pageSize: 100 });
  const connections = connectionsResult?.items;

  const pending = connections?.filter((c) => c.status === "PENDING") ?? [];
  const history = connections?.filter((c) => c.status !== "PENDING") ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Connect requests"
        description={
          pending.length > 0
            ? `${pending.length} founder${pending.length === 1 ? " is" : "s are"} waiting for your answer. Accepting opens chat, documents and meetings.`
            : "Founders reach you here first. Nothing opens until you accept."
        }
      />

      <section className="flex flex-col gap-4">
        {isLoading ? (
          <CardGridSkeleton count={2} />
        ) : pending.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          <h2 className="heading-6">Answered</h2>
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
                      className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
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
