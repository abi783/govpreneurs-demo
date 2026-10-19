/**
 * GHL *user* auth-token acquisition for v2.
 *
 * DEMO: there is no GoHighLevel parent frame and no backend check. The token is
 * a fixed string, so the "Send to Mentor" flow that needs a non-empty
 * `X-GHL-User-Token` header works with no handshake. Production sent a
 * `REQUEST_AUTH_TOKEN` message to the parent frame here.
 */

import { DEMO_TOKEN } from "../demo/session";

export async function getGhlUserToken(_forceRefresh = true): Promise<string> {
  return DEMO_TOKEN;
}
