/**
 * The 13-kind value union, the two first-class empties, and the ONE parser that
 * turns a wire payload into one of them.
 *
 * Port of the prototype's `value.ts` + `parse-mb-value.ts`. Keep the type
 * declarations byte-comparable with `govpreneures`' copies — divergence is a
 * cross-repo drift bug.
 *
 * ONE KIND, ONE RENDERER, ONE EDITOR. No kind may be rendered by joining
 * strings, and adding a kind means adding both halves.
 *
 * This module imports NOTHING from Success Center — not the registry, catalog,
 * Prisma or React — which is what lets `parseMbValue` be exercised by a pure
 * unit test. The reference implementation's `CatalogField` dependency is
 * replaced by the structural `MbFieldSpec`, so the arrow points catalog →
 * mbValue and never back.
 *
 * `MbValue` IS A READ-TIME VIEW, never a storage format for the 35 legacy keys.
 * Nothing in this file writes; see `legacyShapes.ts`.
 */

/** Which control a fact deserves in the record. */
export type MbType =
  | "text"
  | "long-text"
  | "list"
  | "codes"
  | "file"
  | "money"
  | "range"
  | "count"
  | "date"
  | "area"
  | "address"
  | "choice"
  | "choices"
  | "entries"
  | "papers";

export interface ListItem {
  id: string;
  text: string;
}

/** A code in a government taxonomy. NAICS is the legal hook — it sets the size
 *  standard. PSC is the federal retrieval hook. NIGP and UNSPSC are how state,
 *  county and school buyers actually notify vendors. */
export interface Code {
  system: "NAICS" | "PSC" | "NIGP" | "UNSPSC";
  code: string;
  label: string;
  primary?: boolean;
}

export interface StoredFile {
  id: string;
  name: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: string;
  pages?: number;
}

export type PaperKind = "insurance" | "licence" | "permit" | "certification" | "registration";

/** A credential, its expiry, and the document that proves it.
 *
 *  `expiresAt` IS OPTIONAL AND MUST STAY OPTIONAL: a legacy free-text
 *  `insurance_coverage` / `licenses` row lifts with none, so it can never fire
 *  a false renewal reminder. */
export interface Paper {
  id: string;
  kind: PaperKind;
  name: string;
  issuer?: string;
  number?: string;
  jurisdiction?: string;
  issuedAt?: string;
  expiresAt?: string;
  limits?: { label: string; amountUSD: number }[];
  file?: StoredFile;
}

/** One job she has done. Structured because buyers ask for it structured. */
export interface JobEntry {
  id: string;
  customer: string;
  customerType: "federal" | "state" | "local" | "school" | "nonprofit" | "private";
  scope: string;
  role: "prime" | "sub";
  /** The worth as a number, when one can be got from what she typed. Canonical
   *  for anything that sums, sorts or compares. */
  valueUSD?: number;
  /**
   * The worth EXACTLY as she typed it, always kept. `past_performance.worth` is
   * free text, so live rows hold `"$40,000"`, `"40000"` and `"about 25k"`; a
   * `valueUSD` alone cannot hold the third and would erase her words on the
   * first save. Never normalised, invented or dropped.
   */
  valueText?: string;
  startedAt?: string;
  endedAt?: string;
  place?: string;
  reference?: { name: string; title?: string; phone?: string; email?: string; mayContact: boolean };
  outcome?: string;
}

/**
 * A postal address, in parts.
 *
 * Structured because the parts are read separately: SAM matches on the physical
 * address, HUBZone eligibility is decided by it, and a state is what a SLED
 * portal files a vendor under. As one string none of that is reachable without
 * guessing where the commas fall.
 *
 * ONLY `line1` is required — a member half-way through typing has a street and
 * nothing else.
 */
export interface Address {
  line1: string;
  line2?: string;
  city?: string;
  /** Two-letter USPS state code, upper-cased. */
  state?: string;
  postalCode?: string;
}

/**
 * The address on one line, as it would be written on an envelope.
 *
 * THE ONE DEFINITION — the record renders it, `WRITE_BACK` mirrors it onto
 * `SuccessCenter.address`, and a legacy row lowers through it; three copies
 * would let the column and the screen disagree.
 *
 * State and postcode join with a space, not a comma: "NC 27603" is an address,
 * "NC, 27603" is a list.
 */
export function oneLineAddress(address: Address): string {
  const region = [address.state, address.postalCode].filter(Boolean).join(" ").trim();
  return [address.line1, address.line2, address.city, region]
    .map((part) => (part ?? "").trim())
    .filter((part) => part !== "")
    .join(", ");
}

/**
 * Where she can work.
 *
 * Success Center stores `{ states, cities, rung }` and the prototype stores
 * `{ states, counties, radiusMiles }`; neither is a superset, so SC's shape
 * wins on disk and `Area` carries both. Converting `rung` to `radiusMiles` is
 * lossy and BANNED — a rung is a named tier, not a distance, and inventing a
 * mileage would put a number on the record she never said.
 */
export interface Area {
  states: string[];
  counties: string[];
  /** SC's own field — the ServiceArea control stores cities, not counties. */
  cities: string[];
  /** SC's travel rung — one of `registry.ts`'s TRAVEL_RUNGS values. */
  rung?: string;
  /** Prototype-only. Never derived from `rung`. */
  radiusMiles?: number;
  basedIn?: string;
}

export type MbValue =
  | { kind: "text"; text: string; long?: boolean }
  | { kind: "list"; items: ListItem[] }
  /* `searched` is `primary_industry`'s alone: the codes she added through the
     full NAICS search, carried through the lift so a save keeps them. Absent on
     an answer saved before it was recorded. Never sent to Hunter (`wireValue`). */
  | { kind: "codes"; codes: Code[]; searched?: string[] }
  | { kind: "file"; file: StoredFile }
  | { kind: "money"; amountUSD: number }
  | { kind: "range"; lowUSD: number; highUSD: number }
  | { kind: "count"; n: number; unit: string }
  | { kind: "date"; iso: string }
  | { kind: "area"; area: Area }
  | { kind: "address"; address: Address }
  | { kind: "choice"; value: string; label: string }
  | { kind: "choices"; options: { value: string; label: string }[] }
  | { kind: "entries"; entries: JobEntry[] }
  | { kind: "papers"; papers: Paper[] }
  /** She told us she does not know. An honest answer, and a different fact
   *  from "we never asked" — so it gets its own kind rather than a blank. */
  | { kind: "unknown" }
  | { kind: "none" };

/**
 * The structural slice of a catalog row that the parser needs.
 *
 * DECLARED HERE, NOT IMPORTED, so this module keeps its zero-dependency
 * guarantee. `catalog.ts`'s `CatalogField` is assignable to it; the parser
 * never sees `priority`, `part` or any SC field key.
 */
export interface MbFieldSpec {
  id: string;
  mbType: MbType;
  options?: { value: string; label: string; exclusive?: boolean }[];
  /** The answers come from another field's stored list (`primary_services`). */
  optionsFrom?: string;
}

/** The member's own stored answers, for `optionsFrom` fields. Absent lookup ⇒
 *  an `optionsFrom` write is REFUSED rather than stored unchecked. */
export type RecordLookup = (fieldId: string) => MbValue | undefined;

/** Thrown on any rejected payload. The caller maps it to a 400 with the message
 *  intact — specific enough to fix the client, never echoing the offending
 *  value back (it may be huge or hostile). */
export class MbValueError extends Error {
  /**
   * The refusal in words a MEMBER can act on, when the rule has some. Most do
   * not: a parser message names catalog ids and payload paths, so the caller
   * shows its own sentence instead. Never carries the offending value.
   */
  readonly memberMessage?: string;

  constructor(message: string, memberMessage?: string) {
    super(message);
    this.memberMessage = memberMessage;
  }
}

/* ── constructors ─────────────────────────────────────────────────────────
 * Terse on purpose: the fixtures are long, and `text("Amira's Kitchen LLC")`
 * reads better than the object literal at every call site.
 * ──────────────────────────────────────────────────────────────────────── */

/** A short or long answer she typed. */
export const text = (t: string, long = false): MbValue => ({ kind: "text", text: t, long });
/** Her own list, ids assigned positionally. */
export const list = (...items: string[]): MbValue => ({
  kind: "list",
  items: items.map((t, i) => ({ id: `i${i}`, text: t })),
});
/** Government taxonomy codes. */
export const codes = (...c: Code[]): MbValue => ({ kind: "codes", codes: c });
/** One uploaded document. */
export const file = (f: StoredFile): MbValue => ({ kind: "file", file: f });
/** A single dollar amount. */
export const money = (amountUSD: number): MbValue => ({ kind: "money", amountUSD });
/** A dollar band, low to high. */
export const range = (lowUSD: number, highUSD: number): MbValue => ({
  kind: "range",
  lowUSD,
  highUSD,
});
/** A number and its unit — the unit is never implicit. */
export const count = (n: number, unit: string): MbValue => ({ kind: "count", n, unit });
/** One date, ISO on the wire. */
export const date = (iso: string): MbValue => ({ kind: "date", iso });
/** Where she can work. */
export const area = (a: Area): MbValue => ({ kind: "area", area: a });
/** Where she works from, in parts. */
export const address = (a: Address): MbValue => ({ kind: "address", address: a });
/** One option, with the wording she read. */
export const choice = (value: string, label?: string): MbValue => ({
  kind: "choice",
  value,
  label: label ?? value,
});
/** Several options, with the wording she read. */
export const choices = (...labels: string[]): MbValue => ({
  kind: "choices",
  options: labels.map((l) => ({ value: l, label: l })),
});
/** Past jobs. */
export const entries = (...e: JobEntry[]): MbValue => ({ kind: "entries", entries: e });
/** Credentials and their expiries. */
export const papers = (...p: Paper[]): MbValue => ({ kind: "papers", papers: p });
/** She told us she does not know. */
export const unknown: MbValue = { kind: "unknown" };

/**
 * A stored value that is already the answer "I am not sure".
 *
 * WHY THIS IS A PREDICATE AND NOT THREE `kind === "unknown"` CHECKS. "Not sure"
 * is an answer to EVERY question, so it is stored as this `MbValue` on the
 * `ProfileField` row whatever shape the key normally holds — a document key
 * holds `{kind:"unknown"}` in the same column that would otherwise hold
 * `{kind:"file", file:{…}}`. Three separate places then have to recognise it
 * BEFORE a key's own legacy adapter or renderer tries to read it as that key's
 * shape: the acceptor, `toMb`, and `describeFieldValue`. Each of them got it
 * wrong in a different way — refused, wrapped into
 * `{kind:"file",file:{kind:"unknown"}}`, and rendered as an em dash — so the
 * recognition lives here once.
 *
 * `none` is deliberately NOT included. It is a first-class empty too, but
 * several legacy adapters lower it to a meaningful stored shape (`website`
 * writes `{has:false}`), and short-circuiting those would change what is on
 * disk for an answer that already works.
 */
export function isUnknownValue(stored: unknown): boolean {
  return (
    typeof stored === "object" &&
    stored !== null &&
    (stored as { kind?: unknown }).kind === "unknown"
  );
}
/** Asked, and there is nothing. */
export const none: MbValue = { kind: "none" };

/* ── caps ─────────────────────────────────────────────────────────────────
 * Generous for a member, tight enough that a hostile payload cannot turn one
 * profile field into a blob store.
 * ──────────────────────────────────────────────────────────────────────── */

const MAX_TEXT = 2_000;
const MAX_LONG_TEXT = 10_000;
const MAX_SHORT = 300;
const MAX_MIME = 100;
const MAX_PHONE = 50;
const MAX_ISO = 40;
const MAX_SYSTEM = 10;
const MAX_CODE = 20;
const MAX_STATE = 10;
const MAX_ITEMS = 50;
const MAX_ENTRIES = 30;
const MAX_PAPERS = 30;
const MAX_CODES = 100;
const MAX_LIMITS = 10;
const MAX_STATES = 60;
const MAX_PLACES = 200;
const MAX_USD = 1_000_000_000_000; // a trillion — beyond any real answer
const MAX_COUNT = 1_000_000_000;
const MAX_RADIUS_MILES = 20_000;
const MS_PER_DAY = 86_400_000;
const DEFAULT_EXPIRY_WINDOW_DAYS = 60;

/** The longest paper name `parseMbValue` accepts. A proposing channel drops a longer name rather than store one she cannot save. */
export const PAPER_NAME_MAX_CHARACTERS = MAX_SHORT;

const CODE_SYSTEMS = new Set(["NAICS", "PSC", "NIGP", "UNSPSC"]);
const PAPER_KINDS = new Set(["insurance", "licence", "permit", "certification", "registration"]);
const CUSTOMER_TYPES = new Set(["federal", "state", "local", "school", "nonprofit", "private"]);

/* ── the four code formats ────────────────────────────────────────────────
 * Each taxonomy is finite and published, and its codes have ONE shape. Sources:
 *
 *  · NAICS — two to six digits: sector, subsector, industry group, NAICS
 *    industry, national industry.
 *  · PSC — a four-position code, "with products having a digit in the first
 *    position and services and R&D having a character in the first position"
 *    (PSC Manual, August 2011, §B.1). The other three positions may be letters:
 *    the 2011 facility scheme numbers them `Z1AA`, `C1AA`.
 *  · UNSPSC — four levels of two digits each — segment, family, class,
 *    commodity — so eight digits. The optional fifth pair is a BUYER's business
 *    function (retail, wholesale), not a code a vendor lists, and is not taken.
 *  · NIGP — the four published levels: a 3-digit class, a 5-digit class-item,
 *    a 7-digit class-item-group and an 11-digit class-item-group-detail.
 *    Vendors register at the class-item level in most portals, but a class and
 *    the two longer levels are real codes and are not refused.
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * NAICS is two to six digits. THE ONE DEFINITION: `writeBack.ts` filters
 * `SuccessCenter.naicsCodes` on it and `learnedFactMap.ts` reads Hunter's facts
 * through it, both by import. A second copy could disagree, and a code the
 * record accepted would then be dropped on the way to the column that decides
 * her size standard.
 */
export const NAICS_CODE = /^\d{2,6}$/;

/** The shape each register's codes take. Exported so the PSC picker can refuse
 *  a typed code in the browser using the SAME rule the server parses with —
 *  a second copy is how a code the picker accepted starts failing at the PUT. */
export const CODE_FORMAT: Record<Code["system"], RegExp> = {
  NAICS: NAICS_CODE,
  PSC: /^(\d{4}|[A-Za-z][A-Za-z0-9]{3})$/,
  NIGP: /^(\d{3}|\d{5}|\d{7}|\d{11})$/,
  UNSPSC: /^\d{8}$/,
};

/** What a code in each register looks like, said the way she would be told it
 *  at a counter: the shape, and one real code of that shape. */
export const CODE_SHAPE_SAID: Record<Code["system"], string> = {
  NAICS: "A NAICS code is two to six digits, like 722320.",
  PSC:
    "A PSC code is four characters — four digits for a product, like 1005, " +
    "or a letter and three more for a service, like S203.",
  NIGP: "A NIGP code is three, five, seven or eleven digits, like 96190.",
  UNSPSC: "A UNSPSC code is eight digits, like 90101600.",
};

/**
 * The ONLY place a wire payload becomes an MbValue. Three jobs, all fail-closed:
 * shape (structurally one of the 15 kinds, strings trimmed and capped, numbers
 * finite, unknown keys DROPPED), catalog agreement (the kind must be what
 * `spec.mbType` calls for), and option discipline (a `choice`/`choices` answer
 * comes from the field's own options with the label re-derived, an `exclusive`
 * option stands alone, an `optionsFrom` answer exists in her own source list).
 *
 * `unknown` and `none` are accepted for EVERY field.
 */
export function parseMbValue(raw: unknown, spec: MbFieldSpec, record?: RecordLookup): MbValue {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new MbValueError('value must be an object with a "kind"');
  }
  const v = raw as Record<string, unknown>;
  const kind = v.kind;
  if (typeof kind !== "string") throw new MbValueError("value.kind is required");

  // The three-way empty: both explicit empties are valid for every field.
  if (kind === "unknown") return { kind: "unknown" };
  if (kind === "none") return { kind: "none" };

  // Catalog agreement — one field type maps to exactly one payload kind.
  const wanted = spec.mbType === "long-text" ? "text" : spec.mbType;
  if (kind !== wanted) {
    throw new MbValueError(`field "${spec.id}" takes a "${wanted}" value, got "${kind}"`);
  }

  switch (kind) {
    case "text":
      return parseText(v, spec);
    case "list":
      return { kind: "list", items: parseListItems(v.items) };
    case "codes":
      return { kind: "codes", codes: parseCodes(v.codes) };
    case "file":
      return { kind: "file", file: parseStoredFile(v.file) };
    case "money":
      return { kind: "money", amountUSD: usdAmount(v.amountUSD, "amountUSD") };
    case "range":
      return parseRange(v);
    case "count":
      return parseCount(v);
    case "date":
      return { kind: "date", iso: isoDate(v.iso, "iso") };
    case "area":
      return { kind: "area", area: parseArea(v.area) };
    case "address":
      return { kind: "address", address: parseAddress(v.address) };
    case "choice":
      return parseChoice(v, spec, record);
    case "choices":
      return parseChoices(v, spec);
    case "entries":
      return { kind: "entries", entries: parseJobEntries(v.entries) };
    case "papers":
      return { kind: "papers", papers: parsePapers(v.papers) };
    default:
      throw new MbValueError(`unsupported value kind "${String(kind)}"`);
  }
}

/* ── the scalar kinds ───────────────────────────────────────────────────── */

/**
 * The three federal identifiers, which are `text` rows but not free text.
 *
 * Each has ONE published shape, and each is a hard federal gate — the detailed
 * field PRD marks all three "H (federal)". A malformed one does not fail
 * loudly: `sam.ts` sends the UEI as `ueiSAM` and simply finds no registration,
 * which reads on screen as "SAM says you are not registered" rather than "that
 * is not a UEI". So the shape is refused at the door, where it can still be
 * explained.
 *
 * Normalised as well as checked: EIN is stored hyphenated because that is how
 * the IRS letter prints it, and UEI/CAGE upper-cased because SAM's registry is
 * upper-case and an exact-match lookup on a lower-case code finds nothing.
 */
export const IDENTIFIER_FORMAT: Record<
  string,
  { rule: RegExp; said: string; normalize: (s: string) => string }
> = {
  ein: {
    // 9 digits, with or without the hyphen she may or may not have typed.
    rule: /^\d{2}-?\d{7}$/,
    said: "An EIN is nine digits, written like 12-3456789.",
    normalize: (s) => (s.includes("-") ? s : `${s.slice(0, 2)}-${s.slice(2)}`),
  },
  uei: {
    rule: /^[A-Za-z0-9]{12}$/,
    said: "A UEI is twelve letters and numbers, with no spaces or dashes.",
    normalize: (s) => s.toUpperCase(),
  },
  cage: {
    rule: /^[A-Za-z0-9]{5}$/,
    said: "A CAGE code is five letters and numbers, like 1ABC2.",
    normalize: (s) => s.toUpperCase(),
  },
};

function parseText(v: Record<string, unknown>, spec: MbFieldSpec): MbValue {
  const long = spec.mbType === "long-text";
  const raw = str(v.text, "text", long ? MAX_LONG_TEXT : MAX_TEXT);

  const format = IDENTIFIER_FORMAT[spec.id];
  if (format) {
    // Spaces are how these are read aloud and pasted off a letter; they are
    // never part of the value, so they go before the shape is judged.
    const bare = raw.replace(/\s+/g, "");
    if (!format.rule.test(bare)) {
      throw new MbValueError(`"${spec.id}" is not in the published format`, format.said);
    }
    return { kind: "text", text: format.normalize(bare), long };
  }

  return { kind: "text", text: raw, long };
}

function parseRange(v: Record<string, unknown>): MbValue {
  const lowUSD = usdAmount(v.lowUSD, "lowUSD");
  const highUSD = usdAmount(v.highUSD, "highUSD");
  if (lowUSD > highUSD) throw new MbValueError("range low exceeds high");
  return { kind: "range", lowUSD, highUSD };
}

function parseCount(v: Record<string, unknown>): MbValue {
  const n = num(v.n, "n");
  if (!Number.isInteger(n) || n < 0 || n > MAX_COUNT) {
    throw new MbValueError("count.n must be a non-negative integer");
  }
  // The unit is never implicit — "30" is meaningless without "days".
  return { kind: "count", n, unit: str(v.unit, "unit", MAX_SHORT) };
}

/* ── choice / choices — the option discipline ───────────────────────────── */

function parseChoice(
  v: Record<string, unknown>,
  spec: MbFieldSpec,
  record?: RecordLookup,
): MbValue {
  const value = str(v.value, "value", MAX_SHORT);

  // Her own answers as the options: the picked id must exist in the source
  // list she wrote. No lookup ⇒ refuse rather than store unchecked — an
  // unverifiable pointer into her record is worse than a rejected write.
  if (spec.optionsFrom) {
    if (!record) {
      throw new MbValueError(
        `field "${spec.id}" picks from "${spec.optionsFrom}" and needs the record to validate`,
      );
    }
    const source = record(spec.optionsFrom);
    const items = source?.kind === "list" ? source.items : [];
    const hit = items.find((i) => i.id === value);
    if (!hit) {
      throw new MbValueError(`"${value}" is not one of the answers in "${spec.optionsFrom}"`);
    }
    // Label re-derived from HER list, never trusted from the wire.
    return { kind: "choice", value, label: hit.text };
  }

  if (spec.options?.length) {
    const opt = spec.options.find((o) => o.value === value);
    if (!opt) throw new MbValueError(`"${value}" is not one of the options for "${spec.id}"`);
    // Label from the catalog — stores what she read, immune to a client
    // sending its own wording.
    return { kind: "choice", value, label: opt.label };
  }

  // A choice field with neither options nor optionsFrom is a catalog defect;
  // accept free text so a drifted catalog degrades to storage rather than a
  // dead field.
  return { kind: "choice", value, label: str(v.label ?? value, "label", MAX_SHORT) };
}

function parseChoices(v: Record<string, unknown>, spec: MbFieldSpec): MbValue {
  if (!Array.isArray(v.options)) throw new MbValueError("choices.options must be an array");
  if (v.options.length > MAX_ITEMS) throw new MbValueError("too many options picked");

  const picked: { value: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const o of v.options as unknown[]) {
    const raw = (o ?? {}) as Record<string, unknown>;
    const value = str(raw.value, "options[].value", MAX_SHORT);
    if (seen.has(value)) continue;
    seen.add(value);
    picked.push({ value, label: optionLabel(value, raw.label, spec) });
  }

  assertExclusiveStandsAlone(picked, spec);
  return { kind: "choices", options: picked };
}

function optionLabel(value: string, wireLabel: unknown, spec: MbFieldSpec): string {
  if (!spec.options?.length) return str(wireLabel ?? value, "options[].label", MAX_SHORT);
  const opt = spec.options.find((x) => x.value === value);
  if (!opt) throw new MbValueError(`"${value}" is not one of the options for "${spec.id}"`);
  return opt.label;
}

/** "None of these" is an answer ABOUT the list — it cannot coexist with items
 *  in it. The record must never hold "Commercial, Residential, None of these". */
function assertExclusiveStandsAlone(
  picked: { value: string }[],
  spec: MbFieldSpec,
): void {
  if (!spec.options?.length || picked.length <= 1) return;
  const exclusive = new Set(spec.options.filter((o) => o.exclusive).map((o) => o.value));
  if (picked.some((p) => exclusive.has(p.value))) {
    throw new MbValueError("an exclusive answer cannot be combined with others");
  }
}

/* ── the structured kinds ───────────────────────────────────────────────── */

function parseListItems(raw: unknown): ListItem[] {
  if (!Array.isArray(raw)) throw new MbValueError("list.items must be an array");
  if (raw.length > MAX_ITEMS) throw new MbValueError("too many list items");
  return raw.map((item, i) => {
    const o = (item ?? {}) as Record<string, unknown>;
    return {
      id: optStr(o.id, MAX_SHORT) ?? `i${i}`,
      text: str(o.text, `items[${i}].text`, MAX_TEXT),
    };
  });
}

/** The one OTHER register the code would be well formed in, when there is
 *  exactly one. She may have typed a real code into the wrong row, and naming
 *  the register it belongs to is the difference between a dead end and a fix.
 *  Nothing is named when two registers share the shape — a guess between them
 *  would send her to the wrong row. */
function otherSystemShaped(system: Code["system"], code: string): Code["system"] | null {
  const fits = (Object.keys(CODE_FORMAT) as Code["system"][]).filter(
    (s) => s !== system && CODE_FORMAT[s].test(code),
  );
  return fits.length === 1 ? fits[0] : null;
}

/** Refused for its shape, with a sentence she can act on. */
function codeShapeError(system: Code["system"], code: string, i: number): MbValueError {
  const elsewhere = otherSystemShaped(system, code);
  const hint = elsewhere ? ` That code has the shape of a ${elsewhere} code.` : "";
  return new MbValueError(
    `codes[${i}].code is not shaped like a ${system} code`,
    `${CODE_SHAPE_SAID[system]}${hint}`,
  );
}

/**
 * Government codes, each checked against the FORMAT ITS OWN SYSTEM PUBLISHES —
 * `PSC / 99999` is refused here, because a code no buyer's system can match
 * fails silently: the notices simply never arrive.
 *
 * THIS IS SHAPE, NOT EXISTENCE. A well-formed code that no buyer uses, and one
 * that names something she does not sell, both save. Membership of the real
 * published lists is not checked and cannot be from here — that is the picker,
 * backed by the lists themselves, and it is a separate piece of work.
 */
function parseCodes(raw: unknown): Code[] {
  if (!Array.isArray(raw)) throw new MbValueError("codes.codes must be an array");
  if (raw.length > MAX_CODES) throw new MbValueError("too many codes");
  return raw.map((c, i) => {
    const o = (c ?? {}) as Record<string, unknown>;
    const system = str(o.system, `codes[${i}].system`, MAX_SYSTEM);
    if (!CODE_SYSTEMS.has(system)) {
      throw new MbValueError(`codes[${i}].system must be NAICS, PSC, NIGP or UNSPSC`);
    }
    const code = str(o.code, `codes[${i}].code`, MAX_CODE);
    if (!CODE_FORMAT[system as Code["system"]].test(code)) {
      throw codeShapeError(system as Code["system"], code, i);
    }
    return {
      system: system as Code["system"],
      code,
      label: optStr(o.label, MAX_SHORT) ?? "",
      ...(o.primary === true ? { primary: true } : {}),
    };
  });
}

function parseStoredFile(raw: unknown): StoredFile {
  const o = (raw ?? {}) as Record<string, unknown>;
  const f: StoredFile = {
    id: str(o.id, "file.id", MAX_SHORT),
    name: str(o.name, "file.name", MAX_SHORT),
    mime: str(o.mime, "file.mime", MAX_MIME),
    sizeBytes: num(o.sizeBytes, "file.sizeBytes"),
    uploadedAt: isoDate(o.uploadedAt, "file.uploadedAt"),
  };
  if (typeof o.pages === "number" && Number.isInteger(o.pages) && o.pages > 0) {
    f.pages = o.pages;
  }
  return f;
}

function parsePapers(raw: unknown): Paper[] {
  if (!Array.isArray(raw)) throw new MbValueError("papers.papers must be an array");
  if (raw.length > MAX_PAPERS) throw new MbValueError("too many papers");
  return raw.map((p, i) => parsePaper((p ?? {}) as Record<string, unknown>, i));
}

function parsePaper(o: Record<string, unknown>, i: number): Paper {
  const kind = str(o.kind, `papers[${i}].kind`, MAX_CODE);
  if (!PAPER_KINDS.has(kind)) throw new MbValueError(`papers[${i}].kind is not a paper kind`);
  const paper: Paper = {
    id: optStr(o.id, MAX_SHORT) ?? `p${i}`,
    kind: kind as PaperKind,
    name: str(o.name, `papers[${i}].name`, MAX_SHORT),
  };
  const issuer = optStr(o.issuer, MAX_SHORT);
  if (issuer) paper.issuer = issuer;
  const number = optStr(o.number, MAX_SHORT);
  if (number) paper.number = number;
  const jurisdiction = optStr(o.jurisdiction, MAX_SHORT);
  if (jurisdiction) paper.jurisdiction = jurisdiction;
  if (o.issuedAt !== undefined && o.issuedAt !== "") {
    paper.issuedAt = isoDate(o.issuedAt, `papers[${i}].issuedAt`);
  }
  // The expiry is the field that earns its keep — it drives the renewal queue —
  // so it is validated as a real date, never stored as prose. Absent stays
  // absent: hazard 6 lifts a legacy free-text row with NO expiry, and inventing
  // one would fire a renewal she never has to make.
  if (o.expiresAt !== undefined && o.expiresAt !== "") {
    paper.expiresAt = isoDate(o.expiresAt, `papers[${i}].expiresAt`);
  }
  if (Array.isArray(o.limits)) {
    if (o.limits.length > MAX_LIMITS) throw new MbValueError("too many limits");
    paper.limits = (o.limits as unknown[]).map((l, li) => {
      const lim = (l ?? {}) as Record<string, unknown>;
      return {
        label: str(lim.label, `limits[${li}].label`, MAX_SHORT),
        amountUSD: usdAmount(lim.amountUSD, `limits[${li}].amountUSD`),
      };
    });
  }
  if (o.file !== undefined) paper.file = parseStoredFile(o.file);
  return paper;
}

function parseJobEntries(raw: unknown): JobEntry[] {
  if (!Array.isArray(raw)) throw new MbValueError("entries.entries must be an array");
  if (raw.length > MAX_ENTRIES) throw new MbValueError("too many entries");
  return raw.map((e, i) => parseJobEntry((e ?? {}) as Record<string, unknown>, i));
}

function parseJobEntry(o: Record<string, unknown>, i: number): JobEntry {
  const customerType = str(o.customerType, `entries[${i}].customerType`, MAX_CODE);
  if (!CUSTOMER_TYPES.has(customerType)) {
    throw new MbValueError(`entries[${i}].customerType is not a customer type`);
  }
  if (o.role !== "prime" && o.role !== "sub") {
    throw new MbValueError(`entries[${i}].role must be prime or sub`);
  }
  const entry: JobEntry = {
    id: optStr(o.id, MAX_SHORT) ?? `j${i}`,
    customer: str(o.customer, `entries[${i}].customer`, MAX_SHORT),
    customerType: customerType as JobEntry["customerType"],
    scope: str(o.scope, `entries[${i}].scope`, MAX_TEXT),
    role: o.role,
  };
  if (o.valueUSD !== undefined) entry.valueUSD = usdAmount(o.valueUSD, `entries[${i}].valueUSD`);
  // Carried through verbatim, and independently of `valueUSD`: a worth no
  // number can hold ("about 25k") must survive a lift and a lower unchanged.
  const valueText = optStr(o.valueText, MAX_SHORT);
  if (valueText) entry.valueText = valueText;
  if (o.startedAt !== undefined && o.startedAt !== "") {
    entry.startedAt = isoDate(o.startedAt, `entries[${i}].startedAt`);
  }
  if (o.endedAt !== undefined && o.endedAt !== "") {
    entry.endedAt = isoDate(o.endedAt, `entries[${i}].endedAt`);
  }
  const place = optStr(o.place, MAX_SHORT);
  if (place) entry.place = place;
  const outcome = optStr(o.outcome, MAX_TEXT);
  if (outcome) entry.outcome = outcome;
  if (o.reference !== null && typeof o.reference === "object") {
    entry.reference = parseReference(o.reference as Record<string, unknown>, i);
  }
  return entry;
}

function parseReference(r: Record<string, unknown>, i: number): NonNullable<JobEntry["reference"]> {
  const reference: NonNullable<JobEntry["reference"]> = {
    name: str(r.name, `entries[${i}].reference.name`, MAX_SHORT),
    // The consent bit is the point of the structure — never defaulted true.
    mayContact: r.mayContact === true,
  };
  const title = optStr(r.title, MAX_SHORT);
  if (title) reference.title = title;
  const phone = optStr(r.phone, MAX_PHONE);
  if (phone) reference.phone = phone;
  const email = optStr(r.email, MAX_SHORT);
  if (email) reference.email = email;
  return reference;
}

/** Hazard 4: `cities` and `rung` are Success Center's own shape and are carried
 *  through untouched. `rung` is NEVER converted to `radiusMiles` — a travel rung
 *  is a named tier, not a distance, and a mileage she never said is a number on
 *  the record she never said. */
/**
 * An address in parts. `line1` is the only one insisted on — see `Address`.
 *
 * The state is upper-cased but NOT checked against the state list: a member may
 * legitimately hold a territory or an APO address, and refusing her own address
 * on a two-letter code we did not anticipate is a worse failure than storing
 * one no filter matches.
 */
/** Four digits. The row has only ever held a year — see `yearAdapter`. */
const FOUR_DIGIT_YEAR = /^\d{4}$/;

/** Said the way she would say it, and it names the mistake she is likeliest to
 *  make: writing when rather than which year. */
export const YEAR_SHAPE_SAID =
  "Put the year on its own, as four digits — 2015, not “since 2015”.";

/**
 * What is wrong with a year, or null when nothing is.
 *
 * `year_started_operating` is a free-text box whose adapter only ever accepted
 * four digits, so "since 2015" was refused with the general sentence — she was
 * told the record could not store her answer, and not what a year looks like.
 * The three federal identifiers were given their own wording for exactly this
 * reason; this is the fourth field with a shape rule and no words.
 */
export function yearProblem(year: unknown): string | null {
  if (year === undefined || year === null || year === "") return null;
  if (typeof year !== "string") return YEAR_SHAPE_SAID;
  return FOUR_DIGIT_YEAR.test(year.trim()) ? null : YEAR_SHAPE_SAID;
}

/** Five digits, or ZIP+4 written with the hyphen the Postal Service uses. */
const ZIP_CODE = /^\d{5}(-\d{4})?$/;

/** Said the way she would be told it at a counter. */
export /** A US number, area code included. An extension only adds to this. */
const PHONE_MIN_DIGITS = 10;
/** The three fixed widths their issuers set. */
const EIN_DIGITS = 9;

/** E.164's own range for a number written with an explicit country code. */
const E164_MIN_DIGITS = 8;
const E164_MAX_DIGITS = 15;
const ZIP_SHAPE_SAID =
  "A ZIP code is five digits, like 27603 — or nine written 27603-1234.";

/**
 * What is wrong with a ZIP code, or null when nothing is.
 *
 * THE ONE DEFINITION, because the address reaches storage down two different
 * paths: `parseAddress` for any `mb` row, and `acceptStoredValue`'s legacy
 * branch for `company_address`, which is one of the frozen 39 and never meets
 * this parser. A rule written twice is a rule one path enforces and the other
 * does not.
 *
 * An absent ZIP is not a problem: only `line1` is ever insisted on.
 */
/**
 * An address that is not an address yet, in her own words.
 *
 * Deliberately permissive — one `@`, something before it, a dot after it. It
 * exists to catch a typed name or a phone number, not to adjudicate RFC 5322;
 * a stricter pattern refuses real addresses and she has no way to argue.
 */
export function emailProblem(value: unknown): string | null {
  const said = typeof value === "string" ? value.trim() : "";
  if (said === "") return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(said)
    ? null
    : "That does not look like an email address yet.";
}

/**
 * A website that is not a website yet.
 *
 * The box took any non-empty string, so "asda" saved as her web address and
 * went out to Hunter and onto a capability statement as one.
 *
 * Permissive on purpose, in the same way `emailProblem` is: a host with a dot
 * and a tail of letters, scheme and path optional. It is here to catch a word,
 * a phone number or a sentence — not to adjudicate what resolves. Whether the
 * site is REACHABLE is the `website` validator's job and needs the network;
 * this only asks whether she has typed an address at all.
 */
export function websiteProblem(value: unknown): string | null {
  const said = typeof value === "string" ? value.trim() : "";
  if (said === "") return null;
  const bare = said.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  return /^[^\s/@]+\.[a-z]{2,}(\/\S*)?$/i.test(bare)
    ? null
    : "That does not look like a web address yet — like yourcompany.com.";
}

/**
 * A value that is not a phone number.
 *
 * Counted rather than pattern-matched: she may write (704) 555-0143,
 * 704.555.0143 or +1 704 555 0143, and all three are the same number.
 *
 * THIS USED TO CHECK ONLY THE FLOOR, and the reasoning went as far as it could:
 * an extension pushes the digit count up, never down, so a ceiling would refuse
 * a real number with "x22" on the end. What it missed is that with no ceiling
 * at all, `99999999999999` is fourteen digits, clears ten, and is stored as her
 * phone number. So the extension is SPLIT OFF first, which is what lets a
 * ceiling exist at all.
 *
 * US SHAPES, BECAUSE THIS IS A US PRODUCT — SAM.gov registration requires a US
 * entity and the program runs in `America/New_York`. Ten digits, or eleven
 * beginning with the country code. A leading `+` is the explicit escape for a
 * number genuinely outside the US, and takes E.164's own 8-to-15 range.
 */
export function phoneProblem(value: unknown): string | null {
  const said = typeof value === "string" ? value.trim() : "";
  if (said === "") return null;

  // Everything from "x", "ext" or "#" onward is an extension, not the number.
  const main = said.split(/\s*(?:x|ext\.?|#)\s*\d*$/i)[0] ?? "";
  const digits = main.replace(/\D/g, "");
  const tooFew = "A phone number needs ten digits, like (704) 555-0143.";

  if (said.startsWith("+")) {
    if (digits.length < E164_MIN_DIGITS) return tooFew;
    return digits.length <= E164_MAX_DIGITS
      ? null
      : "That is more digits than any phone number has.";
  }

  if (digits.length < PHONE_MIN_DIGITS) return tooFew;
  const national = digits.length === PHONE_MIN_DIGITS;
  const withCountryCode = digits.length === PHONE_MIN_DIGITS + 1 && digits.startsWith("1");
  return national || withCountryCode
    ? null
    : "A US phone number is ten digits, like (704) 555-0143. Start with + for a number outside the US.";
}

/* ── the three fixed-width government identifiers ─────────────────────────
 *
 * These are the one place a strict rule is kinder than a permissive one. Each
 * is a FIXED WIDTH set by the issuer, so a value of any other length is not a
 * near-miss — it is certainly wrong, and it will be rejected by SAM.gov later,
 * at a point where she has no idea which of her answers caused it.
 *
 * Punctuation and case are hers. The EIN is read as digits, so `12-3456789` and
 * `123456789` are the same answer; the other two are read uppercased.
 *
 * NONE OF THEM FIRE ON AN EMPTY ANSWER, and none can trap her: "I am not sure"
 * stores `unknown`, which is a real answer and never reaches a rule here.
 * ──────────────────────────────────────────────────────────────────────── */

/** Employer Identification Number: nine digits, written 12-3456789. */
export function einProblem(value: unknown): string | null {
  const said = typeof value === "string" ? value.trim() : "";
  if (said === "") return null;
  if (/[A-Za-z]/.test(said)) return "An EIN is nine digits, like 12-3456789.";
  const digits = said.replace(/\D/g, "");
  return digits.length === EIN_DIGITS ? null : "An EIN is nine digits, like 12-3456789.";
}

/** Unique Entity ID: the twelve characters SAM.gov issues. */
export function ueiProblem(value: unknown): string | null {
  const said = typeof value === "string" ? value.trim() : "";
  if (said === "") return null;
  const bare = said.replace(/\s+/g, "");
  return /^[A-Za-z0-9]{12}$/.test(bare)
    ? null
    : "A UEI is the twelve letters and numbers SAM.gov gave you.";
}

/** CAGE code: five characters from the Defense Logistics Agency. */
export function cageProblem(value: unknown): string | null {
  const said = typeof value === "string" ? value.trim() : "";
  if (said === "") return null;
  const bare = said.replace(/\s+/g, "");
  return /^[A-Za-z0-9]{5}$/.test(bare)
    ? null
    : "A CAGE code is five letters and numbers, like 1ABC2.";
}

export function zipProblem(postalCode: unknown): string | null {
  if (postalCode === undefined || postalCode === null || postalCode === "") return null;
  if (typeof postalCode !== "string") return ZIP_SHAPE_SAID;
  return ZIP_CODE.test(postalCode.replace(/\s+/g, "")) ? null : ZIP_SHAPE_SAID;
}

function parseAddress(raw: unknown): Address {
  const o = (raw ?? {}) as Record<string, unknown>;
  const address: Address = { line1: str(o.line1, "address.line1", MAX_SHORT) };
  const line2 = optStr(o.line2, MAX_SHORT);
  if (line2) address.line2 = line2;
  const city = optStr(o.city, MAX_SHORT);
  if (city) address.city = city;
  const state = optStr(o.state, MAX_STATE);
  if (state) address.state = state.toUpperCase();
  const postalCode = optStr(o.postalCode, MAX_STATE);
  if (postalCode) {
    // Checked, because a typo'd ZIP does not fail loudly either: HUBZone
    // eligibility is decided by the address, and a wrong five digits looks
    // exactly as settled on screen as a right one.
    const problem = zipProblem(postalCode);
    if (problem) throw new MbValueError("address.postalCode is not a ZIP code", problem);
    address.postalCode = postalCode.replace(/\s+/g, "");
  }
  return address;
}

function parseArea(raw: unknown): Area {
  const o = (raw ?? {}) as Record<string, unknown>;
  const a: Area = {
    states: strArray(o.states, "area.states", MAX_STATES, MAX_STATE),
    counties: strArray(o.counties, "area.counties", MAX_PLACES, MAX_SHORT),
    cities: strArray(o.cities, "area.cities", MAX_PLACES, MAX_SHORT),
  };
  const rung = optStr(o.rung, MAX_SHORT);
  if (rung) a.rung = rung;
  if (o.radiusMiles !== undefined) {
    const r = num(o.radiusMiles, "area.radiusMiles");
    if (r < 0 || r > MAX_RADIUS_MILES) throw new MbValueError("area.radiusMiles out of range");
    a.radiusMiles = r;
  }
  const basedIn = optStr(o.basedIn, MAX_SHORT);
  if (basedIn) a.basedIn = basedIn;
  return a;
}

/* ── scalars ────────────────────────────────────────────────────────────── */

function str(raw: unknown, name: string, max: number): string {
  if (typeof raw !== "string") throw new MbValueError(`${name} must be a string`);
  const t = raw.trim();
  if (!t) throw new MbValueError(`${name} must not be empty`);
  if (t.length > max) throw new MbValueError(`${name} is longer than ${max} characters`);
  return t;
}

function optStr(raw: unknown, max: number): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  return t.length > max ? undefined : t;
}

function strArray(raw: unknown, name: string, maxItems: number, maxLen: number): string[] {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) throw new MbValueError(`${name} must be an array`);
  if (raw.length > maxItems) throw new MbValueError(`${name} has too many items`);
  const out: string[] = [];
  for (const s of raw as unknown[]) {
    if (typeof s !== "string") throw new MbValueError(`${name} must hold strings`);
    const t = s.trim();
    if (t && t.length <= maxLen) out.push(t);
  }
  return out;
}

function num(raw: unknown, name: string): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new MbValueError(`${name} must be a finite number`);
  }
  return raw;
}

function usdAmount(raw: unknown, name: string): number {
  const n = num(raw, name);
  if (n < 0 || n > MAX_USD) throw new MbValueError(`${name} out of range`);
  return Math.round(n);
}

function isoDate(raw: unknown, name: string): string {
  const s = str(raw, name, MAX_ISO);
  if (Number.isNaN(new Date(s).getTime())) throw new MbValueError(`${name} is not a date`);
  return s;
}

/* ── predicates ─────────────────────────────────────────────────────────── */

/** Nothing here yet. Drives whether a field renders as a row or folds into the
 *  part's "more you can add" line — never into a wall of blank rows. */
export function isEmpty(v: MbValue | undefined): boolean {
  if (!v) return true;
  switch (v.kind) {
    case "none":
      return true;
    case "text":
      return v.text.trim() === "";
    case "list":
      return v.items.length === 0;
    case "codes":
      return v.codes.length === 0;
    case "choices":
      return v.options.length === 0;
    case "entries":
      return v.entries.length === 0;
    case "papers":
      return v.papers.length === 0;
    default:
      return false;
  }
}

/** "I'm not sure" is answered. She engaged with the question and told us the
 *  truth; treating that as a gap would ask her again forever. */
export function isAnswered(v: MbValue | undefined): boolean {
  return !isEmpty(v);
}

/** How many things are in there, for the part counts. A count says WHICH; a
 *  percentage only says how much, and is the number this product does not show. */
export function itemCount(v: MbValue | undefined): number {
  if (!v) return 0;
  switch (v.kind) {
    case "list":
      return v.items.length;
    case "codes":
      return v.codes.length;
    case "choices":
      return v.options.length;
    case "entries":
      return v.entries.length;
    case "papers":
      return v.papers.length;
    default:
      return isEmpty(v) ? 0 : 1;
  }
}

/* ── dates ──────────────────────────────────────────────────────────────── */

/** Day first, month spelled out: "15 April 2027".
 *
 *  PINNED TO UTC, and that is not a detail. A date-only ISO ("2027-04-15") is
 *  UTC midnight; rendered in the host's local zone it reads "14 April 2027"
 *  anywhere west of Greenwich — a date the member never said, on a record whose
 *  whole point is that nothing enters it she has not confirmed. The same fixed
 *  zone is used by `formatValue.ts`, so the two agree by construction. */
const FULL_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

/** Day first, month spelled out: "15 April 2027". Never "4/15/27", never
 *  "15 Apr" — an abbreviated month is a real ask at A2.
 *
 *  Fails closed: an unparseable input is returned unchanged rather than
 *  formatted, because `new Date("soon")` renders the literal "Invalid Date" and
 *  a raw JS artifact must never reach a member. */
export function fullDate(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  // Formatted per call, not from a cached Intl.DateTimeFormat: a cached one
  // resolves its zone once at import, which would let the timezone regression
  // test pass vacuously on a UTC runner — the exact way this bug got in.
  return at.toLocaleDateString("en-GB", FULL_DATE_FORMAT);
}

/** Whole days from `now` to `iso`; negative once it has lapsed. `now` is passed
 *  in so a boundary is testable — this module never reads the clock. */
export function daysUntil(iso: string, now: Date): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / MS_PER_DAY);
}

/** A paper that has lapsed, or lapses inside the window. This is what puts a
 *  renewal in front of her, and it is why an expiry is a real field rather than
 *  a sentence inside a text blob. */
export function expiringPapers(
  v: MbValue | undefined,
  now: Date,
  withinDays = DEFAULT_EXPIRY_WINDOW_DAYS,
): Paper[] {
  if (!v || v.kind !== "papers") return [];
  return v.papers.filter((p) => p.expiresAt && daysUntil(p.expiresAt, now) <= withinDays);
}

/* ── money ──────────────────────────────────────────────────────────────── */

/** A whole-dollar amount, grouped: `$250,000`. */
export function usd(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
