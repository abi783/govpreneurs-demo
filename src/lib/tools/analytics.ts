// Thin wrapper around the app-wide PostHog instance (see __root.tsx /
// main.tsx's PostHogProvider) for the /tools funnel events. `usePostHog()`
// can return null (missing VITE_POSTHOG_KEY, or not yet initialized) so every
// call site must guard — this hook does that once instead of every caller
// repeating `posthog?.capture`.
import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

export type ToolName = "demand" | "naics" | "scorecard" | "capstatement" | "checklist" | "hubzone";

export function useToolsAnalytics() {
  const posthog = usePostHog();
  return useCallback(
    (event: string, props?: Record<string, unknown>) => {
      try {
        posthog?.capture(event, props);
      } catch {
        /* analytics is best-effort */
      }
    },
    [posthog],
  );
}
