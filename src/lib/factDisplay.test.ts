import { describe, it, expect } from "vitest";
import {
  CHARS_PER_LINE,
  MAX_ENTRY_CHARS,
  PAGE_LINES,
  estimateLines,
  formatFactEntry,
  paginate,
  toDisplayRows,
} from "./factDisplay";
import type { KnowsYouFact } from "./knowsYouFacts";

/** The worst real value we have: one past-performance entry from the Charlotte
 *  member's capability statement (see the fact-display design doc). */
const CHARLOTTE =
  "Designed and deployed a web-based platform with administrative dashboard " +
  "functionality to support operational tracking for physical security officers, " +
  "including digital outreach channels and ongoing system support";

const DOCUMENT_VALUES = [
  CHARLOTTE,
  "Installed ducting and rooftop units across three county facilities",
  "Completed ventilation upgrades for a regional hospital",
  "Implemented a fleet maintenance schedule",
  "Provided 24/7 monitoring",
  "Performed annual chiller retrofits",
  "Responsible for grounds maintenance at two federal sites",
  "We designed and deployed a scheduling tool",
  "Our team maintains the district's HVAC plant",
  "Developed and maintained the payroll integration.",
];

function fact(over: Partial<KnowsYouFact> = {}): KnowsYouFact {
  return { id: "f1", label: "Past performance", value: "x", inferred: false, ...over };
}

describe("formatFactEntry — the safe half, applied to every source", () => {
  it("collapses internal whitespace and trims", () => {
    expect(formatFactEntry("  chiller   retrofit\n  work ", "member_stated")).toBe(
      "Chiller retrofit work",
    );
  });

  it("drops a single trailing period", () => {
    expect(formatFactEntry("chiller retrofit.", "member_stated")).toBe("Chiller retrofit");
  });

  it("leaves a member's own WORDING alone — no lead-in stripping", () => {
    // THE protection: "installed" is a LEAD_IN_PHRASE and is stripped for a
    // machine-written source, but a member's own opener survives. Only the
    // leading CAPITAL is applied — casing is presentation, not paraphrase, so it
    // puts no words in their mouth.
    expect(formatFactEntry("installed ducting", "member_stated")).toBe("Installed ducting");
    expect(formatFactEntry("installed ducting", "document")).toBe("Ducting");
    expect(formatFactEntry(CHARLOTTE, "member_stated").startsWith("Designed and deployed a web-based")).toBe(true);
  });

  it("still CAPS a member's value — truncating is not rewriting", () => {
    // The cap applies to every source. An over-long value does not merely look
    // untidy: it overflows the fixed three-line page and is clipped mid-word by
    // the CSS, which is worse than an honest ellipsis.
    const out = formatFactEntry(CHARLOTTE, "member_stated");
    expect(out.length).toBeLessThanOrEqual(MAX_ENTRY_CHARS);
    expect(out.endsWith("…")).toBe(true);
  });

  it("leaves a Success Center value alone too — it is already structured", () => {
    expect(formatFactEntry("8(a), HUBZone", "success_center")).toBe("8(a), HUBZone");
  });

  it("does not strip a lead-in when the source is unknown", () => {
    // Unknown provenance is treated as the member's words: the cost of wrongly
    // re-writing someone's sentence is higher than the cost of a clumsy row.
    expect(formatFactEntry("Installed ducting", undefined)).toBe("Installed ducting");
  });
});

describe("formatFactEntry — the full treatment, for machine-lifted text", () => {
  it("strips the throat-clearing so the work leads", () => {
    expect(formatFactEntry("Designed and deployed a web-based platform", "document")).toBe(
      "Web-based platform",
    );
  });

  it.each([
    ["Installed ducting and rooftop units", "Ducting and rooftop units"],
    ["Completed the ventilation upgrade", "Ventilation upgrade"],
    ["Implemented a fleet maintenance schedule", "Fleet maintenance schedule"],
    ["Provided 24/7 monitoring", "24/7 monitoring"],
    ["Performed annual chiller retrofits", "Annual chiller retrofits"],
    ["Responsible for grounds maintenance", "Grounds maintenance"],
    ["Developed and maintained the payroll integration", "Payroll integration"],
    ["We built the scheduling tool", "Built the scheduling tool"],
    ["Our team maintains the HVAC plant", "Maintains the HVAC plant"],
  ])("strips %j", (input, expected) => {
    expect(formatFactEntry(input, "document")).toBe(expected);
  });

  it("strips a pronoun and the opener that follows it", () => {
    expect(formatFactEntry("We designed and deployed a scheduling tool", "document")).toBe(
      "Scheduling tool",
    );
  });

  it("keeps a leading article that no opener preceded", () => {
    // "The Woodlands" is the work, not throat-clearing.
    expect(formatFactEntry("The Woodlands campus retrofit", "document")).toBe(
      "The Woodlands campus retrofit",
    );
  });

  it("keeps the original when stripping would leave nothing", () => {
    expect(formatFactEntry("Completed", "document")).toBe("Completed");
  });

  it("never strips a word that merely starts with an opener", () => {
    expect(formatFactEntry("Weatherproofing for county depots", "document")).toBe(
      "Weatherproofing for county depots",
    );
  });

  it("caps a still-too-long entry at a word boundary, with an ellipsis", () => {
    const out = formatFactEntry(CHARLOTTE, "document");

    expect(out.length).toBeLessThanOrEqual(MAX_ENTRY_CHARS);
    expect(out.startsWith("Web-based platform with administrative dashboard")).toBe(true);
    expect(out.endsWith("…")).toBe(true);
    // Cut on a word boundary, never mid-word.
    expect(CHARLOTTE.toLowerCase()).toContain(
      out.slice(0, -1).toLowerCase().replace("web-based", "a web-based"),
    );
  });

  it("marks a passively-extracted fragment the same way as a document one", () => {
    expect(formatFactEntry("installed ducting", "passive_extraction")).toBe("Ducting");
    expect(formatFactEntry("installed ducting", "signal")).toBe("Ducting");
  });
});

describe("formatFactEntry — idempotence", () => {
  it.each(DOCUMENT_VALUES)("formatting an already-formatted value is a no-op: %j", (value) => {
    const once = formatFactEntry(value, "document");
    expect(formatFactEntry(once, "document")).toBe(once);
  });

  it.each(DOCUMENT_VALUES)("is a no-op for member text too: %j", (value) => {
    const once = formatFactEntry(value, "member_stated");
    expect(formatFactEntry(once, "member_stated")).toBe(once);
  });
});

describe("toDisplayRows", () => {
  it("splits a `;`-separated narrative into one entry per line, each tidied", () => {
    const [row] = toDisplayRows([
      fact({
        value: "Installed ducting; Completed the RTU swap; Provided ongoing support",
        source: "document",
      }),
    ]);

    expect(row.entries).toEqual(["Ducting", "RTU swap", "Ongoing support"]);
  });

  it("keeps the unedited value for the row's tooltip", () => {
    const [row] = toDisplayRows([fact({ value: CHARLOTTE, source: "document" })]);

    expect(row.fullValue).toBe(CHARLOTTE);
    expect(row.entries[0]).not.toBe(CHARLOTTE);
  });

  it("carries the label and the inferred marker through", () => {
    const [row] = toDisplayRows([fact({ label: "Crew size", value: "12 techs", inferred: true })]);

    expect(row).toMatchObject({ label: "Crew size", inferred: true });
  });

  it("drops a fact whose value is nothing but separators", () => {
    expect(toDisplayRows([fact({ value: " ; ; " })])).toEqual([]);
  });
});

describe("paginate", () => {
  const row = (id: string, value: string, label = "Trade") =>
    toDisplayRows([fact({ id, label, value })])[0];

  const short = (id: string) => row(id, "chiller retrofit", "Trade");

  it("packs greedily — several one-line rows share a page", () => {
    // THE behaviour that makes a short fact not monopolise the panel: rows keep
    // being added until the next one would not fit.
    const pages = paginate([short("a"), short("b"), short("c"), short("d")]);

    expect(pages.map((p) => p.map((r) => r.id))).toEqual([["a", "b", "c"], ["d"]]);
  });

  it("sits a one-line row beside a two-line one — the pair that was splitting", () => {
    // The regression that made the member see one field at a time: at two lines
    // a short row could never share with a wrapped one (1 + 2 > 2).
    // A SHORT key: at 9px the column holds ~14 chars, so a longer key wraps and
    // makes its own row two lines tall — see the wrapping test below.
    const shortRow = row("loc", "Charlotte, North Carolina", "Credentials");
    const wrapped = row("diff", "Building complex systems, build high quality", "Differentiator");

    expect(estimateLines(shortRow)).toBe(1);
    expect(estimateLines(wrapped)).toBe(2);
    expect(paginate([shortRow, wrapped]).map((p) => p.map((r) => r.id))).toEqual([
      ["loc", "diff"],
    ]);
  });

  it("never lets a page exceed three lines", () => {
    const rows = [short("a"), row("b", "x".repeat(CHARS_PER_LINE * 2)), short("c")];

    for (const page of paginate(rows)) {
      const lines = page.reduce((sum, r) => sum + estimateLines(r), 0);
      expect(lines).toBeLessThanOrEqual(PAGE_LINES);
    }
  });

  it("gives a field longer than three lines a page of its own", () => {
    const long = row("long", `${"x".repeat(90)}; ${"y".repeat(90)}; ${"z".repeat(90)}`);
    const pages = paginate([short("a"), long, short("b")]);

    expect(pages.map((p) => p.map((r) => r.id))).toEqual([["a"], ["long"], ["b"]]);
  });

  it("counts a key that wraps, not just the value", () => {
    // The key wraps by word rather than truncating — a clipped key stops
    // identifying its row — so a two-line key makes a two-line row.
    // One line: every key that fits the ~14-char column, including the two
    // single-word keys shortened for exactly that reason.
    expect(estimateLines(row("c", "Houston, TX", "Trade"))).toBe(1);
    expect(estimateLines(row("st", "Houston, TX", "Set-asides"))).toBe(1);
    expect(estimateLines(row("ss", "Houston, TX", "Service states"))).toBe(1);
    expect(estimateLines(row("sl", "Houston, TX", "Location"))).toBe(1);
    expect(estimateLines(row("sp", "Houston, TX", "Specialization"))).toBe(1);
    expect(estimateLines(row("df", "Houston, TX", "Differentiator"))).toBe(1);

    // Two lines: the multi-word keys, which wrap at their space.
    expect(estimateLines(row("l", "Houston, TX", "Core capabilities"))).toBe(2);
    expect(estimateLines(row("b", "Houston, TX", "Business category"))).toBe(2);
    expect(estimateLines(row("cs", "Houston, TX", "Capability summary"))).toBe(2);
  });

  it("returns no pages at all for no rows", () => {
    expect(paginate([])).toEqual([]);
  });
});

describe("no-value answers are stored but never shown", () => {
  it.each(["None", "none", "N/A", "na", "not applicable", "Nothing", "no", "None."])(
    "drops a row whose whole value is %j",
    (value) => {
      expect(toDisplayRows([fact({ label: "Credentials", value })])).toEqual([]);
    },
  );

  it("drops only the denying entry when others say something", () => {
    const [row] = toDisplayRows([
      fact({ label: "Past performance", value: "None; Built a hospital system" }),
    ]);

    expect(row.entries).toEqual(["Built a hospital system"]);
  });

  it("keeps a value that merely CONTAINS a denial word", () => {
    const [row] = toDisplayRows([fact({ label: "Credentials", value: "None-destructive testing" })]);

    expect(row.entries).toEqual(["None-destructive testing"]);
  });
});

describe("capitalisation and code expansion", () => {
  it("capitalises every item of a comma-joined list", () => {
    const [row] = toDisplayRows([
      fact({ label: "Specialization", value: "security, defense, healthcare, schooling" }),
    ]);

    expect(row.entries).toEqual(["Security, Defense, Healthcare, Schooling"]);
  });

  it("expands stored USPS state codes to their names", () => {
    // "Location" is the one key states arrive under: `knowsYouFacts` folds the
    // Service states fact into the profile's location row, or renames it when
    // there is no location to fold into.
    const [row] = toDisplayRows([fact({ label: "Location", value: "Houston, TX, GA, CA" })]);

    expect(row.entries).toEqual(["Houston, Texas, Georgia, California"]);
  });

  it("expands a set-aside code to the name the filter panel uses", () => {
    const [row] = toDisplayRows([fact({ label: "Set-asides", value: "SB" })]);

    expect(row.entries).toEqual(["Small Business (Total)"]);
  });

  it("leaves prose commas alone — they are mid-sentence, not list items", () => {
    const [row] = toDisplayRows([
      fact({
        label: "Past performance",
        value: "built a hospital system (state, $500K, 2024)",
      }),
    ]);

    expect(row.entries).toEqual(["Built a hospital system (state, $500K, 2024)"]);
  });

  it("is idempotent — an expanded, capitalised list formats to itself", () => {
    const once = formatFactEntry("GA, CA", "success_center", "Service states");
    expect(formatFactEntry(once, "success_center", "Service states")).toBe(once);

    const sa = formatFactEntry("SB", "success_center", "Set-asides");
    expect(formatFactEntry(sa, "success_center", "Set-asides")).toBe(sa);
  });

  it("normalises spacing around the joining comma", () => {
    const [row] = toDisplayRows([fact({ label: "Specialization", value: "security,defense" })]);

    expect(row.entries).toEqual(["Security, Defense"]);
  });
});

describe("the page-size constants stay consistent with each other", () => {
  it("caps an entry BELOW a full page's theoretical capacity", () => {
    // The cap must leave room for ragged word-boundary wrapping. If PAGE_LINES
    // shrinks and this does not, an over-long entry stops being honestly
    // ellipsised and starts being clipped mid-word by the CSS instead.
    expect(MAX_ENTRY_CHARS).toBeLessThan(PAGE_LINES * CHARS_PER_LINE);
  });

  it("never emits an entry that overflows a page", () => {
    const [row] = toDisplayRows([fact({ label: "Past performance", value: CHARLOTTE })]);

    expect(estimateLines(row)).toBeLessThanOrEqual(PAGE_LINES);
  });
});

describe("the renamed keys keep their display rules", () => {
  // `knowsYouFacts.DISPLAY_LABELS` renames these before a row reaches here, and
  // LIST_VALUED_LABELS / CODE_EXPANDERS key off the name the row CARRIES. If the
  // two drift, list formatting and code expansion silently stop applying.
  it("still expands state codes under the shortened 'Location' key", () => {
    const [row] = toDisplayRows([fact({ label: "Location", value: "GA, CA" })]);

    expect(row.entries).toEqual(["Georgia, California"]);
  });

  it.each(["Location", "Specialization", "Differentiator", "Business category"])(
    "still treats %j as a comma-joined list",
    (label) => {
      const [row] = toDisplayRows([fact({ label, value: "alpha, beta" })]);

      expect(row.entries).toEqual(["Alpha, Beta"]);
    },
  );
});
