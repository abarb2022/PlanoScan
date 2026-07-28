import { Client, type IMessage } from "@stomp/stompjs";
import { resolveWebSocketUrl } from "./apiClient";
import { authService } from "./authService";
import type { Notification } from "../types/notification";

export function connectNotificationSocket(
  onNotification: (notification: Notification) => void,
): Client | null {
  const token = authService.getToken();
  if (!token) return null;

  const client = new Client({
    brokerURL: resolveWebSocketUrl("/ws"),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe("/user/queue/notifications", (message: IMessage) => {
        onNotification(JSON.parse(message.body) as Notification);
      });
    },
  });

  client.activate();
  return client;
}
