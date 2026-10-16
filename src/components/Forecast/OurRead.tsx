// Marks a value we worked out ourselves, beside the buyer's facts, so an inference
// never sits unmarked next to a fact (Hunter Match Score PRD §12). What the tag means,
// and why this value is our read, sit in its tooltip rather than a legend line (v5).

import { GlossTerm } from "../ui/GlossTerm";
import { DETAIL } from "../../lib/forecasts/copy";

export function OurRead({ why }: { why?: string }) {
  return (
    <GlossTerm
      term={DETAIL.ourRead}
      gloss={[DETAIL.ourRead, DETAIL.ourReadLegend, why].filter(Boolean).join(" ")}
      className="fc-ourread"
    >
      {DETAIL.ourRead}
    </GlossTerm>
  );
}
