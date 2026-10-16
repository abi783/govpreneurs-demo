// DEMO API area: Everything else.
// Owns: Calls that fit no other area.
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { getWalletBalance, MENTOR_REVIEW_PRICE, topUpWallet } from "../state/wallet";

const MAX_TOP_UP = 5_000;

export const routes: DemoRouteDef[] = [
  // Success Center page-view tracking (src/lib/portalTrack.ts). Nothing is stored in the demo.
  {
    method: "POST",
    path: "/api/portal/:locationId/track",
    handler: () => ({ ok: true }),
  },
  // The wallet "Add funds" step. The live product opens a billing page; the demo adds the money.
  {
    method: "POST",
    path: "/wallet/top-up",
    handler: ({ body }) => {
      const amount = Math.round(Number(body?.amount) * 100) / 100;
      if (!Number.isFinite(amount) || amount < 10 || amount > MAX_TOP_UP) {
        return demoResponse(400, { message: `Add between $10 and $${MAX_TOP_UP.toLocaleString("en-US")}.` });
      }
      topUpWallet(amount);
      return { balance: getWalletBalance(), chargeAmount: MENTOR_REVIEW_PRICE };
    },
  },
];
