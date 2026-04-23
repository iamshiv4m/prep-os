import { useEffect } from "react";
import Desktop from "./components/Desktop";
import Dock from "./components/Dock";
import FocusPicker from "./components/FocusPicker";
import Launchpad from "./components/Launchpad";
import Menubar from "./components/Menubar";
import ModePicker from "./components/ModePicker";
import ShortcutsOverlay from "./components/ShortcutsOverlay";
import Spotlight from "./components/Spotlight";
import Window from "./components/Window";
import AppRouter from "./apps/AppRouter";
import { useFocus } from "./store/focus";
import { useLockdown } from "./store/lockdown";
import { usePlugins } from "./store/plugins";
import { useShell } from "./store/shell";
import { useWindows } from "./store/windows";
import { openInApp } from "./utils/openInApp";

export default function App() {
  const refreshPlugins = usePlugins((s) => s.refresh);
  const plugins = usePlugins((s) => s.plugins);
  const windows = useWindows((s) => s.windows);
  const focusedId = useWindows((s) => s.focusedId);
  const openApp = useWindows((s) => s.openApp);
  const updateAppState = useWindows((s) => s.updateAppState);
  const toggleSpotlight = useShell((s) => s.toggleSpotlight);
  const setSpotlight = useShell((s) => s.setSpotlight);
  const toggleLaunchpad = useShell((s) => s.toggleLaunchpad);
  const toggleModePicker = useShell((s) => s.toggleModePicker);
  const shortcutsOpen = useShell((s) => s.shortcutsOpen);
  const toggleShortcuts = useShell((s) => s.toggleShortcuts);
  const setShortcuts = useShell((s) => s.setShortcuts);

  const refreshFocus = useFocus((s) => s.refresh);
  const focusActive = useFocus((s) => s.active);
  const focusTargetId = useFocus((s) => s.targetPluginId);
  const endFocus = useFocus((s) => s.end);
  const setHardLock = useFocus((s) => s.setHardLock);

  const hydrateLockdown = useLockdown((s) => s.hydrate);
  const setLockdownActive = useLockdown((s) => s.setActive);
  const lockdownActive = useLockdown((s) => s.active);
  const enableLockdown = useLockdown((s) => s.enable);
  const disableLockdown = useLockdown((s) => s.disable);

  useEffect(() => {
    void refreshPlugins();
    void refreshFocus();
    void (async () => {
      try {
        const settings = await window.prepOS.settings.get();
        setHardLock(!!settings.focusHardLock);
      } catch {
        /* ignore */
      }
    })();
  }, [refreshPlugins, refreshFocus, setHardLock]);

  useEffect(() => {
    const off = window.prepOSEvents?.onFocusForceEnd(() => {
      void endFocus();
    });
    return () => {
      if (typeof off === "function") off();
    };
  }, [endFocus]);

  useEffect(() => {
    const off = window.prepOS.onOpenUrl?.((url) => {
      openInApp({ url });
    });
    return () => {
      if (typeof off === "function") off();
    };
  }, []);

  useEffect(() => {
    void hydrateLockdown();
    const off = window.prepOS.lockdown?.onChange((active) => {
      setLockdownActive(active);
    });
    return () => {
      if (typeof off === "function") off();
    };
  }, [hydrateLockdown, setLockdownActive]);

  useEffect(() => {
    const off = window.prepOS.captures.onReady((capture) => {
      const aiPlugin = plugins.find((p) => p.id === "ai-chat");
      if (!aiPlugin) return;
      const existing = windows.find((w) => w.pluginId === "ai-chat");
      if (existing) {
        updateAppState(existing.id, { capture });
        useWindows.getState().focusWindow(existing.id);
      } else {
        openApp(aiPlugin, { capture });
      }
    });
    return off;
  }, [plugins, windows, openApp, updateAppState]);

  useEffect(() => {
    if (!focusActive || !focusTargetId) return;

    const targetWindow = windows.find((w) => w.pluginId === focusTargetId);
    if (!targetWindow) {
      void endFocus();
      return;
    }

    if (focusedId) {
      const focusedWin = windows.find((w) => w.id === focusedId);
      if (focusedWin && focusedWin.pluginId !== focusTargetId) {
        void endFocus();
      }
    }
  }, [focusActive, focusTargetId, focusedId, windows, endFocus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        if (lockdownActive) void disableLockdown();
        else void enableLockdown();
      } else if (mod && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSpotlight();
      } else if (mod && e.key === ",") {
        e.preventDefault();
        const settings = plugins.find((p) => p.id === "settings");
        if (settings) openApp(settings);
      } else if (mod && !e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        toggleLaunchpad();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        void window.prepOS.captures.trigger();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleModePicker();
      } else if (mod && e.key === "/") {
        e.preventDefault();
        toggleShortcuts();
      } else if (e.key === "Escape") {
        setSpotlight(false);
        setShortcuts(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    plugins,
    openApp,
    toggleSpotlight,
    toggleLaunchpad,
    toggleModePicker,
    toggleShortcuts,
    setSpotlight,
    setShortcuts,
    lockdownActive,
    enableLockdown,
    disableLockdown,
  ]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Desktop />
      <Menubar />
      <div className="absolute inset-x-0 bottom-0 top-7 z-[100]">
        {windows.map((win) => (
          <Window key={win.id} win={win}>
            <AppRouter win={win} />
          </Window>
        ))}
      </div>
      <Dock />
      <Launchpad />
      <Spotlight />
      <FocusPicker />
      <ModePicker />
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcuts(false)} />
    </div>
  );
}
