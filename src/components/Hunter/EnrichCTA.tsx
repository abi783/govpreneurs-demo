// The persistent entry point into the enrichment journey. It is a member-initiated
// action, not Hunter-authored output, so it carries no AI ATTRIBUTION — no sparkle,
// no "Hunter" byline, no amber prose treatment. It is warm-toned (`--ai-7`) only to
// sit in the palette of the knows-you card it now lives inside; the colour is
// adjacency, not a claim of authorship. It owns the `POST /enter` call and hands the returned state
// back to the host via `onEntered`. Hidden once the journey is active (the rail /
// checkpoint own that surface). Label reflects paused (resume) vs. thin (complete)
// vs. viable (sharpen).
import { useState } from "react";
import {
  enterEnrichment,
  deriveStrength,
  isJourneyInSession,
  type EnrichmentStatePayload,
} from "../../lib/enrichment";

/** Copy for the entry button, keyed to journey state and profile strength. */
function ctaLabel(state: EnrichmentStatePayload, level: number): string {
  if (state.paused) return "Resume profile setup";
  return level <= 1 ? "Complete your profile" : "Sharpen your matches";
}

/** The enter/resume button. Calls `POST /enter` and forwards the new state up. */
export function EnrichCTA({
  state,
  onEntered,
  builderOpen = true,
}: {
  state: EnrichmentStatePayload;
  onEntered: (next: EnrichmentStatePayload) => void;
  /** Whether the journey's own surface — the rail and its cards — is on screen.
   *  The button stands down then, because that surface is the way back in.
   *
   *  The HOST decides this, not this component: the builder is closed by default
   *  on every visit, so a journey can be in session with nothing showing, and
   *  re-deriving the answer from `active` here would hide the only way in. */
  builderOpen?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  // In session only — a PAUSED journey is still `active`, and hiding on `active`
  // alone is what made the "Resume profile setup" label above unreachable.
  if (builderOpen && isJourneyInSession(state)) return null;

  const onClick = async () => {
    setBusy(true);
    try {
      // The SHARPEN path, explicitly. For a member whose fields are all
      // answered or parked, a plain enter has nothing left to ask, and the
      // builder opened on a terminal checkpoint and shut again.
      //
      // `EnrichmentService.enter` also falls back to a reopen in that case, so
      // this is belt and braces — but the button IS "sharpen my matches", and
      // saying so here means the behaviour does not depend on a server-side
      // fallback that a future change might narrow.
      const next = await enterEnrichment(true, { reopen: true });
      onEntered(next);
    } catch (err) {
      console.warn("Failed to enter enrichment:", err);
    } finally {
      setBusy(false);
    }
  };

  // A static ring, no motion, in the two states where entering matters most: a
  // thin profile has the most to gain, and a paused journey is unfinished work
  // the member left behind. Both readings already decide the label.
  const level = deriveStrength(state.rail).level;
  const emphasize = level <= 2 || state.paused;
  return (
    <button
      type="button"
      className={`hunter-learn__btn hunter-learn__btn--primary hunter-enrich-cta${
        emphasize ? " is-emphasized" : ""
      }`}
      disabled={busy}
      onClick={() => void onClick()}
    >
      {ctaLabel(state, level)}
    </button>
  );
}
