import type { PipelineEntry, PipelineStage, PrimeCandidate } from "../../../lib/partnersApi";

/** What every step on a My partners card gets. */
export interface StepProps {
  entry: PipelineEntry;
  /** The company facts from the ranked feed. Undefined when the feed has no row for it. */
  partner?: PrimeCandidate;
  /** Moves the card. Pass the stored stage, e.g. "on_their_bench". */
  onMoveTo: (stage: PipelineStage) => void;
}
