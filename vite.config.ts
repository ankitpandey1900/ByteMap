import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { systemDrivesBridgePlugin } from "./scripts/dev-bridge";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), systemDrivesBridgePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "zustand"],
          "vendor-recharts": ["recharts"],
          "vendor-icons": ["lucide-react"],
          "vendor-tauri": [
            "@tauri-apps/api/core",
            "@tauri-apps/api/event",
            "@tauri-apps/api/webview",
            "@tauri-apps/plugin-dialog",
            "@tauri-apps/plugin-opener",
          ],
        },
      },
    },
  },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  // @ts-ignore
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
});
