/**
 * GHL never pushes a "sub-account changed" event to an embedded custom-page
 * iframe, and our app is cross-origin to the GHL parent, so we cannot read the
 * parent URL directly. The GHL-parent Custom JS bridge (the same script that
 * serves `REQUEST_NAVIGATION` / `REQUEST_AUTH_TOKEN`) answers a
 * `REQUEST_LOCATION_ID` message with the active location id read from the parent
 * URL. The provider polls that over `window.parent` and hard-reloads when the id
 * changes.
 *
 * This parser is pure so it can be unit-tested apart from the React provider and
 * its window/postMessage plumbing.
 */

/** Child → parent: "what is the active location id?" (matches bridge convention). */
export const LOCATION_REQUEST_MESSAGE = "REQUEST_LOCATION_ID";
/** Parent → child: the active location id in `payload`. */
export const LOCATION_RESPONSE_MESSAGE = "REQUEST_LOCATION_ID_RESPONSE";

/**
 * Extract the active location id from a bridge response payload, or null when
 * the message is not a well-formed location response (wrong message type or a
 * missing/non-string id).
 */
export function parseLocationIdResponse(data: unknown): string | null {
  const d = data as Record<string, unknown> | null;
  if (!d || d.message !== LOCATION_RESPONSE_MESSAGE) return null;
  return typeof d.payload === "string" && d.payload ? d.payload : null;
}
