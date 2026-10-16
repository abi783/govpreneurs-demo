// OrganicOfferChips — Hunter catches a profile fact IMPLIED by a search (e.g.
// searching Texas ⟹ you serve Texas) and makes ONE light, confirm-before-write
// offer. It is never an assumption: the value is only proposed, with the search
// shown as provenance, and is written only when the member clicks "Yes, add it".
// "Just exploring" dismisses locally and writes nothing.
//
// Presentational only (mirrors ProfileAskBlock/ActCard): EnrichmentJourney owns
// the network calls (fetch on search, confirm via the enrichment client). The
// offer is a single slot — it never stacks or queues.
//
// Hunter is speaking, so the offer is one of Hunter's TURNS: the same
// `from-hunter` row every reply uses, on the prototype's `.ai-surface-subtle` —
// the LIGHTER of the two AI surfaces, because an offer is a passing remark and
// the checkpoint is the authored pause. Only that surface's page-scale padding
// is overridden, in styles.css.
//
// Its chips are the column's own `.hunter-learn__btn`, not the page's `.btn` —
// `.btn` is 36px tall on 14px text, which is page scale inside a ~327px dock.
import type { OrganicOffer } from "../../lib/enrichment";

export function OrganicOfferChips({
  offer,
  onConfirm,
  onDismiss,
}: {
  offer: OrganicOffer | null;
  onConfirm: (offer: OrganicOffer) => void;
  onDismiss: () => void;
}) {
  if (!offer) return null;
  const signal = offer.proposal?.provenance.signal;
  return (
    <div className="hunter-msg-row from-hunter">
      <div
        className="enrich-offer ai-surface-subtle"
        role="group"
        aria-label="Hunter noticed something"
      >
        <span className="ai-attr">
          <span className="dot" aria-hidden />
          Hunter
        </span>
        <p className="enrich-offer__prompt">{offer.question}</p>
        {signal && <div className="hunter-msg-stamp">Noticed from {signal}</div>}
        <div className="enrich-offer__chips">
          <button
            type="button"
            className="hunter-learn__btn hunter-learn__btn--primary"
            onClick={() => onConfirm(offer)}
          >
            Yes, add it
          </button>
          <button type="button" className="hunter-learn__btn" onClick={onDismiss}>
            Just exploring
          </button>
        </div>
      </div>
    </div>
  );
}
