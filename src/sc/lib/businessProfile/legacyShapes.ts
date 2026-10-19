/**
 * The read-time view over the stored JSON. Pure.
 *
 * LEGACY JSON SHAPES ARE NEVER REWRITTEN IN BULK. `WRITE_BACK`, `deriveCerts`,
 * the DSBS validator and `formatFieldValue` read the shapes on disk today; a
 * migration that "tidied" `socioeconomic_certifications` from `string[]` slugs
 * into `Paper[]` would silently empty every member's set-aside eligibility.
 * So `MbValue` is a view, not a storage format, and two storages coexist:
 * `legacy` keys keep their original shape forever (`toMb` lifts, `fromMb`
 * lowers), `mb` keys store a parsed `MbValue`. `storageFor` is derived from
 * `FROZEN_KEYS`, never authored.
 *
 * `ADAPTERS` is keyed by fieldKey and NEVER by `mbType`: `can_get_bonding`
 * shares the `bonding_capacity` row, whose type is `text` while the question
 * is a choice, so anything switching on the type mis-handles one of the two.
 *
 * Four keys — `company_address`, `socioeconomic_certifications`,
 * `insurance_coverage`, `licenses` — accept two shapes and lower to the
 * richer one. Nothing is migrated; a row changes shape only when she edits it.
 * A row still on its old shape lifts with NO `expiresAt`, so a legacy row
 * never fires a renewal she does not owe.
 *
 * A malformed value lifts to `{ kind: "unknown" }` rather than throwing — one
 * bad row must not stop her record loading — and lowering `unknown` clears the
 * key, so it is rewritten only when she edits that row herself.
 *
 * Hazard resolutions and the per-key round-trip tests are in GOAL.md and
 * `legacyShapes.test.ts`.
 */

import {
  isUnknownValue,
  usd,
  type Address,
  type Area,
  type Code,
  type JobEntry,
  type MbValue,
  type Paper,
  type PaperKind,
  type StoredFile,
} from "./mbValue";
import { FROZEN_KEYS } from "./crosswalk";
import { TRADES, fieldDef, type RegistryOption } from "./registry";
import { naicsCodeList } from "@sc/lib/naics/naicsBySource";

export type Storage = "legacy" | "mb";

/**
 * The four legacy keys that hold EITHER their original shape or a richer one.
 *
 * THE ONE LIST. `rowEditor` reads it to open the richer control, and
 * `formatValue` reads it to render whichever shape is actually on the row —
 * a second copy is how a row starts saving in one shape and displaying as
 * nothing, which is precisely what happened when this list lived in one file.
 */
export const WIDENED_KEYS: ReadonlySet<string> = new Set([
  "company_address",
  "socioeconomic_certifications",
  "insurance_coverage",
  "licenses",
]);

/** DEMO: keys that are stored as an `MbValue` although they are in `FROZEN_KEYS`. */
const DEMO_MB_KEYS: ReadonlySet<string> = new Set(["past_performance"]);

/**
 * DERIVED, NOT AUTHORED. A key that exists on disk today is `legacy` forever;
 * everything the catalog adds is `mb`.
 */
export function storageFor(fieldKey: string): Storage {
  // DEMO: `past_performance` keeps whole jobs (`JobEntry`: customer type, dates, place,
  // reference), not the three four-line projects the old shape holds. The old shape
  // cannot keep four jobs, and it labels every job "Private". This key therefore uses
  // the `mb` storage, the same as "Work you did not win".
  if (DEMO_MB_KEYS.has(fieldKey)) return "mb";
  return FROZEN_KEYS.includes(fieldKey) ? "legacy" : "mb";
}

/**
 * Some legacy rows are assembled from more than one key: `past_performance`
 * concatenates `past_performance{,_2,_3}` into one `entries[]`. The reader
 * passes a lookup so `toMb` can reach its siblings without importing Prisma.
 */
export type SiblingLookup = (fieldKey: string) => unknown;

/* ── the two first-class empties, and the constants ───────────────────── */

const NONE: MbValue = { kind: "none" };
const UNKNOWN: MbValue = { kind: "unknown" };

/** The three project keys, in the order a record reads them. */
const PAST_PERFORMANCE_KEYS = ["past_performance", "past_performance_2", "past_performance_3"];

/** `JobEntry` requires a customer type and a role; the legacy project shape
 *  stores neither. These are the neutral defaults the TYPE forces. They are
 *  dropped again by `fromMb`, so nothing invented here ever reaches disk. */
const LEGACY_CUSTOMER_TYPE: JobEntry["customerType"] = "private";
const LEGACY_ROLE: JobEntry["role"] = "prime";

/** Free text lifted into a list or a paper set is ONE item; these separators
 *  only ever matter if a later editor adds a second. */
const LIST_JOIN = ", ";

const CERTIFICATION: PaperKind = "certification";
const NAICS: Code["system"] = "NAICS";

/** A catalog row with no NAICS code of its own is carried as a code entry with
 *  an empty `code` — that is how `{ categories, naics }` stays two lists. */
const NO_CODE = "";

const YEAR = /^\d{4}$/;
const YEAR_START = "-01-01";
const YEAR_LENGTH = 4;

/** `$40,000`, `40000`, `$40,000.50` — the forms a member types into the
 *  "roughly what it was worth" box that a number can hold without guessing. */
const MONEY_TEXT = /^\$?(\d{1,3}(,\d{3})+|\d+)(\.\d{1,2})?$/;

const WEBSITE_YES = "yes";
const WEBSITE_NO = "no";
const WEBSITE_UNSURE = "unsure";

/* ── small readers over whatever is actually on disk ──────────────────── */

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Fail-closed: one non-string member makes the whole array unreadable rather
 *  than half-read. A silently shortened list is a lost answer. */
function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((v) => typeof v === "string") ? (value as string[]) : null;
}

/** Missing arrays read as empty — an older row that predates a member of the
 *  shape still reads, and gains the empty list on its next save. */
function stringsOrEmpty(value: unknown): string[] | null {
  return value === undefined ? [] : asStringArray(value);
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A row that is not there reads as `none`; a row we cannot read reads as
 *  `unknown`. The two are different facts and get different kinds. */
function absentOrUnreadable(stored: unknown): MbValue {
  return stored === null || stored === undefined ? NONE : UNKNOWN;
}

/** The wording she read on the option, inherited from the registry and never
 *  restated here. An unknown slug keeps its own text rather than vanishing. */
export function optionsOf(fieldKey: string): RegistryOption[] {
  return fieldDef(fieldKey)?.options ?? [];
}

function optionLabel(fieldKey: string, value: string): string {
  return optionsOf(fieldKey).find((o) => o.value === value)?.label ?? value;
}

function tradeLabel(categoryId: string): string {
  return TRADES.find((t) => t.value === categoryId)?.label ?? categoryId;
}

function tradeId(label: string): string {
  return TRADES.find((t) => t.label === label)?.value ?? label;
}

/** `$40,000` → 40000. Anything a number cannot hold exactly stays unparsed. */
function moneyFrom(worth: string): number | undefined {
  const trimmed = worth.trim();
  if (!MONEY_TEXT.test(trimmed)) return undefined;
  const amount = Number(trimmed.replace(/[$,]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount) : undefined;
}

/* ── the adapter shape ────────────────────────────────────────────────── */

interface LegacyAdapter {
  /** Stored shape → the record's view of it. */
  up: (stored: unknown, sibling?: SiblingLookup) => MbValue;
  /** The record's view → the shape(s) on disk, one entry per key written. */
  down: (value: MbValue) => Record<string, unknown>;
}

/* ── the generic families ─────────────────────────────────────────────── */

/** A short or long answer she typed. The empty string is a value, not an
 *  absence, so it survives the round trip untouched. */
function textAdapter(key: string, long = false): LegacyAdapter {
  return {
    up: (stored) =>
      typeof stored === "string" ? { kind: "text", text: stored, long } : absentOrUnreadable(stored),
    down: (value) => ({ [key]: value.kind === "text" ? value.text : null }),
  };
}

/**
 * An address, which is on disk as EITHER a plain string or the parts.
 *
 * This is the one adapter that widens what it stores rather than only
 * translating it, and the reason is that the parts are not recoverable from the
 * string. Splitting "418 Glenwood Avenue, Raleigh, NC 27603" on commas gets the
 * right answer often enough to be dangerous and wrong often enough to matter —
 * a suite number, a comma-less address, or "Washington, DC" as a city all break
 * it — and a wrongly-split address is worse than an unsplit one, because it
 * looks filled in. So a stored string lifts WHOLE into `line1`, unparsed, and
 * she moves the parts herself the next time she opens the row.
 *
 * Both shapes stay readable for good: `/intake` still writes the string through
 * its own registry text box (`registry.ts` is frozen), and a row she has never
 * re-opened keeps the string it has always had. Nothing is migrated.
 */
function addressAdapter(key: string): LegacyAdapter {
  return {
    up: (stored) => {
      if (typeof stored === "string") {
        return stored.trim()
          ? { kind: "address", address: { line1: stored.trim() } }
          : absentOrUnreadable(null);
      }
      if (stored && typeof stored === "object") {
        const o = stored as Record<string, unknown>;
        const line1 = asText(o.line1);
        if (!line1) return absentOrUnreadable(stored);
        const address: Address = { line1 };
        const line2 = asText(o.line2);
        if (line2) address.line2 = line2;
        const city = asText(o.city);
        if (city) address.city = city;
        const state = asText(o.state);
        if (state) address.state = state.toUpperCase();
        const postalCode = asText(o.postalCode);
        if (postalCode) address.postalCode = postalCode;
        return { kind: "address", address };
      }
      return absentOrUnreadable(stored);
    },
    // Down writes the PARTS. A row saved from the record therefore stops being a
    // string — which is safe because everything that reads this key raw goes
    // through `WRITE_BACK`, and that reads both.
    down: (value) => ({ [key]: value.kind === "address" ? value.address : null }),
  };
}

/** One option slug, with the wording she read resolved from the registry. */
function choiceAdapter(key: string): LegacyAdapter {
  return {
    up: (stored) =>
      typeof stored === "string" && stored !== ""
        ? { kind: "choice", value: stored, label: optionLabel(key, stored) }
        : absentOrUnreadable(stored === "" ? null : stored),
    down: (value) => ({ [key]: value.kind === "choice" ? value.value : null }),
  };
}

/** Several option slugs. */
function choicesAdapter(key: string): LegacyAdapter {
  return {
    up: (stored) => {
      const slugs = asStringArray(stored);
      if (!slugs) return absentOrUnreadable(stored);
      return {
        kind: "choices",
        options: slugs.map((value) => ({ value, label: optionLabel(key, value) })),
      };
    },
    down: (value) => ({ [key]: value.kind === "choices" ? value.options.map((o) => o.value) : null }),
  };
}

/** Her own list, stored as a bare `string[]`. `servicesFrom()` reads exactly
 *  what `down` writes, which is why it keeps working (hazard 10). */
function stringListAdapter(key: string): LegacyAdapter {
  return {
    up: (stored) => {
      const items = asStringArray(stored);
      if (!items) return absentOrUnreadable(stored);
      return { kind: "list", items: items.map((text, i) => ({ id: `i${i}`, text })) };
    },
    down: (value) => ({ [key]: value.kind === "list" ? value.items.map((i) => i.text) : null }),
  };
}

/** A free-text row the catalog reads as a list — one line in, one item out. */
function textAsListAdapter(key: string): LegacyAdapter {
  return {
    up: (stored) => {
      if (typeof stored !== "string") return absentOrUnreadable(stored);
      return { kind: "list", items: stored === "" ? [] : [{ id: "i0", text: stored }] };
    },
    down: (value) => ({
      [key]: value.kind === "list" ? value.items.map((i) => i.text).join(LIST_JOIN) : null,
    }),
  };
}

/**
 * A document row. No writer creates these `ProfileField` rows today —
 * uploads live on `MemberDocument` — so there is no established stored shape to
 * preserve. The object is therefore carried through VERBATIM in both
 * directions, so whatever a future writer stores survives the round trip.
 */
function fileAdapter(key: string): LegacyAdapter {
  return {
    up: (stored) => {
      const record = asRecord(stored);
      return record ? { kind: "file", file: record as unknown as StoredFile } : absentOrUnreadable(stored);
    },
    down: (value) => ({ [key]: value.kind === "file" ? value.file : null }),
  };
}

/**
 * Papers that were free text on disk, and are documents with expiry dates once
 * she next opens the row. GOAL.md gap 11, closed.
 *
 * The old `down` joined the names into one string, which is why the expiry had
 * nowhere to live: `Paper` has carried `expiresAt` and `file` all along, and
 * every save threw them away. It now stores the papers themselves.
 *
 * BOTH SHAPES STAY READABLE and nothing is migrated. A row she has never
 * re-opened is still the string it always was and still lifts to one paper with
 * NO `expiresAt` — hazard 6's rule survives, because a date nobody gave us must
 * never fire a renewal. The moment she edits, the row starts holding the parts.
 */
function freeTextPapersAdapter(key: string, kind: PaperKind): LegacyAdapter {
  return {
    up: (stored) => {
      if (typeof stored === "string") {
        return {
          kind: "papers",
          papers: stored === "" ? [] : [{ id: `${key}-0`, kind, name: stored }],
        };
      }
      const papers = asPapers(stored, kind);
      return papers ? { kind: "papers", papers } : absentOrUnreadable(stored);
    },
    down: (value) => ({
      [key]: value.kind === "papers" ? value.papers : null,
    }),
  };
}

/**
 * A stored `Paper[]`, read defensively: this is disk data, so every field is
 * checked rather than trusted, and a row that is not a list of papers reads as
 * unreadable instead of being half-accepted.
 */
function asPapers(stored: unknown, kind: PaperKind): Paper[] | null {
  if (!Array.isArray(stored)) return null;
  const papers: Paper[] = [];
  for (const [i, raw] of stored.entries()) {
    const o = asRecord(raw);
    if (!o) return null;
    const name = asText(o.name);
    if (!name) continue; // a paper with no name is not a paper
    const paper: Paper = { id: asText(o.id) || `${kind}-${i}`, kind, name };
    const issuer = asText(o.issuer);
    if (issuer) paper.issuer = issuer;
    const number = asText(o.number);
    if (number) paper.number = number;
    const expiresAt = asText(o.expiresAt);
    if (expiresAt) paper.expiresAt = expiresAt;
    const file = asRecord(o.file);
    if (file) paper.file = file as unknown as StoredFile;
    papers.push(paper);
  }
  return papers;
}

/* ── hazard 1 · socioeconomic_certifications ──────────────────────────── */

const CERTS_KEY = "socioeconomic_certifications";

/** The stored slug for a paper. The lift puts the slug in `id`, so a row she
 *  has not touched comes back byte-identical; a paper added later is matched by
 *  the wording she read. Never guessed, never dropped. */
function certSlugOf(paper: Paper): string {
  const options = optionsOf(CERTS_KEY);
  if (options.some((o) => o.value === paper.id)) return paper.id;
  return options.find((o) => o.label === paper.name)?.value ?? paper.id;
}

/**
 * Certifications: bare slugs on disk, documents with expiry dates once she next
 * opens the row. GOAL.md gap 1, closed.
 *
 * THE CAREFUL PART IS DOWNSTREAM, NOT HERE. `deriveCerts` decides set-aside
 * eligibility, and it reads `SuccessCenter.socioEconomicCerts` — the COLUMN,
 * which the SAM and DSBS validators also write. The only path from this row to
 * that column is `WRITE_BACK.socioeconomic_certifications`, and that reads both
 * shapes and emits the same canonical labels either way. So a member's
 * eligibility cannot move because of a storage change; it moves only if she
 * changes which certifications she holds, which is the point.
 *
 * A slug she has not touched still round-trips to itself, via `certSlugOf`.
 */
const certificationsAdapter: LegacyAdapter = {
  up: (stored) => {
    const slugs = asStringArray(stored);
    if (slugs) {
      // A row still on the slugs carries NO `expiresAt` — an expiry nobody gave
      // us must never put a renewal in front of her.
      return {
        kind: "papers",
        papers: slugs.map((slug) => ({
          id: slug,
          kind: CERTIFICATION,
          name: optionLabel(CERTS_KEY, slug),
        })),
      };
    }
    const papers = asPapers(stored, CERTIFICATION);
    return papers ? { kind: "papers", papers } : absentOrUnreadable(stored);
  },
  // Every paper's `id` is NORMALISED to its slug on the way to disk, rather
  // than trusted from whatever produced it. `WRITE_BACK` reads that id to
  // decide set-aside eligibility, so making it right here — where all three
  // writers meet — is the difference between an invariant and a convention.
  down: (value) => ({
    [CERTS_KEY]:
      value.kind === "papers"
        ? value.papers.map((paper) => ({ ...paper, id: certSlugOf(paper) }))
        : null,
  }),
};

/* ── hazard 3 · past_performance {,_2,_3} ─────────────────────────────── */

/** One stored project → one job. Returns null for a project with nothing in
 *  it, so a blank row is skipped rather than read as an empty job. */
function jobFrom(project: Record<string, unknown>, id: string): JobEntry | null {
  const customer = asText(project.customer);
  const work = asText(project.work);
  const worth = asText(project.worth);
  const result = asText(project.result);
  if (!customer && !work && !worth && !result) return null;

  const job: JobEntry = {
    id,
    customer,
    customerType: LEGACY_CUSTOMER_TYPE,
    scope: work,
    role: LEGACY_ROLE,
  };
  // Her own words first, always. The derived amount is added only when the
  // text yields one — an absent key, never a guessed number.
  if (worth) job.valueText = worth;
  const valueUSD = moneyFrom(worth);
  if (valueUSD !== undefined) job.valueUSD = valueUSD;
  if (result) job.outcome = result;
  return job;
}

/** The amount as she wrote it. Her own text wins; a formatted `valueUSD` is
 *  only for a job entered through an editor that had no text to keep. */
function worthFrom(job: JobEntry): string {
  if (job.valueText !== undefined) return job.valueText;
  return job.valueUSD === undefined ? "" : usd(job.valueUSD);
}

/** One job → the stored project shape, so `formatFieldValue`'s `"customer" in o`
 *  branch and `/intake`'s own writes keep reading the same four keys. */
function projectFrom(job: JobEntry | undefined): Record<string, unknown> | null {
  if (!job) return null;
  return {
    customer: job.customer,
    work: job.scope,
    worth: worthFrom(job),
    result: job.outcome ?? "",
  };
}

const pastPerformanceAdapter: LegacyAdapter = {
  up: (stored, sibling) => {
    const jobs = PAST_PERFORMANCE_KEYS.map((key, i) => {
      const project = asRecord(i === 0 ? stored : sibling?.(key));
      return project ? jobFrom(project, key) : null;
    }).filter((job): job is JobEntry => job !== null);
    return jobs.length === 0 ? absentOrUnreadable(stored) : { kind: "entries", entries: jobs };
  },
  // Mirrors entries 0-2 back to the three keys. Every key is written, so a
  // shortened list clears the trailing rows rather than orphaning them.
  down: (value) => {
    const jobs = value.kind === "entries" ? value.entries : [];
    return Object.fromEntries(PAST_PERFORMANCE_KEYS.map((key, i) => [key, projectFrom(jobs[i])]));
  },
};

/** `/intake` still writes `_2` and `_3` on their own, so each reads on its own. */
function projectAdapter(key: string): LegacyAdapter {
  return {
    up: (stored) => {
      const project = asRecord(stored);
      const job = project ? jobFrom(project, key) : null;
      return job ? { kind: "entries", entries: [job] } : absentOrUnreadable(stored);
    },
    down: (value) => ({
      [key]: projectFrom(value.kind === "entries" ? value.entries[0] : undefined),
    }),
  };
}

/* ── hazard 4 · geographic_coverage ───────────────────────────────────── */

const AREA_KEY = "geographic_coverage";

const areaAdapter: LegacyAdapter = {
  up: (stored) => {
    const record = asRecord(stored);
    if (!record) return absentOrUnreadable(stored);
    const states = stringsOrEmpty(record.states);
    const cities = stringsOrEmpty(record.cities);
    if (!states || !cities) return UNKNOWN;
    // `counties` is the prototype's member and has no home on disk; `rung` is
    // Success Center's and is carried untouched. Converting a rung to
    // `radiusMiles` is BANNED: a travel rung is a named tier, not a distance.
    const area: Area = { states, counties: [], cities };
    if (typeof record.rung === "string") area.rung = record.rung;
    return { kind: "area", area };
  },
  down: (value) => {
    if (value.kind !== "area") return { [AREA_KEY]: null };
    const { states, cities, rung } = value.area;
    return { [AREA_KEY]: rung === undefined ? { states, cities } : { states, cities, rung } };
  },
};

/* ── hazard 5 · primary_industry ──────────────────────────────────────── */

const INDUSTRY_KEY = "primary_industry";
const NAICS_LABELS = "naicsLabels";
const SEARCHED = "searched";

/**
 * The official description F11 resolved for each code when the proposal was
 * CREATED (Gap 2's other half). Only genuinely resolved labels are read: a
 * label is NEVER synthesised from `WORK_TYPE_TO_NAICS`, because that map is
 * many-to-many and guessing is the thing the creation-time lookup exists to
 * avoid. A member's own `categories` and `naics` are her answer; this member is
 * derived, so an unreadable one is repaired rather than allowed to make her
 * answer unreadable.
 */
function resolvedLabels(value: unknown): Record<string, string> {
  const record = asRecord(value);
  if (!record) return {};
  const labels: Record<string, string> = {};
  for (const [code, label] of Object.entries(record)) {
    if (typeof label === "string" && label !== "") labels[code] = label;
  }
  return labels;
}

/**
 * The codes she added through the full NAICS search (`pickedCodes.ts`,
 * Decisions log D152), kept only while they are among her codes. Derived, like
 * the labels: an unreadable record is dropped (the row reads as saved before
 * the record existed) rather than allowed to make her answer unreadable. An
 * empty list is kept, because it says she searched nothing.
 */
function searchedIn(value: unknown, naics: readonly string[]): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const held = new Set(naics);
  return naicsCodeList(value).filter((code) => held.has(code));
}

/** The stored shape, rebuilt from the two kinds of code entry. */
function industryFrom(codes: Code[], searched: string[] | undefined): Record<string, unknown> {
  const named = codes.filter((c) => c.code !== NO_CODE);
  const labels = Object.fromEntries(
    named.filter((c) => c.label !== "").map((c) => [c.code, c.label] as const),
  );
  const naics = named.map((c) => c.code);
  const stored: Record<string, unknown> = {
    categories: codes.filter((c) => c.code === NO_CODE).map((c) => tradeId(c.label)),
    naics,
  };
  // Omitted entirely on a row that never had one — no empty object on disk.
  if (Object.keys(labels).length > 0) stored[NAICS_LABELS] = labels;
  const kept = searchedIn(searched, naics);
  if (kept) stored[SEARCHED] = kept;
  return stored;
}

const industryAdapter: LegacyAdapter = {
  up: (stored) => {
    const record = asRecord(stored);
    if (!record) return absentOrUnreadable(stored);
    const categories = stringsOrEmpty(record.categories);
    const naics = stringsOrEmpty(record.naics);
    if (!categories || !naics) return UNKNOWN;
    // The fused shape is TWO independent lists and `Code[]` is one, so the two
    // are kept apart by `code`: a trade is a code entry with none, a NAICS code
    // is a code entry with one. Nothing is fused, so nothing is lost.
    // `Code.label` carries the trade's own label on a category entry and the
    // resolved NAICS description on a code entry — resolved upstream or blank,
    // never guessed here.
    const labels = resolvedLabels(record[NAICS_LABELS]);
    const codes: Code[] = [
      ...categories.map((id) => ({ system: NAICS, code: NO_CODE, label: tradeLabel(id) })),
      ...naics.map((code) => ({ system: NAICS, code, label: labels[code] ?? "" })),
    ];
    const searched = searchedIn(record[SEARCHED], naics);
    return searched ? { kind: "codes", codes, searched } : { kind: "codes", codes };
  },
  down: (value) =>
    value.kind === "codes"
      ? { [INDUSTRY_KEY]: industryFrom(value.codes, value.searched) }
      : { [INDUSTRY_KEY]: null },
};

/* ── hazard 7 · website ───────────────────────────────────────────────── */

const WEBSITE_KEY = "website";

/** `{ has, url }` ⇄ the three answers, as a bijection: an address is text,
 *  "No, not yet" is `none`, "Not sure" is `unknown`. A row that is not there
 *  reads as "Not sure" — the only honest reading of nothing, and the one that
 *  never claims she said she has no website. */
const websiteAdapter: LegacyAdapter = {
  up: (stored) => {
    const record = asRecord(stored);
    if (!record) return UNKNOWN;
    if (record.has === WEBSITE_YES) return { kind: "text", text: asText(record.url), long: false };
    if (record.has === WEBSITE_NO) return NONE;
    return UNKNOWN;
  },
  down: (value) => {
    if (value.kind === "text") return { [WEBSITE_KEY]: { has: WEBSITE_YES, url: value.text } };
    if (value.kind === "none") return { [WEBSITE_KEY]: { has: WEBSITE_NO } };
    return { [WEBSITE_KEY]: { has: WEBSITE_UNSURE } };
  },
};

/**
 * Whether a `none` on this key is an answer she gave, not an empty row.
 *
 * `none` usually means "nothing stored" (`absentOrUnreadable`). The website
 * adapter is the exception: an absent row reads as `unknown`, so its `none`
 * only ever comes from "No, not yet" — a real answer the score must count.
 */
export function noneIsAnAnswer(fieldKey: string): boolean {
  return fieldKey === WEBSITE_KEY;
}

/* ── hazard 8 · year_started_operating ────────────────────────────────── */

const YEAR_KEY = "year_started_operating";

/** A bare year widens to the first of January so the record has a date kind;
 *  it narrows back to the four digits and NEVER to a different day. */
const yearAdapter: LegacyAdapter = {
  up: (stored) =>
    typeof stored === "string" && YEAR.test(stored)
      ? { kind: "date", iso: `${stored}${YEAR_START}` }
      : absentOrUnreadable(stored === "" ? null : stored),
  down: (value) => ({
    [YEAR_KEY]: value.kind === "date" ? value.iso.slice(0, YEAR_LENGTH) : null,
  }),
};

/* ── the table · keyed by fieldKey, never by the row's mbType ─────────── */

const ADAPTERS: Record<string, LegacyAdapter> = {
  // your legal details
  legal_company_name: textAdapter("legal_company_name"),
  dba_name: textAdapter("dba_name"),
  [YEAR_KEY]: yearAdapter,
  company_address: addressAdapter("company_address"),
  // Born in the new shape rather than lifted out of an old one, but they are
  // registry keys and lower exactly like their siblings above — the table is
  // keyed by fieldKey, and every registry key that owns a catalog row is in it.
  company_email: textAdapter("company_email"),
  company_phone: textAdapter("company_phone"),
  home_address: addressAdapter("home_address"),
  tshirt_size: choiceAdapter("tshirt_size"),
  primary_contact_name: textAdapter("primary_contact_name"),
  phone: textAdapter("phone"),
  email: textAdapter("email"),
  [WEBSITE_KEY]: websiteAdapter,
  sam_registration_status: choiceAdapter("sam_registration_status"),
  [CERTS_KEY]: certificationsAdapter,
  doc_certifications: fileAdapter("doc_certifications"),
  primary_contact_title: textAdapter("primary_contact_title"),

  // what you sell
  primary_services: stringListAdapter("primary_services"),
  business_description: textAdapter("business_description", true),
  [INDUSTRY_KEY]: industryAdapter,
  service_delivery_mode: choiceAdapter("service_delivery_mode"),
  current_customer_types: choicesAdapter("current_customer_types"),
  doc_capability_statement: fileAdapter("doc_capability_statement"),
  has_capability_statement: choiceAdapter("has_capability_statement"),
  service_to_sell_to_government: choiceAdapter("service_to_sell_to_government"),
  sectors_served: choicesAdapter("sectors_served"),
  doc_brochure: fileAdapter("doc_brochure"),
  doc_marketing: fileAdapter("doc_marketing"),

  // what you can take on
  [AREA_KEY]: areaAdapter,
  // Hazard 2: the LIMITS TEXT keeps this key. The "can you get one" choice is
  // `can_get_bonding`, a new key, and therefore `mb` storage — it never passes
  // through here and is never coerced into text.
  bonding_capacity: textAdapter("bonding_capacity"),
  pursuing_as: choiceAdapter("pursuing_as"),
  security_clearances: textAsListAdapter("security_clearances"),
  constraints: choicesAdapter("constraints"),

  // work you have done
  past_performance: pastPerformanceAdapter,
  past_performance_2: projectAdapter("past_performance_2"),
  past_performance_3: projectAdapter("past_performance_3"),
  years_of_experience: choiceAdapter("years_of_experience"),
  has_active_commercial_contracts: choiceAdapter("has_active_commercial_contracts"),
  ninety_day_goal: textAdapter("ninety_day_goal", true),
  best_first_opportunity: textAdapter("best_first_opportunity", true),
  anything_else: textAdapter("anything_else", true),
  doc_past_performance: fileAdapter("doc_past_performance"),

  // your papers
  insurance_coverage: freeTextPapersAdapter("insurance_coverage", "insurance"),
  licenses: freeTextPapersAdapter("licenses", "licence"),
};

/** A legacy key with no adapter is a code defect, not a member's bad row: it
 *  can only happen if `FROZEN_KEYS` gains a key and this table does not. The
 *  suite pins the two together, so this never fires in production. */
function adapterFor(fieldKey: string): LegacyAdapter {
  const adapter = ADAPTERS[fieldKey];
  if (!adapter) throw new Error(`no legacy adapter for "${fieldKey}"`);
  return adapter;
}

/* ── mb storage ───────────────────────────────────────────────────────── */

const MB_KINDS = new Set([
  "text", "list", "codes", "file", "money", "range", "count", "date",
  "area", "choice", "choices", "entries", "papers", "unknown", "none",
]);

/** An `mb` row already holds a parsed `MbValue`; it is carried through, never
 *  re-parsed against the row's `mbType`. Re-parsing is what would break
 *  `can_get_bonding`, whose row is typed `text` for `bonding_capacity`. */
function mbFrom(stored: unknown): MbValue {
  const record = asRecord(stored);
  if (!record || typeof record.kind !== "string" || !MB_KINDS.has(record.kind)) {
    return absentOrUnreadable(stored);
  }
  return record as unknown as MbValue;
}

/* ── the two exported directions ──────────────────────────────────────── */

/**
 * Lift a stored value to the record's view of it.
 *
 * `storage === "mb"` rows pass through; `legacy` rows go through the per-key
 * adapters. An unrecognised or malformed legacy value lifts to
 * `{ kind: "unknown" }` rather than throwing — a member's row must never make
 * her whole record fail to load.
 */
export function toMb(fieldKey: string, stored: unknown, sibling?: SiblingLookup): MbValue {
  /* "Not sure" is stored as this value on any key, so it is returned before an
     adapter tries to read it as that key's shape. `doc_capability_statement`
     accepted the answer and then lifted it to
     `{kind:"file", file:{kind:"unknown"}}` — a row that had saved correctly and
     read back as a broken file. */
  if (isUnknownValue(stored)) return UNKNOWN;
  if (storageFor(fieldKey) === "mb") return mbFrom(stored);
  return adapterFor(fieldKey).up(stored, sibling);
}

/**
 * Lower an edited value back to the shape(s) on disk.
 *
 * RETURNS A MAP OF fieldKey → stored value, not a single value, because two
 * hazards write more than one key: `past_performance` mirrors entries 0–2 back
 * to the three legacy keys, and the bonding row writes `bonding_capacity`
 * (text) and `can_get_bonding` (choice) separately. Never coerce one into the
 * other — they are two different questions that shared one key by accident.
 *
 * The caller upserts each returned key through `upsertProfileField`, unchanged.
 */
export function fromMb(fieldKey: string, value: MbValue): Record<string, unknown> {
  if (storageFor(fieldKey) === "mb") return { [fieldKey]: value };
  return adapterFor(fieldKey).down(value);
}
