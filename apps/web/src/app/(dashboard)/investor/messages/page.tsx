"use client";

import { useConnections } from "@vittamhub/api-client";
import { Avatar, EmptyState } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";

export default function MessagesPage() {
  const { data: connectionsResult, isLoading } = useConnections({ status: ["ACCEPTED"], page: 1, pageSize: 50 });
  const accepted = connectionsResult?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Messages</h1>

      {isLoading ? (
        <ListRowsSkeleton />
      ) : accepted.length > 0 ? (
        <div className="flex flex-col divide-y divide-border rounded-card border border-border">
          {accepted.map((connection) => (
            <Link
              key={connection.id}
              href={`/connections/${connection.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-background-secondary"
            >
              <Avatar name={connection.requester.fullName} src={connection.requester.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{connection.startup?.name ?? connection.requester.fullName}</p>
                <p className="truncate text-xs text-text-secondary">Connected {formatRelativeTime(connection.respondedAt ?? connection.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={MessageCircle} title="No conversations yet" description="Accepting a connect request unlocks messaging with that founder." />
      )}
    </div>
  );
}
