// What Hunter reads out of a forecast, in the shape the engine takes (`scoreForecast`).
// Types only: this file holds no data. For a live record `live.ts` builds the facts
// from the member's match and the record itself.
//
// Everything here is OUR work, not the buyer's, which is why it is on the
// plain-English bar and why the page marks it: titles are Hunter's plain words, `why`
// is Hunter's take, and `place` and `timing` are our reading of the record.
//
// `scopeFit` is how well the described work matches the member's capabilities, 0 to 1.
// `extraction` is how much the record gave us to read: a four-paragraph description is
// high, a repeated title is low, nothing at all is none.

export type Extraction = "high" | "medium" | "low" | "none";

export interface ForecastFacts {
  /** Hunter's plain title. The buyer's own title stays on the forecast page. */
  title: string;
  /** Hunter's take, shown in the top block of the card. */
  why: string;
  /** The kind-of-work line under Hunter's verdict. */
  work: string;
  scopeFit: number;
  /** The industry-code fit from the real NAICS taxonomy, 0 to 1, when the member's match
   *  record gives one. It replaces the code-prefix stand-in in engine.ts. */
  codeFit?: number;
  extraction: Extraction;
  /** SLED only: what kind of public record this came from. */
  found?: string;
  /** Our reading of the place, when HigherGov's place fields are empty or partial. */
  place?: { label: string; states: string[]; note: string };
  /** Our reading of the timing, when the buyer's words beat HigherGov's date. */
  timing?:
    | { kind: "window"; from: string; to: string; label: string; note: string }
    | { kind: "none"; note: string };
  /** A forecast that can no longer be bid, and why. */
  lifecycle?: { state: "closed" | "stale"; note: string; timing: string };
  /** The work goes straight to one party, so no one else can bid. */
  directAward?: string;
  /** Requirements named in the record that could stop her bidding. */
  requirements?: string[];
  /** Hunter's verdict sentence, when the standard one would say less. */
  headline?: string;
  /** Why Hunter matched the last contract to this forecast, and its limits. */
  lastContractNote?: string;
}
