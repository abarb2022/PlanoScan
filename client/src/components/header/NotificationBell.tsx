import { useEffect, useRef, useState } from "react";
import type { Notification } from "../../types/notification";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";
import { connectNotificationSocket } from "../../services/notificationSocket";
import "./NotificationBell.css";

// Fallback reconciliation only — new notifications arrive instantly over the
// WebSocket in connectNotificationSocket; this just guards against a missed
// or dropped push.
const POLL_INTERVAL_MS = 20000;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      getNotifications()
        .then((summary) => {
          if (cancelled) return;
          setNotifications(summary.notifications);
          setUnreadCount(summary.unreadCount);
        })
        .catch(() => {});
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    const client = connectNotificationSocket((notification) => {
      if (cancelled) return;
      setNotifications((prev) =>
        prev.some((n) => n.id === notification.id)
          ? prev
          : [notification, ...prev],
      );
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      client?.deactivate();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleNotificationClick(notification: Notification) {
    if (notification.read) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    markNotificationAsRead(notification.id).catch(() => {});
  }

  function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    markAllNotificationsAsRead().catch(() => {});
  }

  return (
    <div className="notification-bell-wrap" ref={ref}>
      <button
        className="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        type="button"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C10.3 2 9 3.3 9 5v.3C6.6 6.2 5 8.4 5 11v4l-2 2v1h18v-1l-2-2v-4c0-2.6-1.6-4.8-4-5.7V5c0-1.7-1.3-3-3-3z"
            fill="currentColor"
          />
          <path
            d="M9.5 19a2.5 2.5 0 0 0 5 0h-5z"
            fill="currentColor"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="notification-panel">
          <div className="notification-panel__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                className="notification-panel__mark-all"
                onClick={handleMarkAllAsRead}
                type="button"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="notification-panel__list">
            {notifications.length === 0 && (
              <div className="notification-panel__empty">
                No notifications yet
              </div>
            )}
            {notifications.map((notification) => {
              const isUnassignment = notification.type === "STORE_UNASSIGNMENT";
              return (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item${notification.read ? "" : " notification-item--unread"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span
                    className={`notification-item__icon${isUnassignment ? " notification-item__icon--removed" : " notification-item__icon--assigned"}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                      <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      {!isUnassignment && (
                        <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      )}
                    </svg>
                  </span>
                  <span className="notification-item__body">
                    <span className="notification-item__message">
                      {notification.message}
                    </span>
                    <span className="notification-item__time">
                      {formatTimestamp(notification.createdAt)}
                    </span>
                  </span>
                  {!notification.read && <span className="notification-item__dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
