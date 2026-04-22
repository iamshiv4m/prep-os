import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@main": resolve("src/main"),
      },
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
