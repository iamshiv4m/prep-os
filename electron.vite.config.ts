import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

// Build-time env vars baked into the main process bundle. The update checker
// reads PREPOS_WEBSITE_URL at runtime via `process.env.PREPOS_WEBSITE_URL`,
// but Electron's main bundle is created at *build* time — so we have to
// inline the value here for it to survive into the packaged binary.
const PREPOS_WEBSITE_URL = process.env.PREPOS_WEBSITE_URL ?? "";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@main": resolve("src/main"),
      },
    },
    define: {
      "process.env.PREPOS_WEBSITE_URL": JSON.stringify(PREPOS_WEBSITE_URL),
    },
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: resolve("src/main/index.ts"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
      },
    },
    build: {
      outDir: "out/preload",
      rollupOptions: {
        input: resolve("src/main/preload.ts"),
      },
    },
  },
  renderer: {
    root: "src/renderer",
    plugins: [react()],
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer"),
        "@shared": resolve("src/shared"),
      },
    },
    build: {
      outDir: "out/renderer",
      rollupOptions: {
        input: resolve("src/renderer/index.html"),
      },
    },
    server: {
      port: 5173,
    },
  },
});
