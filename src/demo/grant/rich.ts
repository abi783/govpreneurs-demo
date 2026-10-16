// DEMO: small writing helpers for Grant's sample analyses.
//
// Grant's words are `RichLine` values: runs of text, with one bold run that
// carries the consequence. These helpers let a sentence be written as plain
// text with `**bold**` marks, and build the "pins" (source chips) that sit
// beside a claim.

import type {
  Conversation,
  Pin,
  Provenance,
  ProvenanceType,
  RichLine,
  Segment,
} from "@/lib/grant/types";

/** "Plain text with **one bold phrase**" → RichLine. */
export function rt(text: string): RichLine {
  const out: Segment[] = [];
  text.split("**").forEach((part, i) => {
    if (part) out.push({ text: part, bold: i % 2 === 1 });
  });
  return out.length > 0 ? out : [{ text: "" }];
}

/** Flat text of a rich line. */
export function plain(line: RichLine): string {
  return line.map((s) => s.text).join("");
}

/**
 * Bold one phrase inside a sentence. The phrase must be in the sentence: when it
 * is not, the sentence stays plain and `missingBold` reports it (the tests fail on it).
 */
export function boldIn(text: string, phrase: string | undefined): RichLine {
  if (!phrase) return [{ text }];
  const at = text.indexOf(phrase);
  if (at < 0) return [{ text }];
  const out: Segment[] = [];
  if (at > 0) out.push({ text: text.slice(0, at) });
  out.push({ text: phrase, bold: true });
  if (at + phrase.length < text.length) out.push({ text: text.slice(at + phrase.length) });
  return out;
}

export function missingBold(text: string, phrase: string | undefined): boolean {
  return Boolean(phrase) && !text.includes(phrase as string);
}

/** First sentence of a text (up to the first full stop that ends a sentence). */
export function firstSentence(text: string): string {
  const m = /^(.+?[.!?])(\s|$)/.exec(text.trim());
  return m ? m[1] : text.trim();
}

/** Split a text into sentences. */
export function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
}

// ── Pins ─────────────────────────────────────────────────────────────────

/** A bare pin: label, type, ref and an optional quote. */
export const pin = (label: string, type: ProvenanceType, ref: string, quote?: string): Pin => ({
  label,
  provenance: { type, ref, quote },
});

/** A solicitation pin with the neighbouring clauses, so the quote cannot read as cherry-picked. */
export const pinx = (
  label: string,
  ref: string,
  locator: string,
  before: string | undefined,
  span: string,
  after: string | undefined,
): Pin => ({
  label,
  provenance: {
    type: "solicitation",
    ref,
    quote: span,
    locator,
    excerpt: { before, span, after },
  },
});

/** A source Grant could not read. The sheet says so and says whether the analysis used it. */
export const pinMissing = (
  label: string,
  ref: string,
  reason: string,
  usedInAnalysis: boolean,
): Pin => ({
  label,
  provenance: { type: "solicitation", ref, unavailable: { reason, usedInAnalysis } },
});

/** A pin backed by something that was said: the member's words, or a mentor call. */
export const pinSaid = (
  label: string,
  type: "chat" | "transcript",
  ref: string,
  conversation: Conversation,
): Pin => ({
  label,
  provenance: {
    type,
    ref,
    quote: conversation.turns.find((turn) => turn.id === conversation.citedTurnId)?.text,
    conversation,
  },
});

/** A pin backed by a public government record. The record travels with the pin. */
export const pinPublic = (label: string, ref: string, payload: Partial<Provenance>): Pin => ({
  label,
  provenance: { type: "public", ref, ...payload },
});

/** A pin for arithmetic: the quote shows the working. */
export const pinComputed = (label: string, working: string): Pin => ({
  label,
  provenance: { type: "computed", ref: `computed:${label}`, quote: working },
});
