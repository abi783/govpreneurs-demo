import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// DEMO: the start screen collects leads (src/demo/visitor.ts, D98). A production
// build with the start screen on must say where they go, so a live site never
// drops them. Set VITE_LEAD_WEBHOOK_URL, or VITE_LEAD_WEBHOOK_URL=none on purpose,
// or VITE_START_SCREEN=off.
function leadDestinationCheck(): Plugin {
  return {
    name: "demo-lead-destination",
    apply: "build",
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), "VITE_");
      if (env.VITE_START_SCREEN !== "off" && !env.VITE_LEAD_WEBHOOK_URL) {
        throw new Error(
          "The start screen is on but VITE_LEAD_WEBHOOK_URL is not set, so leads would go nowhere. " +
            "Set it to the HighLevel webhook, or to 'none', or set VITE_START_SCREEN=off.",
        );
      }
    },
  };
}

export default defineConfig({
  // DEMO: static site served from the root.
  base: process.env.BASE_PATH ?? "/",
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
    leadDestinationCheck(),
    TanStackRouterVite(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    // DEMO: `@sc/*` is the lifted Success Center code. The `next/*` imports in that
    // code resolve to small stand-ins in src/demo/shims.
    alias: [
      { find: /^next\/link$/, replacement: path.resolve(__dirname, "./src/demo/shims/next-link.tsx") },
      { find: /^next\/navigation$/, replacement: path.resolve(__dirname, "./src/demo/shims/next-navigation.ts") },
      { find: /^next\/image$/, replacement: path.resolve(__dirname, "./src/demo/shims/next-image.tsx") },
      { find: /^next\/dynamic$/, replacement: path.resolve(__dirname, "./src/demo/shims/next-dynamic.tsx") },
      { find: /^@sc\//, replacement: `${path.resolve(__dirname, "./src/sc")}/` },
      { find: /^@\//, replacement: `${path.resolve(__dirname, "./src")}/` },
    ],
  },
});
