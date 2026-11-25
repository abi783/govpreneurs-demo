// Reusable multi-select combobox with search, tokens, grouped results,
// keyboard navigation, and optional custom entries.
//
// Uses Radix Popover for positioning; the listbox itself is a manual
// combobox implementation so typing stays in the input while the dropdown
// is open (Radix's default focus trap would steal focus from the input).
//
// Design contract:
//   - Focus with empty input → popular items shown under "Popular" header.
//   - Typing → grouped filtered results via the caller's search fn.
//   - Select → token above input, input clears, dropdown stays open.
//   - Backspace on empty input removes last token.
//   - maxSelections → remaining items disabled with a quiet note.
//   - allowCustom + no results → `Add "…"` footer row.

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import { X } from "lucide-react";

export type SearchResultItem<T> = {
  /** Stable identifier for equality checks. */
  id: string;
  /** Display label. */
  label: string;
  /** Group header this item belongs under. */
  group: string;
  /** Original data for the caller. */
  data: T;
};

/** Marker so tokens can render a subnote for custom entries. */
export type SearchToken = {
  id: string;
  label: string;
  custom?: boolean;
};

export type SearchMultiSelectProps<T> = {
  placeholder: string;
  /** Called on every keystroke; also called with '' to get popular items when focused. */
  search: (query: string) => SearchResultItem<T>[];
  /** Items to show when input is focused and empty (popular seed). */
  emptyQueryResults: SearchResultItem<T>[];
  maxSelections?: number;
  allowCustom?: boolean;
  selected: SearchToken[];
  onChange: (next: SearchToken[]) => void;
  /** Used in "Selected: … (n of max)" and screen-reader announcements. */
  selectionNoun: string;
  /** Optional label prefix, e.g. "we'll match this to the right codes". */
  customSubnote?: string;
  /** aria-label if no visible label. */
  ariaLabel?: string;
};

type FlatRow<T> =
  | { kind: "header"; group: string }
  | { kind: "item"; item: SearchResultItem<T>; disabled: boolean; selected: boolean }
  | { kind: "custom"; text: string };

function groupResults<T>(
  items: SearchResultItem<T>[],
): Array<{ group: string; items: SearchResultItem<T>[] }> {
  const map = new Map<string, SearchResultItem<T>[]>();
  for (const it of items) {
    if (!map.has(it.group)) map.set(it.group, []);
    map.get(it.group)!.push(it);
  }
  return [...map.entries()].map(([group, items]) => ({ group, items }));
}

/** Highlight matched substring inside the label. */
function highlight(label: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return label;
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return label;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="sms-mark">{label.slice(idx, idx + q.length)}</mark>
      {label.slice(idx + q.length)}
    </>
  );
}

export function SearchMultiSelect<T>({
  placeholder,
  search,
  emptyQueryResults,
  maxSelections,
  allowCustom = false,
  selected,
  onChange,
  customSubnote,
  ariaLabel,
}: SearchMultiSelectProps<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);
  const atMax = maxSelections != null && selected.length >= maxSelections;

  const results = useMemo(() => {
    const raw = query.trim() ? search(query) : emptyQueryResults;
    return raw;
  }, [query, search, emptyQueryResults]);

  const grouped = useMemo(() => groupResults(results), [results]);
  const showCustomRow = allowCustom && query.trim().length > 0 && results.length === 0;

  // Flatten to a keyboard-navigable row list (headers are skipped).
  const flat: FlatRow<T>[] = useMemo(() => {
    const rows: FlatRow<T>[] = [];
    if (query.trim() === "" && results.length > 0) {
      rows.push({ kind: "header", group: "Popular" });
      for (const it of results) {
        rows.push({
          kind: "item",
          item: it,
          disabled: atMax && !selectedIds.has(it.id),
          selected: selectedIds.has(it.id),
        });
      }
    } else {
      for (const g of grouped) {
        rows.push({ kind: "header", group: g.group });
        for (const it of g.items) {
          rows.push({
            kind: "item",
            item: it,
            disabled: atMax && !selectedIds.has(it.id),
            selected: selectedIds.has(it.id),
          });
        }
      }
    }
    if (showCustomRow) rows.push({ kind: "custom", text: query.trim() });
    return rows;
  }, [query, results, grouped, atMax, selectedIds, showCustomRow]);

  const itemIndices = useMemo(
    () => flat.map((r, i) => (r.kind !== "header" ? i : -1)).filter((i) => i >= 0),
    [flat],
  );

  // Reset active index when results change.
  useEffect(() => {
    setActiveIndex(itemIndices[0] ?? 0);
  }, [itemIndices]);

  const toggleItem = useCallback(
    (item: SearchResultItem<T>) => {
      if (selectedIds.has(item.id)) {
        onChange(selected.filter((s) => s.id !== item.id));
      } else {
        if (atMax) return;
        onChange([...selected, { id: item.id, label: item.label }]);
        setQuery("");
        inputRef.current?.focus();
      }
    },
    [selected, selectedIds, atMax, onChange],
  );

  const addCustom = useCallback(
    (text: string) => {
      if (!text.trim() || atMax) return;
      const id = `custom:${text.trim().toLowerCase()}`;
      if (selectedIds.has(id)) return;
      onChange([...selected, { id, label: text.trim(), custom: true }]);
      setQuery("");
      inputRef.current?.focus();
    },
    [atMax, onChange, selected, selectedIds],
  );

  const removeToken = useCallback(
    (id: string) => {
      onChange(selected.filter((s) => s.id !== id));
    },
    [onChange, selected],
  );

  const moveActive = useCallback(
    (dir: 1 | -1) => {
      if (itemIndices.length === 0) return;
      const cur = itemIndices.indexOf(activeIndex);
      const next = cur < 0 ? 0 : (cur + dir + itemIndices.length) % itemIndices.length;
      setActiveIndex(itemIndices[next]);
    },
    [activeIndex, itemIndices],
  );

  const onKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        moveActive(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveActive(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const row = flat[activeIndex];
        if (!row) return;
        if (row.kind === "item" && !row.disabled) toggleItem(row.item);
        else if (row.kind === "custom") addCustom(row.text);
      } else if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
        e.preventDefault();
        removeToken(selected[selected.length - 1].id);
      }
    },
    [flat, activeIndex, moveActive, toggleItem, addCustom, query, selected, removeToken],
  );

  const footerText =
    selected.length > 0
      ? `Selected: ${selected.map((s) => s.label).join(", ")}${
          maxSelections != null ? ` (${selected.length} of ${maxSelections})` : ""
        }`
      : "";

  const activeItemId =
    flat[activeIndex]?.kind === "item"
      ? `${listId}-opt-${(flat[activeIndex] as { item: SearchResultItem<T> }).item.id}`
      : undefined;

  return (
    <div className="sms">
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div
            className={`sms-field${atMax ? " is-at-max" : ""}`}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-owns={listId}
            onClick={() => {
              setOpen(true);
              inputRef.current?.focus();
            }}
          >
            <div className="sms-tokens">
              {selected.map((tok) => (
                <span key={tok.id} className={`sms-token${tok.custom ? " is-custom" : ""}`}>
                  <span>{tok.label}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${tok.label}`}
                    className="sms-token-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeToken(tok.id);
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                className="sms-input"
                aria-label={ariaLabel ?? placeholder}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-activedescendant={activeItemId}
                placeholder={selected.length === 0 ? placeholder : ""}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKey}
              />
            </div>
          </div>
        </Popover.Anchor>

        <Popover.Portal>
          <Popover.Content
            className="sms-pop"
            align="start"
            sideOffset={6}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              // Keep the popover open if the user clicks back into the input.
              const target = e.target as Node | null;
              if (target && inputRef.current?.contains(target)) e.preventDefault();
            }}
            style={{ width: "var(--radix-popover-trigger-width)" }}
          >
            <ul
              id={listId}
              role="listbox"
              aria-label={ariaLabel ?? placeholder}
              className="sms-list"
            >
              {flat.length === 0 && !showCustomRow && (
                <li className="sms-empty">No matches — try a different word.</li>
              )}
              {flat.map((row, i) => {
                if (row.kind === "header") {
                  return (
                    <li key={`h-${row.group}-${i}`} className="sms-header" aria-hidden>
                      {row.group}
                    </li>
                  );
                }
                if (row.kind === "custom") {
                  return (
                    <li
                      key="custom"
                      id={`${listId}-opt-custom`}
                      role="option"
                      aria-selected={activeIndex === i}
                      className={`sms-opt sms-opt-custom${activeIndex === i ? " is-active" : ""}`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => addCustom(row.text)}
                    >
                      Add &ldquo;{row.text}&rdquo;
                    </li>
                  );
                }
                const { item, disabled, selected: sel } = row;
                return (
                  <li
                    key={item.id}
                    id={`${listId}-opt-${item.id}`}
                    role="option"
                    aria-selected={sel}
                    aria-disabled={disabled}
                    className={`sms-opt${activeIndex === i ? " is-active" : ""}${sel ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => !disabled && toggleItem(item)}
                  >
                    <span className="sms-opt-label">{highlight(item.label, query)}</span>
                    {sel && (
                      <span className="sms-opt-check" aria-hidden>
                        ✓
                      </span>
                    )}
                  </li>
                );
              })}
              {atMax && (
                <li className="sms-max-note" aria-live="polite">
                  Up to {maxSelections} — you can add more later in My Business.
                </li>
              )}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <div
        className="sms-footer"
        aria-live="polite"
        style={{ visibility: selected.length > 0 ? "visible" : "hidden" }}
      >
        {footerText}
      </div>
      {allowCustom && selected.some((s) => s.custom) && customSubnote && (
        <p className="sms-custom-note">{customSubnote}</p>
      )}
    </div>
  );
}
