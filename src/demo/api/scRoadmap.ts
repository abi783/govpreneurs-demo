// DEMO API area: Success Center: Roadmap.
// Owns: Lifted Success Center code. Paths start with /api/ (for example /api/portal/roadmap/...). Fill in from ENDPOINTS.md when the page agent lifts the code.
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.

import type { DemoRouteDef } from "../runtime/router";

export const routes: DemoRouteDef[] = [];
