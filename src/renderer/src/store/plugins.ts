import { create } from "zustand";
import type { PluginManifest } from "@shared/types";

interface PluginsStore {
  plugins: PluginManifest[];
  loading: boolean;
  refresh: () => Promise<void>;
  addCustom: (input: { name: string; url: string; icon?: string }) => Promise<PluginManifest>;
  remove: (id: string) => Promise<void>;
}

export const usePlugins = create<PluginsStore>((set, get) => ({
  plugins: [],
  loading: false,

  refresh: async () => {
    set({ loading: true });
    const plugins = await window.prepOS.plugins.list();
    set({ plugins, loading: false });
  },

  addCustom: async ({ name, url, icon }) => {
    const manifest = await window.prepOS.plugins.add({
      name,
      icon: icon ?? "🌐",
      type: "webview",
      entry: url,
    });
    await get().refresh();
    return manifest;
  },

  remove: async (id) => {
    await window.prepOS.plugins.remove(id);
    await get().refresh();
  },
}));
