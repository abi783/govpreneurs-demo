// The card on a finished step whose done-for-you service she may buy again
// (REPEATABLE_SLUGS): how many times she has registered, and the button that
// opens the same purchase drawer. Only Prime Registration repeats today, so
// the words are about primes.
//
// One purchase at a time: while the newest purchase is not delivered, the
// button is gone and the card says why.

import { ArrowRight, Repeat } from "./Icon";

type Props = {
  count: number;
  inProgress: boolean;
  /** Opens the step's done-for-you drawer. */
  onRegister: () => void;
};

/** Prime registration count, plus "Register with another prime". */
export function RepeatPurchaseCard({ count, inProgress, onRegister }: Props) {
  return (
    /* Same grey-and-black look as the step's "Done for you" card: this is
       that offer again. */
    <div className="rm2-panel rm2-panel--dark">
      <div className="rm2-panel-row">
        <span className="rm2-panel-icon rm2-panel-icon--dark">
          <Repeat size={18} />
        </span>
        <div>
          <div className="rm2-panel-title rm2-panel-title--dark">
            Prime registrations: <span style={{ fontVariantNumeric: "tabular-nums" }}>{count}</span>
          </div>
        </div>
      </div>
      <div className="rm2-panel-desc rm2-panel-desc--dark">
        {inProgress
          ? "Our team is working on your newest registration. You can buy another one when it is delivered."
          : "Our team can register you with another prime. We do one registration at a time."}
      </div>
      {!inProgress && (
        <button type="button" className="rm2-btn rm2-btn--dark rm2-btn--pop" onClick={onRegister}>
          Register with another prime <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
