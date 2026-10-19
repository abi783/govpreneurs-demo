// DEMO: the one signed-in member. Amira Haddad on the Elite plan.
//
// Fields that matter for gates:
//   productId  Elite plan id. Pilot and Expert ids show upsell walls.
//   grantV2    true, so the live Grant surface shows (not the old Grant card).
//   userId and locationId are never empty.
// The opportunity field `mentorReviewStatus` is not on the session. It is on
// each opportunity from `/opportunities/discover/v2` (see ENDPOINTS.md).

import type { GhlUserSession } from "../lib/ghlUser";
import { ELITE_PLAN_PRODUCT_ID } from "../lib/entitlements";
import { PERSONA } from "./story/persona";

export const DEMO_TOKEN = "demo-token";

export function demoSession(): GhlUserSession {
  return {
    userId: PERSONA.userId,
    companyId: "demo-company",
    activeLocation: PERSONA.locationId,
    locationId: PERSONA.locationId,
    contactId: "demo-contact-amira",
    userName: PERSONA.ownerName,
    email: PERSONA.email,
    role: "admin",
    type: "account",
    isAgencyOwner: false,
    appStatus: "active",
    productId: ELITE_PLAN_PRODUCT_ID,
    priceId: "price_demo_elite",
    planId: "plan_demo_elite",
    subscriptionId: "sub_demo_elite",
    isMentor: false,
    isLocationExist: true,
    viewerUserId: PERSONA.userId,
    viewerEmail: PERSONA.email,
    saasMode: "activated",
    grantV2: true,
  };
}
