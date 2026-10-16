"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RegistryField } from "@sc/lib/businessProfile/registry";
import { TRAVEL_RUNGS, type RegistryOption } from "@sc/lib/businessProfile/registry";
import type { Paper, StoredFile } from "@sc/lib/businessProfile/mbValue";
import { PRIMARY_SERVICES_MAX_ITEMS } from "@sc/lib/businessProfile/subsetConfirm";
import { TreePicker } from "./TreePicker";
import { TradeSourcesTable, type SourcesRow } from "./TradeSourcesTable";
import { useRecordIfHeld } from "./mybusiness/RecordStore";
import type { ProfileNaics } from "@sc/lib/businessProfile/payload";
import {
  addedCodeRows,
  openTradePicker,
  profileCodeRows,
  toggleProfileCode,
  tradeAnswer,
  tradeSave,
  tradeSaveBlock,
  type OpenedTradePicker,
  type TradePickerState,
  type TradeSaveBlock,
} from "@sc/lib/businessProfile/tradeCodes";
import {
  buildTradeTree,
  TRADE_SECTION_LABELS,
  STATE_TREE,
  CERT_TREE,
  CERT_SECTION_LABELS,
  selectionFromStates,
  statesFromSelection,
  mergeCities,
  attributeLegacyCities,
  selectionFromCertSlugs,
  certSlugsFromSelection,
} from "@sc/lib/businessProfile/treeData";
import { type TreeChild, type TreeSelection } from "@sc/lib/businessProfile/treeSelection";
import {
  ensureNaicsDescriptions,
  describeNaicsFromCache,
  searchNaics,
  type NaicsSearchResult,
} from "@sc/lib/businessProfile/naicsDescriptions";
import { loadCityChildren } from "@sc/lib/businessProfile/citiesClient";
import { WORK_TYPE_TO_NAICS } from "@sc/lib/businessProfile/workTypeTaxonomy";
import { fieldProblem, type EditorField } from "@sc/lib/businessProfile/rowEditor";
import { CONTROL_BUTTON as btn, CONTROL_INPUT as input } from "./controlStyles";
import {
  AddressControl,
  CodesControl,
  CountControl,
  EntriesControl,
  FileControl,
  ListControl,
  MoneyControl,
  PapersControl,
  type MbControlProps,
  type UploadFile,
  DateField,
  PaperFile,
  ReceiptsControl,
} from "./mbControls";

import { PscPicker } from "./PscPicker";

export type { UploadFile, UploadOutcome } from "./mbControls";

/** All day-zero answer controls (PRD §4.3). Each calls onSave with the
 *  field's value shape. Saving per answer — nothing batches (§8.3). */

/**
 * The one seam every editor is reached through, on both surfaces.
 *
 * `field` is either of the two field types (`EditorField`): a `RegistryField`,
 * which is what `/intake` passes and what the ten original controls take, or an
 * `MbControlField` for the seven value kinds `registry.ts` has no name for
 * (F12c). The two `control` unions are DISJOINT, which is what lets one switch
 * serve both: nothing `/intake` can pass reaches a new branch, and no new field
 * can reach an old one. `registry.ts` is the `/intake` contract and gains
 * nothing here.
 *
 * `onUpload` is supplied only by the member's record screen. Without it a
 * document row renders nothing at all — the same nothing `upload` returned
 * before F17, which is what keeps `/intake` exactly as it was.
 */
/** Reported unsaved value; `undefined` means "nothing pending". */
export type DraftFn = (value: unknown | undefined) => void;

/** Order- and key-insensitive: reordering a multi-select is not an edit. */
function norm(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(norm).sort((a, b) => String(a).localeCompare(String(b)));
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, val]) => [k, norm(val)]),
    );
  }
  return v ?? null;
}
const sameAnswer = (a: unknown, b: unknown) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

/**
 * Publish this control's pending value to the page.
 *
 * Keyed on the serialised value, not on identity, so a parent that passes a
 * fresh closure every render (they all do) cannot loop. The cleanup clears the
 * draft on unmount — which is how a field saved by its own button, collapsing
 * the editor, stops counting as unsaved.
 */
function useDraft(onDraft: DraftFn | undefined, value: unknown | undefined) {
  const cb = useRef(onDraft);
  const val = useRef(value);
  // Latest-ref sync in its own effect — writing a ref during render is not
  // allowed. Declared first, so it lands before the keyed effect below reads it.
  useEffect(() => {
    cb.current = onDraft;
    val.current = value;
  });
  const key = value === undefined ? "" : JSON.stringify(value);
  useEffect(() => {
    cb.current?.(val.current);
    return () => cb.current?.(undefined);
  }, [key]);
}

export function ControlFor({ field, initialValue, onSave, saving, onUpload, onDraft }: {
  field: EditorField;
  initialValue: unknown;
  onSave: (value: unknown) => void;
  saving: boolean;
  onUpload?: UploadFile;
  // Only the ten controls `/intake` can render report a draft — the save-all
  // bar exists on that surface alone. The seven catalog editors below are
  // unreachable from it, and the member's record saves a row at a time.
  onDraft?: DraftFn;
}) {
  // The props the seven new editors take. Sound ONLY inside their own branches:
  // the cast is what the disjoint discriminants already guarantee, and it must
  // never be spread into one of the ten above it.
  const mb: MbControlProps = { field: field as MbControlProps["field"], initial: initialValue, onSave, saving, onUpload };
  switch (field.control) {
    // The year is a text row on disk and stays one, but it is not free text:
    // its adapter has only ever accepted four digits, so a box that invites a
    // sentence invites a refusal. "Since ____" asks for the four digits by
    // shape rather than by telling her off afterwards.
    case "text":
      return field.key === "year_started_operating"
        ? <YearControl initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />
        : <TextControl field={field} initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
    case "radio": return <RadioControl field={field} initial={initialValue} onSave={onSave} saving={saving} />;
    case "checkbox":
      // socioeconomic_certifications gets Hunter's cert-category tree; every
      // other checkbox field (current_customer_types, sectors_served,
      // constraints) keeps the flat CheckboxControl.
      return field.key === "socioeconomic_certifications"
        ? <CertPicker field={field} initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />
        : <CheckboxControl field={field} initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
    case "three-things": return <ThreeThings initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
    case "website": return <WebsiteControl initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
    case "work-tree": return <TradePicker initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
    case "service-area": return <ServiceArea initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
    case "long-text": return <LongText field={field} initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
    case "project": return <ProjectControl initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
    // The registry's `upload` and the catalog's `file` are one question with two
    // storage shapes; `rowEditor` has already resolved which, so both open the
    // same control (F17).
    case "upload":
    case "file": return <FileControl {...mb} />;
    case "list":
      // The receipts row is five labelled years, not a list she adds rows to —
      // `mbEditor`'s PICKER table decides, never a key literal here.
      return mb.field.picker === "years" ? <ReceiptsControl {...mb} /> : <ListControl {...mb} />;
    // Which rows have a real taxonomy behind them is `mbEditor`'s `PICKER`
    // table, not a key literal here — see `MbControlField.picker`.
    case "codes":
      return mb.field.picker === "psc" ? <PscPicker {...mb} /> : <CodesControl {...mb} />;
    case "address": return <AddressControl {...mb} />;
    // The registry's home-address row. Its catalog twin arrives as `address`
    // above and carries `picker: "places"` from the PICKER table; on `/intake`
    // there is no catalog row to carry it, so the branch states it — the same
    // control, the same lookup, on both surfaces.
    case "home-address":
      return <AddressControl {...mb} field={{ ...mb.field, picker: "places" }} />;
    case "money": return <MoneyControl {...mb} />;
    case "count": return <CountControl {...mb} />;
    case "papers":
      return mb.field.picker === "certs" ? <CertPapersControl {...mb} /> : <PapersControl {...mb} />;
    case "entries": return <EntriesControl {...mb} />;
    default: return <TextControl field={field as RegistryField} initial={initialValue} onSave={onSave} saving={saving} onDraft={onDraft} />;
  }
}

/**
 * One line of text, and the rule that line has — if it has one.
 *
 * SAID WHILE SHE IS TYPING, NOT AFTER SHE PRESSES SAVE. The rules were already
 * enforced on both sides: a phone of "this is not a phone" never reached the
 * record. But nothing on screen said so until she committed, so the box read as
 * though it would take it — which is what "the phone field still allows text"
 * meant. The value was never saved; it just never looked refused.
 *
 * `fieldProblem` is the SAME gate the save uses, asked one keystroke earlier, so
 * a rule cannot be enforced in one place and forgotten in the other. A row with
 * no rule always answers null and is unaffected.
 */
function TextControl({ field, initial, onSave, saving, onDraft }: { field: RegistryField; initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const seed = typeof initial === "string" ? initial : "";
  const [v, setV] = useState(seed);
  const said = v.trim();
  const problem = fieldProblem(field.key, said);
  // A draft is what `/intake`'s save-all bar flushes, so an answer this control
  // would refuse must never be published as one.
  useDraft(onDraft, said && !problem && !sameAnswer(said, seed) ? said : undefined);
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input className={input} value={v} onChange={(e) => setV(e.target.value)} placeholder={field.helper ?? ""} />
        <button className={btn} disabled={saving || !said || problem !== null} onClick={() => onSave(said)}>Save</button>
      </div>
      {problem ? <p className="gpds-sublabel">{problem}</p> : null}
    </div>
  );
}

/** Four digits, and the box holds no more than that. */
const YEAR_LENGTH = 4;
/** A year, shown as the shape of the answer rather than as an instruction. */
const YEAR_HINT = "2015";

/**
 * The year she started, asked as a sentence she completes: `Since [____]`.
 *
 * The row was a bare text box, and a bare text box invites "since 2015" or
 * "about ten years" — both of which its adapter refuses, because this key has
 * only ever held four digits. Refusing her afterwards is worse than asking in a
 * shape she cannot get wrong: the word carries the "since", the box holds four
 * characters, and a year stands in it as the hint.
 *
 * Digits only, so the value that reaches the server is one the server accepts.
 * The server still checks — `yearProblem` in the one gate — because a control is
 * not a validator and this route takes writes from more than this control.
 */
function YearControl({ initial, onSave, saving, onDraft }: { initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const seed = typeof initial === "string" ? initial : "";
  const [year, setYear] = useState(seed);
  // Same rule as this control's own Save button: a half-typed "20" is not an
  // answer, so the save-all bar must not flush it.
  useDraft(onDraft, year.length === YEAR_LENGTH && year !== seed ? year : undefined);
  return (
    <div className="flex items-center gap-2">
      <span className="gpds-pick__label">Since</span>
      <input
        className={`${input} w-24`}
        value={year}
        inputMode="numeric"
        maxLength={YEAR_LENGTH}
        placeholder={YEAR_HINT}
        aria-label="The year you started"
        onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, YEAR_LENGTH))}
      />
      <button
        className={btn}
        disabled={saving || year.length !== YEAR_LENGTH}
        onClick={() => onSave(year)}
      >
        Save
      </button>
    </div>
  );
}

function RadioControl({ field, initial, onSave, saving }: { field: RegistryField; initial: unknown; onSave: (v: unknown) => void; saving: boolean }) {
  const current = typeof initial === "string" ? initial : null;
  return (
    <div className="gpds-picks">
      {(field.options ?? []).map((o) => (
        <label key={o.value} className="gpds-pick">
          <input type="radio" checked={current === o.value} onChange={() => onSave(o.value)} disabled={saving} />
          <span className="gpds-pick__text">
            <span className="gpds-pick__label">{o.label}</span>
            {o.hint && <span className="gpds-pick__hint">{o.hint}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

function CheckboxControl({ field, initial, onSave, saving, onDraft }: { field: RegistryField; initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const seed = useMemo(() => (Array.isArray(initial) ? (initial as string[]) : []), [initial]);
  const [sel, setSel] = useState<string[]>(seed);
  useDraft(onDraft, sel.length > 0 && !sameAnswer(sel, seed) ? sel : undefined);
  const opts = field.options ?? [];
  function toggle(value: string) {
    const opt = opts.find((o) => o.value === value)!;
    setSel((cur) => {
      if (cur.includes(value)) return cur.filter((x) => x !== value);
      if (opt.exclusive) return [value]; // picking an exclusive clears the rest
      return [...cur.filter((x) => !opts.find((o) => o.value === x)?.exclusive), value];
    });
  }
  return (
    <div>
      <div className="gpds-picks">
        {opts.map((o) => (
          <label key={o.value} className="gpds-pick">
            <input type="checkbox" checked={sel.includes(o.value)} onChange={() => toggle(o.value)} />
            <span className="gpds-pick__text">
              <span className="gpds-pick__label">{o.label}</span>
              {o.hint && <span className="gpds-pick__hint">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      <button className={`${btn} mt-2`} disabled={saving || sel.length === 0} onClick={() => onSave(sel)}>Save</button>
    </div>
  );
}

/** socioeconomic_certifications — Hunter's SET_ASIDE_TREE structure (cert
 *  category parents, SAM code children) instead of the flat CheckboxControl.
 *  Persists at CATEGORY granularity: touching any part of a category maps to
 *  its one SC slug (categoriesFromSelection has no partial concept for
 *  certs — see certSlugsFromSelection). `none`/`not_sure` stay as two
 *  exclusive quick-picks below the tree, same as before this rebuild:
 *  picking either clears the tree and vice versa. */
/**
 * The exclusive answer she is already holding, if any.
 *
 * "None of these" and "Not sure" are exclusive because the REGISTRY says so,
 * not because this file knows their slugs — both cert editors read the same
 * flag their quick-picks are rendered from.
 */
function exclusiveHeld(options: RegistryOption[] | undefined, held: string[]): string | null {
  return held.find((slug) => options?.some((o) => o.exclusive && o.value === slug)) ?? null;
}

function CertPicker({ field, initial, onSave, saving, onDraft }: { field: RegistryField; initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const initSlugs = useMemo(() => (Array.isArray(initial) ? (initial as string[]) : []), [initial]);
  // From the registry's own `exclusive` flag, which is what the quick-picks
  // below render from — naming the two slugs here meant a third one would be
  // offered and never seeded.
  const initExclusive = exclusiveHeld(field.options, initSlugs);
  const [selection, setSelection] = useState<TreeSelection>(() => selectionFromCertSlugs(initSlugs));
  const [exclusive, setExclusive] = useState<string | null>(initExclusive);

  const treeSlugs = certSlugsFromSelection(selection);
  const hasTreeSelection = selection.parents.length > 0 || selection.children.length > 0;

  function pickExclusive(value: string) {
    setExclusive(value);
    setSelection({ parents: [], children: [] }); // exclusive clears the tree
  }
  function onTreeChange(next: TreeSelection) {
    setSelection(next);
    if (next.parents.length > 0 || next.children.length > 0) setExclusive(null); // tree clears the exclusive
  }

  const exclusiveOptions = (field.options ?? []).filter((o) => o.exclusive);
  const saveValue = exclusive ? [exclusive] : treeSlugs;
  useDraft(onDraft, (exclusive || hasTreeSelection) && !sameAnswer(saveValue, initSlugs) ? saveValue : undefined);

  return (
    <div>
      <TreePicker
        groups={CERT_TREE}
        sectionLabels={CERT_SECTION_LABELS}
        selection={selection}
        onChange={onTreeChange}
        searchPlaceholder="Search a set-aside or code…"
        emptyLabel="No matching set-asides"
      />
      <div className="gpds-picks mt-2">
        {exclusiveOptions.map((o) => (
          <label key={o.value} className="gpds-pick">
            <input type="checkbox" checked={exclusive === o.value} onChange={() => pickExclusive(o.value)} />
            <span className="gpds-pick__text">
              <span className="gpds-pick__label">{o.label}</span>
              {o.hint && <span className="gpds-pick__hint">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>
      {/* SHE TICKED SOMETHING THE RECORD CANNOT HOLD, AND SAYING SO BEATS A
          DEAD BUTTON. The tree offers thirteen categories and this row stores
          six: `certSlugsFromSelection` drops the rest. Before, those saved as
          an empty list over whatever she already had; now Save is correctly
          refused, which without a sentence is just a button that does nothing.
          Named, so she can tell which of her ticks is the problem. */}
      {hasTreeSelection && treeSlugs.length === 0 ? (
        <p className="gpds-sublabel mt-2">
          We cannot record that one on this question yet. Small Business and Partial Small
          Business are asked separately, as &ldquo;Whether you count as a small business for
          this kind of work&rdquo;. For anything else, choose &ldquo;Not sure&rdquo; and your
          mentor will sort it out on the call.
        </p>
      ) : null}
      {/* GATED ON WHAT WILL BE STORED, NOT ON WHAT IS TICKED. These were two
          different questions: `hasTreeSelection` asks whether she touched the
          tree, `saveValue` is what the tree maps to — and
          `certSlugsFromSelection` drops any category with no Success Center
          slug behind it. Tick one of those and Save lit up, wrote `[]`, and
          overwrote the answer she already had with nothing. Asking the payload
          means the button and the save can never disagree again. */}
      <button className={`${btn} mt-2`} disabled={saving || saveValue.length === 0} onClick={() => onSave(saveValue)}>Save</button>
    </div>
  );
}

/**
 * Certifications as documents: the same tree that decides WHICH set-asides she
 * holds, plus an expiry and the certificate itself for each one.
 *
 * ── WHY NOT JUST `PapersControl` ──────────────────────────────────────────
 * Two things would have broken, and both are quiet.
 *
 * The slug. `deriveCerts` decides set-aside eligibility from
 * `SuccessCenter.socioEconomicCerts`, which this row reaches through
 * `WRITE_BACK`, which matches on the paper's `id`. A free-text "What it is
 * called" box produces papers with no id, so a certification she typed herself
 * would arrive as prose and match no rule — she would hold 8(a) and be shown no
 * 8(a) work. The tree keeps the slug on every paper.
 *
 * The "none" answer. This is one of Diana's fourteen, and "None of these
 * describe the owner" is a real answer to it. A papers list cannot say that —
 * it can only be empty, which reads as unanswered — so the counter would stop
 * at thirteen and she could never send her intake. The exclusive options stay.
 */
function CertPapersControl({ field, initial, onSave, saving, onUpload }: MbControlProps) {
  const held: Paper[] = Array.isArray(initial) ? (initial as Paper[]) : [];
  const heldSlugs = held.map((p) => p.id).filter(Boolean);
  // Handed over by `mbControlFor`, so this editor no longer names the row it
  // serves — the third place that key used to be written down.
  const options = field.options ?? [];
  const exclusiveOptions = options.filter((o) => o.exclusive);
  const labelOf = (slug: string) => options.find((o) => o.value === slug)?.label ?? slug;

  const [selection, setSelection] = useState<TreeSelection>(() => selectionFromCertSlugs(heldSlugs));
  const [exclusive, setExclusive] = useState<string | null>(
    () => exclusiveHeld(options, heldSlugs),
  );
  // The expiry and the document she has already given, kept by slug so nothing
  // is lost when she adds or removes a certification beside it.
  const [detail, setDetail] = useState<Record<string, { expiresAt?: string; file?: StoredFile }>>(
    () => Object.fromEntries(held.map((p) => [p.id, { expiresAt: p.expiresAt, file: p.file }])),
  );

  const treeSlugs = certSlugsFromSelection(selection);
  function pickExclusive(value: string) {
    setExclusive(value);
    setSelection({ parents: [], children: [] });
  }
  function onTreeChange(next: TreeSelection) {
    setSelection(next);
    if (next.parents.length > 0 || next.children.length > 0) setExclusive(null);
  }
  const patch = (slug: string, next: { expiresAt?: string; file?: StoredFile }) =>
    setDetail((current) => ({ ...current, [slug]: { ...current[slug], ...next } }));

  const chosen = exclusive ? [exclusive] : treeSlugs;
  const papers: Paper[] = chosen.map((slug) => {
    const paper: Paper = { id: slug, kind: "certification", name: labelOf(slug) };
    const extra = detail[slug];
    if (extra?.expiresAt) paper.expiresAt = extra.expiresAt;
    if (extra?.file) paper.file = extra.file;
    return paper;
  });

  return (
    <div>
      <TreePicker
        groups={CERT_TREE}
        sectionLabels={CERT_SECTION_LABELS}
        selection={selection}
        onChange={onTreeChange}
        searchPlaceholder="Search a set-aside or code…"
        emptyLabel="No matching set-asides"
      />
      <div className="gpds-picks mt-2">
        {exclusiveOptions.map((o) => (
          <label key={o.value} className="gpds-pick">
            <input type="checkbox" checked={exclusive === o.value} onChange={() => pickExclusive(o.value)} />
            <span className="gpds-pick__text">
              <span className="gpds-pick__label">{o.label}</span>
              {o.hint && <span className="gpds-pick__hint">{o.hint}</span>}
            </span>
          </label>
        ))}
      </div>

      {/* The paperwork, one block per certification she actually holds. An
          exclusive answer has none to show. */}
      {!exclusive && treeSlugs.length > 0 && (
        <div className="mt-3 space-y-3">
          {treeSlugs.map((slug) => (
            <div key={slug} className="gpds-card px-3 py-2 space-y-1.5">
              <p className="gpds-pick__label">{labelOf(slug)}</p>
              <label className="gpds-sublabel">
                Expires — leave this blank if it does not
                <DateField
                  iso={detail[slug]?.expiresAt}
                  label={`When ${labelOf(slug)} expires`}
                  onChange={(iso) => patch(slug, { expiresAt: iso })}
                />
              </label>
              <PaperFile
                file={detail[slug]?.file}
                onAttach={(file) => patch(slug, { file })}
                onUpload={onUpload}
                saving={saving}
                noun="certificate"
              />
            </div>
          ))}
        </div>
      )}

      {/* Same rule as the other cert editor: gated on the payload, not on the
          selection that produced it. */}
      <button
        className={`${btn} mt-2`}
        disabled={saving || papers.length === 0}
        onClick={() => onSave(papers)}
      >
        Save
      </button>
    </div>
  );
}


/** The prompt on each row. A row past the end of this list reads the last one,
 *  so the cap alone decides how many rows there are. */
const SERVICE_ROW_PROMPTS = ["The main one", "Second (optional)", "Third (optional)"];

/**
 * The `primary_services` editor. HOW MANY ROWS IT DRAWS IS THE CAP, and the cap
 * is `PRIMARY_SERVICES_MAX_ITEMS` — the same constant the confirm route refuses
 * an over-long pick against. One number, so the box she types in and the record
 * that stores it cannot disagree about how many services she may keep.
 */
function ThreeThings({ initial, onSave, saving, onDraft }: { initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const init = useMemo(() => (Array.isArray(initial) ? (initial as string[]) : []), [initial]);
  const [rows, setRows] = useState<string[]>(() =>
    Array.from({ length: PRIMARY_SERVICES_MAX_ITEMS }, (_, i) => init[i] ?? ""),
  );
  const pending = rows.map((s) => s.trim()).filter(Boolean);
  const first = rows[0].trim();
  const setRow = (i: number, text: string) =>
    setRows((current) => current.map((row, at) => (at === i ? text : row)));
  useDraft(onDraft, first && !sameAnswer(pending, init) ? pending : undefined);
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <input
          key={i}
          className={input}
          value={row}
          onChange={(e) => setRow(i, e.target.value)}
          placeholder={SERVICE_ROW_PROMPTS[i] ?? SERVICE_ROW_PROMPTS[SERVICE_ROW_PROMPTS.length - 1]}
        />
      ))}
      <button className={btn} disabled={saving || !first} onClick={() => onSave(pending)}>Save</button>
    </div>
  );
}

function WebsiteControl({ initial, onSave, saving, onDraft }: { initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const init = (initial ?? null) as { has?: string; url?: string } | null;
  const [has, setHas] = useState<string | null>(init?.has ?? null);
  const [url, setUrl] = useState(init?.url ?? "");
  // Only the "yes" branch can be pending — the other two save on pick.
  const pending = { has: "yes", url: url.trim() };
  /** The same rule the record refuses on, asked while she types. */
  const urlProblem = fieldProblem("website", url.trim() ? pending : "");
  useDraft(
    onDraft,
    has === "yes" && url.trim() && !urlProblem && !sameAnswer(pending, init) ? pending : undefined,
  );
  return (
    <div className="space-y-2">
      {[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No, not yet" },
        { value: "unsure", label: "Not sure" },
      ].map((o) => (
        <label key={o.value} className="gpds-pick">
          <input type="radio" checked={has === o.value} onChange={() => {
            setHas(o.value);
            if (o.value !== "yes") onSave({ has: o.value }); // a real answer, saved at once
          }} disabled={saving} />
          <span className="gpds-pick__label">{o.label}</span>
        </label>
      ))}
      {has === "yes" && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <input className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourcompany.com" />
            <button
              className={btn}
              disabled={saving || !url.trim() || urlProblem !== null}
              onClick={() => onSave(pending)}
            >
              Save
            </button>
          </div>
          {/* Said as she types. It used to take "asda" all the way to the button
              before saying anything, which reads as a box that would have it. */}
          {urlProblem ? <p className="gpds-sublabel">{urlProblem}</p> : null}
        </div>
      )}
    </div>
  );
}

/** What she reads under the picker while the record's Save is off. */
const TRADE_SAVE_BLOCK_MESSAGE: Record<TradeSaveBlock, string> = {
  // A save with no code changes nothing on her profile (Decisions log D46), so
  // the Save must not look as though it removed her last code.
  no_code: "Keep at least one code ticked.",
  no_answer: "To save, add a code of your own or choose a trade. Use “Add a code”.",
};

/**
 * "Your trade". On the My Business record it starts from EVERY code on her
 * profile, not only her own picks: her save excludes each code she was shown
 * and did not keep, so an untouched save must keep them all (SPEC §A.5,
 * Decisions log D47, D131). The save sends her picks as the value and the
 * ticked and shown codes beside it (D130). On `/intake` no record is held and
 * it starts from her picks, as before. The state rules are `tradeCodes.ts`';
 * this component only holds and renders.
 */
function TradePicker({ initial, onSave, saving, onDraft }: { initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const init = (initial ?? null) as { categories?: string[]; naics?: string[] } | null;
  const heldNaics = useRecordIfHeld()?.payload.naics ?? null;
  // Read once, on open: the rows must not move while she edits, and the save
  // must know what she was shown and what she had picked before.
  const [profile] = useState<ProfileNaics | null>(heldNaics);
  const [opened] = useState<OpenedTradePicker>(() => openTradePicker(initial, profile));
  const openedWith = opened.categories;
  const [picked, setPicked] = useState<TradePickerState>(opened.seeded);
  const { selection, adhocNaics } = picked;
  const setSelection = (next: TreeSelection) => setPicked((p) => ({ ...p, selection: next }));

  // Background-warm NAICS descriptions for her profile's codes first, then
  // every catalog code, like Hunter's WarmStartWizard — bumps `descVersion` as
  // batches land so the memoized tree re-resolves labels pending on mount.
  const [descVersion, setDescVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const allCodes = [...new Set([...(profile?.codes ?? []), ...Object.values(WORK_TYPE_TO_NAICS).flat()])];
    (async () => {
      for (let i = 0; i < allCodes.length; i += 100) {
        if (cancelled) return;
        await ensureNaicsDescriptions(allCodes.slice(i, i + 100));
        if (!cancelled) setDescVersion((v) => v + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);
  const tradeTree = useMemo(() => buildTradeTree(describeNaicsFromCache), [descVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const { categories, naics } = tradeAnswer(picked);
  // On the record a trade is not required: her codes can stand with no trade,
  // and `tradeSaveBlock` says why a save is off. On `/intake` a trade is
  // required, as before.
  const block = profile === null ? null : tradeSaveBlock(picked, opened, profile);
  const saveOff = profile === null ? categories.length === 0 : block !== null;
  const onProfile = new Set(profile?.codes ?? []);
  useDraft(
    onDraft,
    categories.length > 0 && !sameAnswer({ categories, naics }, { categories: init?.categories ?? [], naics: init?.naics ?? [] })
      ? { categories, naics }
      : undefined,
  );

  // "Search all NAICS codes" escape hatch (Hunter's B4).
  const [showAdhocSearch, setShowAdhocSearch] = useState(false);
  const [adhocQuery, setAdhocQuery] = useState("");
  const [adhocResults, setAdhocResults] = useState<NaicsSearchResult[]>([]);
  const [adhocSearching, setAdhocSearching] = useState(false);
  const runAdhocSearch = (q: string) => {
    setAdhocQuery(q);
    if (!q.trim()) {
      setAdhocResults([]);
      return;
    }
    setAdhocSearching(true);
    searchNaics(q)
      .then(setAdhocResults)
      .catch(() => setAdhocResults([]))
      .finally(() => setAdhocSearching(false));
  };
  const toggleAdhoc = (code: string) =>
    setPicked((p) => ({
      ...p,
      adhocNaics: p.adhocNaics.includes(code) ? p.adhocNaics.filter((c) => c !== code) : [...p.adhocNaics, code],
    }));

  // On the record, her codes are a sources table: every code on her profile,
  // then each she excluded, then any she adds in this visit (Shyam, 9 Oct
  // 2026). The ticks are
  // `picked` alone; the rows only read it. The trade tree and the search open
  // from "Add a code". On `/intake` there is no record, so the tree is the picker.
  const sourceRows: SourcesRow[] = profile
    ? [...profileCodeRows(picked, profile, opened), ...addedCodeRows(picked, profile)].map((row) => ({
        row,
        name: describeNaicsFromCache(row.code),
      }))
    : [];
  const [adding, setAdding] = useState(false);
  const showTree = profile === null || adding;
  const saveLabel =
    profile === null || naics.length === 0 ? "Save" : `Save ${naics.length} ${naics.length === 1 ? "code" : "codes"}`;

  return (
    <div>
      {profile !== null && (
        <TradeSourcesTable rows={sourceRows} onToggle={(code) => setPicked((p) => toggleProfileCode(p, code, openedWith))} />
      )}
      {profile !== null && !adding && (
        <p className="mb-naics__add">
          <button type="button" className="wsw-adhoc-toggle" onClick={() => setAdding(true)}>
            Add a code
          </button>
          <span>Search for a code, or choose from a list of trades.</span>
        </p>
      )}
      {showTree && (
        <TreePicker
          groups={tradeTree}
          sectionLabels={TRADE_SECTION_LABELS}
          selection={selection}
          onChange={setSelection}
          searchPlaceholder="Search a trade, industry, or NAICS code…"
          emptyLabel="No trades match"
          childNoun={{ one: "code", many: "codes" }}
        />
      )}

      {showTree && <div className="wsw-adhoc">
        {!showAdhocSearch ? (
          <button type="button" className="wsw-adhoc-toggle" onClick={() => setShowAdhocSearch(true)}>
            Search all NAICS codes
          </button>
        ) : (
          <div className="wsw-adhoc-panel">
            <label className="wsw-adhoc-label" htmlFor="trade-adhoc-input">Other codes</label>
            <input
              id="trade-adhoc-input"
              className="wsw-input"
              placeholder="Search any NAICS code or description…"
              value={adhocQuery}
              onChange={(e) => runAdhocSearch(e.target.value)}
            />
            {adhocSearching && <div className="wsw-adhoc-loading">Searching…</div>}
            <ul className="wsw-results">
              {adhocResults.map((r) => (
                <li key={r.code}>
                  <button
                    type="button"
                    className={`wsw-chip${adhocNaics.includes(r.code) ? " is-on" : ""}`}
                    onClick={() => toggleAdhoc(r.code)}
                  >
                    {r.description} <span className="wsw-code">{r.code}</span>
                  </button>
                </li>
              ))}
            </ul>
            {/* Her profile's own codes are in the sources table, with their sources. */}
            {adhocNaics.some((c) => !onProfile.has(c)) && (
              <div className="wsw-selected">
                {adhocNaics.filter((c) => !onProfile.has(c)).map((c) => (
                  <span key={c} className="wsw-tag" onClick={() => toggleAdhoc(c)}>
                    {describeNaicsFromCache(c) ?? c} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>}

      {profile === null && naics.length > 0 && (
        <p className="gpds-sublabel gpds-mono mt-2">
          Files under NAICS {naics.join(", ")} — information only, nothing is committed.
        </p>
      )}
      {/* An empty picker says nothing: the message is for a table she can see. */}
      {block && (block === "no_code" || sourceRows.length > 0) && (
        <p className="gpds-sublabel mt-2">{TRADE_SAVE_BLOCK_MESSAGE[block]}</p>
      )}
      <button
        className={`${btn} mt-2`}
        disabled={saving || saveOff}
        onClick={() => onSave(tradeSave(picked, opened))}
      >
        {saveLabel}
      </button>
    </div>
  );
}

function ServiceArea({ initial, onSave, saving, onDraft }: { initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const init = (initial ?? null) as { states?: string[]; cities?: string[]; rung?: string } | null;
  const initStates = useMemo(() => (Array.isArray(init?.states) ? init.states : []), []); // eslint-disable-line react-hooks/exhaustive-deps
  const initCities = useMemo(() => (Array.isArray(init?.cities) ? init.cities : []), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [selection, setSelection] = useState<TreeSelection>(() => selectionFromStates(initStates));
  // Free-text chips: stored city strings that couldn't be matched onto a
  // stored state's Hunter city list (or the whole attribution fetch failed).
  // Tree-matched cities live in `selection` instead and are merged in at
  // save/derive time via mergeCities, same as Hunter's states+cities union.
  const [freeTextCities, setFreeTextCities] = useState<string[]>(initCities);
  const [initialLoadedChildren, setInitialLoadedChildren] = useState<Record<string, TreeChild[]>>({});
  const [rung, setRung] = useState<string | null>(init?.rung ?? null);

  // Attribute legacy free-text cities onto the states tree once on mount.
  // Fetches each stored state's Hunter city list in parallel (reusing the
  // same cache as the tree's lazy loader), matches case-insensitively, and
  // promotes matches to tree-selected children. Degrades to "all cities stay
  // as chips" on any fetch failure — never loses a stored string.
  useEffect(() => {
    if (initStates.length === 0 || initCities.length === 0) return;
    let cancelled = false;
    Promise.all(initStates.map((s) => loadCityChildren(s)))
      .then((lists) => {
        if (cancelled) return;
        const citiesByState = Object.fromEntries(initStates.map((s, i) => [s, lists[i]]));
        const { selection: attributed, loadedByState, unmatched } = attributeLegacyCities(
          initStates,
          initCities,
          citiesByState,
        );
        setSelection(attributed);
        setInitialLoadedChildren(loadedByState);
        setFreeTextCities(unmatched);
      })
      .catch(() => {
        // Fall back to current behavior — leave freeTextCities as the raw
        // stored list (already the initial state) and the tree unattributed.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const states = statesFromSelection(selection);
  const cities = mergeCities(selection, freeTextCities);
  useDraft(
    onDraft,
    (states.length > 0 || cities.length > 0) && rung
      && !sameAnswer({ states, cities, rung }, { states: init?.states ?? [], cities: init?.cities ?? [], rung: init?.rung ?? null })
      ? { states, cities, rung }
      : undefined,
  );
  return (
    <div className="space-y-3">
      <div>
        <p className="gpds-sublabel">States you cover</p>
        <TreePicker
          groups={STATE_TREE}
          selection={selection}
          onChange={setSelection}
          loadChildren={loadCityChildren}
          initialLoadedChildren={initialLoadedChildren}
          searchPlaceholder="Search a state or city…"
          emptyLabel="No matching places"
          childNoun={{ one: "city", many: "cities" }}
        />
      </div>
      {freeTextCities.length > 0 && (
        <div>
          <p className="gpds-sublabel">
            Other cities on file
            <span className="gpds-pick__hint">
              To add a city, pick it from the states list above.
            </span>
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {freeTextCities.map((c, i) => (
              <span key={i} className="gpds-chip">
                {c}
                <button onClick={() => setFreeTextCities((cur) => cur.filter((x) => x.toLowerCase() !== c.toLowerCase()))} className="gpds-chip__x" aria-label={`Remove ${c}`}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="gpds-sublabel">How far you travel</p>
        <div className="gpds-picks">
          {TRAVEL_RUNGS.map((o) => (
            <label key={o.value} className="gpds-pick">
              <input type="radio" checked={rung === o.value} onChange={() => setRung(o.value)} />
              <span className="gpds-pick__text">
                <span className="gpds-pick__label">{o.label}</span>
                {o.hint ? <span className="gpds-pick__hint">{o.hint}</span> : null}
              </span>
            </label>
          ))}
        </div>
      </div>
      <button className={btn} disabled={saving || (states.length === 0 && cities.length === 0) || !rung} onClick={() => onSave({ states, cities, rung })}>Save</button>
    </div>
  );
}

function LongText({ field, initial, onSave, saving, onDraft }: { field: RegistryField; initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const seed = typeof initial === "string" ? initial : "";
  const [v, setV] = useState(seed);
  useDraft(onDraft, v.trim() && !sameAnswer(v.trim(), seed) ? v.trim() : undefined);
  return (
    <div className="space-y-2">
      <textarea className={`${input} resize-y`} rows={4} value={v} onChange={(e) => setV(e.target.value)} />
      {(field.examples ?? []).length > 0 && !v && (
        <div className="flex flex-wrap gap-1.5">
          {field.examples!.map((ex, i) => (
            <button key={i} onClick={() => setV(ex)} className="gpds-chip gpds-chip--action">
              {ex}
            </button>
          ))}
        </div>
      )}
      <button className={btn} disabled={saving || !v.trim()} onClick={() => onSave(v.trim())}>Save</button>
    </div>
  );
}

function ProjectControl({ initial, onSave, saving, onDraft }: { initial: unknown; onSave: (v: unknown) => void; saving: boolean; onDraft?: DraftFn }) {
  const init = (initial ?? null) as { customer?: string; work?: string; worth?: string; result?: string } | null;
  const [customer, setCustomer] = useState(init?.customer ?? "");
  const [work, setWork] = useState(init?.work ?? "");
  const [worth, setWorth] = useState(init?.worth ?? "");
  const [result, setResult] = useState(init?.result ?? "");
  const pending = { customer, work, worth, result };
  useDraft(
    onDraft,
    customer.trim() && work.trim()
      && !sameAnswer(pending, { customer: init?.customer ?? "", work: init?.work ?? "", worth: init?.worth ?? "", result: init?.result ?? "" })
      ? pending
      : undefined,
  );
  return (
    <div className="space-y-2">
      <input className={input} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Who it was for" />
      <input className={input} value={work} onChange={(e) => setWork(e.target.value)} placeholder="What you did" />
      <input className={input} value={worth} onChange={(e) => setWorth(e.target.value)} placeholder="Roughly what it was worth" />
      <input className={input} value={result} onChange={(e) => setResult(e.target.value)} placeholder="How it went" />
      <button className={btn} disabled={saving || !customer.trim() || !work.trim()} onClick={() => onSave({ customer, work, worth, result })}>Save</button>
    </div>
  );
}
