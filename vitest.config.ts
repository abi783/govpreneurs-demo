import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Node env + globals stay the default for the pure-logic `*.test.ts` suites.
// The react() plugin (JSX transform) and the `@` alias are added so component
// tests can opt into a browser env with `// @vitest-environment jsdom`.
//
// Playwright SPECS are excluded because they import `@playwright/test`, which
// throws when run under any runner but Playwright's own — see `npm run test:e2e`.
//
// The pattern is `e2e/**/*.spec.ts`, NOT `e2e/**`. Every one of the browser specs
// is a `*.spec.ts` under `e2e/`, so the exclusion above is preserved exactly;
// what the narrower pattern buys is that the CI tooling's pure units
// (`e2e/tools/*.test.ts` — the OTP extractor, the GHL token decode) are run by
// the ordinary `npx vitest run`. Under the old `e2e/**` they were unrunnable:
// naming one explicitly reported "No test files found" AND EXITED 0, which is a
// test that proves nothing while reading as green. Convention, repo-wide:
// `*.test.ts` is vitest, `*.spec.ts` under `e2e/` is Playwright.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/vitest.setup.ts"],
    // The forecast tests read forecasts recorded on this day, so their clock is pinned
    // to it. The app itself counts from today (lib/forecasts/engine.ts, FORECASTS_TODAY).
    env: { VITE_FORECASTS_TODAY: "2026-09-16" },
    exclude: [...configDefaults.exclude, "qa/**"],
  },
});
