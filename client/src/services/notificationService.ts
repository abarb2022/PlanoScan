import { apiRequest } from "./apiClient";
import type { NotificationSummary } from "../types/notification";

const NOTIFICATIONS_URL = "/api/rep/notifications";

export function getNotifications(): Promise<NotificationSummary> {
  return apiRequest<NotificationSummary>(NOTIFICATIONS_URL);
}

export function getUnreadCount(): Promise<number> {
  return apiRequest<number>(`${NOTIFICATIONS_URL}/unread-count`);
}

export function markNotificationAsRead(id: string): Promise<null> {
  return apiRequest<null>(`${NOTIFICATIONS_URL}/${id}/read`, {
    method: "POST",
  });
}

export function markAllNotificationsAsRead(): Promise<null> {
  return apiRequest<null>(`${NOTIFICATIONS_URL}/read-all`, {
    method: "POST",
  });
}
