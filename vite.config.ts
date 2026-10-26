import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
