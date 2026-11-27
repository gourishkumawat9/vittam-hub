"use client";

import { useConnections } from "@vittamhub/api-client";
import { Card, EmptyState } from "@vittamhub/ui";
import { Inbox, MessageCircle } from "@vittamhub/ui/icons";
import { formatRelativeTime } from "@vittamhub/utils";
import Link from "next/link";

import { ConnectionStatusBadge } from "@/components/connections/ConnectionStatusBadge";
import { ListRowsSkeleton } from "@/components/dashboard/ListRowsSkeleton";

/** The founder's sent connect requests and where each one stands. Accepted ones open the conversation. */
export function ConnectRequestsList({ limit, emptyHint }: { limit?: number; emptyHint: string }) {
  const { data, isLoading } = useConnections();
  const connections = data?.items ?? [];
  const shown = limit ? connections.slice(0, limit) : connections;

  if (isLoading) return <ListRowsSkeleton />;
  if (shown.length === 0) return <EmptyState icon={Inbox} title="No connect requests yet" description={emptyHint} className="py-10" />;

  return (
    <Card className="p-0">
      <ul className="flex flex-col">
        {shown.map((connection, index) => (
          <li key={connection.id}>
            {index > 0 && <div className="mx-4 h-px bg-border sm:mx-6" aria-hidden="true" />}
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="body-5 truncate text-text-primary">{connection.recipient.fullName}</p>
                <p className="caption-5">Sent {formatRelativeTime(connection.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ConnectionStatusBadge status={connection.status} />
                {connection.status === "ACCEPTED" && (
                  <Link
                    href={`/connections/${connection.id}`}
                    className="flex items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 transition-colors duration-300 ease-base hover:text-brand-800 dark:text-brand-300"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" /> Open chat
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
