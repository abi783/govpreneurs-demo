// THE URL allow-list for the client.
//
// Three places turn a string we did not author into an `href`: the two research
// citation sites in `HunterChatOverlay` (LLM/web-derived) and the Act card's
// self-serve route (composed from the Success Center DFY catalog). Until this
// module existed the only thing standing between those and `data:` / `vbscript:`
// / `file:` was React 19's built-in `javascript:` special case — a framework
// control we did not choose and cannot see. An allow-list is the control.
//
// It is an ALLOW-list on purpose: a deny-list of known-bad schemes is a list of
// the schemes someone thought of.

/** Schemes an ordinary web link may use. Everything else is not a link. */
const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);

/** Resolution base for a relative URL. A CONSTANT rather than the live
 *  `location.href`: the only property under test is the SCHEME, and a relative
 *  URL has none — so the answer must not depend on where the app is served. */
const RELATIVE_BASE = "https://localhost/";

/**
 * The URL when it is an ordinary web link, otherwise null so the caller can
 * render inert text instead of an anchor. Returns the ORIGINAL string (trimmed),
 * never a normalised one, so a legitimate link is rendered exactly as supplied.
 */
export function httpUrlOrNull(url: string | null | undefined): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed, RELATIVE_BASE);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? trimmed : null;
  } catch {
    // Unparseable is not a link either — the browser would resolve it against
    // the page, and we would be guessing on its behalf.
    return null;
  }
}
