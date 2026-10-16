// Small shared marks for Forecasts: money in tabular figures, and the
// expected-date-passed mark. Words come from src/lib/forecasts/copy.ts.

import { History } from "lucide-react";
import { LIFECYCLE_LABEL } from "../../lib/forecasts/copy";

/** Figures in JetBrains Mono, words in the UI font: "Up to $250K" (tabular figures for every number). */
export function MoneyText({ text }: { text: string }) {
  const parts = text.split(/(\$[\d,]+(?:\.\d+)?[KMBT]?)/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="fc-money">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** The mark on a forecast whose expected date has passed. It is not closed. */
export function ExpectedDatePassedChip() {
  return (
    <span className="fc-chip fc-chip--quiet">
      <History size={12} aria-hidden />
      {LIFECYCLE_LABEL.passed}
    </span>
  );
}
