// DEMO API area: Session and boot.
// Owns: POST /users/from-highlevel, GET /users/:userId/subscription, and any call
// that every page makes while it starts.
//
// Path scheme (see src/demo/runtime/router.ts): no prefix for frontend-v2 code.
// The member is always Amira Haddad on the Elite plan (see src/demo/session.ts).

import type { DemoRouteDef } from "../runtime/router";
import { demoSession } from "../session";
import { ELITE_PLAN_PRODUCT_ID } from "../../lib/entitlements";

export const routes: DemoRouteDef[] = [
  {
    method: "POST",
    path: "/users/from-highlevel",
    handler: () => demoSession(),
  },
  {
    method: "GET",
    path: "/users/:userId/subscription",
    handler: () => ({ productId: ELITE_PLAN_PRODUCT_ID }),
  },
];
