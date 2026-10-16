// The comparison table — the `ComparePayload` artifact on the stage.
//
// ONE degradation is deliberate and is recorded in ARCHITECTURE.md §3(d): the
// verdict bar is a SINGLE winner segment, sized by `verdict.strengthPct` and
// named by `verdict.strengthLabel`. It is not an N-segment proportional bar,
// because `ComparePayload` carries no per-column weights and none can be
// derived from what it does carry. The percentage drives the width only; it is
// never printed, because a number on screen is a claim and this one would be a
// claim about a single column's share that nothing measures.
//
// The SECOND degradation is now gone. Cells used to be plain strings with no
// room for the line under them, so a deadline could not say whether its runway
// was workable and a counted figure could not name what it was counted over.
// `CompareRow.notes` is that line, parallel to `values`, and the cell renders
// it only where the server sent one — an absent note leaves the cell as it was
// rather than reserving empty space for a sentence nobody wrote.
//
// The column head names the AGENCY under the title. It was already on the
// payload (`CompareCol.agency`) and already dropped on the floor; a member
// comparing two notices is comparing two buyers as much as two jobs.
//
// Both the note and the agency are DIVs, not spans. Each is a separate line
// from the value above it, and that has to be true of the MARKUP rather than
// only of the stylesheet. A span needs `display: block` to take its own line,
// so a stylesheet that has not loaded renders "Houston, TXin your city" — two
// facts fused into one unreadable string. A block element degrades to a line
// break instead of to nonsense.
//
// It keeps the `hunter-compare__*` class names it already had: this card moved
// here from the chat thread, it did not get rewritten.

import type { ComparePayload } from "../../../lib/hunterChat";

/** Keeps a server-supplied percentage inside the bar. */
function barWidth(pct: number): string {
  if (!Number.isFinite(pct)) return "0%";
  return `${Math.min(100, Math.max(0, pct))}%`;
}

/** Renders one comparison table, its single-segment verdict bar and the tradeoff. */
export function CompareArtifact({ payload }: { payload: ComparePayload }) {
  const opps = payload.opps ?? [];
  const rows = payload.rows ?? [];
  const { verdict, tradeoff } = payload;
  const winnerCol = opps.findIndex((o) => o.oppKey === verdict?.winnerOppKey);
  return (
    <div className="hunter-compare">
      {verdict && (
        <div className="hunter-compare__verdict">
          <div className="hunter-compare__pick">
            Go for <strong>{verdict.winnerTitle}</strong>
            <span className="hunter-compare__strength">{verdict.strengthLabel}</span>
          </div>
          <div className="hunter-compare__bar">
            <div
              className="hunter-compare__bar-fill"
              style={{ width: barWidth(verdict.strengthPct) }}
            />
          </div>
        </div>
      )}
      <table className="hunter-compare__grid">
        <thead>
          <tr>
            <th />
            {opps.map((o, i) => (
              <th key={o.oppKey} className={i === winnerCol ? "win" : undefined}>
                {o.title || `Opportunity ${i + 1}`}
                {o.agency && <div className="hunter-compare__agency">{o.agency}</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.field}>
              <td className="hunter-compare__label">{row.field}</td>
              {row.values.map((v, i) => (
                <td
                  key={`${row.field}-${opps[i]?.oppKey ?? i}`}
                  className={row.winner === i ? "win" : undefined}
                >
                  {v}
                  {row.notes?.[i] && <div className="hunter-compare__note">{row.notes[i]}</div>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {tradeoff && (
        <div className="hunter-compare__tradeoff">
          <strong>Tradeoff:</strong> {tradeoff}
        </div>
      )}
    </div>
  );
}
