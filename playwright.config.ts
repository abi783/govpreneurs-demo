import { defineConfig } from "@playwright/test";
import os from "node:os";

// QA crawl: chromium, headless, against `vite preview` of a production build.
// Port: QA_PORT (default 4318). Use a different port if two runs share a machine.
// Workers: QA_WORKERS (default: half the CPUs, at most 6).
const PORT = Number(process.env.QA_PORT ?? 4318);
const WORKERS = Number(process.env.QA_WORKERS ?? Math.max(2, Math.min(6, Math.floor(os.cpus().length / 2))));

export default defineConfig({
  testDir: "./qa",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  workers: WORKERS,
  timeout: 10 * 60_000,
  reporter: [["list"]],
  globalSetup: "./qa/globalSetup.ts",
  globalTeardown: "./qa/globalTeardown.ts",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    // Which sample member the build opens on (src/demo/member.ts). The flow specs are written for the caterer.
    // Presenter mode is on, so the crawl reaches every page (src/demo/visitor.ts).
    env: { VITE_DEMO_MEMBER: process.env.QA_MEMBER ?? "caterer", VITE_PRESENTER: "on" },
    // The build goes to its own folder so a QA run never touches `dist/`.
    command: `bunx vite build --outDir .qa-dist/${PORT} --emptyOutDir && bunx vite preview --outDir .qa-dist/${PORT} --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
