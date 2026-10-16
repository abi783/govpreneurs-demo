// HigherGov is our upstream data vendor — it must NEVER be surfaced to members
// as a source / reference link. Every place that renders a "View on source" or a
// provenance link routes the candidate URL through `externalSourceUrl` first.
//
// It returns the URL only when it is a safe, member-facing external source: an
// absolute http(s) URL whose host is not HigherGov. Anything else — a HigherGov
// link, a relative path, a §-clause ref, or an unparseable string — returns null
// so the caller hides the link (or falls back to a non-vendor source).

/** True when `host` is highergov.com or any of its subdomains. */
function isHigherGovHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "highergov.com" || h.endsWith(".highergov.com");
}

/**
 * True when a piece of FREE TEXT names our data vendor anywhere inside it.
 *
 * `externalSourceUrl` guards the case where a whole value IS a URL. This guards
 * the other one: a vendor URL (or bare domain) sitting INSIDE a description, a
 * company name, a locator — anywhere a register field can carry prose. We drop
 * the vendor's own `path` fields at the ingestion boundary, but the row's text
 * columns are free text we do not author, so the rule has to hold on content as
 * well as on shape.
 *
 * A value that trips this is discarded WHOLE by the caller rather than redacted
 * in place: a half-scrubbed sentence still tells the member something about
 * where the data came from, and a value we cannot show is better rendered as
 * absent than as mangled.
 */
export function mentionsVendor(text: unknown): boolean {
  if (typeof text !== "string" || !text) return false;
  return /(^|[^a-z0-9.-])(www\.)?highergov\.com\b/i.test(text) || /highergov/i.test(text);
}

/**
 * The URL to show members as an external source, or null when there is none we
 * may surface. HigherGov URLs are always rejected (never shown to members).
 *
 * The scheme is allowlisted to http/https: a provenance `ref` is model- and
 * vendor-supplied, and `new URL()` happily parses `javascript:…`, which would
 * otherwise reach `window.open` in EvidencePin and run in the member's session.
 */
export function externalSourceUrl(url?: string | null): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null; // not an absolute URL — not something we link out to
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return isHigherGovHost(parsed.hostname) ? null : url;
}

/* ── The agency posting: what "the source" actually means ────────────────
   HigherGov is where we GOT the opportunity; it is not where the opportunity
   came FROM. The issuing agency posted it somewhere public — SAM.gov, DIBBS,
   a state portal — and that posting is the source of record we may show.
   HigherGov gives us that URL as `source_path` (`sourcePath` on the opportunity
   document); ~98% of opportunities carry one, and the hosts are wildly varied
   (sam.gov and DLA DIBBS lead, then dozens of state/local eProcurement sites).

   So the rule is not "hide HigherGov and show nothing" — it is "hide HigherGov
   and show the agency's own posting instead". */

/** Posting hosts common enough to name the way a member would say them. Anything
 *  not listed falls back to the bare hostname, which is still true — just less
 *  familiar. Never guess a prettier name for a host we don't know. */
const HOST_LABEL: Record<string, string> = {
  "sam.gov": "SAM.gov",
  "www.sam.gov": "SAM.gov",
  "grants.gov": "Grants.gov",
  "www.grants.gov": "Grants.gov",
  "www.dibbs.bsm.dla.mil": "DLA DIBBS",
  "dibbs.bsm.dla.mil": "DLA DIBBS",
  "www.fbo.gov": "FBO",
  "www.bidnetdirect.com": "BidNet Direct",
  "procurement.opengov.com": "OpenGov Procurement",
  "www.commbuys.com": "COMMBUYS",
  "caleprocure.ca.gov": "Cal eProcure",
  "emma.maryland.gov": "eMMA",
  "www.txsmartbuy.gov": "TxSmartBuy",
  "www.nyscr.ny.gov": "NYS Contract Reporter",
};

export interface AgencySource {
  /** The vetted, member-safe posting URL. */
  url: string;
  /** What to call it, e.g. "SAM.gov" or "scbo.sc.gov". */
  host: string;
  /** Ready-made link text: "View on SAM.gov". */
  label: string;
}

/**
 * The issuing agency's own posting for an opportunity, or null when we have
 * none we may show.
 *
 * Null is a real and common answer — ~1.6% of opportunities have no
 * `sourcePath` at all — and the ONLY correct response to it is to render no
 * link. A source URL must never be synthesised from an id: our opportunity ids
 * are HigherGov keys, so a constructed `sam.gov/opp/{id}/view` is a fabricated
 * citation that 404s, and it would be wrong for the majority of postings even
 * if it resolved (DIBBS and the state portals aren't SAM at all).
 *
 * Vetting is delegated to `externalSourceUrl`, so a HigherGov `sourcePath`, a
 * non-http scheme (one live row carries `actransit://…`), or an unparseable
 * value all return null here too.
 */
export function agencySource(sourcePath?: string | null): AgencySource | null {
  const url = externalSourceUrl(sourcePath);
  if (!url) return null;
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!hostname) return null;
  const host = HOST_LABEL[hostname] ?? hostname.replace(/^www\./, "");
  return { url, host, label: `View on ${host}` };
}

/** Whitespace or a control character anywhere in a "path" means it isn't one. */
const hasUnsafeChar = (s: string): boolean =>
  [...s].some((ch) => ch.charCodeAt(0) <= 0x20 || ch.charCodeAt(0) === 0x7f);
/** "scheme:" at the head — javascript:, data:, http:, and friends. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * The in-app destination for a server-supplied route (a Grant rail chip's
 * `target`), or null when it is not one we may navigate to.
 *
 * Chips are authored by the backend/LLM, so the target is untrusted input on a
 * navigation sink. Only a same-origin absolute PATH is allowed: it must start
 * with a single "/" (never "//host", which is protocol-relative and off-site)
 * and must not carry a scheme, whitespace, or control characters — all three
 * are how something other than a path gets past a naive "starts with /" check.
 * Everything else (javascript:, data:, another host, a bare word) returns null
 * so the caller does nothing rather than navigating where the member didn't ask.
 */
export function internalRouteTarget(target?: string | null): string | null {
  if (!target) return null;
  const t = target.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  if (hasUnsafeChar(t) || HAS_SCHEME.test(t)) return null;
  return t;
}
