// The stage-card canvas shell. Pinned above the opportunity list, one at a
// time; the list stays alive underneath, filters intact.
//
// `StageCardMount` returns either null or a sibling <section>. It is NEVER a
// wrapper around the list, never a route change and never a modal — that is
// what keeps the feed mounted while an artifact is on screen (ARCHITECTURE.md
// §3(d)). Escape does not dismiss: a member typing in the search box must not
// lose the artifact to a stray key.

import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import type { StageArtifact } from "../../../lib/hunter/stageArtifact";
import { artifactOnScreenSentence, artifactTitle } from "../../../lib/hunter/artifactTitle";
import { useStageStore } from "../../../lib/hunter/stageStore";
import { ErrorBoundary } from "../../ui/ErrorBoundary";
import { prefersReducedMotion } from "./reducedMotion";
import { ChecklistArtifact } from "./ChecklistArtifact";
import { CompareArtifact } from "./CompareArtifact";
import { MatchesArtifact } from "./MatchesArtifact";
import { ProfileArtifact } from "./ProfileArtifact";
import { ProfileUpdateArtifact } from "./ProfileUpdateArtifact";
import { ResearchArtifact } from "./ResearchArtifact";
import { ScorecardArtifact } from "./ScorecardArtifact";

/** "Back to your 5 results", singular at one — the real count the feed shows. */
function backLabel(resultCount: number): string {
  return `Back to your ${resultCount} result${resultCount === 1 ? "" : "s"}`;
}

/**
 * The artifact body for one kind. Exhaustive over the union, so a sixth kind
 * cannot be added to `StageArtifact` without landing here — the alternative is
 * an artifact the store accepts and the stage renders as an empty card.
 */
function ArtifactBody({ artifact }: { artifact: StageArtifact }) {
  switch (artifact.kind) {
    case "scorecard":
      return <ScorecardArtifact payload={artifact.payload} />;
    case "compare":
      return <CompareArtifact payload={artifact.payload} />;
    case "checklist":
      return <ChecklistArtifact payload={artifact.payload} />;
    case "matches":
      return <MatchesArtifact payload={artifact.payload} />;
    case "research":
      return <ResearchArtifact payload={artifact.payload} />;
    case "profile":
      return <ProfileArtifact payload={artifact.payload} />;
    case "profileUpdate":
      return <ProfileUpdateArtifact payload={artifact.payload} />;
  }
}

function StageCardShell({
  artifact,
  resultCount,
  onBack,
}: {
  artifact: StageArtifact;
  resultCount: number;
  onBack: () => void;
}) {
  const instant = prefersReducedMotion();
  const { kicker, subject } = artifactTitle(artifact);
  const ref = useRef<HTMLElement>(null);

  // BRING THE STAGE INTO VIEW when an artifact lands on it.
  //
  // The stage sits above the feed, between the results row and the chips, and
  // the member is usually reading the RAIL when it changes — either a tool turn
  // just answered, or they clicked the thread's mini card to re-show one. Either
  // way the card they asked for could open off-screen, and nothing said so.
  //
  // Keyed on `artifact.key`, which the store increments on every `showArtifact`,
  // so asking the same question twice scrolls again rather than sitting still.
  // `block: "center"` rather than "start": the whole point is to see the card
  // AND keep the list it sits above in view.
  useEffect(() => {
    const el = ref.current;
    // Guarded on the METHOD, not on the element. jsdom renders the node but
    // implements no layout, so `scrollIntoView` is simply absent there — and an
    // unguarded call threw out of the effect and took 47 unrelated tests with
    // it. A browser that cannot scroll should cost the scroll, nothing else.
    if (typeof el?.scrollIntoView !== "function") return;
    el.scrollIntoView({
      behavior: instant ? "auto" : "smooth",
      block: "center",
    });
    // `instant` is a preference read once per render and is not what should
    // re-trigger a scroll — the ARTIFACT changing is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifact.key]);

  return (
    <section
      ref={ref}
      className={`stage-card${instant ? " is-instant" : ""}`}
      role="region"
      aria-live="polite"
      aria-label={artifactOnScreenSentence(artifact)}
    >
      <header className="stage-card__head">
        <button type="button" className="stage-card__back" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden="true" /> {backLabel(resultCount)}
        </button>
        <h3 className="stage-card__title">
          {kicker}
          {subject && (
            <>
              {" "}
              <span className="stage-card__title-sep">·</span>{" "}
              <span className="stage-card__subject">{subject}</span>
            </>
          )}
        </h3>
      </header>
      <div className="stage-card__body">
        <ErrorBoundary label={`Stage ${artifact.kind}`}>
          <ArtifactBody artifact={artifact} />
        </ErrorBoundary>
      </div>
    </section>
  );
}

/**
 * Renders the stage artifact, or nothing. Sits between `OppsSummaryRow` and the
 * active filter chips; `resultCount` is the count the feed is showing.
 */
export function StageCardMount({ resultCount }: { resultCount: number }) {
  const { artifact, dismissArtifact } = useStageStore();
  if (!artifact) return null;
  return (
    // Keyed on the store's instance counter so asking the same question twice
    // re-runs the reveal.
    <StageCardShell
      key={artifact.key}
      artifact={artifact}
      resultCount={resultCount}
      onBack={dismissArtifact}
    />
  );
}
