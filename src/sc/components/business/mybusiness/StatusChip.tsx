/**
 * StatusChip — the one visual for a field's state. FRAMEWORKS & DRIVERS.
 *
 * FILLED BY F8 (depends on F4, F5).
 *
 * Reads `ROW_CONTRACT[state]` and renders `chip` + `tone`. It decides NOTHING:
 * the moment a chip picks its own colour, `conflict` and `attested` start
 * looking the same on one screen and different on another. If a state needs new
 * wording, change `rowContract.ts`.
 *
 * NEVER: a confidence score, a percentage, a badge, a streak, red on anything
 * missing. `tone: "problem"` exists only for `error`, which is our failure.
 *
 * Styling belongs in `mybusiness.css`, scoped under `.gpds`. `ds.css` gains
 * zero lines — it is shared with `/business`, `/tasks`, `/tasks-v1` and
 * `/intake`.
 */

import type { ReactElement } from "react";
import { rowContract } from "@sc/lib/businessProfile/rowContract";
import type { ProfileFieldState } from "@sc/lib/businessProfile/registry";

export interface StatusChipProps {
  state: ProfileFieldState;
}

/** The chip for a state, or nothing where the contract says the row is settled. */
export function StatusChip({ state }: StatusChipProps): ReactElement | null {
  const { chip, tone } = rowContract(state);
  if (chip === null) return null;
  return <span className={`mb-chip mb-chip--${tone}`}>{chip}</span>;
}
