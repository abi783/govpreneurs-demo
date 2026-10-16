// DEMO API area: The Hunter feed (Opportunities page).
// Owns: POST /opportunities/discover/v2 (feed), /discover/v2/counts, /discover/v2/scores, /opportunities/filters/*, /opportunities/preview*, /opportunities/all, /opportunities/saved, /hunters-take/*, /hunter-chat/* (chat, profile, enrichment, profile-update), /naics/*, /psc/*.
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.

import type { DemoRouteDef } from "../runtime/router";

export const routes: DemoRouteDef[] = [];
