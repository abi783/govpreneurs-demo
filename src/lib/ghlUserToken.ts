/**
 * GHL *user* auth-token acquisition for v2.
 *
 * The backend `POST /opportunities/send-for-review` endpoint requires an
 * `X-GHL-User-Token` header carrying a GHL USER token. This is DISTINCT from
 * the `X-GHL-Token` session token that `apiFetch` attaches — that one is the
 * encrypted GHL *session* payload, this one is a short-lived user auth token
 * the GHL host frame mints on request.
 *
 * Ported from v1 (`frontend/src/contexts/HighLevelUserContext.tsx` →
 * `ghlUserAuthToken`), adapted to v2 conventions with no dependency on v1's
 * React context.
 */

import { isMockEnv } from "./env";

const REQUEST = "REQUEST_AUTH_TOKEN";
const RESPONSE = "REQUEST_AUTH_TOKEN_RESPONSE";
const TIMEOUT_MS = 10_000;

function makeRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Resolves a GHL user auth token for use as the `X-GHL-User-Token` header.
 *
 * - **Local dev only (mock):** returns `VITE_LOCAL_AUTH_TOKEN` if set.
 *   If it is NOT set, we fall back to the string `"local"` rather than
 *   throwing. Rationale: in the mock environment the backend
 *   (`isMockGhlEnvironment()` in `backend/src/ghl/ghl.constants.ts`, true only
 *   when ENVIRONMENT is `local`) bypasses real GHL auth and injects a mock
 *   user, and `apiFetch`/`ghlUser.tsx` already hardcode the SESSION token to
 *   `"local"` in that environment. The `send-for-review` controller only
 *   requires the header to be *present* (`if (!ghlUserAuthToken) throw` — see
 *   `opportunity.controller.ts` ~L281); any non-empty string satisfies it and
 *   keeps the local mock flow working without extra dev setup. Matching the
 *   session-token sentinel keeps mock behaviour consistent across the app.
 *
 * - **Staging/production:** performs the `postMessage`/`REQUEST_AUTH_TOKEN`
 *   handshake with the GHL host frame, with a 10s timeout and listener
 *   cleanup. Staging is no longer mocked — it uses the same real handshake
 *   as production.
 */
export async function getGhlUserToken(
  forceRefresh = true,
): Promise<string> {
  if (isMockEnv()) {
    const localToken = import.meta.env.VITE_LOCAL_AUTH_TOKEN as
      | string
      | undefined;
    // Fall back to the same sentinel the session token uses in mock envs.
    // Treat empty string as unset — an empty header would fail the backend's
    // `if (!ghlUserAuthToken)` presence check on `send-for-review`.
    return localToken && localToken.length > 0 ? localToken : "local";
  }

  return new Promise<string>((resolve, reject) => {
    const requestId = makeRequestId();

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener("message", handler);
    };

    const handler = (event: MessageEvent) => {
      const d = event.data as
        | {
            message?: string;
            requestId?: string;
            payload?: string;
            token?: string;
            error?: string;
          }
        | undefined;
      if (!d || d.message !== RESPONSE || d.requestId !== requestId) return;
      cleanup();
      if (d.error) {
        reject(new Error(d.error));
        return;
      }
      // v1 returns the token under `payload`; accept `token` as a fallback.
      const token = d.payload ?? d.token;
      if (typeof token === "string" && token.length > 0) {
        resolve(token);
      } else {
        reject(new Error("Auth token response contained no token"));
      }
    };

    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Timeout waiting for auth token from parent window"));
    }, TIMEOUT_MS);

    window.addEventListener("message", handler);
    window.parent.postMessage({ message: REQUEST, requestId, forceRefresh }, "*");
  });
}
