/**
 * controlStyles.ts — the two class strings every answer control is built from.
 * FRAMEWORKS & DRIVERS.
 *
 * F12c. `controls.tsx` held these as file-local constants; `mbControls.tsx`
 * needs the same two, and a second copy of a class string is how one editor
 * quietly stops looking like the rest. Both classes already exist in `ds.css`
 * and this file adds no CSS of its own — it only stops the strings being
 * written twice.
 */

/** The save button on every control. */
export const CONTROL_BUTTON =
  "px-4 py-2 text-sm font-bold rounded-lg text-white disabled:opacity-50 gpds-btn";

/** Any field she types into. */
export const CONTROL_INPUT = "w-full px-3 py-2 text-sm gpds-input";

/** A secondary action beside a primary one — "Upload" next to a Save, where the
 *  filled blue button would claim a decision it is not. `gpds-btn-ghost` is the
 *  system's own outline button; this only carries the sizing. */
export const CONTROL_BUTTON_GHOST =
  "px-3.5 py-1.5 text-xs font-bold rounded-lg disabled:opacity-60 gpds-btn-ghost";
