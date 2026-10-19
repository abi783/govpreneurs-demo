/**
 * One value, one string, one definition. Pure.
 *
 * Replaces two copies that disagreed — `displayValue()` in `FieldRow.tsx` and
 * an older copy in the mentor drawer — so the member and her mentor read the
 * same sentence about the same fact.
 *
 * `storageFor(fieldKey)` picks the path. The mb path dispatches on the VALUE,
 * never on the row's `mbType`: `can_get_bonding` lives on the
 * `bonding_capacity` row, whose type is `text` while the question is a choice.
 * Both dispatch tables are exhaustive by type, so a new kind is a compile
 * error rather than a silent em dash.
 *
 * Copy rules, which are why this cannot be `JSON.stringify`: a date is never
 * written `4/15/27`; an acronym never stands alone; a slug never reaches the
 * member; an empty value renders as an em dash, never "null" and never in red.
 *
 * Takes the RAW stored value, not an `MbValue`, because the mentor drawer
 * reads `ProfileField` rows directly.
 *
 * NO CLOCK, BY DESIGN. An expiry is stated ("expires 15 April 2027"), never
 * judged — `expiringPapers(value, now)` answers the today question.
 */

import { TRADES, TRAVEL_RUNGS, fieldDef, type ControlKind, type RegistryField } from "./registry";
import { storageFor, toMb, WIDENED_KEYS } from "./legacyShapes";
import { isUnknownValue, unknown as unknownValue } from "./mbValue";
import {
  fullDate,
  oneLineAddress,
  usd,
  type Address,
  type Code,
  type JobEntry,
  type MbValue,
  type Paper,
} from "./mbValue";

/** One answer inside a value that a single line cannot carry. */
export interface DisplayPart {
  /** Sentence-case label, or null when the piece stands on its own. */
  label: string | null;
  text: string;
}

/** A stored value, rendered. `text` is what a member or a mentor reads. */
export interface FieldDisplay {
  text: string;
  /**
   * True when there is nothing to show — `text` is then the em dash.
   *
   * NOT the same question as `mbValue.ts`'s `isEmpty`, and the difference is
   * deliberate. `isEmpty({kind:"none"})` is true, because "asked, and there is
   * nothing" still needs no further answer. Here it is FALSE: she answered, and
   * a mentor reading "None" learns something a blank row would have hidden.
   */
  empty: boolean;
  parts: DisplayPart[];
}

const EM_DASH = "—";
const LIST_SEPARATOR = ", ";
/** Between the pieces of one thing: the parts of an area, of a job, of a paper. */
const DETAIL_SEPARATOR = " · ";
const PROJECT_SEPARATOR = " — ";
/** Between two whole jobs or papers — each already holds a "·", so a comma
 *  would read as one long sentence. */
const ITEM_SEPARATOR = "; ";
const EMPTY: FieldDisplay = { text: EM_DASH, empty: true, parts: [] };

/** She engaged with the question and told us the truth. Both are answers, and
 *  neither is a gap — see `FieldDisplay.empty`. */
const NOT_SURE = "Not sure";
const NOTHING = "None";

const ISO_DATE = /^(\d{4}-\d{2}-\d{2})(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/** The four answers behind a project, in the order she was asked for them
 *  (`ProjectControl`, components/business/controls.tsx). */
const PROJECT_PARTS: Array<{ key: string; label: string }> = [
  { key: "customer", label: "Who it was for" },
  { key: "work", label: "What you did" },
  { key: "worth", label: "Roughly what it was worth" },
  { key: "result", label: "How it went" },
];

/* ── small readers over whatever is actually on disk ──────────────────── */

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

/** A scalar as she would read it. Anything else is "" — never raw JSON. */
function plain(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

/**
 * "2027-04-15" → "15 April 2027", inside free text she typed.
 *
 * This is the DETECTOR, not a second formatter: the writing-out is `fullDate`
 * in `mbValue.ts`, which is UTC-pinned so a date-only ISO cannot slip back a
 * day west of Greenwich. What is needed here and not there is the decision of
 * whether a free-text answer is a date at all — a legacy `text` row holds
 * whatever she typed, and "2027-13-45" must survive unchanged rather than be
 * rolled into a month she never wrote.
 */
function writeDateInFull(text: string): string {
  const match = ISO_DATE.exec(text);
  if (!match) return text;
  const day = new Date(`${match[1]}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return text;
  if (day.toISOString().slice(0, match[1].length) !== match[1]) return text;
  return fullDate(match[1]);
}

/** The wording she read on the option, or nothing if the slug is not ours. */
function labelOf(def: RegistryField | undefined, value: string): string {
  return def?.options?.find((o) => o.value === value)?.label ?? "";
}

/** Registry-labelled where we can, her own words where we cannot. */
function optionText(def: RegistryField | undefined, value: string): string {
  return labelOf(def, value) || value;
}

/* ── assembling a display ─────────────────────────────────────────────── */

function joinParts(parts: DisplayPart[], separator: string): FieldDisplay {
  const kept = parts.filter((p) => p.text !== "");
  if (kept.length === 0) return EMPTY;
  return { text: kept.map((p) => p.text).join(separator), empty: false, parts: kept };
}

function single(text: string): FieldDisplay {
  return joinParts([{ label: null, text }], LIST_SEPARATOR);
}

function listOf(texts: string[]): FieldDisplay {
  return joinParts(texts.map((text) => ({ label: null, text })), LIST_SEPARATOR);
}

/* ── one renderer per control kind ────────────────────────────────────── */

type Renderer = (value: unknown, def: RegistryField | undefined) => FieldDisplay;

const describeText: Renderer = (value) => single(writeDateInFull(plain(value)));

const describeChoice: Renderer = (value, def) => single(optionText(def, plain(value)));

const describeChoices: Renderer = (value, def) =>
  listOf(asStrings(value).map((v) => optionText(def, v)));

const describeList: Renderer = (value) => listOf(asStrings(value));

/** `{ has, url }` — "No, not yet" and "Not sure" are real answers, and the
 *  wording comes from the registry so it cannot drift from the question. */
const describeWebsite: Renderer = (value, def) => {
  const stored = asRecord(value);
  const has = plain(stored.has);
  if (has === "yes") return single(plain(stored.url));
  return single(labelOf(def, has) || labelOf(def, "unsure"));
};

/**
 * GAP 2, THE OTHER HALF. A learned fact can arrive with codes and no trade
 * behind them, because the reverse `WORK_TYPE_TO_NAICS` lookup is many-to-many.
 * F11 resolves each code's description when the proposal is CREATED and stores
 * it on the value as `naicsLabels`, so this reads it and never fetches — that
 * is the whole reason the lookup happens at creation time.
 *
 * A code with no description is DROPPED, never rendered bare: six digits mean
 * nothing to a first-time federal contractor, and she cannot confirm what she
 * cannot read. All of them dropped is an em dash, which is the honest answer.
 */
function naicsLines(stored: Record<string, unknown>): string[] {
  const labels = asRecord(stored.naicsLabels);
  return asStrings(stored.naics)
    .map((code) => ({ code, label: plain(labels[code]) }))
    .filter((c) => c.label !== "")
    .map((c) => `${c.code}${DETAIL_SEPARATOR}${c.label}`);
}

/** `{ categories, naics, naicsLabels? }` — the trade, in words. Her own
 *  categories are the answer whenever she has them; the codes are the fallback
 *  for a fact she has not been asked about yet. */
const describeTrade: Renderer = (value) => {
  const stored = asRecord(value);
  const categories = asStrings(stored.categories);
  if (categories.length > 0) {
    return listOf(
      categories.map((c) => TRADES.find((t) => t.value === c)?.label ?? c.replace(/_/g, " ")),
    );
  }
  // Each line already holds a "·", so they are separated like whole things.
  return linesOf(naicsLines(stored));
};

/** `{ states, cities, rung }` — the member page's cities-then-states line,
 *  plus how far she travels. The rung is carried because `national`
 *  legitimately has no states at all (the warm-start receiver writes exactly
 *  that shape), and without it such a record reads as blank. Its slug never
 *  shows: an unknown rung is dropped. */
const describeArea: Renderer = (value) => {
  const stored = asRecord(value);
  const rung = plain(stored.rung);
  return joinParts(
    [
      { label: "Cities", text: asStrings(stored.cities).join(LIST_SEPARATOR) },
      // Success Center's own control stores cities, so this is empty on every
      // legacy row. It is rendered anyway because `Area` carries it across the
      // repo boundary, and a silently dropped answer is the bug F2 exists for.
      { label: "Counties", text: asStrings(stored.counties).join(LIST_SEPARATOR) },
      { label: "States", text: asStrings(stored.states).join(LIST_SEPARATOR) },
      {
        label: "How far you travel",
        text: TRAVEL_RUNGS.find((r) => r.value === rung)?.label ?? "",
      },
    ],
    DETAIL_SEPARATOR,
  );
};

/** `{ customer, work, worth, result }` — the line is who it was for and what
 *  she did; the worth and the outcome ride along in `parts`. */
const describeProject: Renderer = (value) => {
  const stored = asRecord(value);
  const parts = PROJECT_PARTS.map(({ key, label }) => ({ label, text: plain(stored[key]) })).filter(
    (p) => p.text !== "",
  );
  if (parts.length === 0) return EMPTY;
  const line = [plain(stored.customer), plain(stored.work)].filter(Boolean).join(PROJECT_SEPARATOR);
  return { text: line || parts[0].text, empty: false, parts };
};

/** A document's own name — never its storage key or its URL. */
function fileName(value: unknown): string {
  const stored = asRecord(value);
  return plain(value) || plain(stored.filename) || plain(stored.name);
}

const describeFile: Renderer = (value) =>
  Array.isArray(value) ? listOf(value.map(fileName)) : single(fileName(value));

const RENDERERS = {
  text: describeText,
  "long-text": describeText,
  radio: describeChoice,
  checkbox: describeChoices,
  "three-things": describeList,
  website: describeWebsite,
  "work-tree": describeTrade,
  "service-area": describeArea,
  project: describeProject,
  upload: describeFile,
  // The registry's home-address row stores the same parts the catalog's
  // `address` kind does, so it reads back through the one definition of what
  // an address looks like on a line.
  "home-address": (value) =>
    value && typeof value === "object"
      ? single(oneLineAddress(value as Address))
      : single(""),
} satisfies Record<ControlKind, Renderer>;

/* ── one renderer per MbValue kind — the 39 keys the catalog added ────── */

/** Per-kind, so each renderer sees its own narrowed value. A missing kind is a
 *  compile error, which is what stops a new kind shipping as an em dash. */
type MbRenderers = {
  [K in MbValue["kind"]]: (value: Extract<MbValue, { kind: K }>) => FieldDisplay;
};

/** A code never stands as a bare number. The label carries it where she has
 *  one; where she does not, the system at least says what the number is. */
function codeLine(code: Code): string {
  const numbered = `${code.system} ${code.code}`;
  return code.label ? `${code.label} (${numbered})` : numbered;
}

/** Her own words for the worth, always preferred: `valueUSD` cannot hold
 *  "about 25k", and rewriting it as a number puts a figure on the record she
 *  never said. */
function jobWorth(job: JobEntry): string {
  if (job.valueText) return job.valueText;
  return job.valueUSD === undefined ? "" : usd(job.valueUSD);
}

function jobPeriod(job: JobEntry): string {
  if (job.startedAt) {
    return `${fullDate(job.startedAt)} to ${job.endedAt ? fullDate(job.endedAt) : "now"}`;
  }
  return job.endedAt ? fullDate(job.endedAt) : "";
}

function jobLine(job: JobEntry): string {
  const what = [job.customer, job.scope].filter(Boolean).join(PROJECT_SEPARATOR);
  return [what, jobWorth(job), jobPeriod(job)].filter(Boolean).join(DETAIL_SEPARATOR);
}

/** Hazard 6: a legacy free-text row lifts to a paper with NO `expiresAt`, so a
 *  paper without one must say nothing whatever about a date — anything else
 *  invents a renewal she never has to make. */
function paperLine(paper: Paper): string {
  const expiry = paper.expiresAt ? `expires ${fullDate(paper.expiresAt)}` : "";
  return [paper.name, paper.issuer ?? "", expiry].filter(Boolean).join(DETAIL_SEPARATOR);
}

/** Whole things — jobs, papers — each of which already holds its own "·". */
function linesOf(lines: string[]): FieldDisplay {
  return joinParts(lines.map((text) => ({ label: null, text })), ITEM_SEPARATOR);
}

const MB_RENDERERS: MbRenderers = {
  text: (v) => single(writeDateInFull(v.text)),
  list: (v) => listOf(v.items.map((i) => i.text)),
  codes: (v) => listOf(v.codes.map(codeLine)),
  file: (v) => single(v.file.name),
  money: (v) => single(usd(v.amountUSD)),
  range: (v) => single(`${usd(v.lowUSD)} to ${usd(v.highUSD)}`),
  // The unit is never implicit — "30" is meaningless without "days".
  count: (v) => single(`${v.n.toLocaleString("en-US")} ${v.unit}`),
  date: (v) => single(fullDate(v.iso)),
  // The SAME area renderer the legacy path uses, which is what makes a lifted
  // service area and a stored one read identically.
  area: (v) => describeArea(v.area, undefined),
  address: (v) => single(oneLineAddress(v.address)),
  choice: (v) => single(v.label || v.value),
  choices: (v) => listOf(v.options.map((o) => o.label || o.value)),
  entries: (v) => linesOf(v.entries.map(jobLine)),
  papers: (v) => linesOf(v.papers.map(paperLine)),
  unknown: () => single(NOT_SURE),
  none: () => single(NOTHING),
};

function describeMbValue(value: MbValue): FieldDisplay {
  const render = MB_RENDERERS[value.kind] as (v: MbValue) => FieldDisplay;
  return render(value);
}

/** An `mb` key holds a parsed `MbValue`. Anything else on that key is a row we
 *  cannot read — it takes the safe path rather than throwing. */
function asMbValue(value: unknown): MbValue | undefined {
  const stored = asRecord(value);
  return typeof stored.kind === "string" && stored.kind in MB_RENDERERS
    ? (value as MbValue)
    : undefined;
}

/** A key with no registry home. It must not throw, and it must not leak a
 *  shape the member never wrote — so anything unreadable renders as nothing. */
function describeUnknownField(value: unknown): FieldDisplay {
  if (Array.isArray(value)) return listOf(value.map((v) => plain(v) || fileName(v)));
  return single(writeDateInFull(fileName(value)));
}

/**
 * A stored `ProfileField.value`, rendered as the member reads it, with the
 * pieces kept apart for rows one line cannot carry.
 *
 * `storageFor` picks the path: a legacy key by its control kind, everything
 * else by the value's own `MbValue` kind. An unknown key is therefore not a
 * special case — it simply has no legacy shape to read, and falls through.
 *
 * TAKES A `ProfileField.fieldKey`, NEVER A CATALOG ID. Several catalog ids are
 * spelled the same as a legacy key (`constraints`, `website`, `owners`) and
 * resolve down the wrong path, silently. Translate with `fieldKeyFor(id)`.
 */
export function describeFieldValue(fieldKey: string, value: unknown): FieldDisplay {
  if (value === null || value === undefined) return EMPTY;
  /* "Not sure" READS AS "Not sure" ON EVERY KEY. A legacy key goes to its
     registry renderer below, and that renderer only knows its own shape — so it
     answered EMPTY, and an answer she had given came back as an em dash, which
     is what the record prints for a question nobody has asked. The two are
     different facts and this is the line that kept them apart. */
  if (isUnknownValue(value)) return describeMbValue(unknownValue);
  const def = storageFor(fieldKey) === "legacy" ? fieldDef(fieldKey) : undefined;
  // A widened key can be holding either shape, and the registry renderer only
  // knows the old one — it answered EMPTY for an address in parts and for a
  // certification stored as a document, so a row she had just filled in read as
  // a dash. `toMb` is the one thing that reads both, so it decides here too.
  if (def && WIDENED_KEYS.has(fieldKey)) return describeMbValue(toMb(fieldKey, value));
  if (def) return RENDERERS[def.control](value, def);
  const mb = asMbValue(value);
  return mb ? describeMbValue(mb) : describeUnknownField(value);
}

/** A stored `ProfileField.value` on one line. The em dash when there is none. */
export function formatFieldValue(fieldKey: string, value: unknown): string {
  return describeFieldValue(fieldKey, value).text;
}
