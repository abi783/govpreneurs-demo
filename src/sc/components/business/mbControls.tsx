"use client";

/**
 * mbControls.tsx — the seven editors no registry control could describe.
 * FRAMEWORKS & DRIVERS.
 *
 * F12c + F17. Twenty-seven rows of the record had no editor at all, and four
 * more had one that rendered nothing: `ControlFor` returned null for `upload`
 * once the page holding `DocUpload` was deleted. This file supplies both.
 *
 * ── WHY THEY ARE NOT IN `controls.tsx` ────────────────────────────────────
 * That file is a contract with the PUBLIC `/intake` site, which imports it
 * through `QuestionCard` and must render exactly as it does today. Every one of
 * these editors is reached only through an `MbControlField`, a field type
 * `/intake` never constructs, so keeping them in their own file means the
 * riskiest constraint on this feature is satisfied by the import graph rather
 * than by review. `ControlFor` stays the one seam and delegates here.
 *
 * ── THEY DECIDE NOTHING ───────────────────────────────────────────────────
 * Which control a row gets, its unit, its registers, its paper kind and the
 * wording of every option are `mbEditor.ts`'s, tested there without a browser.
 * This file holds markup and the state of a half-typed answer, and nothing else.
 *
 * ── NO NEW CSS, ANYWHERE ──────────────────────────────────────────────────
 * The ten existing controls are built from Tailwind utilities plus `gpds-btn`
 * and `gpds-input`, and so are these. `ds.css` gains zero lines and so does
 * `mybusiness.css`: an editor that invented its own look would be visibly a
 * different product from the ten beside it.
 *
 * ── THE UPLOAD IS TWO STEPS AND ONLY ONE OF THEM IS HERE ──────────────────
 * `FileControl` hands the file to the caller's `onUpload`, which stores it, and
 * then saves what comes back through the ORDINARY `onSave` every other control
 * uses. So the record entry, the row's state, the rail's count and the analytics
 * all travel the one save path that already exists; nothing about a document is
 * special once it is stored.
 */

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import {
  CODE_SYSTEM_LABEL,
  CUSTOMER_TYPE_LABEL,
  ROLE_LABEL,
  type MbControlField,
} from "@sc/lib/businessProfile/mbEditor";
import { fieldProblem } from "@sc/lib/businessProfile/rowEditor";
import type { Address, Code, JobEntry, ListItem, Paper, StoredFile } from "@sc/lib/businessProfile/mbValue";
import {
  DATE_HINT,
  digitsFromIso,
  formatMask,
  isoFrom,
  nextDigits,
} from "@sc/lib/businessProfile/dateMask";
import {
  amountDigits,
  groupDigits,
  rowsToItems,
  seedRows,
  yearsFor,
  type ReceiptRow,
} from "@sc/lib/businessProfile/receiptYears";
import { loadCityChildren } from "@sc/lib/businessProfile/citiesClient";
import { addressForPlace, newSession, searchAddresses } from "@sc/lib/places/placesClient";
import { mergeAddress, type PlaceSuggestion } from "@sc/lib/places/address";
import { STATE_TREE } from "@sc/lib/businessProfile/treeData";
import { CONTROL_BUTTON as btn, CONTROL_INPUT as input } from "./controlStyles";

/** What a stored document becomes, or why it did not. */
export type UploadOutcome = { ok: true; file: StoredFile } | { ok: false; message: string };

/** Store one file and hand back the record entry it becomes. Supplied by the
 *  screen that knows whose record this is; `/intake` supplies none. */
export type UploadFile = (file: File) => Promise<UploadOutcome>;

export interface MbControlProps {
  field: MbControlField;
  initial: unknown;
  onSave: (value: unknown) => void;
  saving: boolean;
  /** `file` rows only. Without one the control renders nothing, which is what
   *  keeps `/intake` exactly as it was. */
  onUpload?: UploadFile;
}

const ADD_LABEL = "Add another";
const SAVE_LABEL = "Save";
const REMOVE_LABEL = "Remove this one";
const ghost = "px-3 py-1.5 text-xs font-bold text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400";
const removeBtn = "mt-1 px-2 text-lg leading-none text-gray-400 hover:text-gray-700";
const legend = "block text-xs font-semibold text-gray-600";
/** A US ZIP, without the optional +4 — the record has never held one. */
const ZIP_LENGTH = 5;
/** How many chips are worth showing at once. The list scrolls at 160px by its
 *  own rule; past a couple of dozen it stops reading as a shortlist. */
const PICK_SUGGESTIONS = 24;
/** The fifty-two, as `PickOne` takes them: the code is stored, the name is read.
 *  Built once — `STATE_TREE` is a constant. */
const STATE_OPTIONS: PickOption[] = STATE_TREE.map((s) => ({ value: s.id, label: s.label }));

/* ── picking one thing out of a known list ───────────────────────────────── */

/** One option: what is stored, and what she reads. */
export interface PickOption {
  value: string;
  label: string;
}

/**
 * Search a list, pick one thing, and the pick is the only way to set it.
 *
 * NOT a `<select>`, for three reasons that all showed up on the first try:
 *
 *  - ITS POPUP IS DRAWN BY THE BROWSER, in the system font, and takes its
 *    colours from `color-scheme` — which the legacy portal sets to `dark` at
 *    the root. So a dark list dropped out of a light page, and no amount of
 *    styling the closed box could reach it.
 *  - IT CANNOT BE SEARCHED. Type-ahead jumps to a match invisibly; with
 *    fifty-two states there is nothing on screen saying what she matched.
 *  - It looks nothing like the pickers beside it. This is the shape
 *    `PscPicker` and the trade tree already use, and it borrows their classes.
 *
 * TYPING IS SEARCHING, NEVER ANSWERING. The box narrows the list; the value
 * moves only when she picks a chip. That is what makes "it must come from the
 * list" true rather than merely asked for.
 */
function PickOne({
  value,
  options,
  placeholder,
  onPick,
  noun,
}: {
  /** What is stored now, or "" for nothing picked yet. */
  value: string;
  options: PickOption[];
  placeholder: string;
  onPick: (value: string) => void;
  /** What this is a list of, for the sentence saying typing is not picking. */
  noun: string;
}): ReactElement {
  const [query, setQuery] = useState("");
  const chosen = options.find((option) => option.value === value);
  const typed = query.trim();
  const needle = typed.toLowerCase();
  /**
   * The list is for choosing, so it goes away once she has chosen.
   *
   * Left up, two dozen states she did not pick sat between this row and the
   * next one, pushing the rest of the form down and reading as though the
   * question were still open. It comes back the moment she searches again.
   */
  const browsing = typed !== "" || !chosen;
  const matches = browsing
    ? options.filter((option) => option.label.toLowerCase().includes(needle)).slice(0, PICK_SUGGESTIONS)
    : [];
  return (
    <div className="mt-1 space-y-1.5">
      <input
        className={input}
        value={query}
        autoComplete="off"
        placeholder={chosen ? chosen.label : placeholder}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* What she has picked, and the way to change her mind about it. */}
      {chosen ? (
        <div className="wsw-selected">
          <button type="button" className="wsw-tag" onClick={() => onPick("")}>
            {chosen.label} ×
          </button>
        </div>
      ) : null}
      {matches.length > 0 ? (
      <ul className="wsw-results">
        {matches.map((option) => (
          <li key={option.value}>
            <button
              type="button"
              className={`wsw-chip${option.value === value ? " is-on" : ""}`}
              onClick={() => {
                onPick(option.value);
                setQuery("");
              }}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
      ) : null}
      {/* SAID WHERE SHE IS LOOKING. Text left in the box reads exactly like an
          answer — that is how "Asda" came to sit in the State field looking
          filled in. It is a search, it set nothing, and the row says so rather
          than letting Save quietly ignore it. */}
      {typed !== "" && matches.length === 0 ? (
        <p className="text-xs text-gray-600">
          No {noun} matches “{typed}”. Pick one from the list — typing here does
          not set it.
        </p>
      ) : null}
    </div>
  );
}

/* ── the repeated-row frame the four list-shaped editors share ───────────── */

interface RowsProps<T> {
  rows: T[];
  onChange: (rows: T[]) => void;
  blank: () => T;
  render: (row: T, patch: (next: Partial<T>) => void) => ReactNode;
}

/**
 * A growing set of rows, each removable. One frame for `list`, `codes`,
 * `papers` and `entries` — four near-identical add/remove implementations is
 * the duplication this component exists instead of.
 */
function Rows<T>({ rows, onChange, blank, render }: RowsProps<T>): ReactElement {
  const patchAt = (i: number) => (next: Partial<T>) =>
    onChange(rows.map((row, j) => (j === i ? { ...row, ...next } : row)));
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div className="flex items-start gap-2" key={i}>
          <div className="flex-1 space-y-1.5">{render(row, patchAt(i))}</div>
          <button
            type="button"
            className={removeBtn}
            aria-label={REMOVE_LABEL}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className={ghost} onClick={() => onChange([...rows, blank()])}>
        {ADD_LABEL}
      </button>
    </div>
  );
}

/** The save button every editor ends with. */
/**
 * The Save every control in this file shares — and the one place a malformed
 * answer is stopped.
 *
 * IT ASKS THE GATE THE SERVER ASKS. `fieldProblem` runs the same acceptance
 * `acceptStoredValue` runs, one keystroke earlier, so the browser and the
 * record can never disagree about what is storable. Nothing here decides
 * anything: a second cap table living in a component is exactly how a rule and
 * its enforcement drift apart.
 *
 * These editors had NO check at all. `controls.tsx` asked `fieldProblem` for
 * its text and website boxes; every control in this file — counts, money,
 * receipts, addresses, lists, codes, papers, entries — let anything through to
 * a round trip that came back a 422, if it came back at all.
 *
 * The reason is text under the control, not a tooltip, and Save is disabled
 * rather than hidden: a button that vanishes is a button she thinks she broke.
 */
function Save({
  onClick,
  disabled,
  fieldKey,
  value,
}: {
  onClick: () => void;
  disabled: boolean;
  /** The key whose rule applies. Omitted only where the control has no single
   *  key to check — nothing today. */
  fieldKey?: string;
  /** What pressing Save would store, in the shape `onSave` will be handed. */
  value?: unknown;
}): ReactElement {
  const problem = fieldKey !== undefined ? fieldProblem(fieldKey, value) : null;
  return (
    <>
      <button className={btn} disabled={disabled || problem !== null} onClick={onClick}>
        {SAVE_LABEL}
      </button>
      {problem ? <p className="gpds-sublabel">{problem}</p> : null}
    </>
  );
}

/** What is on the record, or one empty row so there is something to type in. */
function seeded<T>(initial: unknown, blank: T): T[] {
  return Array.isArray(initial) && initial.length > 0 ? (initial as T[]) : [blank];
}

/* ── list ────────────────────────────────────────────────────────────────── */

const blankItem = (): ListItem => ({ id: "", text: "" });

/** Her own list, one line each. The id is carried through untouched so an item
 *  she does not retype keeps the identity the record gave it. */
export function ListControl({ field, initial, onSave, saving }: MbControlProps): ReactElement {
  const [rows, setRows] = useState<ListItem[]>(() => seeded(initial, blankItem()));
  const kept = rows
    .map((row) => ({ ...row, text: row.text.trim() }))
    .filter((row) => row.text !== "");
  return (
    <div className="space-y-2">
      <Rows
        rows={rows}
        onChange={setRows}
        blank={blankItem}
        render={(row, patch) => (
          <input
            className={input}
            value={row.text}
            placeholder={field.helper ?? ""}
            onChange={(e) => patch({ text: e.target.value })}
          />
        )}
      />
      <Save fieldKey={field.key} value={kept} disabled={saving || kept.length === 0} onClick={() => onSave(kept)} />
    </div>
  );
}

/* ── receipts, one box per year ──────────────────────────────────────────── */

/**
 * Five years of receipts, each box told which year it is for.
 *
 * A plain list gave her five identical boxes and one line of help saying "one
 * number per year" — leaving her to hold the years, and their direction, in her
 * head. The year now sits beside the box, and is stored with the figure, so a
 * deleted row cannot silently re-date the numbers under it.
 *
 * Fixed at five: they are not rows she adds and removes, they are the five
 * years the size standard averages. Which years, and how a figure already on
 * the record finds its box, are `receiptYears.ts`'s and tested there.
 */
export function ReceiptsControl({ field, initial, onSave, saving }: MbControlProps): ReactElement {
  // Read once on mount: the boxes must not renumber themselves underneath her
  // if this is open across midnight on New Year's Eve.
  const [years] = useState(() => yearsFor(new Date()));
  const [rows, setRows] = useState<ReceiptRow[]>(() => seedRows(initial, years));
  const answered = rows.filter((row) => row.amount !== "");
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div className="flex items-center gap-2" key={row.year}>
          <span className="gpds-mono w-12 shrink-0 text-sm text-gray-700">{row.year}</span>
          {/* Beside the box rather than inside it: an overlaid prefix needs
              padding tuned to the glyph, and this file adds no CSS. It is
              `aria-hidden` because the label already says what the figure is,
              and "dollar" read before every box is noise. */}
          <span className="shrink-0 text-sm text-gray-500" aria-hidden="true">
            $
          </span>
          <input
            className={input}
            value={groupDigits(row.amount)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="What it made that year"
            aria-label={`Money the business made in ${row.year}, in dollars`}
            onChange={(e) => {
              const amount = amountDigits(e.target.value);
              setRows(rows.map((r, j) => (j === i ? { ...r, amount } : r)));
            }}
          />
        </div>
      ))}
      {/* One year is not the answer to a five-year test, and saying so once
          under the boxes beats refusing her after she presses save. */}
      <Save fieldKey={field.key} value={rowsToItems(rows)} disabled={saving || answered.length === 0} onClick={() => onSave(rowsToItems(rows))} />
    </div>
  );
}

/* ── count ───────────────────────────────────────────────────────────────── */

/** Whole things only — half a person and a third of a day are not answers. */
const WHOLE_NUMBER = /^\d+$/;

function seededCount(initial: unknown): { n: string; unit: string } {
  const held = (initial ?? {}) as { n?: unknown; unit?: unknown };
  return {
    n: typeof held.n === "number" ? String(held.n) : "",
    unit: typeof held.unit === "string" ? held.unit : "",
  };
}

/** A number and the thing it counts. The unit is never implicit: three of the
 *  four rows carry one the question itself names, and the fourth depends on her
 *  trade, so she says it. */
export function CountControl({ field, initial, onSave, saving }: MbControlProps): ReactElement {
  const held = seededCount(initial);
  const [n, setN] = useState(held.n);
  const [unit, setUnit] = useState(field.unit ?? held.unit);
  const named = typeof field.unit === "string";
  const said = named ? (field.unit as string) : unit.trim();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          className={input}
          inputMode="numeric"
          value={n}
          placeholder="A number"
          onChange={(e) => setN(e.target.value)}
        />
        {named ? (
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{field.unit}</span>
        ) : (
          <input
            className={input}
            value={unit}
            placeholder="What you count — meals, houses, deliveries"
            onChange={(e) => setUnit(e.target.value)}
          />
        )}
      </div>
      <Save
        fieldKey={field.key}
        value={{ n: Number(n.trim()), unit: said }}
        disabled={saving || !WHOLE_NUMBER.test(n.trim()) || said === ""}
        onClick={() => onSave({ n: Number(n.trim()), unit: said })}
      />
    </div>
  );
}

/* ── money ───────────────────────────────────────────────────────────────── */

/** Whole dollars. Anything that is not a digit is dropped as she types, so
 *  "$25,000" and "25000" reach the record as the same number. */
const digitsOf = (typed: string): string => typed.replace(/\D/g, "");

/** One amount, in dollars. */
export function MoneyControl({ field, initial, onSave, saving }: MbControlProps): ReactElement {
  const [amount, setAmount] = useState(typeof initial === "number" ? String(initial) : "");
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">$</span>
        <input
          className={input}
          inputMode="numeric"
          value={amount}
          placeholder="25000"
          onChange={(e) => setAmount(digitsOf(e.target.value))}
        />
      </div>
      <Save fieldKey={field.key} value={Number(amount)} disabled={saving || amount === ""} onClick={() => onSave(Number(amount))} />
    </div>
  );
}

/* ── codes ───────────────────────────────────────────────────────────────── */

const blankCode = (system: Code["system"]): Code => ({ system, code: "", label: "" });

/**
 * Government codes, in the registers this row is filed in and no others.
 *
 * Deliberately NOT a second NAICS picker: `primary_industry` is the NAICS row
 * and `TradePicker` already searches it against a live catalogue. These two rows
 * are PSC and NIGP/UNSPSC, for which this repo holds no catalogue at all — so
 * she copies the number from the portal that gave it to her, and says what it
 * covers in her own words. Inventing a description for a code we cannot look up
 * would be a government label on a fact we cannot fetch.
 */
export function CodesControl({ field, initial, onSave, saving }: MbControlProps): ReactElement {
  const systems = field.systems ?? [];
  const [rows, setRows] = useState<Code[]>(() => seeded(initial, blankCode(systems[0])));
  const kept = rows
    .map((row) => ({ ...row, code: row.code.trim(), label: row.label.trim() }))
    .filter((row) => row.code !== "");
  return (
    <div className="space-y-2">
      <Rows
        rows={rows}
        onChange={setRows}
        blank={() => blankCode(systems[0])}
        render={(row, patch) => (
          <>
            {systems.length > 1 ? (
              <select
                className={input}
                value={row.system}
                aria-label="Which list this code comes from"
                onChange={(e) => patch({ system: e.target.value as Code["system"] })}
              >
                {systems.map((system) => (
                  <option key={system} value={system}>
                    {CODE_SYSTEM_LABEL[system]}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              className={input}
              value={row.code}
              placeholder="The code"
              onChange={(e) => patch({ code: e.target.value })}
            />
            <input
              className={input}
              value={row.label}
              placeholder="What it covers"
              onChange={(e) => patch({ label: e.target.value })}
            />
          </>
        )}
      />
      <Save fieldKey={field.key} value={kept} disabled={saving || kept.length === 0} onClick={() => onSave(kept)} />
    </div>
  );
}

/* ── address ─────────────────────────────────────────────────────────────── */

/** The parts, in the order they are written on an envelope. `line1` is the only
 *  one insisted on — see `Address` for why the rest stay optional. */
/**
 * An address in parts.
 *
 * A row that has only ever held one line arrives with the whole thing in
 * `line1` — `addressAdapter` refuses to split it, because splitting on commas
 * is right often enough to be trusted and wrong often enough to matter. So the
 * first time she opens this she sees her address intact in the street box and
 * moves the parts herself, which is the only reading of it we can be sure of.
 *
 * THREE OF THE FIVE ARE NOT FREE TEXT ANY MORE. A state typed by hand arrives
 * as "NC", "N.C.", "North Carolina" or "nc" for one value the record stores
 * two letters of, so it is a list. A city is offered from the state's own
 * cities. A ZIP is five digits or it is not a ZIP.
 *
 * THE CITY LIST SUGGESTS, IT DOES NOT RESTRICT. Those cities are facets of
 * Hunter's opportunity data, not a gazetteer of every place in America — a
 * member in a town nobody has yet advertised work in must still be able to type
 * it. `datalist` is exactly that shape, and needs no dropdown of our own, no
 * new CSS and no keyboard handling to get wrong.
 */
/**
 * Type an address, pick it from Google, and the parts below fill themselves in.
 *
 * An ASSIST, never a gate: the box can be ignored entirely, no answer is
 * required from it, and every failure it can have — no API key installed, a
 * Google outage, an address Google has never heard of — ends in an empty list
 * and a member typing the parts by hand, which is what they did before this
 * existed. That is why there is no error state to show.
 */
function AddressLookup({ onPick }: { onPick: (address: Address) => void }): ReactElement {
  const [query, setQuery] = useState("");
  /** Suggestions WITH the text they answer, the same way this control already
   *  holds cities with their state — it is what stops one query's results
   *  being offered under another while the next list is still in flight. */
  const [loaded, setLoaded] = useState<{ q: string; hits: PlaceSuggestion[] }>({ q: "", hits: [] });
  const [open, setOpen] = useState(false);
  // One billable session per address being filled in: Google charges per
  // session when the keystrokes and the final details call share a token, and
  // per request when they do not.
  const session = useRef(newSession());

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return; // too little to search on — `hits` below derives to []
    let live = true;
    // Debounced, because this is charged per session and she types faster than
    // she needs suggestions.
    const timer = setTimeout(() => {
      void searchAddresses(q, session.current).then((rows) => {
        if (live) setLoaded({ q, hits: rows });
      });
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  /** Derived, never stored empty: a query with no list yet simply has none. */
  const hits = loaded.q === query.trim() ? loaded.hits : [];

  async function choose(hit: PlaceSuggestion) {
    setOpen(false);
    setQuery("");
    const picked = await addressForPlace(hit.placeId, session.current);
    // A new session starts after a pick — the old token is spent.
    session.current = newSession();
    if (picked) onPick(picked);
  }

  return (
    <div className="relative">
      <label className={legend}>
        Find your address
        <input
          className={`${input} mt-1`}
          value={query}
          placeholder="Start typing your address"
          autoComplete="off"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          // A blur that fires before the click would close the list first.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </label>
      {open && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          {hits.map((hit) => (
            <li key={hit.placeId}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[0.8rem] hover:bg-[var(--blue-1)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void choose(hit)}
              >
                {hit.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AddressControl({ field, initial, onSave, saving }: MbControlProps): ReactElement {
  const [address, setAddress] = useState<Address>(() =>
    initial && typeof initial === "object" ? (initial as Address) : { line1: "" },
  );
  /** Suggestions, WITH the state they are for. Holding the two together is what
   *  stops one state's cities being offered under another while the next list
   *  is still in flight. */
  const [loaded, setLoaded] = useState<{ state: string; cities: string[] }>({
    state: "",
    cities: [],
  });
  const patch = (part: keyof Address, value: string) =>
    setAddress((current) => ({ ...current, [part]: value }));

  const state = address.state;
  useEffect(() => {
    if (!state) return;
    let live = true;
    // Fails soft to [] by its own contract, so a Hunter outage costs her the
    // suggestions and nothing else — the box still takes what she types.
    void loadCityChildren(state).then((rows) => {
      if (live) setLoaded({ state, cities: rows.map((row) => row.label) });
    });
    return () => {
      live = false;
    };
  }, [state]);
  /** Derived, never stored empty: a state with no list yet simply has none.
   *  A city she typed before this row had a list stays picked — the option is
   *  synthesised for it, so changing state is the only thing that clears it. */
  const cities = loaded.state === state ? loaded.cities : [];
  const held = address.city?.trim() ?? "";
  const cityOptions: PickOption[] = cities.map((city) => ({ value: city, label: city }));
  if (held !== "" && !cities.includes(held)) cityOptions.unshift({ value: held, label: held });

  const zip = address.postalCode?.trim() ?? "";
  const zipWrong = zip !== "" && zip.length !== ZIP_LENGTH;
  /**
   * A city belongs to a state, so one without the other is half an answer —
   * and the city list IS the chosen state's, so a city held over from another
   * state would be a place she never said she works from.
   */
  const cityWithoutState = held !== "" && state === undefined;
  /**
   * The state is required once anything else is given, because every downstream
   * reader of this row — SAM's physical-address match, HUBZone, the SLED
   * registries — is keyed on it.
   *
   * The CITY is not required, and that is deliberate. It must come from the
   * list, but Hunter's cities are facets of its opportunity data — a hundred
   * for North Carolina against some five hundred municipalities — so requiring
   * one as well would leave a member in an unlisted town unable to save an
   * address at all. Must-be-from-the-list and must-be-given are different rules
   * and only the first one is safe here.
   */
  const stateMissing = address.line1.trim() !== "" && !state;

  const kept: Address = { line1: address.line1.trim() };
  for (const part of ["line2", "city", "state", "postalCode"] as const) {
    const value = address[part]?.trim();
    if (value) kept[part] = value;
  }

  return (
    <div className="space-y-2">
      {/* Rows the PICKER table marks `places` get a Google lookup above the
          parts. Everything below still works exactly as it did — the lookup
          fills the boxes in, it does not replace them, and a member with no
          match (or with the key not installed) types the address as before. */}
      {field.picker === "places" && (
        <AddressLookup onPick={(picked) => setAddress((current) => mergeAddress(current, picked))} />
      )}

      <label className={legend}>
        Street
        <input
          className={`${input} mt-1`}
          value={address.line1 ?? ""}
          placeholder="418 Glenwood Avenue"
          onChange={(e) => patch("line1", e.target.value)}
        />
      </label>

      <label className={legend}>
        Suite, unit or floor — if there is one
        <input
          className={`${input} mt-1`}
          value={address.line2 ?? ""}
          placeholder="Suite 2"
          onChange={(e) => patch("line2", e.target.value)}
        />
      </label>

      {/* State before city, because the city list is the state's. */}
      <div className={legend}>
        State
        <PickOne
          noun="state"
          value={address.state ?? ""}
          options={STATE_OPTIONS}
          placeholder="Search states"
          onPick={(picked) => {
            // Her old city belongs to the old state's list; keeping it under a
            // new state would read as a place she said she works from.
            setAddress((current) => ({ ...current, state: picked, city: "" }));
          }}
        />
      </div>

      <div className={legend}>
        City
        <PickOne
          noun="city"
          value={address.city ?? ""}
          options={cityOptions}
          placeholder={state ? "Search cities" : "Pick a state first"}
          onPick={(picked) => patch("city", picked)}
        />
      </div>

      <label className={legend}>
        ZIP
        <input
          className={`${input} mt-1`}
          value={address.postalCode ?? ""}
          inputMode="numeric"
          autoComplete="off"
          placeholder="27603"
          onChange={(e) => patch("postalCode", e.target.value.replace(/\D/g, "").slice(0, ZIP_LENGTH))}
        />
      </label>
      {/* Said while she can still fix it, and never as a colour on the box. */}
      {zipWrong ? <p className="text-xs text-gray-600">A ZIP is five digits.</p> : null}
      {stateMissing ? (
        <p className="text-xs text-gray-600">Pick the state this address is in.</p>
      ) : null}
      {cityWithoutState ? (
        <p className="text-xs text-gray-600">Pick the state that city is in.</p>
      ) : null}

      <Save
        fieldKey={field.key}
        value={kept}
        disabled={saving || kept.line1 === "" || zipWrong || stateMissing || cityWithoutState}
        onClick={() => onSave(kept)}
      />
    </div>
  );
}

/* ── papers ──────────────────────────────────────────────────────────────── */

/**
 * The document on one paper: choose a file, see what is attached, replace it.
 *
 * Shared by both papers editors and deliberately NOT its own save — the file is
 * part of the paper, so it is stored the moment it is chosen (the URL has to
 * exist before it can be written down) and then travels with the rest of the
 * row through the one `onSave` every other control uses.
 *
 * Renders nothing without an `onUpload`, the same way `FileControl` does, which
 * is what keeps `/intake` exactly as it was.
 */
/**
 * A date she types, in one box.
 *
 * NOT `<input type="date">`. The native control puts a calendar in front of a
 * date she already knows, splits itself into three sub-fields that need a
 * mouse or arrow keys to move between, and renders in the BROWSER's locale —
 * so the same box reads `dd/mm/yyyy` for one member and `mm/dd/yyyy` for
 * another, over a value stored one way.
 *
 * Eight digits go in and `MM/DD/YYYY` comes back; the separators are produced,
 * never typed. All the parsing is `dateMask.ts`, which is pure and tested —
 * this file holds the box, not the rules.
 *
 * It reports only a REAL date, and clears to "" — a half-typed date is not an
 * answer and 02/31 is not a day, so neither is handed to the caller.
 */
export function DateField({
  iso,
  onChange,
  label,
}: {
  /** What the record holds, as `YYYY-MM-DD`. */
  iso: string | null | undefined;
  /** The stored value for a finished, real date; "" while it is neither. */
  onChange: (iso: string) => void;
  label: string;
}): ReactElement {
  const [digits, setDigits] = useState(() => digitsFromIso(iso));
  return (
    <input
      className={`${input} mt-1`}
      value={formatMask(digits)}
      // The keyboard she needs, and no browser autofill guessing at a date.
      inputMode="numeric"
      autoComplete="off"
      placeholder={DATE_HINT}
      aria-label={label}
      onChange={(e) => {
        const next = nextDigits(digits, e.target.value);
        setDigits(next);
        onChange(isoFrom(next) ?? "");
      }}
    />
  );
}

export function PaperFile({
  file,
  onAttach,
  onUpload,
  saving,
  noun = "document",
}: {
  /** What this paper is called on its button — the one thing that ever differed
   *  between the two copies of this component. */
  noun?: string;
  file?: StoredFile;
  onAttach: (file: StoredFile) => void;
  onUpload?: UploadFile;
  saving: boolean;
}): ReactElement | null {
  const picker = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!onUpload) return null;

  const send = async (chosen: File): Promise<void> => {
    setSending(true);
    setError(null);
    const outcome = await onUpload(chosen);
    setSending(false);
    if (outcome.ok) onAttach(outcome.file);
    else setError(outcome.message);
  };

  const busy = sending || saving;
  return (
    <div className="flex items-center gap-2">
      <input
        ref={picker}
        type="file"
        className="hidden"
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          if (chosen) void send(chosen);
        }}
      />
      <button type="button" className={ghost} disabled={busy} onClick={() => picker.current?.click()}>
        {busy ? SENDING_LABEL : file ? `Replace the ${noun}` : `Attach the ${noun}`}
      </button>
      {file ? <span className="text-xs text-gray-600 truncate">{file.name}</span> : null}
      {error ? <span className="text-xs text-gray-700">{error}</span> : null}
    </div>
  );
}

const blankPaper = (kind: Paper["kind"]): Paper => ({ id: "", kind, name: "" });

/**
 * A credential and the date it runs out.
 *
 * THE EXPIRY IS WHY THIS KIND EXISTS — `expiringPapers` and the renewal queue
 * read it. It is also OPTIONAL and stays optional: a legacy row lifts to a paper
 * with no expiry (hazard 6), and stamping one on save would put a renewal in
 * front of her that nobody ever has to make. A blank date field therefore leaves
 * the field absent rather than sending today.
 */
export function PapersControl({ field, initial, onSave, saving, onUpload }: MbControlProps): ReactElement {
  const kind = field.paperKind as Paper["kind"];
  const [rows, setRows] = useState<Paper[]>(() => seeded(initial, blankPaper(kind)));
  const kept = rows
    .map((row) => ({ ...row, kind: row.kind ?? kind, name: row.name.trim() }))
    .filter((row) => row.name !== "");
  return (
    <div className="space-y-2">
      <Rows
        rows={rows}
        onChange={setRows}
        blank={() => blankPaper(kind)}
        render={(row, patch) => (
          <>
            <input
              className={input}
              value={row.name}
              placeholder="What it is called"
              onChange={(e) => patch({ name: e.target.value })}
            />
            <input
              className={input}
              value={row.issuer ?? ""}
              placeholder="Who issued it"
              onChange={(e) => patch({ issuer: e.target.value })}
            />
            <label className={legend}>
              Expires — leave this blank if it does not
              <DateField
                iso={row.expiresAt}
                label={`When ${row.name.trim() || "it"} expires`}
                onChange={(iso) => patch({ expiresAt: iso })}
              />
            </label>
            <PaperFile
              file={row.file}
              onAttach={(file) => patch({ file })}
              onUpload={onUpload}
              saving={saving}
            />
          </>
        )}
      />
      <Save fieldKey={field.key} value={kept} disabled={saving || kept.length === 0} onClick={() => onSave(kept)} />
    </div>
  );
}

/* ── entries ─────────────────────────────────────────────────────────────── */

/**
 * A job as she is half-way through typing it: the two answers `JobEntry` cannot
 * do without start unchosen rather than guessed at.
 *
 * IT IS THE WHOLE ENTRY, not the five fields this editor shows. A `JobEntry` can
 * also carry dates, a place, a reference and an outcome; picking out the five
 * would silently drop the rest the first time she corrected a customer's name.
 * The draft carries everything through and this editor only overwrites what it
 * asked about.
 */
type JobDraft = Omit<JobEntry, "id" | "customer" | "customerType" | "role" | "scope" | "valueText"> & {
  id: string;
  customer: string;
  customerType: string;
  role: string;
  scope: string;
  valueText: string;
};

const blankJob = (): JobDraft => ({
  id: "",
  customer: "",
  customerType: "",
  role: "",
  scope: "",
  valueText: "",
});

const UNCHOSEN_CUSTOMER = "Who they were";
const UNCHOSEN_ROLE = "Your part in it";

/** One `<select>` over a named set, starting on nothing. */
function Pick({
  value,
  labels,
  unchosen,
  onPick,
}: {
  value: string;
  labels: Record<string, string>;
  unchosen: string;
  onPick: (value: string) => void;
}): ReactElement {
  return (
    <select className={input} value={value} aria-label={unchosen} onChange={(e) => onPick(e.target.value)}>
      <option value="">{unchosen}</option>
      {Object.entries(labels).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}

function isWholeJob(draft: JobDraft): boolean {
  return (
    draft.customer.trim() !== "" &&
    draft.scope.trim() !== "" &&
    draft.customerType !== "" &&
    draft.role !== ""
  );
}

/** What she typed, as `JobEntry` holds it — everything else on the entry carried
 *  through. Her words for the worth are never normalised: `valueUSD` cannot hold
 *  "about 25k", and rewriting it would put a figure on the record she never
 *  said. */
function asJob(draft: JobDraft): Partial<JobEntry> {
  return {
    ...draft,
    customer: draft.customer.trim(),
    customerType: draft.customerType as JobEntry["customerType"],
    role: draft.role as JobEntry["role"],
    scope: draft.scope.trim(),
    valueText: draft.valueText.trim(),
  };
}

/** Jobs, structured, because buyers ask for them structured. */
export function EntriesControl({ field, initial, onSave, saving }: MbControlProps): ReactElement {
  const [rows, setRows] = useState<JobDraft[]>(() =>
    seeded((initial as JobDraft[] | undefined)?.map((e) => ({ ...blankJob(), ...e })), blankJob()),
  );
  const kept = rows.filter(isWholeJob).map(asJob);
  return (
    <div className="space-y-2">
      <Rows
        rows={rows}
        onChange={setRows}
        blank={blankJob}
        render={(row, patch) => (
          <>
            <input
              className={input}
              value={row.customer}
              placeholder="Who it was for"
              onChange={(e) => patch({ customer: e.target.value })}
            />
            <Pick
              value={row.customerType}
              labels={CUSTOMER_TYPE_LABEL}
              unchosen={UNCHOSEN_CUSTOMER}
              onPick={(customerType) => patch({ customerType })}
            />
            <Pick
              value={row.role}
              labels={ROLE_LABEL}
              unchosen={UNCHOSEN_ROLE}
              onPick={(role) => patch({ role })}
            />
            <input
              className={input}
              value={row.scope}
              placeholder="What the work was"
              onChange={(e) => patch({ scope: e.target.value })}
            />
            <input
              className={input}
              value={row.valueText}
              placeholder="Roughly what it was worth"
              onChange={(e) => patch({ valueText: e.target.value })}
            />
          </>
        )}
      />
      <Save fieldKey={field.key} value={kept} disabled={saving || kept.length === 0} onClick={() => onSave(kept)} />
    </div>
  );
}

/* ── file ────────────────────────────────────────────────────────────────── */

const CHOOSE_LABEL = "Choose a file";
const REPLACE_LABEL = "Replace it";
const SENDING_LABEL = "Sending…";

/** The document already on this row, if the record holds one. */
function onFile(initial: unknown): StoredFile | null {
  const held = initial as StoredFile | null | undefined;
  return held && typeof held.name === "string" ? held : null;
}

/**
 * One document, uploaded and then recorded.
 *
 * Renders NOTHING without an `onUpload`, which is exactly what `ControlFor`
 * returned for an upload before this feature — so `/intake`, which passes none
 * and filters upload fields out anyway, is unchanged twice over.
 */
export function FileControl({ field, initial, onSave, saving, onUpload }: MbControlProps): ReactElement | null {
  const picker = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const held = onFile(initial);
  const store = onUpload;
  if (!store) return null;

  const send = async (file: File): Promise<void> => {
    setSending(true);
    setError(null);
    const outcome = await store(file);
    setSending(false);
    // The row saves what came back down the ordinary path, so the record, the
    // rail and the analytics all move exactly as they do for a typed answer.
    if (outcome.ok) onSave(outcome.file);
    else setError(outcome.message);
  };

  const busy = sending || saving;
  return (
    <div className="space-y-2">
      {held ? <p className="text-sm text-gray-700">{held.name}</p> : null}
      <input
        ref={picker}
        type="file"
        className="hidden"
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          if (chosen) void send(chosen);
        }}
      />
      <button type="button" className={btn} disabled={busy} onClick={() => picker.current?.click()}>
        {busy ? SENDING_LABEL : held ? REPLACE_LABEL : CHOOSE_LABEL}
      </button>
      {error ? <p className="text-xs text-gray-700">{error}</p> : null}
    </div>
  );
}
