export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
  link?: string;
}

export interface NotificationResponse {
  notifications: AppNotification[];
  count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}
