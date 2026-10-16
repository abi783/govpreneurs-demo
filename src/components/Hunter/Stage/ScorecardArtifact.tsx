// The readiness scorecard — the `EligibilityPayload` artifact on the stage.
//
// It renders the payload verbatim. `EligibilityRow` carries a field, a value and
// a status and nothing else, so this card shows a field, a value and a status:
// the prototype's `action` / `subNote` / `blocker` / `hypothetical` decorations
// have no source here and DROP OUT rather than being filled with placeholder
// copy (ARCHITECTURE.md §3(d), gap 4).

import { useEffect, useState } from "react";
import { Check, CircleHelp, TriangleAlert, X } from "lucide-react";
import type { EligibilityPayload, EligibilityRow } from "../../../lib/hunterChat";
import type { ScorecardDotStatus } from "../../../lib/hunter/stageArtifact";
import { lookupOwn } from "../../../lib/lookup";
import { prefersReducedMotion } from "./reducedMotion";

/** Milliseconds before the first row reveals, and between each row after it. */
const REVEAL_DELAY_MS = 120;
const REVEAL_STEP_MS = 90;

interface Dot {
  status: ScorecardDotStatus;
  label: string;
}

/**
 * FOUR statuses, not three. Collapsing `warn` and `neutral` onto one dot would
 * turn "we checked this and it is marginal" into "we have not checked this" —
 * empty is not verified-absent.
 */
const DOT: Record<string, Dot> = {
  pass: { status: "have", label: "You have this" },
  fail: { status: "missing", label: "You do not have this" },
  warn: { status: "marginal", label: "We checked this; it is marginal" },
  neutral: { status: "confirm", label: "We have not checked this" },
};

/** The dot for a server-supplied status, or undefined for one we do not know. */
function dotFor(status: EligibilityRow["status"]): Dot | undefined {
  return lookupOwn(DOT, status);
}

function StatusDot({ dot }: { dot: Dot }) {
  return (
    <span className={`scorecard__dot is-${dot.status}`} role="img" aria-label={dot.label}>
      {dot.status === "have" && <Check size={12} strokeWidth={3} />}
      {dot.status === "missing" && <X size={12} strokeWidth={3} />}
      {dot.status === "marginal" && <TriangleAlert size={12} strokeWidth={2.5} />}
      {dot.status === "confirm" && <CircleHelp size={12} strokeWidth={2.5} />}
    </span>
  );
}

/**
 * Reveals the rows one after another. Under reduced motion every row starts
 * revealed and NO timer is created — not a timer of zero duration, none at all.
 */
function useStaggeredReveal(rowCount: number): number {
  const reduced = prefersReducedMotion();
  const [revealed, setRevealed] = useState(reduced ? rowCount : 0);

  useEffect(() => {
    if (reduced) {
      setRevealed(rowCount);
      return;
    }
    setRevealed(0);
    const timers: number[] = [];
    for (let i = 0; i < rowCount; i += 1) {
      timers.push(
        window.setTimeout(
          () => setRevealed((n) => Math.max(n, i + 1)),
          REVEAL_DELAY_MS + i * REVEAL_STEP_MS,
        ),
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduced, rowCount]);

  return revealed;
}

function ScorecardRow({ row, revealed }: { row: EligibilityRow; revealed: boolean }) {
  const dot = dotFor(row.status);
  // A status we do not recognise gets no dot and no state class: the field and
  // the value are what the server gave us, and we assert nothing beyond them.
  const state = dot ? `is-${dot.status}` : "";
  return (
    <li className={`scorecard__row ${state} ${revealed ? "is-in" : "is-pre"}`}>
      {dot && <StatusDot dot={dot} />}
      <div className="scorecard__row-body">
        <span className="scorecard__row-label">{row.field}</span>
        <span className="scorecard__row-note">{row.value}</span>
      </div>
    </li>
  );
}

/** Renders one eligibility verdict and its rows on the stage. */
export function ScorecardArtifact({ payload }: { payload: EligibilityPayload }) {
  const rows = payload.rows ?? [];
  const revealed = useStaggeredReveal(rows.length);

  return (
    <div className="scorecard">
      <div className="scorecard__verdict">
        <span className={`scorecard__verdict-chip is-${payload.verdict}`}>
          {payload.verdictLabel}
        </span>
        {payload.soleSource && <span className="scorecard__sole">Sole source</span>}
      </div>
      <ul className="scorecard__rows" role="list">
        {rows.map((row, i) => (
          <ScorecardRow key={row.field} row={row} revealed={i < revealed} />
        ))}
      </ul>
      {payload.note && <div className="scorecard__footnote">{payload.note}</div>}
    </div>
  );
}
