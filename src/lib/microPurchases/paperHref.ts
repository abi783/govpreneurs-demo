// Small orders — the link to the order paper.
//
// WHY THIS IS NOT JUST A FIELD ON THE ORDER. The document row we store carries
// a `downloadUrl`, and it is unusable twice over: it is a HigherGov presigned
// S3 link whose query string carries an `AWSAccessKeyId`, and every one sampled
// on 2026-09-09 had already expired — latest expiry 27 June, and a GET returns
// 403. Rendering it would put a dead link and a credential in the markup at
// once, so the server never sends it.
//
// WHAT WE LINK INSTEAD is our own redirect endpoint, which reads the stored
// `documentPath` SERVER-SIDE, pulls its `related_key`, asks HigherGov for a
// fresh URL and 302s the browser to it. Measured end to end: 302 → a URL
// expiring in one hour → GET 206, 418,695 bytes, first bytes `%PDF-1.6`.
//
// IT IS THE OPPORTUNITY PAGE'S ENDPOINT, not a second one. `EvidenceBlock`
// already uses it, small-orders ids ARE `oppKey`s, and it resolves a public
// document with no authenticated user — which is why it carries `@SkipGhlAuth`
// and why an `<a href>` navigation works at all: that navigation cannot send
// the `X-GHL-Token` header a fetch would.
//
// Duplicating it under `/small-orders/` was considered and rejected:
// `SmallOrdersModule` documents that it imports nothing, so sharing the
// resolver would have meant either breaking that isolation or copying fifteen
// lines of HTTP. Neither buys anything the existing route does not already do.

import { API_BASE_URL } from "../api";

/** The link that opens one order's paper, or `null` when we hold none. */
export function paperHref(order: {
  id: string;
  paper: { fileName: string } | null;
}): string | null {
  if (order.paper == null) return null;
  return (
    `${API_BASE_URL}/opportunities/discover/v2/${encodeURIComponent(order.id)}` +
    `/documents?fileName=${encodeURIComponent(order.paper.fileName)}`
  );
}

/** "409 KB", or null where the row carried no size. Bytes are not a fact she
 *  can use; an order of magnitude before she taps a link on a phone is. */
export function paperSize(bytes: number | null): string | null {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
