import { defineConfig } from "@playwright/test";

// Headless E2E for the Grant rail UX. Boots the Vite dev server and drives the
// harness page (e2e/harness.html) which mounts the real GrantRail component;
// backend calls (/grants-take/rail) are intercepted per-test.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    // The app is served under Vite's base ('/v2/ui'); the harness lives there too.
    baseURL: "http://localhost:5199/v2/ui/",
    headless: true,
  },
  webServer: {
    command: "npm run dev -- --port 5199 --strictPort",
    port: 5199,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
