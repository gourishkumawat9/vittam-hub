import type { Notification, NotificationListFilters, PaginatedResult } from "@vittamhub/types";

import { apiRequest } from "../http";

export const notificationsApi = {
  list: (filters: NotificationListFilters) =>
    apiRequest<PaginatedResult<Notification>>(`/v1/notifications?page=${filters.page}&pageSize=${filters.pageSize}`),
  unreadCount: () => apiRequest<{ count: number }>("/v1/notifications/unread-count"),
  markRead: (id: string) => apiRequest<void>(`/v1/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => apiRequest<void>("/v1/notifications/read-all", { method: "PATCH" }),
};
