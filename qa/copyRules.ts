// Copy rules for the demo. The crawl checks the visible text of every page, and every
// placeholder, title, aria-label and alt text, against these patterns.
//
// A pattern here is a mistake that a sharp prospect would see: a promise to win, a word
// that is not US English, a build note, or a count that reads "1 months".
// Add a pattern when the copy review finds a new kind of mistake.

/** The text must not match. Each entry names the rule, so the failure says what to fix. */
export const COPY_RULES: { rule: string; pattern: RegExp }[] = [
  {
    rule: "promises a win",
    pattern: /\b(you(?:'ll| will) (?:win|get the (?:job|contract))|guaranteed? (?:to )?(?:win|an? award)|sure to win|build a price that wins|price to win|members who win)\b/i,
  },
  {
    rule: "not US English",
    pattern: /\b(centres?|licences?|labelled|prioritis(?:e|es|ed|ing)|colour\w*|organis(?:e|es|ed|ation)|fortnight|programme)\b/i,
  },
  {
    rule: "reads as unfinished",
    pattern: /\b(lorem ipsum|TODO|TBD|gazetteer)\b|\bcoming soon\b/i,
  },
  {
    rule: "wrong plural (1 months, 1 days, 1 awards)",
    pattern: /(?<![\d.,$])1 (?:months|days|weeks|hours|awards|firms|jobs|orders|forecasts|matches)\b/i,
  },
  {
    rule: "odd place name (Stem, NC)",
    pattern: /\bStem(?:,| and nearby)/,
  },
  {
    rule: "a real company as a bidder, incumbent or partner",
    pattern: /\b(Sodexo|Aramark|Compass Group|Eurest|ABM Industries|Chartwells|Centerplate)\b/i,
  },
  {
    rule: "HigherGov",
    pattern: /highergov/i,
  },
];

/** The first rule that the text breaks, with the words that break it. */
export function copyProblem(text: string): { rule: string; found: string; context: string } | null {
  for (const { rule, pattern } of COPY_RULES) {
    const m = pattern.exec(text);
    if (m) {
      const at = text.indexOf(m[0]);
      return { rule, found: m[0], context: text.slice(Math.max(0, at - 40), at + 60) };
    }
  }
  return null;
}
