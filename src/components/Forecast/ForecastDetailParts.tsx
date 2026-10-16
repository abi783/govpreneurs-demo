// What the record says: the record's own text, and on local records the buyer's words
// quoted from the public record it came from. A federal record's text is the agency's
// own words. A local record's text is a summary of the public record, and says so. Who
// published it, its meeting and item, and the link to open it are in Forecast source
// above Get ready, so this card holds the words only (one home per fact).
//
// Colour rules held here (D-E5): the buyer's own words are never amber.

import { FileText } from "lucide-react";
import { DETAIL_MORE } from "../../lib/forecasts/copy";
import { FORECASTS_TODAY, type ScoredForecast } from "../../lib/forecasts/engine";
import { EVIDENCE } from "../../lib/forecasts/grantCopy";

export function SourceCard({ f }: { f: ScoredForecast }) {
  const doc = f.document;
  const r = f.record;
  const text = r.hgText && r.hgText !== r.hgTitle ? r.hgText : null;
  if (!doc && !text) return null;
  return (
    <section className="ui-card fc-ev fc-source" aria-labelledby="fc-ev-source">
      <h3 id="fc-ev-source" className="fc-ev__title">
        <FileText size={15} aria-hidden /> {EVIDENCE.buyerWords}
      </h3>

      {text && (
        <blockquote className="fc-quote fc-quote--record">
          {text.split(/\n\s*\n/).map((para) => (
            <p key={para.slice(0, 40)}>{para.replace(/\s+/g, " ").trim()}</p>
          ))}
          <cite>{f.lane === "sled" ? DETAIL_MORE.summaryCite : DETAIL_MORE.quoteCite}</cite>
        </blockquote>
      )}
      {doc?.quotes.map((quote) => (
        <blockquote key={quote} className="fc-quote">
          “{quote.replace(/\s+/g, " ").trim()}”<cite>{DETAIL_MORE.quoteCite}</cite>
        </blockquote>
      ))}
      {doc?.upcoming && doc.upcoming.on >= FORECASTS_TODAY && (
        <blockquote className="fc-quote">
          “{doc.upcoming.quote}”<cite>{DETAIL_MORE.quoteCite}</cite>
        </blockquote>
      )}
    </section>
  );
}
