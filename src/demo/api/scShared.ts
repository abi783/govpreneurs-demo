// DEMO API area: Success Center calls that several lifted pages make
// (Home, Mentors, Roadmap, Tasks, My Business). Registered once, here, so no
// two pages can answer them differently. Owner: the lead.

import type { DemoRouteDef } from "../runtime/router";
import { getWalletBalance } from "../state/wallet";
import { homeUpload } from "./scHome";
import { roadmapUpload, roadmapVerify, ROADMAP_VERIFY_KEYS } from "./scRoadmap";
import { storeMedia, verify as businessVerify } from "../sc/business/ops";

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
    handler: async (ctx) => {
      const type = ctx.body instanceof FormData ? String(ctx.body.get("type") ?? "") : "";
      if (type === "contact" || type === "logo") {
        // The photo and logo show on Success Center home and in My Business: keep both in step.
        await storeMedia(ctx.body);
        return homeUpload(ctx);
      }
      return roadmapUpload(ctx);
    },
  },
  {
    // One check address for the Roadmap, Tasks and My Business. The key says whose check it is.
    method: "POST",
    path: `${P}/verify`,
    handler: async (ctx) => {
      const key = String(ctx.body?.validationKey ?? "");
      const action = String(ctx.body?.action ?? "");
      if (key === "digital_compliance_intake") {
        // Both pages show the audit: record it in both, answer with My Business's fuller result.
        await roadmapVerify(ctx);
        return businessVerify(ctx.body);
      }
      if (ROADMAP_VERIFY_KEYS.includes(key) && !(key === "llc" && action === "confirm")) return roadmapVerify(ctx);
      return businessVerify(ctx.body);
    },
  },
];
