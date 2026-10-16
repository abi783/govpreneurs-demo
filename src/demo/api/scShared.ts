// DEMO API area: Success Center calls that several lifted pages make
// (Home, Mentors, Roadmap, Tasks, My Business). Registered once, here, so no
// two pages can answer them differently. Owner: the lead.

import type { DemoRouteDef } from "../runtime/router";
import { getWalletBalance } from "../state/wallet";
import { homeUpload } from "./scHome";
import { roadmapUpload } from "./scRoadmap";

const P = "/api/portal/:locationId";

/** The member's time zone, used by every booking calendar. */
export const MEMBER_TIME_ZONE = "America/New_York";

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: `${P}/wallet-balance`,
    handler: () => {
      const balance = getWalletBalance();
      return { balance, paidBalance: balance, promotionalCredit: 0, currency: "USD" };
    },
  },
  { method: "GET", path: `${P}/contact-timezone`, handler: () => ({ timezone: MEMBER_TIME_ZONE }) },
  { method: "GET", path: `${P}/checkout-terms`, handler: () => ({ showTerms: false }) },
  { method: "GET", path: `${P}/billing-address`, handler: () => ({ needsAddress: false }) },
  {
    // One upload address, several pages: the form's `type` field says which.
    method: "POST",
    path: `${P}/upload`,
    handler: (ctx) => {
      const type = ctx.body instanceof FormData ? String(ctx.body.get("type") ?? "") : "";
      return type === "contact" || type === "logo" ? homeUpload(ctx) : roadmapUpload(ctx);
    },
  },
];
