// One control for "what you do" that serves both maturity stages:
// - New members pick plain trade categories (Food Service, HVAC…). Each row shows
//   how many NAICS codes it covers; that's all a first-year needs.
// - Experienced members who've learned their codes expand a selected trade
//   and uncheck the ones that don't fit, or search by a NAICS code directly.
// Selecting a trade includes its whole code bundle; unchecking a code adds it
// to filters.excludedNaics (an honest narrowing — see resolveNaicsSelection()).
//
// Ported from govpreneurs-v2/src/components/Hunter/WorkPicker.tsx, adapted to
// live data: the curated trade bundle WORK_TYPE_TO_NAICS from lib/vocab/trades
// (editorial vocabulary the backend does not hold), each code's words from the
// live taxonomy (useNaicsDescriptionMap → GET /naics/descriptions), and optional
// live per-code counts from fetchFacetCounts().naics (wired by the parent
// FiltersDrawer via useFacetCounts — see filterCountsHook.ts).

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { FromProfileTag } from "./FromProfileTag";
import { WORK_TYPE_TO_NAICS } from "../../lib/vocab/trades";
import { useNaicsDescriptionMap } from "../../lib/useNaicsDescriptions";

export type TradeOption = {
  id: string;
  label: string;
  prefilled?: boolean;
};

export function WorkPicker({
  trades,
  selected,
  excludedNaics,
  onChangeTrades,
  onChangeExcluded,
  naicsCounts,
}: {
  trades: TradeOption[];
  selected: string[];
  excludedNaics: string[];
  onChangeTrades: (next: string[]) => void;
  onChangeExcluded: (next: string[]) => void;
  /** Per-NAICS-code result counts from fetchFacetCounts().naics. Optional — omit to render without live counts. */
  naicsCounts?: Record<string, number>;
}) {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Only a SELECTED trade expands, so its bundle is the whole set of codes this
  // picker can ever label. One batched request per selection, from the single
  // WorkPicker the drawer mounts. A code the taxonomy does not resolve keeps
  // its bare number — the picker never invents a label.
  const codeDescriptions = useNaicsDescriptionMap(
    selected.flatMap((id) => WORK_TYPE_TO_NAICS[id] ?? []),
  );

  const needle = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!needle) return trades;
    return trades.filter(
      (t) =>
        t.label.toLowerCase().includes(needle) ||
        (WORK_TYPE_TO_NAICS[t.id] ?? []).some((c) => c.startsWith(needle)),
    );
  }, [needle, trades]);

  // A query that looks like a NAICS code but matches no trade → honest
  // dead-end pointing at Hunter (searching outside your lanes).
  // TODO: back this with the live searchNaics(q) endpoint (lib/preview.ts) so
  // a code outside the user's selected trades can actually be found and added
  // — deferred because wiring "add an ad-hoc code outside any trade" needs a
  // small extension to the trade-bundle selection model this phase didn't
  // scope. For now this stays an honest dead-end rather than a fake result.
  const codeMiss = needle.length >= 3 && /^\d+$/.test(needle) && filtered.length === 0;

  const toggleTrade = (id: string) => {
    if (selected.includes(id)) {
      onChangeTrades(selected.filter((v) => v !== id));
      // Re-selecting a trade should start with its full bundle again.
      const codes = WORK_TYPE_TO_NAICS[id] ?? [];
      if (codes.some((c) => excludedNaics.includes(c)))
        onChangeExcluded(excludedNaics.filter((c) => !codes.includes(c)));
    } else {
      onChangeTrades([...selected, id]);
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleCode = (code: string) => {
    if (excludedNaics.includes(code)) onChangeExcluded(excludedNaics.filter((c) => c !== code));
    else onChangeExcluded([...excludedNaics, code]);
  };

  return (
    <div className="of-ms">
      <div className="of-ms__search">
        <Search size={12} aria-hidden />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a trade or NAICS code…"
          aria-label="Search trades or NAICS codes"
        />
        {q && (
          <button
            type="button"
            className="of-ms__clear"
            onClick={() => setQ("")}
            aria-label="Clear search"
          >
            <X size={11} />
          </button>
        )}
      </div>

      <ul className="of-ms__list of-ms__list--tall" role="listbox" aria-multiselectable="true">
        {codeMiss ? (
          <li className="of-ms__empty">
            That code isn't in your trades — ask Hunter to search outside your lanes.
          </li>
        ) : filtered.length === 0 ? (
          <li className="of-ms__empty">No matching trades</li>
        ) : (
          filtered.map((t) => {
            const isOn = selected.includes(t.id);
            const codes = WORK_TYPE_TO_NAICS[t.id] ?? [];
            const isExpanded = expanded.has(t.id);
            const trimmed = codes.filter((c) => excludedNaics.includes(c)).length;
            const tradeCount = naicsCounts
              ? codes.reduce((sum, c) => sum + (naicsCounts[c] ?? 0), 0)
              : undefined;
            const isZero = tradeCount === 0 && !isOn;
            return (
              <li key={t.id} className="wp-trade">
                <div className={`wp-trade__row${isZero ? " of-option--zero" : ""}`}>
                  <button
                    type="button"
                    className={`of-option wp-trade__main${isOn ? " of-option--on" : ""}`}
                    onClick={() => toggleTrade(t.id)}
                    role="option"
                    aria-selected={isOn}
                  >
                    <span className={`of-option__box${isOn ? " is-on" : ""}`} aria-hidden>
                      {isOn && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="of-option__main">
                      <span className="of-option__label">
                        <span>{t.label}</span>
                        {t.prefilled && <FromProfileTag />}
                      </span>
                      {codes.length > 0 && (
                        <span className="of-option__detail">
                          covers {codes.length} NAICS {codes.length === 1 ? "code" : "codes"}
                          {trimmed > 0 && ` · ${trimmed} off`}
                        </span>
                      )}
                    </span>
                    {tradeCount !== undefined && (
                      <span className="of-option__count">{tradeCount}</span>
                    )}
                  </button>
                  {isOn && codes.length > 0 && (
                    <button
                      type="button"
                      className="wp-trade__expand"
                      onClick={() => toggleExpand(t.id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? "Hide codes" : "Fine-tune codes"}
                    >
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  )}
                </div>
                {isOn && isExpanded && (
                  <ul className="wp-codes">
                    {codes.map((code) => {
                      const included = !excludedNaics.includes(code);
                      const cc = naicsCounts?.[code];
                      const description = codeDescriptions.get(code);
                      return (
                        <li key={code}>
                          <button
                            type="button"
                            className={`of-option of-option--compact wp-code${included ? " of-option--on" : ""}`}
                            onClick={() => toggleCode(code)}
                            role="option"
                            aria-selected={included}
                          >
                            <span
                              className={`of-option__box${included ? " is-on" : ""}`}
                              aria-hidden
                            >
                              {included && <Check size={11} strokeWidth={3} />}
                            </span>
                            <span className="of-option__main">
                              <span className="of-option__label">
                                <span className="of-mono">{code}</span>
                              </span>
                              {description && (
                                <span className="of-option__detail">{description}</span>
                              )}
                            </span>
                            {cc !== undefined && <span className="of-option__count">{cc}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })
        )}
      </ul>

      {selected.length > 0 && (
        <div className="of-ms__foot">
          <button
            type="button"
            className="of-ms__clear-all"
            onClick={() => {
              onChangeTrades([]);
              onChangeExcluded([]);
            }}
          >
            Clear ({selected.length})
          </button>
        </div>
      )}
    </div>
  );
}
