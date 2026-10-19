// DEMO: must stay the first import. It blocks every network call that is not a demo API call.
import "./demo/runtime/boot";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { PostHogProvider } from "posthog-js/react";
import { router } from "./router";
import "./styles.css";
// DEMO: the lifted Success Center styles. Layered or scoped, so frontend-v2 pages do not change.
import "./sc/sc.css";
// After styles.css, not @imported from it: an @import lands before every rule in
// the file, and the forecast rules must win over base rules of equal weight.
import "./styles/forecasts.css";
// The forecast watch's change marker. Global: it shows on the list, My Bids and Saved.
import "./styles/forecast-watch.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// PostHog analytics (mirrors the v1 app): wrap the tree in PostHogProvider when
// a key is configured; when it isn't, render without it so usePostHog() is a
// no-op and nothing breaks locally / in tests.
// DEMO: analytics stay off. A key in the hosting build settings must not start PostHog: it would
// load a script from posthog.com and send events from a sales call.
const POSTHOG_KEY = undefined as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ??
  "https://app.posthog.com";

const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

createRoot(rootElement).render(
  POSTHOG_KEY ? (
    <PostHogProvider
      apiKey={POSTHOG_KEY}
      options={{
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        capture_pageleave: true,
      }}
    >
      {app}
    </PostHogProvider>
  ) : (
    app
  )
);
