"use client";

import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@vittamhub/api-client";
import { EmptyState } from "@vittamhub/ui";
import { formatRelativeTime } from "@vittamhub/utils";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PAGE_SIZE_STEP = 20;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_STEP);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: unread } = useUnreadNotificationCount();
  const { data: notificationsResult } = useNotifications({ page: 1, pageSize });
  const notifications = notificationsResult?.items;
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = unread?.count ?? 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `${count} unread notifications` : "Notifications"}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background-secondary hover:text-text-primary"
      >
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-danger-600" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-dropdown w-80 rounded-card border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-text-primary">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification) => {
                const content = (
                  <div className={`px-4 py-3 ${notification.readAt ? "" : "bg-brand-50"}`}>
                    <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{notification.body}</p>
                    <p className="mt-1 text-[11px] text-text-secondary">{formatRelativeTime(notification.createdAt)}</p>
                  </div>
                );
                return notification.linkUrl ? (
                  <Link key={notification.id} href={notification.linkUrl} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })
            ) : (
              <EmptyState icon={Bell} title="You're all caught up" description="New notifications will show up here." className="py-8" />
            )}
            {notificationsResult && notificationsResult.totalItems > pageSize && (
              <button
                type="button"
                onClick={() => setPageSize((size) => size + PAGE_SIZE_STEP)}
                className="px-4 py-3 text-center text-xs font-medium text-brand-primary hover:underline"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
