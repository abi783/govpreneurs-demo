// DEMO API area: Grant, the analysis agent.
// Owns: /grants-take/* including /grants-take/rail*.
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.
//
// Grant's words come from the story (src/demo/grant/). The visitor's answers and
// the rail conversation are kept in the demo store (src/demo/grant/state.ts).

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { buildAnalysis } from "../grant/analysis";
import { railReply, railSession } from "../grant/rail";
import { addSkip, resetRail } from "../grant/state";
import { buildOldTake } from "../grant/takeOld";

const keyOf = (body: unknown): string => String((body as { oppKey?: unknown } | null)?.oppKey ?? "");

export const routes: DemoRouteDef[] = [
  {
    method: "POST",
    path: "/grants-take/opportunity",
    handler: ({ body }) => ({ take: buildOldTake(keyOf(body)) }),
  },
  {
    method: "POST",
    path: "/grants-take/analysis",
    // An id outside the story answers `null`; the page then says "Not analyzed yet".
    handler: ({ body }) => ({ analysis: buildAnalysis(keyOf(body)) }),
  },
  {
    method: "POST",
    path: "/grants-take/rail/session",
    handler: ({ body }) => railSession(keyOf(body)),
  },
  {
    method: "POST",
    path: "/grants-take/rail",
    handler: ({ body }) => {
      const b = body as { oppKey?: string; message?: string; openQuestion?: string } | null;
      const message = String(b?.message ?? "").trim();
      if (!b?.oppKey || !message) return demoResponse(400, { message: "Ask Grant a question." });
      return railReply(String(b.oppKey), message, b.openQuestion);
    },
  },
  {
    method: "POST",
    path: "/grants-take/rail/skip",
    handler: ({ body }) => {
      const b = body as { oppKey?: string; questionId?: string } | null;
      if (b?.oppKey && b.questionId) addSkip(b.oppKey, b.questionId);
      return { ok: true };
    },
  },
  {
    method: "POST",
    path: "/grants-take/rail/reset",
    handler: ({ body }) => {
      resetRail(keyOf(body));
      return { ok: true };
    },
  },
];
