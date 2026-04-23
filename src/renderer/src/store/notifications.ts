import { create } from "zustand";
import { nanoid } from "nanoid";

export type NotificationKind = "focus" | "feed" | "tip" | "update" | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  icon?: string;
  createdAt: number;
  read: boolean;
  /** Optional handler run when the user clicks the notification. */
  actionLabel?: string;
}

const MAX_NOTIFICATIONS = 30;

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: () => number;
  push: (input: Omit<AppNotification, "id" | "createdAt" | "read">) => AppNotification;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotifications = create<NotificationStore>((set, get) => ({
  notifications: [],

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  push: (input) => {
    const notif: AppNotification = {
      id: nanoid(10),
      createdAt: Date.now(),
      read: false,
      ...input,
    };
    set((state) => ({
      notifications: [notif, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
    }));
    return notif;
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  clearAll: () => set({ notifications: [] }),
}));

export function formatNotificationTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}
