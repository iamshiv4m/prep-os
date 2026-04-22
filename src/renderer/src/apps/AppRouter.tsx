import { useEffect, useState } from "react";
import type { Capture } from "@shared/types";
import { usePlugins } from "../store/plugins";
import { useWindows, type WindowState } from "../store/windows";
import AIChat from "./AIChat";
import Feed from "./Feed";
import Notes from "./Notes";
import Playground from "./Playground";
import Settings from "./Settings";
import WebviewHost from "./WebviewHost";

interface Props {
  win: WindowState;
}

export default function AppRouter({ win }: Props) {
  const plugins = usePlugins((s) => s.plugins);
  const updateAppState = useWindows((s) => s.updateAppState);
  const plugin = plugins.find((p) => p.id === win.pluginId);
  const [seedCapture, setSeedCapture] = useState<Capture | undefined>(
    (win.appState?.capture as Capture | undefined) ?? undefined,
  );

  useEffect(() => {
    setSeedCapture((win.appState?.capture as Capture | undefined) ?? undefined);
  }, [win.appState]);

  if (!plugin) return <div className="p-6 text-white/60">Plugin not found</div>;

  if (plugin.type === "webview") {
    return <WebviewHost plugin={plugin} />;
  }

  switch (plugin.entry) {
    case "ai-chat":
      return (
        <AIChat
          seedCapture={seedCapture}
          onConsumeCapture={() => {
            updateAppState(win.id, { capture: undefined });
            setSeedCapture(undefined);
          }}
        />
      );
    case "notes":
      return <Notes />;
    case "playground":
      return <Playground />;
    case "feed":
      return <Feed />;
    case "settings":
      return <Settings initialTab={(win.appState?.tab as string | undefined) ?? undefined} />;
    default:
      return <div className="p-6 text-white/60">Unknown native app: {plugin.entry}</div>;
  }
}
