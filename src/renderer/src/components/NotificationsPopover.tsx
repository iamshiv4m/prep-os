import { Bell, CheckCheck, Inbox, Trash2 } from "lucide-react";
import Popover from "./Popover";
import {
  formatNotificationTime,
  useNotifications,
  type AppNotification,
  type NotificationKind,
} from "../store/notifications";
import clsx from "../utils/clsx";

const KIND_ICON: Record<NotificationKind, string> = {
  focus: "🎯",
  feed: "📰",
  tip: "💡",
  update: "⬆️",
  system: "◆",
};

function NotifRow({ n }: { n: AppNotification }) {
  return (
    <div
      className={clsx(
        "flex items-start gap-3 border-b border-white/5 px-3 py-2.5 last:border-b-0",
        !n.read && "bg-white/[0.03]",
      )}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[14px] ring-1 ring-white/10">
        {n.icon ?? KIND_ICON[n.kind]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-[12.5px] font-medium text-white/90">{n.title}</div>
          <div className="shrink-0 text-[10.5px] text-white/40">
            {formatNotificationTime(n.createdAt)}
          </div>
        </div>
        {n.body && (
          <div className="mt-0.5 whitespace-pre-line text-[11.5px] leading-relaxed text-white/55">
            {n.body}
          </div>
        )}
      </div>
      {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />}
    </div>
  );
}

export default function NotificationsPopover() {
  const notifications = useNotifications((s) => s.notifications);
  const unread = notifications.filter((n) => !n.read).length;
  const markAllRead = useNotifications((s) => s.markAllRead);
  const clearAll = useNotifications((s) => s.clearAll);

  return (
    <Popover
      width={360}
      align="end"
      trigger={({ open, toggle }) => (
        <button
          onClick={() => {
            toggle();
            if (!open && unread > 0) markAllRead();
          }}
          className={clsx(
            "relative flex items-center rounded px-1.5 py-0.5 hover:bg-white/10",
            open && "bg-white/10",
          )}
          title={
            unread > 0 ? `${unread} new notification${unread === 1 ? "" : "s"}` : "Notifications"
          }
        >
          <Bell className="h-3.5 w-3.5 opacity-85" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/60" />
              <span className="relative h-2 w-2 rounded-full bg-sky-400" />
            </span>
          )}
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white/85">
          <Bell className="h-3.5 w-3.5" />
          Notifications
          {unread > 0 && (
            <span className="ml-1 rounded-full bg-sky-500/20 px-1.5 py-px text-[10px] font-medium text-sky-200">
              {unread} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] text-white/55 hover:bg-white/[0.08] hover:text-white"
                title="Mark all as read"
              >
                <CheckCheck className="h-3 w-3" /> Read
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] text-white/55 hover:bg-white/[0.08] hover:text-red-200"
                title="Clear all"
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </>
          )}
        </div>
      </div>
      <div className="max-h-[380px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <Inbox className="h-8 w-8 text-white/20" />
            <div className="mt-2 text-[12.5px] font-medium text-white/60">All caught up</div>
            <div className="mt-0.5 text-[11px] text-white/35">
              Focus sessions & Dev News updates will show up here.
            </div>
          </div>
        ) : (
          notifications.map((n) => <NotifRow key={n.id} n={n} />)
        )}
      </div>
    </Popover>
  );
}
