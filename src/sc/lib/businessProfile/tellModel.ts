/**
 * The model behind "Tell Hunter everything". Server-side only — the API key is
 * read in the route's process and no key, prompt or provider reply crosses to
 * the browser.
 *
 * The second implementation of `TellExtractor`; `tellExtract.extract` is the
 * first and remains the fallback whenever the model cannot be reached or
 * believed. Nothing downstream knows which one ran.
 *
 * THE MODEL PROPOSES CANDIDATES; THE CATALOG DECIDES. A candidate is treated
 * as if she had typed it into that row's editor: shaped by `wirePayloadFor`,
 * then run through `acceptStoredValue` — the same gate the member `PUT` uses.
 * That caps lengths, enforces option discipline and re-derives option labels,
 * so a model can never store its own wording. A refused candidate is not a
 * fact: it never becomes a proposal and its sentence returns in `leftover`.
 *
 * HER WORDS ARE THE EVIDENCE. Every candidate carries a quote, looked up in
 * her own text so we store HER characters. A quote absent from her text is a
 * fabricated citation and the fact it supports is dropped.
 *
 * It must not be looser than the code it replaces: a money candidate survives
 * only where `amountIn` finds that amount in her quote, days only where
 * `daysIn` does, any other quantity only where she said that number at all.
 *
 * Runs on her submit, so the timeout is 15s and a timeout is a fallback rather
 * than an error — the worst she sees is the deterministic result, late.
 */

import { completeChatViaOpenRouter, parseJsonFromText } from "@sc/lib/ai/openrouter";
import { CATALOG, copyFor, type CatalogCopy, type CatalogField } from "./catalog";
import { storageFor, toMb } from "./legacyShapes";
import { countUnitFor } from "./mbEditor";
import { IDENTIFIER_FORMAT, none, type MbType, type MbValue } from "./mbValue";
import { rowEditor, storedFrom } from "./rowEditor";
import { acceptStoredValue } from "./storedValue";
import {
  amountIn,
  daysIn,
  extract,
  saidNumbers,
  sentences,
  type ExtractedFact,
  type Extraction,
} from "./tellExtract";

const MODEL = "anthropic/claude-haiku-4.5";
/** Her submit is waiting on this. See the header. */
const TIMEOUT_MS = 15_000;
/** Enough for twenty facts with their quotes; not enough to write an essay. */
const MAX_TOKENS = 900;
/** More than this from one submission is a model listing fields rather than
 *  reading sentences. The record has 75 rows and she is typing, not filing. */
const MAX_FACTS = 20;
/** How long a candidate's field id may be before we stop even looking it up. */
const MAX_KEY_CHARS = 100;
/** The `count` row measured in days is the one the deterministic reader covers. */
const DAYS = "days";

/* ── the closed set of fields a model may fill ────────────────────────────── */

/** The value kinds a spoken sentence can honestly become. `codes`, `date`,
 *  `area`, `range`, `file`, `papers` and `entries` need their own editor, and
 *  squeezing a sentence into one would destroy the typed value the record
 *  exists to protect — the same line the deterministic rules draw. */
/* `address`, `area` and `entries` JOINED THE LIST. They were excluded on the
   grounds that each "takes a structure with parts a model would have to
   invent", and that reasoning does not survive contact with the shapes:

     · An address stores what she said and nothing more. `zipProblem` only
       validates a postcode that is PRESENT, so "54th Street, Raleigh, North
       Carolina" stores line1, city and state with the postcode left blank for
       her — measured, not assumed. An invented bad one is still refused.
     · An area's states and cities are exactly what she names. The travel rung
       is the part she rarely says, and it is simply left empty rather than
       guessed at.
     · A job's customer and scope are the sentence. `past_performance` lowers
       through its legacy adapter, which DROPS customerType and role, so the
       two parts a model would have to invent never reach the record at all.

   What stays out is anything a sentence cannot be: a document (`file`,
   `papers` — no wording makes a PDF exist), a classification code (`codes` —
   a model asserting a NAICS code is the eligibility hazard `size_status`
   exists to avoid), and `size_status` itself. */
const PROSE_KINDS: readonly MbType[] = [
  "text", "long-text", "list", "money", "count", "choice", "choices",
  "address", "area", "entries",
];

/**
 * Option values that say she does not know, rather than saying anything about
 * her business.
 *
 * NOT offered to the model and NOT accepted from it. "Not sure" is a real answer
 * — it is on the fourteen deliberately, and it is what a member picks when a
 * question is genuinely beyond her — but it is an answer only she can give. A
 * model reading "we are a woman owned catering company" and proposing
 * "Kind of business: Not sure" has extracted nothing, and would put a card in
 * front of her asking her to confirm that we do not know something. She would
 * be confirming OUR ignorance as HER answer, and the record would then hold
 * "Not sure" as an attested fact.
 *
 * `none` is deliberately NOT here. "None of these describe the owner" is a
 * claim about her business and a model may propose it, where she said it.
 */
const DONT_KNOW: ReadonlySet<string> = new Set(["unsure", "not_sure"]);

/** A catalog row a model may propose against. Its `key` is known non-null. */
type TellField = CatalogField & { key: string };

/**
 * The kind of answer THIS ROW'S OWN EDITOR takes, which is not always the
 * catalog's `mbType`.
 *
 * A legacy key's editor is the registry's control, and its `onSave` shape is
 * the shape on disk — that is the whole reason the storage never moves. So a
 * legacy row is asked for in its CONTROL's terms: `year_started_operating` is
 * typed `date` in the catalog and answered with four characters in a text box,
 * and asking a model for a date there would produce something the row cannot
 * store.
 *
 * Null means prose cannot become this row's answer, whatever it is typed as.
 */
function kindOf(field: CatalogField): MbType | null {
  const key = field.key;
  if (!key) return null;
  if (storageFor(key) === "mb") {
    return PROSE_KINDS.includes(field.mbType) ? field.mbType : null;
  }
  const control = rowEditor(key, none)?.control.control;
  return control ? (LEGACY_CONTROL_KIND[control] ?? null) : null;
}

/**
 * A registry control, in the terms the prompt and the shaping already speak.
 *
 * Only the five a sentence can fill. `website`, `work-tree`, `service-area`,
 * `project` and `upload` are deliberately absent: each takes a structure with
 * parts a model would have to invent — a service area is states AND cities AND
 * a travel rung, and two of the three are never in the sentence that names the
 * first. A geography assembled from one of them is a guess wearing her
 * confirmation.
 */
const LEGACY_CONTROL_KIND: Record<string, MbType> = {
  text: "text",
  "long-text": "long-text",
  radio: "choice",
  checkbox: "choices",
  "three-things": "list",
  /* The four a sentence states plainly. `website` is asked for as text and
     wrapped into the `{has, url}` shape the row stores by `answerFor` — a bare
     string is ACCEPTED by that key and then silently degrades to
     `{has:"unsure"}`, losing the address she just gave. `work-tree` and
     `upload` are still absent: one is a classification code, the other a
     document. */
  address: "address",
  "home-address": "address",
  website: "text",
  "service-area": "area",
  project: "entries",
};

/** Legacy keys whose control names a shape the model is not asked to build. */
const WEBSITE_CONTROL = "website";

/**
 * Whether this row is one a model may fill. Four gates, all of them the
 * catalog's and the registry's own answers rather than a hand-kept list:
 *
 *  · it has a `ProfileField` key of its own (the two virtual rows have none);
 *  · the editor it opens takes a shape prose can become (`kindOf`);
 *  · a `count` row names its own unit — `max_daily_output` falls out here,
 *    because only her trade can say whether it counts meals or houses, and a
 *    unit is not ours or a model's to invent;
 *  · it has a real editor, so a fact she confirms has somewhere to be changed.
 *
 * LEGACY KEYS ARE ADMITTED, which they were not before. The reason they were
 * excluded — that `parseMbValue` cannot validate a shape older than itself — was
 * about the WRONG gate: `acceptStoredValue` has a legacy branch that checks
 * exactly these keys through their own adapters, and `storedFrom` already knows
 * which shape each key wants. So the candidate goes down the same two functions
 * a member's own save does. What is still excluded is structure a model would
 * have to invent, which is a decision about the CONTROL and not about storage.
 */
function mayFill(field: CatalogField): field is TellField {
  const key = field.key;
  if (!key) return false;
  // A row with no prompt to add it is one nobody is asked — it is WORKED OUT.
  // `size_status` is the only one, and it is derived from her receipts and her
  // headcount against the SBA standard for a given NAICS code. Offering it
  // invited a model to assert an eligibility conclusion from prose, which is a
  // different kind of wrong from a misread fact: she would be confirming a
  // finding about what she QUALIFIES for. Taken from the catalog rather than a
  // list here, so a second derived row cannot be added and quietly offered.
  if (!field.addPrompt) return false;
  const kind = kindOf(field);
  if (kind === null) return false;
  if (kind === "count" && countUnitFor(key) === null) return false;
  return rowEditor(key, none) !== null;
}

/** The closed set, derived from the catalog and never written down twice. */
export const TELL_FIELDS: readonly TellField[] = CATALOG.filter(mayFill);
const TELL_FIELD_KEYS = new Set<string>(TELL_FIELDS.map((f) => f.key));

/**
 * Rows that need the DOCUMENT itself, which no wording can be.
 *
 * A sentence can say "my insurance is at xyz.com" and mean it, and the record
 * still cannot hold an insurance certificate that nobody uploaded. Before this
 * the sentence simply fell into "What I did not understand", which was true and
 * useless: she had been understood perfectly, and the answer was that this one
 * takes a file.
 *
 * So they are named to the model in their own list, to RECOGNISE and never to
 * fill. A candidate here carries no value at all — only the field and her quote
 * — so there is no shape to get wrong and nothing that can reach the record.
 */
export const UPLOAD_FIELDS: readonly CatalogField[] = CATALOG.filter(
  (f): f is CatalogField => f.key !== null && (f.mbType === "papers" || f.mbType === "file"),
);

/**
 * What to do instead, for a row words cannot answer.
 *
 * EVERY ROW OUTSIDE THE FILLABLE SET HAS ONE, and that is the point: 53 rows
 * can be filled from a sentence and 24 cannot, and until this the second group
 * was split in two. Documents were named; the other six — the three code
 * registers, the derived size standard, the service she picks from her own
 * list, and a count with no unit — were named nowhere at all. She could say
 * "we are NAICS 722310" and watch it fall into "What I did not understand",
 * which was not true. It was understood. It is simply not something a sentence
 * decides.
 */
const INSTEAD_BY_KEY: Record<string, string> = {
  primary_industry: "Pick your trade from the official list on this row — the codes under it set your size standard.",
  psc_codes: "Pick these from the official code list on this row.",
  commodity_codes: "Pick these from the official code list on this row.",
  size_status: "Nothing to write: we work this out from your receipts and your headcount against the standard for your trade.",
  service_to_sell_to_government: "Choose one of the services you have already listed, on this row.",
  max_daily_output: "Add this on the row, where you can say what it is you count.",
};

const INSTEAD_FOR_A_DOCUMENT = "Add the document itself on this row — a file cannot be written down.";

/** Every row a sentence may NAME but never fill, and what to do about each. */
export const UNFILLABLE_FIELDS: readonly CatalogField[] = CATALOG.filter(
  (f): f is CatalogField => f.key !== null && !TELL_FIELD_KEYS.has(f.key),
);

const UNFILLABLE_BY_KEY = new Map(UNFILLABLE_FIELDS.map((f) => [f.key as string, f]));

/** What she should do with a row the extractor may not fill. */
export function insteadFor(fieldKey: string): string {
  return INSTEAD_BY_KEY[fieldKey] ?? INSTEAD_FOR_A_DOCUMENT;
}

/** One row she was talking about that the record cannot take from words. */
export interface UploadAim {
  fieldKey: string;
  /** The row's own name, as the record calls it. */
  label: string;
  /** Her words, looked up in her text exactly as the facts' quotes are. */
  quote: string;
  /** What to do instead — never a refusal on its own. */
  instead: string;
}

const FIELD_BY_KEY = new Map<string, TellField>(TELL_FIELDS.map((f) => [f.key, f]));

/* ── the prompt ───────────────────────────────────────────────────────────── */

/** What `value` must look like for one row, in the row's own terms. */
/**
 * Rows whose answer has ONE published shape, said in the same words the refusal
 * uses.
 *
 * Without these the prompt asked for "a short line of text in her own words" on
 * four rows that accept nothing of the sort: `year_started_operating` has only
 * ever held four digits, and the three federal identifiers each have a format a
 * registrar issues. A model that proposes "since 2015" or a ten-character UEI is
 * not wrong to have tried — it was asked for free text — and the candidate is
 * then refused silently, so her sentence lands in leftover with no sign that we
 * understood it and could not store it.
 *
 * `IDENTIFIER_FORMAT` is reused rather than restated: one description of what
 * an EIN looks like, used both to ask for it and to refuse it.
 */
const SHAPE_SAID: Record<string, string> = {
  year_started_operating: "the four-digit year she named, and nothing else",
  ein: IDENTIFIER_FORMAT.ein.said,
  uei: IDENTIFIER_FORMAT.uei.said,
  cage_code: IDENTIFIER_FORMAT.cage.said,
};

function shapeOf(field: TellField, copy: CatalogCopy): string {
  const said = SHAPE_SAID[field.key];
  if (said) return said;
  const kind = kindOf(field) ?? field.mbType;
  // The don't-know options are left off the line entirely: a model cannot pick
  // an option it was never shown, which is cheaper than refusing it afterwards.
  const values = (copy.options ?? [])
    .map((o) => o.value)
    .filter((value) => !DONT_KNOW.has(value))
    .join(" | ");
  switch (kind) {
    case "list":
      return "an array of short strings, one per thing she named";
    case "money":
      return "a whole number of US dollars she named";
    case "count":
      return `a whole number of ${countUnitFor(field.key)} she named`;
    case "choice":
      return `exactly one of: ${values}`;
    case "choices":
      return `an array of any of: ${values}`;
    case "address":
      /* EVERY PART OPTIONAL, SAID SO EXPLICITLY. The postcode is the part a
         sentence almost never carries, and it is the one that matters most to
         get right: `company_address` is what SAM and HUBZone read. Leaving it
         out is correct and storable; inventing one is refused by the shape
         rule, but by then she has been shown a card asking her to confirm it. */
      return '{"line1":…,"city":…,"state":…,"postalCode":…} — include ONLY the parts she said, omit the rest, and NEVER invent a postcode or a state';
    case "area":
      return '{"states":[…],"cities":[…]} — two-letter states, city names as she said them; omit either if she named none';
    case "entries":
      return '[{"customer":…,"scope":…,"worth":…}] — one object per job she described, worth exactly as she wrote it, omitted when she gave none';
    default:
      return "a short line of text in her own words";
  }
}

function fieldLine(field: TellField): string {
  const copy = copyFor(field);
  const line = `${field.key} — ${copy.label} — value: ${shapeOf(field, copy)}`;
  // The row's OWN helper, where it has one — the sentence a member already
  // reads under that question. Without it every `list` row read identically
  // ("an array of short strings"), and "Money the business made, each of the
  // last five years" took the worth of a single job, because nothing on the
  // line said one number per year. The copy that disambiguates it was already
  // written, for her, and was simply not being passed on.
  return copy.helper ? `${line} — ${copy.helper}` : line;
}

/**
 * The instruction, with the closed field list built from the catalog.
 *
 * Built once at import: the catalog is static, and a prompt assembled per
 * request is a prompt that can differ per request.
 */
export const TELL_PROMPT = [
  "You read what a small-business owner typed about her own business and pick out only the facts she plainly stated.",
  "",
  "Reply with ONLY a JSON object, no prose, no code fences:",
  '{"facts": [{"field": string, "value": ..., "quote": string}]}',
  "",
  "- field: one of the ids listed below, exactly as spelled there. NEVER any other id.",
  "- value: exactly the shape that field's line calls for.",
  "- quote: a VERBATIM span of her text, copied character for character, that states this fact.",
  "  Never paraphrase it, never tidy her spelling, her casing or her punctuation. If you cannot",
  "  copy an exact span of her text, leave the fact out — a quote she did not type is discarded.",
  '- Returning nothing is CORRECT when nothing on the list is clearly stated. Reply {"facts": []}',
  "  for text that is only background, feeling, hopes or plans. Never stretch to fill a field.",
  "- NEVER infer an amount, a date, a quantity or a unit she did not say. \"one van\" is one van and",
  "  not a sum of money; a bare \"5\" is a 5 of nothing. If she gave a number without saying what it",
  "  measures, leave the fact out.",
  "- Only what she states about her OWN business. Not what she wants, plans, or is thinking about.",
  "- THE QUOTE MUST STATE THAT FIELD'S FACT, not merely contain a word or a number that could",
  "  belong to it. One job's worth is not what the business makes in a year. What one customer",
  "  paid is not her rate. A trade she names in passing is not the name she trades under. If the",
  "  sentence is about something else, leave the field out, however well the value would fit it.",
  "- At most one fact per field, and at most " + MAX_FACTS + " facts in all.",
  "",
  "The fields:",
  ...TELL_FIELDS.map(fieldLine),
  "",
  /* NAMED, NEVER FILLED. The instruction is deliberately about RECOGNITION and
     carries no value shape, so there is nothing here for a model to build. */
  'These CANNOT be answered from words — a document, a code picked from an official list, or a',
  'figure worked out from her records. If she is clearly talking about one, name it under',
  '"uploads" with her quote and NO value, so she can be told what to do instead. Never put one',
  'of these under "facts".',
  ...UNFILLABLE_FIELDS.map((f) => `${f.key as string} — ${copyFor(f).label}`),
  "",
  'Reply shape: {"facts": [...], "uploads": [{"field": …, "quote": …}]}. "uploads" may be omitted.',
].join("\n");

/* ── reading the reply ────────────────────────────────────────────────────── */

interface Candidate {
  field?: unknown;
  value?: unknown;
  quote?: unknown;
}

function isRecord(x: unknown): x is Candidate {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** The candidates the reply carries, or null when it carries no usable JSON at
 *  all — which is a failure to fall back from, not an empty answer. */
function candidatesIn(reply: string): Candidate[] | null {
  const obj = parseJsonFromText<{ facts?: unknown }>(reply);
  if (!obj || typeof obj !== "object" || !Array.isArray(obj.facts)) return null;
  return obj.facts.filter(isRecord).slice(0, MAX_FACTS);
}

/**
 * Her own characters for this quote, or null when the quote is not in her text.
 *
 * Matched case-insensitively and returned as SHE typed it: a model that
 * lower-cases her sentence still cites her, and what is stored and shown on the
 * card is hers either way. Anything else is a fabricated citation.
 */
function heardIn(text: string, quote: unknown): string | null {
  if (typeof quote !== "string") return null;
  const wanted = quote.trim();
  if (wanted === "") return null;
  const at = text.toLowerCase().indexOf(wanted.toLowerCase());
  return at === -1 ? null : text.slice(at, at + wanted.length);
}

/**
 * Whether a number the model returned is a number SHE said.
 *
 * Money and days are read back by the deterministic extractor's own readers, so
 * this path can never accept what that one refuses. Every other quantity has to
 * appear in her quote as a number she wrote or spelled.
 */
function corroborated(field: TellField, value: number, heard: string): boolean {
  if (field.mbType === "money") return amountIn(heard) === value;
  if (countUnitFor(field.key) === DAYS) return daysIn(heard) === value;
  return saidNumbers(heard).includes(value);
}

/** The candidate as the row's own editor would have handed it over, or null when
 *  it is not even the right sort of thing for that row. */
/** The registry control this row is edited with, where it has one. */
function controlOf(field: TellField): string | null {
  return rowEditor(field.key, none)?.control.control ?? null;
}

/** A string field of an object, trimmed, or undefined when she did not say it. */
function said(o: Record<string, unknown>, key: string): string | undefined {
  const v = o[key];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

/** Only the strings she actually gave — a key she did not answer is ABSENT
 *  rather than empty, so nothing downstream reads a blank as an answer. */
function pick(value: unknown, keys: readonly string[]): Record<string, string> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = said(o, k);
    if (v !== undefined) out[k] = v;
  }
  return Object.keys(out).length === 0 ? null : out;
}

const ADDRESS_PARTS = ["line1", "line2", "city", "state", "postalCode"] as const;

/** Her address, with the parts she did not give left out entirely. */
function addressFrom(value: unknown): Record<string, string> | null {
  const parts = pick(value, ADDRESS_PARTS);
  /* A city or a state ALONE is not an address. It is almost always a place she
     mentioned in passing — "we serve Raleigh" — and storing it as her business
     address would put a card in front of her asking her to confirm a street she
     never gave. The street line is what makes it one. */
  return parts && parts.line1 ? parts : null;
}

/** Somewhere she works: the states and cities she named, and nothing implied. */
function areaFrom(value: unknown): { states: string[]; cities: string[] } | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  const list = (k: string): string[] =>
    Array.isArray(o[k]) ? (o[k] as unknown[]).filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];
  const states = list("states");
  const cities = list("cities");
  /* NO TRAVEL RUNG. It is the third part of a service area and the one a
     sentence almost never carries; the row leaves it unset and she picks it. */
  return states.length === 0 && cities.length === 0 ? null : { states, cities };
}

/**
 * The jobs she described.
 *
 * `customerType` and `role` are REQUIRED by `JobEntry` and are not in the
 * sentence, so they are filled with the record's own defaults and then dropped
 * again: `past_performance` lowers through its legacy adapter, which keeps only
 * customer, work, worth and result. Nothing a model guessed reaches disk.
 */
function entriesFrom(value: unknown): { kind: "entries"; entries: unknown[] } | null {
  if (!Array.isArray(value)) return null;
  const entries = value
    .map((raw, i) => {
      const parts = pick(raw, ["customer", "scope", "worth"]);
      if (!parts || !parts.customer) return null;
      return {
        id: `i${i}`,
        customer: parts.customer,
        scope: parts.scope ?? "",
        worth: parts.worth ?? "",
        customerType: "private" as const,
        role: "prime" as const,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
  return entries.length === 0 ? null : { kind: "entries", entries };
}

function answerFor(field: TellField, value: unknown, heard: string): unknown {
  const kind = kindOf(field) ?? field.mbType;
  if (typeof value === "number") {
    if (!corroborated(field, value, heard)) return null;
    return kind === "count" ? { n: value, unit: countUnitFor(field.key) } : value;
  }
  if (typeof value === "string") {
    if (kind === "list") return null;
    /* THE ROW STORES `{has, url}` AND A BARE STRING IS NOT REFUSED — it is
       accepted and lowered to `{has:"unsure"}`, so the address she just gave
       is dropped and the row reads "Not sure". Asked for as text, stored as
       the shape. `has` is the STRING "yes"; a boolean degrades the same way. */
    if (controlOf(field) === WEBSITE_CONTROL) {
      const url = value.trim();
      return url === "" ? null : { has: "yes", url };
    }
    return value;
  }
  if (kind === "address") return addressFrom(value);
  if (kind === "area") return areaFrom(value);
  if (kind === "entries") return entriesFrom(value);
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) return null;
  // A legacy `three-things` row stores the bare strings; only the `list` kind of
  // an `mb` row carries ids, because only its editor makes them.
  if (kind !== "list") return value;
  return storageFor(field.key) === "legacy" ? value : value.map((text, i) => ({ id: `i${i}`, text }));
}

/** Whether the model's value IS a don't-know, in either shape an option row
 *  takes — one for a `choice`, a list for `choices`. */
function saysDontKnow(value: unknown): boolean {
  if (typeof value === "string") return DONT_KNOW.has(value);
  if (Array.isArray(value)) return value.some((v) => typeof v === "string" && DONT_KNOW.has(v));
  return false;
}

/**
 * One candidate as a fact, or null — which leaves her sentence in `leftover`.
 *
 * The order is the point: the quote has to be hers before the value is looked
 * at, and the value has to survive the record's own gate before it is a fact.
 */
function factFor(field: TellField, candidate: Candidate, text: string): ExtractedFact | null {
  const heard = heardIn(text, candidate.quote);
  if (heard === null) {
    console.warn("[tell] model quoted text she did not write; fact dropped", { field: field.key });
    return null;
  }
  // Belt as well as braces: the prompt no longer offers these, and a reply that
  // reaches for one anyway is not a fact about her business.
  if (saysDontKnow(candidate.value)) {
    console.warn("[tell] model proposed a don't-know option; fact dropped", { field: field.key });
    return null;
  }
  const answer = answerFor(field, candidate.value, heard);
  if (answer === null || answer === undefined) return null;

  // Lowered by the row's OWN editor path — `storedFrom` already knows whether
  // this key wants a parsed `MbValue` or the shape it has always held on disk,
  // so a candidate travels exactly the two functions a member's own save does.
  const lowered = storedFrom(field.key, answer);
  if (lowered === null) return null;

  // The one gate. For an `mb` key it IS `parseMbValue` — the caps, the option
  // discipline and the catalog's own option labels. For a legacy key it is that
  // key's adapter, plus its own shape rule where it has one.
  const accepted = acceptStoredValue(field.key, lowered.value);
  if (!accepted.ok) {
    console.warn("[tell] the record refused a model candidate", { field: field.key, reason: accepted.reason });
    return null;
  }

  // `planTell` compares facts as `MbValue`s, so a legacy row's disk shape is
  // lifted back through the same adapter that just validated it.
  const value =
    storageFor(field.key) === "legacy"
      ? toMb(field.key, accepted.value)
      : (accepted.value as MbValue);
  return { fieldKey: field.key, value, heard };
}

/** The sentences no fact came from — everything the model could not place, in
 *  her own words. A fact's `heard` is always a real span of her text, so a
 *  sentence it touches is accounted for and the rest are not. */
function leftoverIn(text: string, facts: ExtractedFact[]): string[] {
  return sentences(text).filter(
    (sentence) => !facts.some((f) => f.heard.includes(sentence) || sentence.includes(f.heard)),
  );
}

/**
 * The model's reply as an extraction, or null when it carries no usable JSON.
 *
 * Exported because it is where every rule in this file is enforced, and the
 * golden eval set drives it directly with checked-in replies.
 */
export function readTellReply(text: string, reply: string): Extraction | null {
  const candidates = candidatesIn(reply);
  if (!candidates) return null;

  const facts: ExtractedFact[] = [];
  for (const candidate of candidates) {
    const key = typeof candidate.field === "string" ? candidate.field.slice(0, MAX_KEY_CHARS) : "";
    const field = FIELD_BY_KEY.get(key);
    if (!field) {
      console.warn("[tell] model named a field it may not fill; candidate dropped", { field: key });
      continue;
    }
    // One fact, one owner — the same rule the deterministic extractor keeps.
    if (facts.some((f) => f.fieldKey === field.key)) continue;
    const fact = factFor(field, candidate, text);
    if (fact) facts.push(fact);
  }

  return { facts, leftover: leftoverIn(text, facts), needsUpload: uploadsIn(reply, text) };
}

/**
 * The rows she was talking about that take a document.
 *
 * Her quote is checked against her own text exactly as a fact's is — a model
 * that cites words she did not write is not evidence of anything, and this
 * sentence is shown to her verbatim. No value is read even if one is sent:
 * there is nothing here for the record to hold.
 */
function uploadsIn(reply: string, text: string): UploadAim[] {
  const obj = parseJsonFromText<{ uploads?: unknown }>(reply);
  if (!obj || !Array.isArray(obj.uploads)) return [];
  const aims: UploadAim[] = [];
  for (const raw of obj.uploads.slice(0, MAX_FACTS)) {
    if (!isRecord(raw)) continue;
    const key = typeof raw.field === "string" ? raw.field.slice(0, MAX_KEY_CHARS) : "";
    const field = UNFILLABLE_BY_KEY.get(key);
    if (!field) continue;
    // One row, once — she does not need telling twice about the same document.
    if (aims.some((a) => a.fieldKey === key)) continue;
    const quote = heardIn(text, raw.quote);
    if (quote === null) {
      console.warn("[tell] model quoted text she did not write; upload aim dropped", { field: key });
      continue;
    }
    aims.push({ fieldKey: key, label: copyFor(field).label, quote, instead: insteadFor(key) });
  }
  return aims;
}

/* ── the extractor ────────────────────────────────────────────────────────── */

/** The deterministic extractor, and the reason we are back on it. Never an
 *  error to the member: the surface has to keep working with no key at all. */
/**
 * The deterministic extractor, and one line saying why it was reached.
 *
 * `why` is a REASON, never a response body: `OpenRouterHttpError` keeps the
 * provider's own text off `.message` (and off its enumerable properties)
 * precisely so this line cannot leak her sentences into a log. Her words have
 * one home, the `Provenance` row the route writes.
 */
function fallback(text: string, why: string): Extraction {
  console.warn(`[tell] model extraction unavailable (${why.slice(0, 200)}); using the deterministic extractor`);
  return extract(text);
}

/**
 * What she said, read by the model — or by the deterministic extractor when
 * there is no key, the call fails, or the reply will not parse.
 *
 * The one async `TellExtractor`. It never throws and never surfaces a provider
 * error: local dev, the demo and CI have no `OPENROUTER_API_KEY` and the surface
 * must keep working for them exactly as it did.
 */
export async function extractWithModel(text: string): Promise<Extraction> {
  if (!process.env.OPENROUTER_API_KEY) return fallback(text, "no OPENROUTER_API_KEY is set");
  try {
    const { text: reply } = await completeChatViaOpenRouter({
      systemPrompt: TELL_PROMPT,
      userText: text,
      model: MODEL,
      maxTokens: MAX_TOKENS,
      timeoutMs: TIMEOUT_MS,
    });
    return readTellReply(text, reply) ?? fallback(text, "the model returned no usable JSON");
  } catch (error) {
    return fallback(text, error instanceof Error ? error.message : String(error));
  }
}
