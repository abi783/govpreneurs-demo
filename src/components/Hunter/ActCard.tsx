import type { ActPayload, GapKind, SelfServeDestination } from "../../lib/hunterChat";
import { roadmapUrl } from "../../lib/preview";
import { isEmbeddedInGhl, requestCrossPageNav } from "../../lib/ghlNav";
import { httpUrlOrNull } from "../../lib/safeUrl";
import { lookupOwn } from "../../lib/lookup";
import { boundedList, MAX_CHECKLIST_STEPS } from "../../lib/renderLimits";

const GAP_LABEL: Record<GapKind, string> = {
  set_aside: "Certification gap",
  llc: "Business entity (LLC)",
  sam: "SAM.gov registration",
  capability: "Capability statement",
  sled: "State & local (SLED) enrollment",
  sbs: "SBA Small Business Search profile",
  prime: "Prime contractor registration",
  govcompliant: "Contract-ready web presence",
};

/** A gap kind the union does not name still gets a heading — the card announces
 *  "Close the gap" beside it, so an empty heading reads as a broken card. */
const UNKNOWN_GAP_LABEL = "Profile gap";

/** DIY destination → the parent bridge's semantic page key. The GHL custom JS
 *  maps this to the destination's custom-menu-link and swaps ONLY the page suffix,
 *  keeping the live `/v2/location/<locationId>/` prefix — so it is correct for
 *  every tenant and sub-account without us hardcoding a domain. */
const NAV_PAGE_KEY: Record<SelfServeDestination, string> = { roadmap: "roadmap" };

/**
 * The DIY "Get started" affordance. The Success Center is a DIFFERENT GHL page
 * and this app runs inside a GHL iframe, so a plain link would nest GHL inside
 * our own frame (a second SSO session) rather than switch the real top-level page.
 *
 * Embedded → post a REQUEST_NAVIGATION intent to the parent, exactly as the
 * "View in Mentor" jump does. Standalone (local dev, not iframed) → there is no
 * parent to relay through, so fall back to the absolute location-scoped URL.
 * Neither available → render nothing; the DIY guidance text still stands alone.
 */
function SelfServeCta({
  destination,
  locationId,
}: {
  destination: SelfServeDestination | null;
  locationId: string | null;
}) {
  if (!destination) return null;
  if (isEmbeddedInGhl()) {
    return (
      <button
        type="button"
        className="hunter-act__cta"
        onClick={() =>
          // The route rides in shared-origin localStorage for OUR apps; the
          // Success Center never reads it, so send the current path — if the
          // member bounces straight back, they land where they left off.
          requestCrossPageNav(NAV_PAGE_KEY[destination], window.location.pathname || "/")
        }
      >
        Get started
      </button>
    );
  }
  if (!locationId) return null;
  return (
    <a
      href={roadmapUrl(locationId)}
      className="hunter-act__cta"
    >
      Get started
    </a>
  );
}

/**
 * ActCard — renders the act agent's gap resolution under the reply: up to two
 * DFY service offers (name + benefit + turnaround + a "Get started" click-through,
 * NEVER a price), an optional self-serve certification route with the flat mentor
 * fee (the only monetary figure), and the bid-checklist (done-vs-todo steps).
 */
export function ActCard({
  payload,
  locationId = null,
}: {
  payload: ActPayload;
  /** Needed to build the location-scoped Success Center link. */
  locationId?: string | null;
}) {
  const { gap, offers, selfServe, bidChecklist, mentorFeeUSD } = payload;
  const heading =
    gap.kind === "set_aside" && gap.setAsideName
      ? `${gap.setAsideName} certification`
      : (lookupOwn(GAP_LABEL, gap.kind) ?? UNKNOWN_GAP_LABEL);
  // The self-serve route is composed from the DFY catalog fetched off the
  // Success Center portal — a URL this app did not author, so it reaches the
  // allow-list before it reaches an href. Rejected → the guidance still reads,
  // the link does not exist.
  const selfServeHref = selfServe ? httpUrlOrNull(selfServe.url) : null;
  const checklist = boundedList(bidChecklist ?? [], MAX_CHECKLIST_STEPS);
  return (
    <div className="hunter-act hunter-card-enter">
      <div className="hunter-act__head">
        <span className="hunter-act__badge">Close the gap</span>
        <span className="hunter-act__gap">{heading}</span>
      </div>
      {gap.note && <div className="hunter-act__note">{gap.note}</div>}
      {offers.length > 0 && (
        <div className="hunter-act__offers">
          {offers.map((o) => {
            const hasCta = Boolean(o.selfServeDestination);
            return (
              <div key={o.slug} className="hunter-act__offer">
                <div className="hunter-act__offer-top">
                  <span className="hunter-act__offer-name">{o.name}</span>
                  {o.turnaround && <span className="hunter-act__turnaround">{o.turnaround}</span>}
                </div>
                {o.benefit && <div className="hunter-act__offer-desc">{o.benefit}</div>}
                {(hasCta || o.externalGuidance) && (
                  <div className="hunter-act__offer-foot">
                    <SelfServeCta destination={o.selfServeDestination} locationId={locationId} />
                    {o.externalGuidance && (
                      <span className="hunter-act__guidance">{o.externalGuidance}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {selfServe && (
        <div className="hunter-act__selfserve">
          <div className="hunter-act__offer-top">
            <span className="hunter-act__offer-name">{selfServe.label}</span>
          </div>
          <div className="hunter-act__offer-desc">{selfServe.guidance}</div>
          <div className="hunter-act__offer-foot">
            {selfServeHref && (
              <a
                href={selfServeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hunter-act__cta"
              >
                Self-serve
              </a>
            )}
            {selfServe.mentorOptional && mentorFeeUSD != null && (
              <span className="hunter-act__guidance">or have a mentor help (${mentorFeeUSD})</span>
            )}
          </div>
        </div>
      )}
      {checklist.shown.length > 0 && (
        <div className="hunter-act__checklist">
          <div className="hunter-act__checklist-title">Before you bid</div>
          <ul className="hunter-act__checklist-list">
            {checklist.shown.map((item) => (
              <li
                key={item.label}
                className={
                  item.done ? "hunter-act__step hunter-act__step--done" : "hunter-act__step"
                }
              >
                <span className="hunter-act__step-mark" aria-hidden="true">
                  {item.done ? "✓" : "○"}
                </span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          {checklist.hidden > 0 && (
            <div className="hunter-act__guidance">and {checklist.hidden} more not shown</div>
          )}
        </div>
      )}
    </div>
  );
}
