import type { ReactNode } from "react";
import { searchTerms } from "../../lib/search/match";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds a function that marks the search words in a piece of text, the way search
 * results do on Google or LinkedIn: the matched words stand out, so she sees at once
 * why a result is here. Returns null when there is no search, so callers render as usual.
 */
export function makeHighlighter(q: string | undefined): ((text: string) => ReactNode) | null {
  if (!q || !q.trim()) return null;
  const { words, phrases, ids } = searchTerms(q);
  // A word or phrase of 4 or more characters also marks longer forms ("cater" marks
  // "catering"). A shorter one ("nc", "va") marks only the whole word, so "va" never marks
  // "Valor". A code with digits also marks its longer forms ("7223" marks "722310").
  const ending = (p: string) =>
    /\d/.test(p)
      ? "[a-z0-9]*"
      : p.replace(/[^a-z0-9]/gi, "").length >= 4
        ? "[a-z]*"
        : "(?![a-z0-9])";
  const parts = [
    ...phrases.filter(Boolean).map((p) => `${escape(p).replace(/[\s-]+/g, "[\\s-]+")}${ending(p)}`),
    ...words.filter(Boolean).map((w) => `${escape(w)}${ending(w)}`),
    // An ID typed without hyphens still marks the written ID: "w9124725d" marks "W91247-25-D".
    ...ids.map((id) => [...id].map(escape).join("[\\s-]?")),
  ].sort((a, b) => b.length - a.length);
  if (!parts.length) return null;
  const re = new RegExp(`(?<![a-z0-9])(${parts.join("|")})`, "gi");
  return (text: string) => {
    if (!text) return text;
    const out: ReactNode[] = [];
    let last = 0;
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      if (i > last) out.push(text.slice(last, i));
      out.push(
        <mark key={i} className="hl">
          {m[0]}
        </mark>,
      );
      last = i + m[0].length;
    }
    if (!out.length) return text;
    if (last < text.length) out.push(text.slice(last));
    return out;
  };
}

/** One highlighter shared by a list: `hl(text)` returns the text, marked or not. */
export const highlight = (hl: ((text: string) => ReactNode) | null, text: string): ReactNode =>
  hl ? hl(text) : text;
