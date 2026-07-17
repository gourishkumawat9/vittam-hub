"use client";

import type { NotificationListFilters } from "@vittamhub/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationsApi } from "../endpoints/notifications";

const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters: NotificationListFilters) => [...notificationKeys.all, filters] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export function useNotifications(filters: NotificationListFilters) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationsApi.list(filters),
    placeholderData: (previousData) => previousData,
  });
}

/** Polls every 15s for the dashboard bell badge — see NotificationsService.unreadCount for the "why polling" note. */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 15_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
}
