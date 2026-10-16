// The milestone checkpoint pause: enrichment reaches a checkpoint, states what it
// gathered, proves the payoff, then asks whether to keep going. Hunter is speaking,
// so the card sits on the shared AI-authored surface (`.ai-surface`, amber) as it
// does in the prototype, and in the same `from-hunter` turn row every other card
// in this column uses. Only the surface's page-scale padding is overridden, in
// styles.css — the colour comes from the design system, never from here.
// Order is fixed:
// acknowledge progress → show the reward (<PayoffDelta />) → offer the choice.
// "Keep going" is the clear primary; "Stop here for now" is a real, low-friction
// exit — it never decides checkpoint timing itself, only fires the member's choice.
import { PayoffDelta } from "./PayoffDelta";
import type { CheckpointPayload, PayoffDelta as PayoffDeltaValue } from "../../lib/enrichment";

/** Reports whether two payoff readings hold different numbers. */
function differs(a: PayoffDeltaValue, b: PayoffDeltaValue): boolean {
  return a.unlocked !== b.unlocked || a.sharpened !== b.sharpened;
}

/** Renders a milestone checkpoint and fires the continue/stop decision. */
export function CheckpointCard({
  checkpoint,
  onDecision,
  busy = false,
}: {
  checkpoint: CheckpointPayload;
  onDecision: (decision: "continue" | "stop") => void;
  busy?: boolean;
}) {
  const { summary, payoffDelta, totalPayoff, isFinal } = checkpoint;
  // The milestone's own gain leads; the journey's running total trails it. At the
  // first checkpoint the two ARE the same reading, and printing it twice would
  // read as two separate results.
  const showTotal = differs(totalPayoff, payoffDelta);
  return (
    <div className="hunter-msg-row from-hunter">
      <div
        className="hunter-enrich-checkpoint ai-surface hunter-card-enter"
        role="group"
        aria-label="Enrichment checkpoint"
      >
        <span className="hunter-enrich-checkpoint__attr">
          <span className="hunter-enrich-checkpoint__dot" aria-hidden />
          Hunter
        </span>
        {summary.length > 0 && (
          <p className="hunter-enrich-checkpoint__say">
            Here's what I have about you now: <strong>{summary.join(", ")}</strong>.
          </p>
        )}
        <PayoffDelta delta={payoffDelta} />
        {showTotal && <PayoffDelta delta={totalPayoff} scope="total" />}
        <div className="hunter-learn__actions">
          <button
            type="button"
            className="hunter-learn__btn hunter-learn__btn--primary"
            disabled={busy}
            onClick={() => onDecision("continue")}
          >
            {isFinal ? "Finish up" : "Keep going"}
          </button>
          <button
            type="button"
            className="hunter-learn__btn"
            disabled={busy}
            onClick={() => onDecision("stop")}
          >
            Stop here for now
          </button>
        </div>
      </div>
    </div>
  );
}
