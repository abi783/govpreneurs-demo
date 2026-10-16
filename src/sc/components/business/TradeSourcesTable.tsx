import type { ProfileCodeRow } from "@sc/lib/businessProfile/tradeCodes";
import type { NaicsSourceSlot } from "@sc/lib/naics/naicsBySource";

/**
 * "Where your codes came from" — the "Your trade" picker's code list on the My
 * Business record. One row per code, one column per source, one tick per code.
 *
 * Shyam, 9 Oct 2026: the sources are columns of plain ticks, not coloured chips,
 * so she never has to learn a colour key; the only blue on the table is the
 * checkbox, because it is the only thing she can click. It replaces the codes
 * shown inside the trade tree (D151) — the tree now opens from "Add a code".
 *
 * It renders `profileCodeRows` and decides nothing: a column is ticked when the
 * row carries that slot's chip, so "You added" follows the "You picked" rule
 * (D152, D156) exactly. Every row ticks at least one column: a code no other
 * source lists is hers (`withOwner` in `tradeCodes.ts`).
 */

/** The four columns, in source order, and the words she reads in each header. */
const COLUMNS: { slot: NaicsSourceSlot; header: string }[] = [
  { slot: "sam", header: "SAM" },
  { slot: "sbs", header: "SBA" },
  { slot: "capability_statement", header: "Capability statement" },
  { slot: "my_business", header: "You added" },
];

/** One row of the table: a code on her profile, or a code she added in this visit. */
export interface SourcesRow {
  row: ProfileCodeRow;
  /** Its name, once the description has loaded. */
  name: string | undefined;
}

function Tick() {
  return (
    <svg className="mb-naics__tick" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxTick() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8.5L6.2 11.5L13 4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TradeSourcesTable({ rows, onToggle }: { rows: SourcesRow[]; onToggle: (code: string) => void }) {
  return (
    <div className="mb-naics">
      <p className="mb-naics__title">Where your codes came from</p>
      <table className="mb-naics__table">
        {/* Widths live on the columns: the source columns stay narrow and the
            code column takes the rest, for each code's name. */}
        <colgroup>
          <col className="mb-naics__col-use" />
          <col />
          {COLUMNS.map((c) => (
            <col key={c.slot} className="mb-naics__col-src" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="mb-naics__use">Use</th>
            <th className="mb-naics__code">Code</th>
            {COLUMNS.map((c) => (
              <th key={c.slot} className="mb-naics__src">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, name }) => {
            const has = (slot: NaicsSourceSlot) => row.chips.some((chip) => chip.slot === slot);
            const label = name ? `${row.code} ${name}` : row.code;
            return (
              <tr key={row.code} className={row.on ? undefined : "is-off"}>
                <td className="mb-naics__use">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={row.on}
                    aria-label={`Use ${label}`}
                    className="mb-naics__check"
                    onClick={() => onToggle(row.code)}
                  >
                    <span className={`of-option__box${row.on ? " is-on" : ""}`}>{row.on && <BoxTick />}</span>
                  </button>
                </td>
                <td className="mb-naics__code">
                  <span className="mb-naics__num">{row.code}</span>
                  {name && <span className="mb-naics__name">{name}</span>}
                </td>
                {COLUMNS.map((c) => (
                  <td key={c.slot} className="mb-naics__src">
                    {has(c.slot) ? (
                      <>
                        <Tick />
                        <span className="sr-only">{c.header}: yes</span>
                      </>
                    ) : (
                      <>
                        <span className="mb-naics__dash" aria-hidden>–</span>
                        <span className="sr-only">{c.header}: no</span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
