import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // DEMO: static site served from the root.
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  // DEMO: the QA harness (qa/) runs against this fixed port.
  preview: {
    host: "127.0.0.1",
    port: 4318,
    strictPort: true,
  },
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
