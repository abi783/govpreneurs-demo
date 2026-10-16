/**
 * What she said, turned into facts. Pure: no Prisma, React, clock or network.
 *
 * IT PRODUCES FACTS, NEVER RECORD WRITES. `tell.ts` runs each past the shared
 * drop matrix and the survivors become `open` proposals she confirms one at a
 * time.
 *
 * IT NEVER SILENTLY EATS WHAT SHE SAID. Every fact carries `heard` — the
 * sentence that produced it, verbatim — and every sentence that produced
 * nothing comes back in `leftover` and is shown as not understood. A sentence
 * is claimed by at most one rule; a second sentence about an answered field
 * goes to `leftover` rather than quietly replacing it.
 *
 * IT NEVER INVENTS A VALUE. A list or text fact is her own clause with only a
 * lead-in removed and her casing untouched. A number fact is the number she
 * said, and only when she also said what it measures. Anything else abstains.
 *
 * `TellExtractor` is the seam; this is the deterministic implementation and
 * also the fallback when there is no API key or the provider fails. Four
 * things are shared with the model path rather than copied: `sentences`,
 * `amountIn`, `daysIn` and `saidNumbers` — reading a number out of her words
 * is decided once, here.
 */

import { count, list, money, type MbValue } from "./mbValue";
import { countUnitFor } from "./mbEditor";
import type { UploadAim } from "./tellModel";

/** One thing she said, mapped to one field of the record. */
export interface ExtractedFact {
  /** The record key this answers. Always a catalog key. */
  fieldKey: string;
  /** The record's own view of the value. The caller lowers it with `fromMb`. */
  value: MbValue;
  /** The sentence that produced it, verbatim. Stored on the proposal as
   *  `heard` and shown to her on the card. */
  heard: string;
}

/** Everything one submission became: what was understood, and what was not. */
export interface Extraction {
  facts: ExtractedFact[];
  /** Said, and mapped to nothing. Kept and shown — never dropped. */
  leftover: string[];
  /**
   * Rows she was clearly talking about that only a document can answer.
   *
   * REQUIRED, so a second extractor cannot quietly stop reporting them. The
   * deterministic one names none and says so with an empty array.
   */
  needsUpload: UploadAim[];
}

/**
 * The one seam. Swap the implementation, not the caller: a structured
 * extraction call satisfies this and may return a promise, which is why
 * nothing downstream takes the text.
 */
export type TellExtractor = (text: string) => Extraction;

/* ── reading a number out of her own words ────────────────────────────── */

/** The spelled numbers a member actually types. Nothing above a million: the
 *  two fields this feeds are days to wait and dollars she could put in. */
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

/** The multipliers, kept apart from the digits above because they multiply
 *  what came before them rather than adding to it. */
const SCALES: Record<string, number> = { hundred: 100, thousand: 1_000, million: 1_000_000 };

const NUMBER_WORD_LIST = [...Object.keys(SCALES), ...Object.keys(NUMBER_WORDS)].join("|");
/** A run of number words: "five", "five thousand", "twenty-five hundred". */
const SPELLED_RUN = new RegExp(
  `\\b(?:${NUMBER_WORD_LIST})(?:[\\s-]+(?:and[\\s-]+)?(?:${NUMBER_WORD_LIST}))*\\b`,
  "gi",
);
const RUN_SEPARATOR = /[\s-]+/;
const AND = "and";
const THOUSANDS_COMMA = /(\d),(\d)/g;

/** "five thousand" → 5000. The ordinary spoken-number accumulation: words add,
 *  scales multiply what has been said since the last one. */
function spelledValue(run: string): number {
  let total = 0;
  let current = 0;
  for (const word of run.toLowerCase().split(RUN_SEPARATOR)) {
    if (word === AND) continue;
    const scale = SCALES[word];
    if (scale === undefined) {
      current += NUMBER_WORDS[word];
    } else if (scale === SCALES.hundred) {
      current = (current === 0 ? 1 : current) * scale;
    } else {
      total += (current === 0 ? 1 : current) * scale;
      current = 0;
    }
  }
  return total + current;
}

/**
 * Her sentence with every number written as digits, so one plain pattern can
 * read "$5,000", "5k" and "five thousand dollars" alike. Used ONLY to read a
 * number out — her own words are never rewritten anywhere she can see them.
 */
function withDigits(sentence: string): string {
  return sentence
    .replace(THOUSANDS_COMMA, "$1$2")
    .replace(SPELLED_RUN, (run) => String(spelledValue(run)));
}

/** An amount, and only where she said it was money: "$5,000", "5000 dollars",
 *  "5k", "five thousand dollars". A bare number is NOT an amount — "one van"
 *  is not a thousand dollars, and abstaining is the whole point. */
const AMOUNT = /\$\s*(\d+(?:\.\d+)?)\s*(k|thousand|million)?|\b(\d+(?:\.\d+)?)\s*(k|thousand|million)?\s*(?:dollars|usd)\b/i;
const AMOUNT_SCALE: Record<string, number> = { k: 1_000, thousand: 1_000, million: 1_000_000 };

/** The amount she named in this sentence, or null when she named none. Shared
 *  with the model extractor, which refuses a money candidate this cannot find. */
export function amountIn(sentence: string): number | null {
  const match = AMOUNT.exec(withDigits(sentence));
  if (!match) return null;
  const digits = match[1] ?? match[3];
  const scale = (match[2] ?? match[4] ?? "").toLowerCase();
  const amount = Number(digits) * (AMOUNT_SCALE[scale] ?? 1);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : null;
}

/** A stretch of time, and only where she named the unit. `a month` is one
 *  month; a bare "30" is nothing at all. */
const DURATION = /\b(\d+|an?)\s*(day|week|month)s?\b/i;
/** A month is thirty days here, which is the same month the row's own helper
 *  means by "many buyers pay thirty to forty days after the invoice". */
const DAYS_IN: Record<string, number> = { day: 1, week: 7, month: 30 };
const ONE = 1;
/** Every run of digits left once the spelled numbers have been written out. */
const DIGITS = /\d+(?:\.\d+)?/g;

/** The stretch of time she named, as days, or null when she named none. Shared
 *  with the model extractor, on the one row measured in days. */
export function daysIn(sentence: string): number | null {
  const match = DURATION.exec(withDigits(sentence));
  if (!match) return null;
  const n = /^\d/.test(match[1]) ? Number(match[1]) : ONE;
  const days = Math.round(n * DAYS_IN[match[2].toLowerCase()]);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

/** Every number she actually said, spelled ones included: "three vans" → [3].
 *  Shared with the model extractor, which refuses a quantity that is not here —
 *  "a few vans" says no number, and three is not ours to put on her record. */
export function saidNumbers(sentence: string): number[] {
  return [...withDigits(sentence).matchAll(DIGITS)].map((m) => Number(m[0]));
}

/* ── reading her own words back out ───────────────────────────────────── */

/** The ways a member opens a sentence about her own business. Removed so the
 *  stored item reads as a fact rather than as half a sentence. Longest first —
 *  the alternation is leftmost-first. */
const LEAD_IN =
  /^(?:i have got|i have|i've got|i've|i own|i run|i use|i keep|we have|we own|we run|we use|there is|there are|most of my work is|most of my work|my work is|we mostly do|i mostly do|we specialise in|we specialize in|i specialise in|i specialize in|we do|i do)\s+/i;
const TERMINATOR = /[.!?]+$/;
/** How she separates the things in a list she says out loud. */
const PHRASE_SPLIT = /\s*,\s*|\s+and\s+/i;

/** Her sentence as a fact: the terminator and the lead-in removed, and not one
 *  other character changed. Her casing is hers. */
function clause(sentence: string): string {
  const body = sentence.trim().replace(TERMINATOR, "").trim();
  const stripped = body.replace(LEAD_IN, "").trim();
  return stripped === "" ? body : stripped;
}

/** One clause, as the several things she named in it. */
function phrases(sentence: string): string[] {
  return clause(sentence)
    .split(PHRASE_SPLIT)
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase !== "");
}

/* ── the rules ────────────────────────────────────────────────────────── */

interface Rule {
  /** The catalog key this rule answers. */
  fieldKey: string;
  /** What has to be in the sentence for the rule to look at it at all. */
  trigger: RegExp;
  /** The value, or null to abstain — she mentioned it and did not say it. */
  build: (sentence: string) => MbValue | null;
}

const PAYMENT_TERMS = "payment_terms_tolerance";

/**
 * Five facts, on five catalog rows, in four parts of the record.
 *
 * Deliberately narrow. A rule exists here only where a spoken sentence can
 * become the value WITHOUT coercion: a list of her own phrases, an amount, a
 * stretch of time. Five counties, a certificate with an expiry date or a list
 * of past jobs need their own editor, and squeezing a sentence into one of
 * them would destroy the typed value this whole record exists to protect.
 */
const RULES: Rule[] = [
  {
    fieldKey: "equipment",
    trigger: /\b(vans?|trucks?|trailers?|warming box(?:es)?|cold storage|freezers?|ovens?)\b/i,
    build: (sentence) => list(clause(sentence)),
  },
  {
    fieldKey: "professional_references",
    trigger: /\b(speak for me|speak for my work|knows my work|vouch for me|will vouch|as a reference|give me a reference)\b/i,
    build: (sentence) => list(clause(sentence)),
  },
  {
    fieldKey: PAYMENT_TERMS,
    trigger: /\b(paid|payment|invoiced?)\b/i,
    build: (sentence) => {
      const days = daysIn(sentence);
      // The unit is the row's own, so the record never holds one fact in two
      // units. `mbEditor` authors it; nothing is restated here.
      return days === null ? null : count(days, countUnitFor(PAYMENT_TERMS) ?? "days");
    },
  },
  {
    fieldKey: "working_capital",
    trigger: /\b(own money|my own|put in|put into|invest|savings|saved up|capital)\b/i,
    build: (sentence) => {
      const amount = amountIn(sentence);
      return amount === null ? null : money(amount);
    },
  },
  {
    fieldKey: "search_keywords",
    trigger: /\b(most of my work|my work is|we mostly do|i mostly do|we specialise|we specialize|i specialise|i specialize)\b/i,
    build: (sentence) => {
      const found = phrases(sentence);
      return found.length === 0 ? null : list(...found);
    },
  },
];

/* ── the extraction ───────────────────────────────────────────────────── */

/** Sentence enders and line breaks. She may type neither, in which case the
 *  whole thing is one sentence — which is correct, not a failure. */
const SENTENCES = /(?<=[.!?])\s+|\n+/;

/**
 * Her submission as the sentences she typed, blanks dropped.
 *
 * Shared with the model extractor so both report `leftover` in the same units —
 * her own sentences, never a machine's idea of a span.
 */
export function sentences(text: string): string[] {
  return text
    .split(SENTENCES)
    .map((raw) => raw.trim())
    .filter((sentence) => sentence !== "");
}

/**
 * What she said, as facts and as the honest remainder.
 *
 * One sentence produces at most one fact: the first rule that both triggers
 * AND builds a value claims it. A sentence that claims a field another
 * sentence already answered goes to `leftover` instead of overwriting it —
 * one fact, one owner, and she can see the part that did not land.
 */
export const extract: TellExtractor = (text) => {
  const facts: ExtractedFact[] = [];
  const leftover: string[] = [];

  for (const sentence of sentences(text)) {
    const fact = factIn(sentence, facts);
    if (fact) facts.push(fact);
    else leftover.push(sentence);
  }

  // The regex extractor names no document rows — it has no way to tell what a
  // sentence was ABOUT, only what it matched.
  return { facts, leftover, needsUpload: [] };
};

/** The one fact this sentence produces, or null — which is what puts it in
 *  `leftover`. `taken` is what earlier sentences already answered. */
function factIn(sentence: string, taken: ExtractedFact[]): ExtractedFact | null {
  for (const rule of RULES) {
    if (!rule.trigger.test(sentence)) continue;
    if (taken.some((fact) => fact.fieldKey === rule.fieldKey)) continue;
    const value = rule.build(sentence);
    if (value === null) continue;
    return { fieldKey: rule.fieldKey, value, heard: sentence };
  }
  return null;
}
