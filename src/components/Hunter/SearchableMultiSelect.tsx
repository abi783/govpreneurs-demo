import { useMemo, useState, type ReactNode } from "react";
import { Check, Search, X } from "lucide-react";
import { FromProfileTag } from "./FromProfileTag";

export type MSOption = {
  id: string;
  label: string;
  /** Optional secondary line (e.g. NAICS description) */
  detail?: string;
  /** Show "from your profile" tag */
  prefilled?: boolean;
  /** Per-option plain-English gloss */
  gloss?: string;
  /** Mono-format the label (codes) */
  mono?: boolean;
  /** Heading this option sits under. Absent on every option = one flat list. */
  group?: string;
  /** Badge rendered beside the label (e.g. the set-aside eligibility badge) */
  badge?: ReactNode;
};

/** One heading and the options under it, in first-appearance order. */
type MSGroup = { name: string; options: MSOption[] };

/** Buckets options by `group`, keeping the order the caller supplied. */
function byGroup(options: MSOption[]): MSGroup[] {
  const out: MSGroup[] = [];
  for (const o of options) {
    const name = o.group ?? "";
    const bucket = out.find((g) => g.name === name);
    if (bucket) bucket.options.push(o);
    else out.push({ name, options: [o] });
  }
  return out;
}

/** One selectable row: the checkbox, the label and its optional extras. */
function OptionRow({
  option,
  isOn,
  onToggle,
}: {
  option: MSOption;
  isOn: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={`of-option${isOn ? " of-option--on" : ""}`}
        onClick={onToggle}
        role="option"
        aria-selected={isOn}
      >
        <span className={`of-option__box${isOn ? " is-on" : ""}`} aria-hidden>
          {isOn && <Check size={11} strokeWidth={3} />}
        </span>
        <span className="of-option__main">
          <span className={`of-option__label${option.mono ? " of-mono" : ""}`}>{option.label}</span>
          {option.prefilled && <FromProfileTag />}
          {option.badge}
          {option.detail && <span className="of-option__detail">{option.detail}</span>}
          {option.gloss && <span className="of-option__gloss">{option.gloss}</span>}
        </span>
      </button>
    </li>
  );
}

/** Multi-select list of options, optionally searched and optionally grouped. */
export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Search…",
  searchable,
  emptyText = "No matches",
  onQueryChange,
  groupCheckAll,
}: {
  options: MSOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Override; default = show search when options > 8 */
  searchable?: boolean;
  emptyText?: string;
  /** Drives the option list REMOTELY, for a catalog too large to ship to the
   *  client (the NAICS taxonomy). When supplied the caller owns matching, so
   *  the built-in client-side filter is skipped and `options` renders as given. */
  onQueryChange?: (q: string) => void;
  /** Group names whose heading carries a "Select all" control. */
  groupCheckAll?: string[];
}) {
  const [q, setQ] = useState("");
  const showSearch = searchable ?? options.length > 8;

  // "From your profile" options bubble to the top of the list. Array.sort is
  // stable, so the original order is preserved within each group.
  const ordered = useMemo(
    () => [...options].sort((a, b) => Number(!!b.prefilled) - Number(!!a.prefilled)),
    [options],
  );

  const filtered = useMemo(() => {
    if (onQueryChange || !q.trim()) return ordered;
    const needle = q.toLowerCase();
    return ordered.filter(
      (o) =>
        o.id.toLowerCase().includes(needle) ||
        o.label.toLowerCase().includes(needle) ||
        (o.detail?.toLowerCase().includes(needle) ?? false),
    );
  }, [q, ordered, onQueryChange]);

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((v) => v !== id));
    else onChange([...selected, id]);
  };

  // Grouping is opt-in per option. With no `group` anywhere the list renders
  // exactly as it always has, so every existing call site is untouched. It is
  // read off `options`, not `filtered`, so a search cannot drop a heading; an
  // empty result still falls through to the flat list and its `emptyText`.
  const grouped = filtered.length > 0 && options.some((o) => o.group);
  const groups = useMemo(() => (grouped ? byGroup(filtered) : []), [grouped, filtered]);

  /** Adds a group's own ids to the selection and touches no other group. */
  const selectGroup = (g: MSGroup) => {
    onChange([...new Set([...selected, ...g.options.map((o) => o.id)])]);
  };

  return (
    <div className="of-ms">
      {showSearch && (
        <div className="of-ms__search">
          <Search size={12} aria-hidden />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              onQueryChange?.(e.target.value);
            }}
            placeholder={placeholder}
            aria-label={placeholder}
          />
          {q && (
            <button
              type="button"
              className="of-ms__clear"
              onClick={() => {
                setQ("");
                onQueryChange?.("");
              }}
              aria-label="Clear search"
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}
      {grouped ? (
        <div className="of-ms__groups" role="listbox" aria-multiselectable="true">
          {groups.map((g) => (
            <div key={g.name} className="of-ms__group" role="group" aria-label={g.name}>
              <div className="of-ms__group-head">
                <span className="of-ms__group-label">{g.name}</span>
                {groupCheckAll?.includes(g.name) && (
                  <button type="button" className="of-ms__group-all" onClick={() => selectGroup(g)}>
                    Select all
                  </button>
                )}
              </div>
              <ul className="of-ms__group-list">
                {g.options.map((o) => (
                  <OptionRow
                    key={o.id}
                    option={o}
                    isOn={selected.includes(o.id)}
                    onToggle={() => toggle(o.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="of-ms__list" role="listbox" aria-multiselectable="true">
          {filtered.length === 0 ? (
            <li className="of-ms__empty">{emptyText}</li>
          ) : (
            filtered.map((o) => (
              <OptionRow
                key={o.id}
                option={o}
                isOn={selected.includes(o.id)}
                onToggle={() => toggle(o.id)}
              />
            ))
          )}
        </ul>
      )}
      {selected.length > 0 && (
        <div className="of-ms__foot">
          <button type="button" className="of-ms__clear-all" onClick={() => onChange([])}>
            Clear ({selected.length})
          </button>
        </div>
      )}
    </div>
  );
}
