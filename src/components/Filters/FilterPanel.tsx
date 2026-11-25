// The filter panel for Partners and Awards — the redesign Shyam approved on 10 Nov 2026,
// rebuilt on the design system's tokens.
//
// One category at a time: a list of categories on the left (a row of tabs on a phone), the
// filters she has on as removable chips at the top, then the chosen category's questions.
// Choices apply as she makes them, so the list behind the panel is always the true answer.
//
// The primitives (.fp-*) live in src/styles/components.css.

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Info,
  Search,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  isAnyRange,
  rangeFrom,
  rangeWords,
  sameRange,
  type Range,
  type RangeKind,
  type RangePreset,
  type RangeUnit,
} from "../../lib/filters/range";

const COPY = {
  filters: "Filters",
  openFilters: "Open filters",
  close: "Close filters",
  categories: "Filter categories",
  tipHead: "Tip",
  tip: "Pick a category, then choose what matters to you. Blue means selected.",
  yourFilters: "Your filters",
  none: "none",
  noneOn: "No filters on. Start with any category.",
  clearAll: "Clear all",
  remove: "Remove filter",
  updates: "The list behind this panel changes as you choose.",
  oneOn: "1 filter on",
  noMatch: "Nothing matches. Try a different word.",
  listHint: "You can pick more than one.",
  unit: "Unit",
  units: { days: "Days", months: "Months", years: "Years" } as Record<RangeUnit, string>,
  anyRange: "No limit. Type one or both numbers.",
};

const filtersOn = (n: number) => (n === 1 ? COPY.oneOn : n + " filters on");

const ICON_PROPS = { size: 18, strokeWidth: 1.75, "aria-hidden": true } as const;

/** The page's Filters button, with how many filters are on. */
export function FilterButton({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <button type="button" className="fp-open" onClick={onOpen} aria-label={COPY.openFilters}>
      <SlidersHorizontal {...ICON_PROPS} />
      <span>{COPY.filters}</span>
      {count > 0 && <span className="fp-open__count">{count}</span>}
    </button>
  );
}

export interface ChipView {
  key: string;
  label: string;
}

/** The filters that are on, as chips that remove themselves. */
export function AppliedChips({
  chips,
  onRemove,
  onClear,
  emptyText,
}: {
  chips: ChipView[];
  onRemove: (key: string) => void;
  onClear: () => void;
  emptyText?: string;
}) {
  if (chips.length === 0) {
    return emptyText ? <p className="fp-chips__empty">{emptyText}</p> : null;
  }
  return (
    <div className="fp-chips" role="group" aria-label={COPY.yourFilters}>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          className="fp-chip"
          aria-label={`${COPY.remove}: ${c.label}`}
          onClick={() => onRemove(c.key)}
        >
          {c.label}
          <X size={13} strokeWidth={2} aria-hidden />
        </button>
      ))}
      <button type="button" className="fp-chips__clear" onClick={onClear}>
        {COPY.clearAll}
      </button>
    </div>
  );
}

export interface PanelSection<T extends string> {
  id: T;
  label: string;
  count: number;
}

/** The panel itself: header, categories, chips, the chosen category, and the footer. */
export function FilterPanel<T extends string>({
  open,
  onClose,
  kicker,
  title,
  subtitle,
  sections,
  active,
  onSection,
  chips,
  onRemoveChip,
  onClearAll,
  applyLabel,
  children,
  toolbar,
  footerStart,
  footerActions,
  hideNav = false,
  variant = "sheet",
}: {
  open: boolean;
  onClose: () => void;
  kicker: string;
  title: string;
  subtitle: string;
  sections: PanelSection<T>[];
  active: T;
  onSection: (id: T) => void;
  chips: ChipView[];
  onRemoveChip: (key: string) => void;
  onClearAll: () => void;
  applyLabel: string;
  children: ReactNode;
  /** Optional controls above the chips (Opportunities: keyword, saved searches). */
  toolbar?: ReactNode;
  /** Optional footer controls on the left. They replace the "N filters on" status. */
  footerStart?: ReactNode;
  /** Optional footer controls beside the apply button. They replace the footer "Clear all". */
  footerActions?: ReactNode;
  /** Hides the category list, for a view that is not one category. */
  hideNav?: boolean;
  /** "sheet" slides in from the right (Partners, Awards). "window" is a large window in the
   *  middle of the page with no tip, list caption or "no filters" text (Opportunities).
   *  "centered" is the same window with the chips in the footer (Partners, Awards). */
  variant?: "sheet" | "window" | "centered";
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<Element | null>(null);

  // The page passes a new onClose on every render. The effect below must not run again
  // for that, or each filter change sends focus back to the close button.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // An open popover (such as the save-search popover) takes the first press.
      if (document.querySelector("[data-radix-popper-content-wrapper]")) return;
      // Partners and Awards (centered): Escape closes the window from a text field too.
      // Opportunities keeps its keyword box: a field takes the first press there.
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (variant !== "centered" && (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA"))
        return;
      onCloseRef.current();
    };
    const scroll = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = scroll;
      if (returnTo.current instanceof HTMLElement) returnTo.current.focus();
    };
  }, [open, variant]);

  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [active]);

  const n = chips.length;
  const centered = variant === "centered";
  const plain = variant === "window" || centered;
  return (
    <>
      <div className={`fp-shade${open ? "" : " is-hidden"}`} onClick={onClose} aria-hidden="true" />
      <section
        className={`fp-panel${plain ? " fp-panel--window" : ""}${centered ? " fp-panel--centered" : ""}${open ? "" : " is-hidden"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fp-title"
        aria-hidden={!open}
        inert={!open}
      >
        <header className="fp-head">
          <div>
            {kicker && <div className="fp-head__kicker">{kicker}</div>}
            <h2 id="fp-title" className="fp-head__title">
              {title}
            </h2>
            {subtitle && <p className="fp-head__sub">{subtitle}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            className="fp-close"
            onClick={onClose}
            aria-label={COPY.close}
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        <div className={`fp-middle${hideNav ? " is-single" : ""}`}>
          {!hideNav && (
            <aside className="fp-side">
              {!plain && <div className="fp-side__caption">{COPY.categories}</div>}
              <nav className="fp-nav" aria-label={COPY.categories}>
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`fp-nav__item${s.id === active ? " is-active" : ""}`}
                    aria-current={s.id === active ? "true" : undefined}
                    onClick={() => onSection(s.id)}
                  >
                    <span>{s.label}</span>
                    {s.count > 0 && <span className="fp-nav__count">{s.count}</span>}
                  </button>
                ))}
              </nav>
              {!plain && (
                <div className="fp-side__tip">
                  <strong>{COPY.tipHead}</strong>
                  {COPY.tip}
                </div>
              )}
            </aside>
          )}

          <div className="fp-main">
            {toolbar && <div className="fp-tools">{toolbar}</div>}
            {centered ? null : plain ? (
              n > 0 && (
                <div className="fp-applied">
                  <AppliedChips chips={chips} onRemove={onRemoveChip} onClear={onClearAll} />
                </div>
              )
            ) : (
              <div className="fp-applied">
                <div className="fp-applied__top">
                  <strong>
                    {COPY.yourFilters} · {n ? n : COPY.none}
                  </strong>
                  {n > 0 && (
                    <button type="button" className="fp-applied__clear" onClick={onClearAll}>
                      {COPY.clearAll}
                    </button>
                  )}
                </div>
                {n > 0 ? (
                  <div className="fp-chips">
                    {chips.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        className="fp-chip"
                        aria-label={`${COPY.remove}: ${c.label}`}
                        onClick={() => onRemoveChip(c.key)}
                      >
                        {c.label}
                        <X size={13} strokeWidth={2} aria-hidden />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="fp-chips__empty">{COPY.noneOn}</p>
                )}
              </div>
            )}
            <div className="fp-pane" ref={paneRef}>
              {children}
            </div>
          </div>
        </div>

        <footer className="fp-foot">
          {/* Centered: the chips sit in the footer. Above the questions, a new chip pushed
              them down under the pointer. */}
          {centered && n > 0 && (
            <div className="fp-applied">
              <AppliedChips chips={chips} onRemove={onRemoveChip} onClear={onClearAll} />
            </div>
          )}
          {centered
            ? null
            : (footerStart ?? (
                <div className="fp-foot__status">
                  <strong>{filtersOn(n)}</strong>
                  <span>{COPY.updates}</span>
                </div>
              ))}
          <div className="fp-foot__actions">
            {footerActions ??
              (!centered && n > 0 && (
                <button type="button" className="fp-btn-quiet" onClick={onClearAll}>
                  {COPY.clearAll}
                </button>
              ))}
            <button type="button" className="fp-btn-primary" onClick={onClose}>
              {applyLabel}
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </footer>
      </section>
    </>
  );
}

/** The heading at the top of one category. */
export function PaneHeading({
  icon: Icon,
  title,
  sub,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
}) {
  return (
    <>
      <div className="fp-pane-head">
        <span className="fp-pane-head__icon">
          <Icon size={21} strokeWidth={1.75} aria-hidden />
        </span>
        <h3>{title}</h3>
      </div>
      <p className="fp-pane-sub">{sub}</p>
    </>
  );
}

/** One question inside a category. */
export function Field({
  title,
  help,
  note,
  children,
}: {
  title: string;
  help?: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="fp-field">
      <h4 className="fp-field__title">{title}</h4>
      {help && <p className="fp-field__help">{help}</p>}
      {children}
      {note && <p className="fp-field__note">{note}</p>}
    </section>
  );
}

/** One answer from a few — mutually exclusive. */
export function Segments<V extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div className="fp-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            className={`fp-seg__btn${on ? " is-on" : ""}`}
            onClick={() => onChange(o.value)}
          >
            {on && <Check size={14} strokeWidth={2} aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Several answers from a few. */
export function Choices<V extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: V; label: string; term?: string }[];
  selected: V[];
  onToggle: (id: V) => void;
}) {
  return (
    <div className="fp-choices" role="group" aria-label={label}>
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            className={`fp-choice${on ? " is-on" : ""}`}
            onClick={() => onToggle(o.id)}
          >
            {on && <Check size={13} strokeWidth={2} aria-hidden />}
            <span className="fp-choice__text">
              {o.label}
              {o.term && <small className="fp-choice__term">{o.term}</small>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Several answers from a long list, with a search box. */
export function CheckList({
  label,
  placeholder,
  items,
  selected,
  onToggle,
}: {
  label: string;
  placeholder: string;
  items: { id: string; label: string; detail?: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? items.filter((i) => i.label.toLowerCase().includes(needle)) : items;
  return (
    <div className="fp-list">
      <label className="fp-list__search">
        <Search size={17} strokeWidth={1.75} aria-hidden />
        <input
          type="search"
          value={q}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <div className="fp-list__items" role="group" aria-label={label}>
        {shown.map((i) => (
          <label key={i.id} className={`fp-list__item${selected.includes(i.id) ? " is-on" : ""}`}>
            <input
              type="checkbox"
              checked={selected.includes(i.id)}
              onChange={() => onToggle(i.id)}
            />
            <span>
              {i.label}
              {i.detail && <small>{i.detail}</small>}
            </span>
          </label>
        ))}
        {shown.length === 0 && <p className="fp-list__none">{COPY.noMatch}</p>}
      </div>
      <p className="fp-list__hint">{COPY.listHint}</p>
    </div>
  );
}

/** A switch for a genuine yes or no, shown as a card she can tap anywhere. */
export function ToggleCard({
  checked,
  onChange,
  title,
  detail,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  title: string;
  detail?: string;
}) {
  return (
    <label className={`fp-toggle${checked ? " is-on" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </label>
  );
}

const showValue = (n: number | null, kind: RangeKind) =>
  n === null ? "" : kind === "money" ? n.toLocaleString("en-US") : String(n);

/**
 * An open range: shortcut buttons, then two boxes she can type anything into, then a line
 * that says the range back in words. A box commits when she leaves it or presses Enter.
 */
export function RangeField({
  label,
  kind,
  value,
  onChange,
  presets,
  minLabel,
  maxLabel,
  direction = "ago",
  sayPrefix,
  anyText: _anyText = COPY.anyRange,
}: {
  label: string;
  kind: RangeKind;
  value: Range;
  onChange: (r: Range) => void;
  presets: RangePreset[];
  minLabel: string;
  maxLabel: string;
  direction?: "ago" | "ahead";
  sayPrefix: string;
  anyText?: string;
}) {
  const [minText, setMinText] = useState(showValue(value.min, kind));
  const [maxText, setMaxText] = useState(showValue(value.max, kind));
  const [unit, setUnit] = useState<RangeUnit>(value.unit);
  useEffect(() => {
    setMinText(showValue(value.min, kind));
    setMaxText(showValue(value.max, kind));
    setUnit(value.unit);
  }, [value.min, value.max, value.unit, kind]);

  const commit = (nextUnit = unit) => {
    const next = rangeFrom(minText, maxText, kind, nextUnit);
    if (!sameRange(next, value)) onChange(next);
    else {
      setMinText(showValue(value.min, kind));
      setMaxText(showValue(value.max, kind));
    }
  };

  const box = (which: "min" | "max", text: string, set: (s: string) => void, boxLabel: string) => (
    <label className="fp-range__box">
      <span>{boxLabel}</span>
      <span className="fp-range__input">
        {kind === "money" && <em>$</em>}
        <input
          type="text"
          inputMode={kind === "money" ? "text" : "numeric"}
          value={text}
          placeholder="Any"
          aria-label={`${label}: ${boxLabel}`}
          onChange={(e) => set(e.target.value)}
          onBlur={() => commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          data-bound={which}
        />
      </span>
    </label>
  );

  return (
    <div className="fp-range">
      {presets.length > 0 && (
        <div className="fp-range__presets" role="group" aria-label={`${label}: shortcuts`}>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`fp-preset${sameRange(p.range, value) ? " is-on" : ""}`}
              aria-pressed={sameRange(p.range, value)}
              onClick={() => onChange(p.range)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <div className={`fp-range__row${kind === "time" ? " has-unit" : ""}`}>
        {box("min", minText, setMinText, minLabel)}
        <span className="fp-range__dash" aria-hidden>
          –
        </span>
        {box("max", maxText, setMaxText, maxLabel)}
        {kind === "time" && (
          <label className="fp-range__box fp-range__unit">
            <span>{COPY.unit}</span>
            <select
              value={unit}
              aria-label={`${label}: ${COPY.unit}`}
              onChange={(e) => {
                const u = e.target.value as RangeUnit;
                setUnit(u);
                commit(u);
              }}
            >
              {(["days", "months", "years"] as RangeUnit[]).map((u) => (
                <option key={u} value={u}>
                  {COPY.units[u]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {/* The read-back only appears once a range is set. */}
      {!isAnyRange(value) && (
        <p className="fp-range__say">
          <Info size={14} strokeWidth={1.75} aria-hidden />
          <span>{`${sayPrefix} ${rangeWords(value, kind, direction)}.`}</span>
        </p>
      )}
    </div>
  );
}
