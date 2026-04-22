import { usePlugins } from "../store/plugins";
import { useWindows } from "../store/windows";

export interface OpenInAppOptions {
  url: string;
  title?: string;
  sourceName?: string;
  sourceIcon?: string;
}

/**
 * Open any http(s) URL inside PrepOS by launching the hidden `reader` plugin
 * in a new window. All path converge here: Feed articles, webview popups,
 * main-window `window.open` forwards.
 */
export function openInApp(options: OpenInAppOptions): string | null {
  const { url, title, sourceName, sourceIcon } = options;
  if (!url || typeof url !== "string") return null;

  const plugins = usePlugins.getState().plugins;
  const reader = plugins.find((p) => p.id === "reader");
  if (!reader) {
    // Fallback: if reader is somehow missing, bail to the system browser so
    // we don't silently swallow user clicks.
    void window.prepOS?.openExternal?.(url);
    return null;
  }

  return useWindows.getState().openApp(reader, {
    url,
    title: title ?? url,
    sourceName,
    sourceIcon,
  });
}
