"use client";

import { useRevokeOtherSessions, useRevokeSession, useSessions } from "@vittamhub/api-client";
import { Badge, Button, Card, Skeleton, useToast } from "@vittamhub/ui";
import { MonitorSmartphone } from "@vittamhub/ui/icons";
import { useState } from "react";

import { formatDateTime } from "@/lib/datetime";

/**
 * Where the account is open right now. Ending a session here takes effect on
 * that device's very next click: the API checks every request against the
 * list, it doesn't wait for the old session to time out.
 */
export function SessionsSection({ isDemo }: { isDemo: boolean }) {
  const { data: sessions, isLoading, isError, refetch } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const { toast } = useToast();
  const [endingId, setEndingId] = useState<string | null>(null);

  const others = (sessions ?? []).filter((session) => !session.isCurrent);

  const endOne = (id: string) => {
    setEndingId(id);
    revokeSession.mutate(id, {
      onSuccess: () => toast({ variant: "success", title: "That device has been signed out" }),
      onSettled: () => setEndingId(null),
    });
  };

  const endOthers = () => {
    revokeOthers.mutate(undefined, {
      onSuccess: () => toast({ variant: "success", title: "Every other device has been signed out" }),
    });
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-base font-semibold text-text-primary">Where you&apos;re signed in</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isDemo
            ? "Demo accounts are shared, so only this device is shown."
            : "Sign out any device you don't recognise, then change your password."}
        </p>
      </div>

      {isLoading && <Skeleton className="h-16 w-full" />}

      {isError && (
        <p className="text-sm text-text-secondary">
          We couldn&apos;t load your devices.{" "}
          <button type="button" onClick={() => refetch()} className="font-medium text-brand-700 underline-offset-2 hover:underline">
            Try again
          </button>
        </p>
      )}

      {sessions && (
        <ul className="flex flex-col divide-y divide-border">
          {sessions.map((session) => (
            <li key={session.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <MonitorSmartphone className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-text-primary">
                    <span className="truncate">{session.deviceLabel ?? "Unknown device"}</span>
                    {session.isCurrent && <Badge variant="brand">This device</Badge>}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Signed in {formatDateTime(session.createdAt)}
                    {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                  </p>
                </div>
              </div>
              {!session.isCurrent && !isDemo && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => endOne(session.id)}
                  isLoading={endingId === session.id}
                  disabled={revokeOthers.isPending}
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isDemo && others.length > 1 && (
        <div className="border-t border-border pt-4">
          <Button variant="secondary" size="sm" onClick={endOthers} isLoading={revokeOthers.isPending}>
            Sign out of all {others.length} other devices
          </Button>
        </div>
      )}
    </Card>
  );
}
