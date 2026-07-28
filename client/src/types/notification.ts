export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationSummary {
  unreadCount: number;
  notifications: Notification[];
}
