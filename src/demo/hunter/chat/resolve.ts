// DEMO (Hunter chat): find which opportunity the member means.
//
// The member may name it ("the Pope Army Airfield catering job"), point at it
// ("the top one", "number 2"), or say "it". The starter buttons name the top
// opportunity by its plain title, so a full title is matched first.

import type { VisibleOpp } from "../../../lib/hunterChat";
import { allRows, forYouRows, rowById, type FeedRow } from "../data";
import { searchTokens, stem } from "../query";
import { readSession } from "./session";

/** Lower case, letters and digits only, one space between words. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/'s\b/g, "")
    .replace(/[^a-z0-9$.%\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function plain(text: string): string {
  return normalize(text).replace(/[$.%-]/g, " ").replace(/\s+/g, " ").trim();
}

/** The story rows for the cards on screen. A card that the story does not know is left out. */
export function visibleRows(visible: VisibleOpp[] | undefined): FeedRow[] {
  const rows: FeedRow[] = [];
  for (const v of visible ?? []) {
    const row = rowById(v.oppKey);
    if (row) rows.push(row);
  }
  return rows;
}

const ORDINALS: [RegExp, number][] = [
  [/\b(first|1st|top|number 1|number one|no 1|#1)\b/, 0],
  [/\b(second|2nd|number 2|number two|no 2|#2)\b/, 1],
  [/\b(third|3rd|number 3|number three|no 3|#3)\b/, 2],
  [/\b(fourth|4th|number 4|#4)\b/, 3],
  [/\b(fifth|5th|number 5|#5)\b/, 4],
];

/** The opportunity that a whole plain title names, if the text holds one. */
export function titleIn(text: string): FeedRow | undefined {
  const t = plain(text);
  let best: FeedRow | undefined;
  let bestLen = 0;
  for (const row of allRows()) {
    for (const name of [row.o.plainTitle, row.o.title, row.id]) {
      const n = plain(name);
      if (n.length > bestLen && t.includes(n)) {
        best = row;
        bestLen = n.length;
      }
    }
  }
  return best;
}

/** Words that never help to find an opportunity. */
const FILLER = new Set([
  "am", "is", "are", "i", "me", "my", "we", "you", "it", "this", "that", "the", "a", "an", "to", "for",
  "of", "in", "on", "at", "about", "tell", "show", "what", "whats", "which", "how", "why", "does", "do",
  "ready", "bid", "eligible", "fit", "good", "match", "matches", "qualify", "can", "should", "one", "job",
  "opportunity", "contract", "work", "and", "or", "with", "any", "more", "details", "detail", "info",
  "compare", "save", "open", "who", "when", "where", "deadline", "close", "closes", "value", "worth",
]);

/** Finds the opportunity by the words that the text shares with its title, agency and place. */
function byKeywords(text: string): FeedRow | undefined {
  const tokens = searchTokens(text).filter((t) => !FILLER.has(t) && t.length > 2);
  if (tokens.length === 0) return undefined;
  const scored = allRows()
    .map((row) => {
      let score = 0;
      for (const t of tokens) {
        const root = stem(t);
        if (row.haystack.includes(t)) score += 1;
        else if ([...row.words].some((w) => w.startsWith(root))) score += 0.6;
      }
      return { row, score, rank: row.o.hunter.forYouRank ?? 99 };
    })
    .sort((a, b) => b.score - a.score || a.rank - b.rank);
  const [best, second] = scored;
  if (!best || best.score < Math.min(2, tokens.length)) return undefined;
  // One word ("the Mackall one") may name several; the higher-ranked one wins.
  // Several words must single one out, or the member did not name an opportunity.
  const clear = !second || best.score - second.score >= 1;
  return clear || tokens.length === 1 ? best.row : undefined;
}

/**
 * The opportunity the member means.
 * Order: full title, a pointer ("the top one"), "it", then shared keywords.
 */
export function findOpp(norm: string, visible: FeedRow[]): FeedRow | undefined {
  const named = titleIn(norm);
  if (named) return named;

  const list = visible.length > 0 ? visible : forYouRows();
  for (const [rx, index] of ORDINALS) {
    if (rx.test(norm) && list[index]) return list[index];
  }
  if (/\b(last|bottom)\b/.test(norm) && list.length > 0) return list[list.length - 1];

  const kw = byKeywords(norm);
  if (kw) return kw;

  if (/\b(it|this|that|this one|that one|the same)\b/.test(norm)) {
    const last = readSession().lastOppId;
    if (last) return rowById(last);
  }
  return undefined;
}
