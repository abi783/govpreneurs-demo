// How a stored fact reads in the "Hunter knows you" panel: the tidy rules that
// turn capability-statement prose and machine-lifted fragments into one
// scannable line, plus the packing rule that fills the panel's three-line
// viewport. Pure — no React, no DOM, no measurement — so every rule is testable
// without rendering anything.
import type { FactSource } from "./hunterChat";
import type { KnowsYouFact } from "./knowsYouFacts";
import { SET_ASIDES } from "./vocab/filterOptions";
import { stateName } from "./vocab/usStates";
import { stripInvisible } from "./displayText";

/** Lines of text the panel shows at a time.
 *
 *  THREE, not two. At two, a one-line row could never share a page with a
 *  two-line one (1 + 2 = 3 > 2), so "Service location" paged alone while
 *  "Differentiators" waited its turn — the member saw one field at a time. Three
 *  is the smallest count that lets the common pair (one short row + one wrapped
 *  row) sit together. Reserving the third line costs nothing on a still panel:
 *  `.ky-panel__page` takes only the height it needs unless it is cycling. */
export const PAGE_LINES = 3;

/** APPROXIMATE characters per wrapped line in the value column.
 *  Deliberately an estimate: measuring the real wrapped height needs the DOM,
 *  which is hard to test and thrashes on resize. The CSS ceiling on
 *  `.ky-panel__page` is the actual guarantee — this constant only decides how
 *  rows are packed, so being a line out costs a slightly loose page, never a
 *  broken layout.
 *
 *  MEASURED from rendered panels rather than guessed: at the previous 12.5px,
 *  "Built a Hospital Management System" (34) and "Building complex systems,
 *  Build high" (36) each occupied one line while "Security, Defense,
 *  Healthcare," (30) wrapped before "Schooling" would take it to 40 — a true
 *  width of 36-39, of which 36 was the conservative end.
 *
 *  The value is now 11px, so the same column holds proportionally more:
 *  36 × 12.5/11 ≈ 41, taken as 40 to stay on the conservative side. This is
 *  SCALED from that measurement, not re-measured — if the font size changes
 *  again, scale it again or re-measure. */
export const CHARS_PER_LINE = 40;

/** The same approximation for the 80px key column at 9px UPPERCASE. Capitals are
 *  wider than lower-case and the tracking adds a little more, so the column holds
 *  ~14 — which is why the longest single-word keys are shortened to fit
 *  ("SPECIALIZATION", "DIFFERENTIATOR", 14) in `knowsYouFacts.DISPLAY_LABELS`:
 *  a single word has no space to wrap at and would otherwise break mid-word.
 *  Every key that still wraps is multi-word and wraps at a space.
 *  The key wraps by WORD, but a plain character estimate agrees with word
 *  wrapping on every label in the vocabulary, so it stays a character count
 *  rather than a wrapping simulation. */
export const LABEL_CHARS_PER_LINE = 14;

/** Longest single entry worth rendering — what a whole page could hold anyway. */
/**
 * Hard cap on one entry. Still STRICTER than `PAGE_LINES × CHARS_PER_LINE`
 * (= 117) — that product is the theoretical capacity of three full lines, but
 * real text wraps at word boundaries and leaves ragged ends, so a value sized to
 * the theoretical maximum overflows and gets clipped mid-word.
 * `factDisplay.test.ts` pins the inequality, so this cannot silently outgrow a
 * page when `PAGE_LINES` or `CHARS_PER_LINE` moves.
 *
 * Well under that ceiling on purpose: at 58 an entry occupies at most two of the
 * three lines, which is what leaves room for a second row to share the page.
 * Raising it trades pairing for a longer single value.
 */
export const MAX_ENTRY_CHARS = 58;

/** Narrative fields store their entries `;`-separated (see `tokenJoinFor` on the
 *  backend), and each entry is a line of its own. */
const ENTRY_SEPARATOR = ";";

const ELLIPSIS = "…";

/**
 * Answers that mean "I have none of these" rather than naming a value. MIRRORS
 * `NO_VALUE_ANSWERS` in the backend's `profile-facts/facts-normalize.ts` — the
 * fact is REAL and stays stored there (the enrichment journey must not ask
 * again), but it holds nothing to show. Rendered literally it reads as a defect:
 * "Credentials — None" looks like a broken row, not an answer.
 */
const NO_VALUE_ANSWERS: ReadonlySet<string> = new Set([
  "none",
  "n/a",
  "na",
  "not applicable",
  "nothing",
  "no",
]);

/** The backend's `normalizeValue`, repeated here so the two sets compare alike. */
function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** True when the stored answer denies having a value rather than supplying one. */
export function isNoValueAnswer(value: string): boolean {
  return NO_VALUE_ANSWERS.has(normalizeValue(dropTrailingPeriod(value.trim())));
}

/**
 * Labels whose stored value is a COMMA-JOINED list — the backend's `tokenJoinFor`
 * joins these fields with ", ", so every comma marks the start of a new noun
 * phrase and each one takes a capital.
 *
 * `Past performance` is deliberately ABSENT even though it is also a `tokens`
 * field: its `tokenSplit` is `;`/newline, so its commas sit INSIDE a sentence.
 * Capitalising those would turn "(state, $500K–$1M, 2024)" into
 * "(State, $500K–$1M, 2024)". A NAMED list rather than a shape heuristic, so
 * every entry is a rule a reviewer can argue with and a test can pin.
 */
const LIST_VALUED_LABELS: readonly string[] = [
  "Business category",
  "Category",
  "Core capabilities",
  "Credentials",
  "Differentiator",
  "Location",
  "NAICS codes",
  "Set-asides",
  "Specialization",
];

const LIST_LABEL_KEYS: ReadonlySet<string> = new Set(
  LIST_VALUED_LABELS.map((label) => label.toLowerCase()),
);

/** True when this row's value reads as a comma-separated list. */
export function isListValuedLabel(label: string): boolean {
  return LIST_LABEL_KEYS.has(label.trim().toLowerCase());
}

/** Splits on the comma the backend joined with, tolerating missing spaces. */
const LIST_ITEM_SEPARATOR = /\s*,\s*/;

/** Set-aside id → the name a member would recognise, reusing the SAME table the
 *  filter panel and onboarding tree render from, so the panel cannot disagree
 *  with them about what "SB" is called. */
const SET_ASIDE_NAMES: ReadonlyMap<string, string> = new Map(
  SET_ASIDES.map((option) => [option.id.toLowerCase(), option.label]),
);

/** A stored USPS code reads as a code. Only a 2-letter item is expanded, so an
 *  already-expanded name ("Georgia") passes through untouched and a second pass
 *  is a no-op. */
function expandStateCode(item: string): string {
  const code = item.trim().toUpperCase();
  return code.length === 2 ? stateName(code) : item;
}

function expandSetAsideCode(item: string): string {
  return SET_ASIDE_NAMES.get(item.trim().toLowerCase()) ?? item;
}

/** Per-label code expanders, keyed by lower-cased label. A field with no entry
 *  here keeps its stored text verbatim. */
const CODE_EXPANDERS: Readonly<Record<string, (item: string) => string>> = {
  location: expandStateCode,
  "set-asides": expandSetAsideCode,
};

/**
 * Formats a comma-joined list: expands any stored codes to their member-facing
 * names, capitalises each item, and re-joins with one space after each comma.
 * Idempotent — both expanders return their input unchanged when it is already a
 * name, so a formatted list formats to itself.
 */
function formatListValue(text: string, label: string): string {
  const expand = CODE_EXPANDERS[label.trim().toLowerCase()];
  return text
    .split(LIST_ITEM_SEPARATOR)
    .filter(Boolean)
    .map((item) => (expand ? expand(item) : item))
    .map(capitalizeFirst)
    .join(", ");
}

/** Openers that say who did the work instead of what the work was. A NAMED list
 *  rather than one sprawling regex: every entry is a rule a reviewer can argue
 *  with, and every entry is covered by a test. */
const LEAD_IN_PHRASES = [
  "designed and deployed",
  "developed and maintained",
  "responsible for",
  "implemented",
  "completed",
  "installed",
  "performed",
  "provided",
] as const;

const LEAD_IN_PRONOUNS = ["our team", "we"] as const;

/** Only stripped once an opener has already gone, so "The Woodlands campus
 *  retrofit" keeps its article. */
const LEAD_IN_ARTICLES = ["the", "an", "a"] as const;

/** Sources whose text a machine produced, and which may therefore be re-led.
 *  A member's own words (and their structured Success Center profile) are never
 *  re-written — paraphrasing those puts words in their mouth. An unknown source
 *  is treated as theirs, because that is the cheaper mistake. */
const REWRITABLE_SOURCES: readonly FactSource[] = ["document", "passive_extraction", "signal"];

function stripsLeadIn(source?: FactSource): boolean {
  return source !== undefined && REWRITABLE_SOURCES.includes(source);
}

/** Drops a leading prefix, case-insensitively and only on a word boundary, so
 *  "Weatherproofing" is never mistaken for the pronoun "we". Null = no match. */
function stripPrefix(text: string, prefixes: readonly string[]): string | null {
  const lower = text.toLowerCase();
  for (const prefix of prefixes) {
    if (lower.startsWith(prefix) && /\s/.test(text.charAt(prefix.length))) {
      return text.slice(prefix.length).trimStart();
    }
  }
  return null;
}

function stripLeadIn(text: string): string {
  const withoutPronoun = stripPrefix(text, LEAD_IN_PRONOUNS) ?? text;
  const withoutPhrase = stripPrefix(withoutPronoun, LEAD_IN_PHRASES);
  if (withoutPhrase === null) return withoutPronoun;
  return stripPrefix(withoutPhrase, LEAD_IN_ARTICLES) ?? withoutPhrase;
}

function dropTrailingPeriod(text: string): string {
  return text.replace(/\.$/, "");
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Cuts to at most `max` characters INCLUDING the ellipsis, at a word boundary —
 *  the length bound is what keeps a second pass a no-op.
 *
 *  Counted and cut by CODE POINT, not by UTF-16 code unit: `"👷".slice(0, 1)`
 *  keeps half a surrogate pair, and a lone surrogate in the DOM is not a
 *  character at all (§7.2 — truncation happens on a code-point boundary). */
function capAtWord(text: string, max: number): string {
  const points = [...text];
  if (points.length <= max) return text;
  const cut = points.slice(0, max - ELLIPSIS.length).join("");
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${head.replace(/[\s,;:.]+$/, "")}${ELLIPSIS}`;
}

/**
 * One display line for one stored entry. It only ever trims, strips and
 * re-cases — it never paraphrases, reorders meaning or invents. Text the member
 * supplied (or their Success Center profile did) gets the safe half only:
 * whitespace, trim, trailing period. Idempotent, so a formatted value formats to
 * itself.
 */
export function formatFactEntry(text: string, source?: FactSource, label?: string): string {
  // Invisible and bidi-control characters go FIRST, before anything measures,
  // splits or cases the value. `\s+` matches neither a zero-width joiner nor an
  // RTL override, so both used to survive verbatim into a row the member reads
  // back as a confirmed fact — one of them reversing what it claims, the other
  // spelling a certification whose stored token matches no gate.
  const tidied = dropTrailingPeriod(stripInvisible(text).replace(/\s+/g, " ").trim());
  // A comma-joined list is expanded and cased ITEM BY ITEM; prose keeps its
  // internal commas untouched and takes only a leading capital.
  if (label !== undefined && isListValuedLabel(label)) {
    return capAtWord(formatListValue(tidied, label), MAX_ENTRY_CHARS);
  }
  // The CAP applies to EVERY source. Truncating is not rewriting — it puts no
  // words in the member's mouth, and an over-long value does not simply look
  // untidy: it overflows the fixed three-line page and gets clipped mid-word by
  // the CSS, which is strictly worse than an honest ellipsis. Leading-capital is
  // likewise presentation, not paraphrase, so it applies to every source.
  if (!stripsLeadIn(source)) return capAtWord(capitalizeFirst(tidied), MAX_ENTRY_CHARS);
  const led = dropTrailingPeriod(stripLeadIn(tidied));
  return capAtWord(capitalizeFirst(led), MAX_ENTRY_CHARS);
}

/** One row as the panel renders it. */
export interface FactDisplayRow {
  id: string;
  label: string;
  /** One tidied line per stored entry. */
  entries: string[];
  /** The unedited stored value, kept for the row's tooltip. */
  fullValue: string;
  inferred: boolean;
  /** The journey field this row re-opens, when it is editable at all. */
  editField?: string;
}

/** Turns the merged facts into renderable rows, dropping any left with nothing
 *  to say — including a row whose every entry DENIES having a value, which is a
 *  real stored answer but renders as the defect "Credentials — None". */
export function toDisplayRows(facts: KnowsYouFact[]): FactDisplayRow[] {
  return facts.flatMap((fact) => {
    const entries = fact.value
      .split(ENTRY_SEPARATOR)
      .filter((entry) => entry.trim() !== "" && !isNoValueAnswer(entry))
      .map((entry) => formatFactEntry(entry, fact.source, fact.label))
      .filter(Boolean);
    if (entries.length === 0) return [];
    return [
      {
        id: fact.id,
        label: fact.label,
        entries,
        fullValue: fact.value,
        inferred: fact.inferred,
        ...(fact.editField ? { editField: fact.editField } : {}),
      },
    ];
  });
}

function linesFor(text: string, charsPerLine: number): number {
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

/** Approximate height of a row in text lines. Label and value sit in their own
 *  grid columns, so the row is as tall as the taller of the two — a long key
 *  that wraps to two lines makes a two-line row even beside a one-line value. */
export function estimateLines(row: FactDisplayRow): number {
  const valueLines = row.entries.reduce((sum, entry) => sum + linesFor(entry, CHARS_PER_LINE), 0);
  return Math.max(linesFor(row.label, LABEL_CHARS_PER_LINE), valueLines);
}

/**
 * Packs rows into pages of at most {@link PAGE_LINES} lines, greedily — a page
 * always fills up to three lines before the next one starts. A row taller than a
 * page on its own gets a page to itself, where the CSS clamp truncates it.
 */
export function paginate(rows: FactDisplayRow[]): FactDisplayRow[][] {
  const pages: FactDisplayRow[][] = [];
  let page: FactDisplayRow[] = [];
  let lines = 0;
  for (const row of rows) {
    const rowLines = estimateLines(row);
    if (page.length > 0 && lines + rowLines > PAGE_LINES) {
      pages.push(page);
      page = [];
      lines = 0;
    }
    page.push(row);
    lines += rowLines;
  }
  if (page.length > 0) pages.push(page);
  return pages;
}
