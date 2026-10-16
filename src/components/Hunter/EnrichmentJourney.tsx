// The enrichment journey host (#6). Owns the `/hunter-chat/enrichment/*` flow and
// stitches the surfaces together: on load it reads state; a thin/rule-only member
// sees the EnrichCTA; entering drives next → question → answer →
// checkpoint → continue/stop → resume, rendering the milestone rail + checkpoint +
// payoff. All network calls live here (the surfaces are presentational); the honest
// question step reuses ProfileAskBlock, routed to POST /answer and POST /skip.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MilestoneRail } from "./MilestoneRail";
import { CheckpointCard } from "./CheckpointCard";
import { ProfileStrengthMeter } from "./ProfileStrengthMeter";
import { EnrichCTA } from "./EnrichCTA";
import { ProfileAskBlock } from "./ProfileAskBlock";
import { ActCard } from "./ActCard";
import { OrganicOfferChips } from "./OrganicOfferChips";
import { PayoffDelta } from "./PayoffDelta";
import {
  enterEnrichment,
  getEnrichmentState,
  getNextEnrichment,
  answerEnrichment,
  skipEnrichment,
  backEnrichment,
  decideCheckpoint,
  fetchOrganicOffer,
  confirmOrganicOffer,
  pauseEnrichment,
  type EnrichmentStatePayload,
  isJourneyInSession,
  isProfileComplete,
  showsSharpenNudge,
  type Milestone,
  type NextPayload,
  type OrganicFilters,
  type OrganicOffer,
} from "../../lib/enrichment";
import type { ActPayload, ProfileAsk } from "../../lib/hunterChat";

/** One "edit this field" request raised from outside the journey. `token` makes
 *  a repeat request for the SAME field a new request.
 *
 *  No surface raises one today — the "Hunter knows you" panel that did was
 *  removed. The entry point is kept because it is the journey's only
 *  field-targeted re-entry: the milestone rail reopens a whole milestone, the
 *  CTA reopens the whole journey. */
export interface EditFieldRequest {
  /** The one field to re-open. Omitted to re-open the WHOLE journey. */
  field?: string;
  token: number;
}

/** Renders the proactive-enrichment dock section inside the Hunter overlay.
 *  `appliedFilters` is the feed's current search — when it implies a profile fact
 *  the member lacks, one light organic offer surfaces (confirm-before-write). */
export function EnrichmentJourney({
  appliedFilters,
  onAskHunter,
  editRequest,
  idleDockTarget,
}: {
  appliedFilters?: OrganicFilters;
  /** Send a member's clarifying question to Hunter as a normal chat turn. */
  onAskHunter?: (question: string) => void;
  /** Re-open ONE field for editing. See {@link EditFieldRequest} — no surface
   *  raises one today. */
  editRequest?: EditFieldRequest | null;
  /**
   * Where to render the IDLE dock (profile strength + entry button). Given a
   * node, the dock is portalled there — pinned at the top of the pane — while
   * this component stays mounted in the conversation so there is one `/state`
   * reader, not two.
   *
   * Absent (or not yet mounted) it renders in place, which is what keeps this a
   * relocation rather than a dependency: every existing caller and every test
   * that mounts this component bare still sees the dock.
   */
  idleDockTarget?: HTMLElement | null;
} = {}) {
  const [state, setState] = useState<EnrichmentStatePayload | null>(null);
  // Whether the BUILDER is on screen. Deliberately local and starting at
  // `false`, so every visit begins with the builder closed even when the server
  // says a journey is still in session. Enrichment is member-initiated: they
  // open it by pressing the entry button, and a page they came to for the feed
  // must not hand them a profile question they did not ask for.
  //
  // Not persisted, and not a second copy of `paused`. The server flag records
  // what the MEMBER decided ("finish this later"); this records only whether the
  // surface is showing right now.
  const [opened, setOpened] = useState(false);
  const [next, setNext] = useState<NextPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [deferAct, setDeferAct] = useState<ActPayload | null>(null);
  const [organic, setOrganic] = useState<OrganicOffer | null>(null);
  // An adaptive follow-up probe for a thin answer — shown in place of the
  // current question until answered, then the flow advances as usual. It
  // renders with the SAME elicitShape as the question it follows up on
  // (`next.elicitShape`, still in state) and is seeded with the value the
  // member just submitted, so resubmitting extends rather than replaces it (F2).
  const [followUp, setFollowUp] = useState<ProfileAsk | null>(null);
  const [followUpSeed, setFollowUpSeed] = useState<string | undefined>(undefined);

  // Explicit re-entry: un-parks skipped fields and re-offers every answered one,
  // pre-filled. Editing an answer re-embeds the profile and re-scores the matched
  // set, so this is the member's way to improve their feed after finishing.
  // With `fields` it is the TARGETED version (one named field, via
  // `editRequest`); with `milestone` it is one clicked rail step.
  async function reopen(opts: { fields?: string[]; milestone?: Milestone } = {}) {
    setBusy(true);
    try {
      setState(await enterEnrichment(true, { reopen: true, ...opts }));
      setOpened(true); // re-entry is an explicit ask to see the builder
      setFollowUp(null);
      setNext(await getNextEnrichment());
    } catch (err) {
      console.warn("Failed to reopen enrichment:", err);
    } finally {
      setBusy(false);
    }
  }

  // An edit was requested from outside: a named field re-opens that one field,
  // a field-less request re-opens the whole journey. Keyed on the request token,
  // so asking twice for the same thing asks again.
  const editToken = editRequest?.token;
  const editField = editRequest?.field;
  useEffect(() => {
    if (editToken === undefined) return;
    void reopen(editField ? { fields: [editField] } : {});
    // The TOKEN is what decides when an edit is requested — deliberately not the
    // identity of `reopen`, which is re-created on every render.
  }, [editToken, editField]);

  // Load posture on mount; pull the current step if a journey is already in-flight.
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const s = await getEnrichmentState();
        if (!live) return;
        setState(s);
        // No `/next` here. The builder opens on the member's click, so fetching
        // a question on mount would ask the server for a card nobody has asked
        // to see — and for an in-session journey it would also race the first
        // render into showing one.
      } catch (err) {
        console.warn("Failed to load enrichment state:", err);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // When the feed's search implies a fact the member lacks, offer to save it —
  // one light confirm-before-write chip; a search with nothing implied clears it.
  // Keyed on the filter values (not the object identity) so a parent re-render
  // that passes a fresh object literal doesn't re-fetch on every render.
  const filterKey = appliedFilters
    ? JSON.stringify([
        appliedFilters.states ?? [],
        appliedFilters.naics ?? [],
        appliedFilters.setAsides ?? [],
      ])
    : null;
  useEffect(() => {
    if (filterKey === null) return;
    const [states, naics, setAsides] = JSON.parse(filterKey) as [string[], string[], string[]];
    let live = true;
    void (async () => {
      try {
        const offer = await fetchOrganicOffer({ states, naics, setAsides });
        if (live) setOrganic(offer);
      } catch (err) {
        console.warn("Failed to check for an organic offer:", err);
      }
    })();
    return () => {
      live = false;
    };
  }, [filterKey]);

  const confirmOrganic = async (offer: OrganicOffer) => {
    setOrganic(null); // recede immediately on either choice
    try {
      await confirmOrganicOffer(offer);
    } catch (err) {
      console.warn("Failed to save the organic offer:", err);
    }
  };

  const loadNext = async () => setNext(await getNextEnrichment());

  const onEntered = (s: EnrichmentStatePayload) => {
    setState(s);
    setOpened(true);
    if (isJourneyInSession(s)) void loadNext();
  };

  /**
   * Close the builder and keep the member's place.
   *
   * The surface closes IMMEDIATELY, before the round trip: the member pressed
   * "Finish later" and the click must register now, not when the network says
   * so. The server call records the pause, which is what makes the entry button
   * read "Resume profile setup" on the next visit.
   *
   * If that call fails the builder is still closed — only the label degrades to
   * "Sharpen your matches". Nothing is lost either way, because every answer was
   * written as it was given.
   */
  const closeBuilder = async () => {
    setOpened(false);
    setNext(null);
    setFollowUp(null);
    setDeferAct(null);
    try {
      setState(await pauseEnrichment());
    } catch (err) {
      console.warn("Failed to record the pause:", err);
    }
  };

  const answer = async (input: {
    field: string;
    value: string;
    documentUrl?: string;
    freeText?: boolean;
  }) => {
    setFollowUp(null); // answering (the question or a prior follow-up) clears it
    setFollowUpSeed(undefined);
    const res = await answerEnrichment(input);
    // The member asked what the question means rather than answering it. Nothing
    // was written; send it to Hunter as a real chat turn and leave the ask open.
    if (res.notAnAnswer) {
      onAskHunter?.(input.value);
      // Tell the ask nothing was written so it stays open — the member can now
      // answer for real once Hunter has replied.
      return { written: false as const };
    }
    setDeferAct(null);
    if (res.followUp) {
      setFollowUp(res.followUp);
      setFollowUpSeed(input.value); // seed the same-shape builder with this answer
      return; // hold on the follow-up before advancing
    }
    if (res.atCheckpoint && res.checkpoint) setNext(res.checkpoint);
    // The save now resolves the next card on its own round trip. Falling back to
    // `loadNext()` keeps the old two-request path working when the server does
    // not send one (a follow-up, or a failed inline resolve).
    else if (res.next) setNext(res.next);
    else await loadNext();
    return { written: true as const };
  };

  const skip = async (field: string) => {
    const res = await skipEnrichment(field);
    setDeferAct(res.deferAct ?? null);
    if (res.atCheckpoint && res.checkpoint) setNext(res.checkpoint);
    else await loadNext();
  };

  // Step back one card. The previous field returns pre-filled with what is on
  // file — an edit, not an undo: nothing saved is removed until it is replaced.
  const goBack = async () => {
    setBusy(true); // the click must register NOW, not when the round trip lands
    setFollowUp(null);
    setDeferAct(null);
    try {
      setNext(await backEnrichment());
    } catch (err) {
      console.warn("Failed to go back:", err);
    } finally {
      setBusy(false);
    }
  };

  const decide = async (decision: "continue" | "stop") => {
    setBusy(true);
    try {
      const s = await decideCheckpoint(decision);
      setState(s);
      setDeferAct(null);
      // A `stop` comes back PAUSED-but-active. Reading `active` here fetched the
      // next question the moment the member said they were done, so the card
      // they had just dismissed was replaced by another one.
      if (isJourneyInSession(s)) await loadNext();
      else {
        // "Stop here for now" pauses server-side; closing the surface is the
        // other half of the same decision.
        setOpened(false);
        setNext(null);
      }
    } catch (err) {
      console.warn("Failed to record checkpoint decision:", err);
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;

  // `/state` is read straight into the render. A payload missing `rail` — a
  // degraded response, a partial serialisation — made `rail.reduce` throw, and
  // with no boundary local to the rail that blanked the whole feed route. An
  // absent rail means "no milestones to show", not "stop rendering".
  const rail = state.rail ?? [];

  const organicChips = (
    <OrganicOfferChips
      offer={organic}
      onConfirm={(o) => void confirmOrganic(o)}
      onDismiss={() => setOrganic(null)}
    />
  );

  if (!opened || !isJourneyInSession(state)) {
    // A finished profile has nothing left to nudge: the journey has been walked
    // to the end and the answers are embedded (`hybrid`), so a generic "sharpen"
    // button would offer work that is already done.
    //
    // Gated on ANSWERED, not on the strength tier: `deriveStrength` reaches 4 at
    // 75%, so "sharp · 4 of 4" can still hide a quarter of the journey.
    // A journey still in session is by definition unfinished, however complete
    // the rail reads — without this, closing a re-opened journey would retire
    // the dock and strand the member with no way back into it.
    const finished =
      !isJourneyInSession(state) && state.scoringMode === "hybrid" && isProfileComplete(rail);
    if (finished && !organic) return null;

    // The strength block: the meter strip, then its entry button directly under
    // it, full width. `generating` and rule-only-but-embed-ready offer no button
    // at all — a ranking that is not built yet, or whose real matches are already
    // on the way, has nothing to sharpen.
    // `showsSharpenNudge` reports false for an in-session journey, which was
    // right while the builder could not be closed. Now that it can, a paused or
    // merely-closed journey is exactly the case that needs the button most.
    const showCta =
      !finished &&
      (isJourneyInSession(state) || state.scoringMode === "hybrid" || showsSharpenNudge(state));

    const dock = (
      <div className="hunter-enrich-dock">
        {organicChips}
        {!finished && <ProfileStrengthMeter rail={rail} />}
        {showCta && <EnrichCTA state={state} onEntered={onEntered} builderOpen={false} />}
      </div>
    );

    // Location only — identical markup, identical handlers. Entering still calls
    // `POST /enter` and the builder still opens in the conversation below.
    return idleDockTarget ? createPortal(dock, idleDockTarget) : dock;
  }

  // The freshest rail the component holds: `/next` returns an updated one with
  // each answer, so the rail band and the strength meter read from it and
  // advance together.
  const liveRail = next?.rail ?? rail;

  // The rail is NAVIGATION, not just chrome: a step re-offers that milestone's
  // fields, pre-filled, so a member can walk back to a whole section instead of
  // one card at a time.
  const railBand = (
    <MilestoneRail rail={liveRail} onJump={(milestone) => void reopen({ milestone })} />
  );

  // The strength row rides ABOVE the rail for the whole journey, exactly as the
  // idle dock shows it — the two are independent readings, not alternatives, so
  // entering a journey must not swap progress-so-far out for progress-in-step.
  // The `--strip` modifier is what lets them stack as one block: it drops the
  // dock's own closing rule so the rail's is the only one.
  //
  // Its ENTRY BUTTON is deliberately not here: the member is already in the
  // journey, so there is nothing to enter.
  const dockBand = (
    <>
      <div className="hunter-enrich-dock hunter-enrich-dock--strip">
        <ProfileStrengthMeter rail={liveRail} />
      </div>
      {railBand}
    </>
  );

  // Active journey renders INSIDE the conversation (see HunterChatOverlay): the
  // `--turn` modifier lets it be styled as one of Hunter's messages rather than a
  // panel, so a profile question sits in the same flow as every other reply.
  // The STRENGTH ROW and the RAIL are the exception — they say where the member
  // is, not what Hunter just said, so they portal up into the SAME dock slot the
  // idle half uses and pin there. In the flow the rail scrolled away mid-journey.
  // With no slot they stay in place, which keeps every bare caller working.
  return (
    <>
      {idleDockTarget ? createPortal(dockBand, idleDockTarget) : null}
      <div className="hunter-enrich-dock hunter-enrich-dock--turn">
        {organicChips}
        {!idleDockTarget && dockBand}
        {/* A jump/back/reopen is two round trips; without this the OLD card just sits
            there and the click reads as ignored. The pending line replaces it the
            moment the member acts, so the wait is visible rather than mysterious.
            Not shown over a checkpoint — CheckpointCard owns its own busy state. */}
        {busy && next?.kind !== "checkpoint" && (
          <div className="hunter-learn__saving" role="status">
            <span className="stream-dot" />
            <span className="stream-dot" style={{ animationDelay: "0.2s" }} />
            <span className="stream-dot" style={{ animationDelay: "0.4s" }} />
            Opening…
          </div>
        )}
        {!busy && next?.kind === "question" && !followUp && (
          <ProfileAskBlock
            asks={[next.ask]}
            handlers={{ answer, skip }}
            onAskHunter={onAskHunter}
            // Only offered when the server says there IS a card behind this one.
            onBack={next.canGoBack ? () => void goBack() : undefined}
            elicitShape={next.elicitShape}
            // Seed from the synthesized summary draft, or — for a field the member's
            // capability statement already covers — from that document-backed
            // proposal, so the ask reads as confirm-and-extend rather than asking
            // them to retype what their PDF already said.
            initialValue={next.draft ?? next.ask.proposal?.value}
            onFinishLater={() => void closeBuilder()}
          />
        )}
        {!busy && followUp && next?.kind === "question" && (
          <ProfileAskBlock
            asks={[followUp]}
            handlers={{ answer, skip }}
            onAskHunter={onAskHunter}
            elicitShape={next.elicitShape}
            initialValue={followUpSeed}
            onFinishLater={() => void closeBuilder()}
          />
        )}
        {next?.kind === "checkpoint" && (
          <CheckpointCard checkpoint={next} onDecision={(d) => void decide(d)} busy={busy} />
        )}
        {next?.kind === "complete" && (
          <div className="hunter-msg-row from-hunter">
            <div className="hunter-enrich-complete">
              {/* Nothing here is final — but the way back in is the milestone rail
                  above, not a button parked here. This copy is read once, at the end
                  of the journey; a primary button under it occupied the dock for the
                  whole session to serve that one moment. */}
              <p className="hunter-enrich-complete__copy">
                That's everything for now — your matches are sharpened. Tap a step above to revisit
                anything.
              </p>
              {/* The result the journey earned. `/next` sends it on the complete
                  payload; the card used to drop it and close on the claim alone. */}
              <PayoffDelta delta={next.totalPayoff} scope="total" />
            </div>
          </div>
        )}
        {deferAct && <ActCard payload={deferAct} />}
      </div>
    </>
  );
}
