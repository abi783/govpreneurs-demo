// The copy rules that the crawl applies to every page (qa/copyRules.ts) must catch
// the mistakes they name and must not flag clean text.
import { describe, expect, it } from "vitest";
import { copyProblem } from "../../qa/copyRules";

describe("copy rules", () => {
  it("catch the mistakes the copy review found", () => {
    const bad: [string, string][] = [
      ["Win state, city and school-district work. Build a price that wins and still pays you.", "promises a win"],
      ["The members who win are the ones who are ready.", "promises a win"],
      ["Senior meals at two Durham County centres", "not US English"],
      ["Halal and allergen-labelled menus", "not US English"],
      ["Am I eligible? (set-aside, licences, bonding, experience)", "not US English"],
      ["County and ZIP-radius live in Advanced below until the gazetteer tree is ported.", "reads as unfinished"],
      ["This job comes up for bid again in about 1 months.", "wrong plural"],
      ["Tight — 1 days", "wrong plural"],
      ["1 opportunities · showing 1", "wrong plural"],
      ["1 awards · $11.9M", "wrong plural"],
      ["Almost all their work is in Stem and nearby, in North Carolina.", "odd place name"],
      ["Hunter will prioritise their solicitations.", "not US English"],
      ["Aramark runs the incumbent contract.", "a real company"],
    ];
    for (const [text, rule] of bad) expect(copyProblem(text)?.rule, text).toContain(rule);
  });

  it("do not flag clean text", () => {
    const good = [
      "This job comes up for bid again in about 1 month.",
      "Tight — 1 day",
      "1 opportunity · showing 1. 1 matches you. 11 opportunities.",
      "11 days left. 21 days. 1.1 days. $1 days",
      "A reply does not guarantee a place in the next one.",
      "Senior meals at two Durham County centers, 12 firms, 1 award.",
      "Hunter will prioritize their solicitations, and organizes the list.",
      "No one can promise a win. Hunter won't surface opportunities outside your reach.",
    ];
    for (const text of good) expect(copyProblem(text), text).toBeNull();
  });
});
