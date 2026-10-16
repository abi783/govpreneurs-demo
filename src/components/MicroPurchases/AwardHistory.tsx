// What DLA has paid for this stock number before.
//
// Sits inside "what to charge", under Hunter's instruction, because it is the
// evidence for it — not a sixth thing to read. Verdict first, then the record
// (pattern 1): the statement carries the range and the recency, and the dated
// rows underneath are there for the member who wants to see the trend.
//
// It is NOT an AI surface. These are record facts, so no `.ai-surface` and no
// agent chip — attribution was inverted in both directions once, with the
// computed price block wearing amber while the one model-written string on the
// board rendered bare (D-E5).
//
// No company names, no CAGE codes, no contract numbers. We hold all three and
// render none: a name here is a name she might ring, and that inference is the
// whole reason the supplier concept came out.
import type { MicroOrder } from "../../lib/microPurchases/order";
import { awardHistory } from "../../lib/microPurchases/pricing";

export function AwardHistory({ order: o, now }: { order: MicroOrder; now: Date | null }) {
  // The served corpus's day, never the real one: how old an award is, is a fact
  // about the order. The 24-month window this block states is measured from it.
  const h = awardHistory(o, now);
  // null means the record has awards but none carries a usable cost. Nothing
  // true to say, so the block does not render at all.
  if (!h) return null;

  return (
    <section className="mp-awards">
      {/* A LABEL, THEN THE SENTENCE. This card began with `h.headline` — "DLA
          has bought this 6 times." — as its heading, so it was the one block on
          the page whose title was neither in the box-heading style nor even the
          same shape: a generated sentence with a full stop where every sibling
          card carries a short label. It cannot simply take the shared style
          either, because that style sets its heading in capitals and a shouted
          sentence is exactly what the copy gate exists to stop.
          So the card gets a label of its own and the count keeps its sentence,
          one line down, where it reads as the lead of the evidence rather than
          as the name of the card. */}
      <h2 className="mp-h2">What DLA paid before</h2>
      <p className="mp-awards__head">{h.headline}</p>
      <p className="mp-awards__body">{h.body}</p>

      {h.recent.length > 1 && (
        <ul className="mp-awards__list">
          {h.recent.map((a) => (
            <li key={a.key}>
              <span className="mp-awards__when">{a.when}</span>
              <span className="mp-awards__price mono">{a.price}</span>
            </li>
          ))}
        </ul>
      )}

      {h.older > 0 && (
        <p className="mp-awards__more">
          {h.older === 1 ? "One older order" : `${h.older} older orders`} before these.
        </p>
      )}
    </section>
  );
}
