import { api } from './client';

export type NotificationType = 'COMMUNITY' | 'MESSAGE' | 'PROMOTION' | 'SYSTEM';

export type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  payload: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationList = { unread: number; items: NotificationItem[] };

export async function getNotifications(limit?: number): Promise<NotificationList> {
  const { data } = await api.get<NotificationList>('/users/me/notifications', { params: { limit } });
  return data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/users/me/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/users/me/notifications/read-all');
}

// Device-token registration for remote push. Wired for when a dev/EAS build adds
// expo-notifications (Expo Go on SDK 54 cannot receive remote push).
export async function registerPushToken(token: string, platform?: string): Promise<void> {
  await api.post('/users/me/push-tokens', { token, platform });
}

export async function removePushToken(token: string): Promise<void> {
  await api.post('/users/me/push-tokens/remove', { token });
}
