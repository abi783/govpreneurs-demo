// DEMO API area: Everything else.
// Owns: Calls that fit no other area.
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.

import type { DemoRouteDef } from "../runtime/router";

export const routes: DemoRouteDef[] = [];
