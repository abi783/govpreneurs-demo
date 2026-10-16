// DEMO API area: Pipeline (My Bids).
// Owns: Anything the /pipeline page calls that no other area owns. There is nothing: the page
// reads GET /workspace/saved-opps/details and GET /mentor-reviews, and builds its cards in
// src/demo/explore/pipelineBoard.ts (the story's pursuits, the closed ones, saved forecasts
// and orders, and open reviews, each record once).
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.

import type { DemoRouteDef } from "../runtime/router";

export const routes: DemoRouteDef[] = [];
