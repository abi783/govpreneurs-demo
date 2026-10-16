import type { Page, Route } from "@playwright/test";

/**
 * The whole SPA is gated on one call: `GhlUserProvider` POSTs
 * `/users/from-highlevel` before rendering any route, and shows an
 * "Unable to sign in" wall if it fails. Stubbing that single endpoint is
 * therefore enough to boot the app with no backend at all — which is what lets
 * the shell specs run in CI without Mongo/Redis/GovAI.
 */

/** Elite product id (see lib/plans.ts) — anything but Pilot avoids the upsell gate. */
export const ELITE_PRODUCT_ID = "prod_RyCniw2GwDwIJw";

export const TEST_LOCATION_ID = "69ddebd8435f987215609573";

/** A fully-entitled session, shaped to `GhlUserSession` in lib/ghlUser.tsx. */
export const TEST_SESSION = {
  userId: "e2e-user",
  companyId: "e2e-company",
  activeLocation: TEST_LOCATION_ID,
  locationId: TEST_LOCATION_ID,
  contactId: "e2e-contact",
  userName: "E2E Tester",
  email: "e2e@example.com",
  role: "admin",
  type: "account",
  isAgencyOwner: false,
  appStatus: "active",
  productId: ELITE_PRODUCT_ID,
  priceId: null,
  planId: null,
  subscriptionId: null,
  isMentor: false,
  isLocationExist: true,
  grantV2: false,
};

/** Stub the auth handshake so the app boots past the sign-in wall. */
export async function stubSession(page: Page, overrides: object = {}): Promise<void> {
  await page.route("**/users/from-highlevel", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...TEST_SESSION, ...overrides }),
    }),
  );
}

/**
 * Fail every other backend call with a 503 so a shell spec is deterministic:
 * without this, un-stubbed calls hit ERR_CONNECTION_REFUSED at whatever pace
 * the machine allows. Call BEFORE `stubSession` — Playwright runs routes in the
 * reverse order of registration, so the last-registered (specific) stub wins.
 */
export async function stubBackendDown(
  page: Page,
  apiBaseUrl = "http://localhost:3000",
): Promise<void> {
  await page.route(`${apiBaseUrl}/**`, (route: Route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "stubbed: backend not part of this spec" }),
    }),
  );
}

/**
 * True when a real API server is answering — used to skip backend-dependent
 * specs. Probes the API's root route, which is the only `@SkipGhlAuth()` GET on
 * the API process (there is no /health there; that one lives on the worker).
 */
export async function backendIsUp(apiBaseUrl = "http://localhost:3000"): Promise<boolean> {
  try {
    const res = await fetch(`${apiBaseUrl}/`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
