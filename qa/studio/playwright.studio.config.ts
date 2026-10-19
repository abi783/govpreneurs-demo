import { defineConfig } from "@playwright/test";

// Studio browser checks. No webServer on purpose: it targets the run's
// already-running preview (STUDIO_URL), so a gate run never rebuilds the app.
export default defineConfig({
  testDir: ".",
  testMatch: "studio.spec.ts",
  fullyParallel: true,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.STUDIO_URL,
    headless: true,
    // Optional: point at an already-installed Chromium when the pinned Playwright browser is not downloaded.
    launchOptions: { executablePath: process.env.STUDIO_CHROMIUM || undefined },
  },
});
