// Playwright config for Ava's own QA specs. It reuses a server that is already
// running (the production build, served by `vite preview`), so a run does not
// build again and does not wipe qa/report.
//
//   bunx vite build --outDir .qa-dist/4371 --emptyOutDir
//   bunx vite preview --outDir .qa-dist/4371 --port 4371 --strictPort &
//   QA_PORT=4371 bunx playwright test -c qa/ava.config.ts
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.QA_PORT ?? 4371);

export default defineConfig({
  testDir: ".",
  testMatch: ["ava-flow.spec.ts", "flows/ava-qa.spec.ts"],
  fullyParallel: true,
  workers: Number(process.env.QA_WORKERS ?? 2),
  timeout: 5 * 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
});
