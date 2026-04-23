import {
  Camera,
  ExternalLink,
  Info,
  Keyboard,
  LogOut,
  Lock,
  LockOpen,
  Maximize2,
  Minimize2,
  RefreshCw,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useShell } from "../store/shell";
import { useWindows } from "../store/windows";
import { usePlugins } from "../store/plugins";
import { formatDuration, formatTimer, todayMs, useFocus } from "../store/focus";
import { useNotifications } from "../store/notifications";
import { useLockdown } from "../store/lockdown";
import FocusStats from "./FocusStats";
import MenuDropdown, { type MenuItem } from "./MenuDropdown";
import AboutModal from "./AboutModal";
import NotificationsPopover from "./NotificationsPopover";
import ClockPopover from "./ClockPopover";
import ModeSwitcher from "./ModeSwitcher";
import TasksPopover from "./TasksPopover";
import { useModes } from "../store/modes";
import clsx from "../utils/clsx";

export default function Menubar() {
  const [now, setNow] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [statsOpen, setStatsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const toggleSpotlight = useShell((s) => s.toggleSpotlight);
  const setLaunchpad = useShell((s) => s.setLaunchpad);
  const toggleModePicker = useShell((s) => s.toggleModePicker);
  const toggleShortcuts = useShell((s) => s.toggleShortcuts);
  const activeMode = useModes((s) => {
    const id = s.activeId;
    return id ? (s.modes.find((m) => m.id === id) ?? null) : null;
  });
  const focusedId = useWindows((s) => s.focusedId);
  const windows = useWindows((s) => s.windows);
  const plugins = usePlugins((s) => s.plugins);
  const openApp = useWindows((s) => s.openApp);
  const closeWindow = useWindows((s) => s.closeWindow);
  const toggleMaximize = useWindows((s) => s.toggleMaximize);
  const minimizeWindow = useWindows((s) => s.minimizeWindow);

  const focusActive = useFocus((s) => s.active);
  const focusStartedAt = useFocus((s) => s.startedAt);
  const focusTargetId = useFocus((s) => s.targetPluginId);
  const focusSessions = useFocus((s) => s.sessions);
  const focusHardLock = useFocus((s) => s.hardLock);
  const startFocus = useFocus((s) => s.start);
  const endFocus = useFocus((s) => s.end);
  const openPicker = useFocus((s) => s.openPicker);

  const pushNotification = useNotifications((s) => s.push);

  const lockdownActive = useLockdown((s) => s.active);
  const lockdownPending = useLockdown((s) => s.pending);
  const enableLockdown = useLockdown((s) => s.enable);
  const disableLockdown = useLockdown((s) => s.disable);

  const focused = windows.find((w) => w.id === focusedId);
  const focusedPlugin = focused ? plugins.find((p) => p.id === focused.pluginId) : undefined;
  const targetPlugin = focusTargetId ? plugins.find((p) => p.id === focusTargetId) : undefined;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!focusActive || focusStartedAt == null) {
      setElapsed(0);
      return;
    }
    setElapsed(Date.now() - focusStartedAt);
    const t = setInterval(() => {
      setElapsed(Date.now() - focusStartedAt);
    }, 1000);
    return () => clearInterval(t);
  }, [focusActive, focusStartedAt]);

  const today = useMemo(() => todayMs(focusSessions), [focusSessions]);

  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const date = now.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const handleFocusClick = () => {
    if (focusActive) {
      void endFocus();
      return;
    }
    if (focusedPlugin) {
      startFocus(focusedPlugin);
    } else {
      openPicker();
    }
  };

  const openSettings = (tab?: string) => {
    const settings = plugins.find((p) => p.id === "settings");
    if (settings) openApp(settings, tab ? { tab } : undefined);
  };

  const isMac = navigator.userAgent.toLowerCase().includes("mac");
  const mod = isMac ? "⌘" : "Ctrl";

  const preposItems: MenuItem[] = [
    {
      id: "about",
      label: "About PrepOS",
      icon: <Info className="h-3.5 w-3.5" />,
      onSelect: () => setAboutOpen(true),
    },
    { id: "sep-0", type: "separator" },
    {
      id: "mode-picker",
      label: activeMode ? `Switch mode (current: ${activeMode.name})` : "Pick study mode…",
      icon: <span className="text-[14px]">{activeMode?.icon ?? "🎯"}</span>,
      shortcut: `${mod}⇧M`,
      onSelect: () => toggleModePicker(),
    },
    { id: "sep-1", type: "separator" },
    {
      id: "lockdown",
      label: lockdownActive ? "Unlock PrepOS" : "Enable Lockdown Mode",
      icon: lockdownActive ? (
        <LockOpen className="h-3.5 w-3.5 text-amber-300" />
      ) : (
        <Lock className="h-3.5 w-3.5" />
      ),
      shortcut: `${mod}⇧L`,
      danger: lockdownActive,
      onSelect: () => {
        if (lockdownActive) void disableLockdown();
        else void enableLockdown();
      },
    },
    { id: "sep-1a", type: "separator" },
    {
      id: "settings",
      label: "Settings…",
      icon: <SettingsIcon className="h-3.5 w-3.5" />,
      shortcut: `${mod},`,
      onSelect: () => openSettings(),
    },
    {
      id: "focus-settings",
      label: "Focus Settings",
      icon: <Target className="h-3.5 w-3.5" />,
      onSelect: () => openSettings("focus"),
    },
    {
      id: "shortcuts",
      label: "Keyboard Shortcuts",
      icon: <Keyboard className="h-3.5 w-3.5" />,
      shortcut: `${mod}/`,
      onSelect: () => toggleShortcuts(),
    },
    { id: "sep-2", type: "separator" },
    {
      id: "updates",
      label: "Check for Updates…",
      icon: <RefreshCw className="h-3.5 w-3.5" />,
      onSelect: async () => {
        const res = await window.prepOS.checkForUpdates();
        if (res.status === "dev") {
          pushNotification({
            kind: "update",
            title: "Development build",
            body: "Auto-updates only run in packaged releases.",
            icon: "🛠️",
          });
        } else if (res.status === "up-to-date") {
          pushNotification({
            kind: "update",
            title: "You're up to date",
            body: "No new updates available right now.",
            icon: "✅",
          });
        } else if (res.status === "checking") {
          pushNotification({
            kind: "update",
            title: `Update ${res.version} downloading`,
            body: "You'll be prompted to install when it's ready.",
            icon: "⬇️",
          });
        } else {
          pushNotification({
            kind: "update",
            title: "Couldn't check for updates",
            body: res.message,
            icon: "⚠️",
          });
        }
      },
    },
    { id: "sep-3", type: "separator" },
    {
      id: "quit",
      label: "Quit PrepOS",
      icon: <LogOut className="h-3.5 w-3.5" />,
      shortcut: `${mod}Q`,
      danger: true,
      onSelect: () => void window.prepOS.quit(),
    },
  ];

  const appMenuLabel = focusedPlugin?.name ?? "Desktop";
  const appMenuItems: MenuItem[] = useMemo(() => {
    if (!focused || !focusedPlugin) {
      return [
        {
          id: "launchpad",
          label: "Open Launchpad",
          shortcut: "F4",
          onSelect: () => setLaunchpad(true),
        },
        {
          id: "spotlight",
          label: "Open Spotlight",
          shortcut: `${mod}K`,
          onSelect: () => toggleSpotlight(),
        },
      ];
    }

    const items: MenuItem[] = [];
    items.push({
      id: "heading-app",
      type: "heading",
      label: focusedPlugin.name,
    });

    if (focusedPlugin.type === "webview") {
      const sections = focusedPlugin.sections ?? [];
      if (sections.length > 0) {
        items.push({
          id: "heading-sections",
          type: "heading",
          label: "Quick Links",
        });
        sections.forEach((sec) => {
          items.push({
            id: `section-${sec.id}`,
            label: sec.label,
            icon: sec.icon ? <span>{sec.icon}</span> : undefined,
            onSelect: () => {
              window.dispatchEvent(
                new CustomEvent("prepos:navigate", {
                  detail: { winId: focused.id, url: sec.url },
                }),
              );
            },
          });
        });
      }
      if (focusedPlugin.homepageShortcut) {
        items.push({ id: "sep-home", type: "separator" });
        items.push({
          id: "open-external",
          label: `Open ${focusedPlugin.name} in system browser`,
          icon: <ExternalLink className="h-3.5 w-3.5" />,
          onSelect: () =>
            void window.prepOS.openExternal(focusedPlugin.homepageShortcut ?? focusedPlugin.entry),
        });
      }
    }

    items.push({ id: "sep-win", type: "separator" });
    items.push({
      id: "minimize",
      label: "Minimize",
      icon: <Minimize2 className="h-3.5 w-3.5" />,
      shortcut: `${mod}M`,
      onSelect: () => minimizeWindow(focused.id),
    });
    items.push({
      id: "maximize",
      label: focused.maximized ? "Restore" : "Zoom",
      icon: <Maximize2 className="h-3.5 w-3.5" />,
      onSelect: () =>
        toggleMaximize(focused.id, {
          width: window.innerWidth,
          height: window.innerHeight,
        }),
    });
    items.push({ id: "sep-close", type: "separator" });
    items.push({
      id: "close",
      label: `Close ${focusedPlugin.name}`,
      icon: <X className="h-3.5 w-3.5" />,
      shortcut: `${mod}W`,
      danger: true,
      onSelect: () => closeWindow(focused.id),
    });

    return items;
  }, [
    focused,
    focusedPlugin,
    mod,
    closeWindow,
    toggleMaximize,
    minimizeWindow,
    setLaunchpad,
    toggleSpotlight,
  ]);

  return (
    <div
      className={clsx(
        "drag-region fixed inset-x-0 top-0 z-[9200] flex h-7 items-center justify-between border-b px-4 text-[12px] text-white/90 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl transition-colors",
        lockdownActive ? "bg-amber-950/80" : "bg-neutral-950/85",
      )}
      style={{
        borderBottomColor: lockdownActive
          ? "rgba(251,191,36,0.55)"
          : activeMode
            ? `${activeMode.accent}55`
            : "rgba(255,255,255,0.10)",
      }}
    >
      <div className="no-drag flex items-center gap-1.5 pl-20">
        <MenuDropdown
          label={<span className="font-semibold">PrepOS</span>}
          items={preposItems}
          triggerClassName="flex items-center gap-1 rounded px-2 py-0.5 text-[12px] hover:bg-white/10"
        />
        <MenuDropdown
          label={<span className="text-white/85">{appMenuLabel}</span>}
          items={appMenuItems}
          triggerClassName="flex items-center gap-1 rounded px-2 py-0.5 text-[12px] hover:bg-white/10"
        />
        <div className="mx-1 h-3 w-px bg-white/10" aria-hidden />
        <ModeSwitcher />
      </div>
      <div className="no-drag flex items-center gap-3">
        {focusActive ? (
          <div
            className={clsx(
              "flex items-center gap-1.5 rounded-full border px-2 py-0.5",
              focusHardLock
                ? "border-amber-300/40 bg-amber-500/15 text-amber-200"
                : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
            )}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={clsx(
                  "absolute inset-0 animate-ping rounded-full",
                  focusHardLock ? "bg-amber-400/60" : "bg-emerald-400/60",
                )}
              />
              <span
                className={clsx(
                  "relative h-2 w-2 rounded-full",
                  focusHardLock ? "bg-amber-400" : "bg-emerald-400",
                )}
              />
            </span>
            {focusHardLock && (
              <Lock className="h-3 w-3 text-amber-200/90" aria-label="Hard focus mode" />
            )}
            <span
              className="text-[11px] tabular-nums"
              title={
                focusHardLock
                  ? "Hard focus mode — app is locked until session ends"
                  : targetPlugin
                    ? `Focusing on ${targetPlugin.name}`
                    : "Focus session"
              }
            >
              {formatTimer(elapsed)}
            </span>
            <button
              onClick={handleFocusClick}
              className={clsx(
                "ml-1 rounded px-1 text-[10px] uppercase tracking-wider hover:bg-white/10 hover:text-white",
                focusHardLock ? "text-amber-100/85" : "text-emerald-100/80",
              )}
              title="End focus session"
            >
              End
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleFocusClick}
              className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10"
              title="Start focus session"
            >
              <Target className="h-3.5 w-3.5" />
              <span className="text-[11px]">Focus</span>
            </button>
            {today > 0 && (
              <button
                onClick={() => setStatsOpen((v) => !v)}
                className={clsx(
                  "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] tabular-nums text-white/70 hover:bg-white/10",
                  statsOpen && "bg-white/10 text-white",
                )}
                title="Focus stats"
              >
                {formatDuration(today)} today
              </button>
            )}
          </>
        )}
        <button
          onClick={async () => {
            await window.prepOS.captures.trigger();
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10"
          title="Capture region · Cmd+Shift+A"
        >
          <Camera className="h-3.5 w-3.5" />
          <span className="text-[11px]">Capture</span>
        </button>
        <button
          onClick={() => {
            const ai = plugins.find((p) => p.id === "ai-chat");
            if (ai) openApp(ai);
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10"
          title="Open AI Chat"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[11px]">AI</span>
        </button>
        {lockdownActive && (
          <button
            onClick={() => {
              if (!lockdownPending) void disableLockdown();
            }}
            disabled={lockdownPending}
            className="flex items-center gap-1 rounded-full border border-amber-300/50 bg-amber-500/25 px-2 py-0.5 text-[11px] text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.25)] hover:bg-amber-500/35 disabled:opacity-60"
            title="Lockdown is active — click to unlock (⌘⇧L)"
          >
            <Lock className="h-3 w-3" />
            <span className="font-medium tracking-wide">LOCKED</span>
          </button>
        )}
        <Wifi className="h-3.5 w-3.5 opacity-80" />
        <TasksPopover />
        <NotificationsPopover />
        <button
          onClick={toggleSpotlight}
          className="rounded px-2 py-0.5 hover:bg-white/10"
          title="Spotlight · Cmd+K"
        >
          🔎
        </button>
        <ClockPopover date={date} time={time} />
      </div>
      <FocusStats open={statsOpen} onClose={() => setStatsOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
