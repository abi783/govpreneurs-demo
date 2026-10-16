// Small orders — the dead-selector sweep and the eyebrow allowlist.
//
// Eight comments in `styles/small-orders.css` claimed a sweep held these rules.
// They named a script this repo has never held, so for every one of those eight
// claims nothing ran. This spec is the gate, and those eight comments name it
// now. It reads the stylesheet and the source tree, and it answers two
// questions.
//
// 1. DOES EVERY `.mp-*` RULE STILL HAVE AN ELEMENT BEHIND IT? A rule the app
//    never applies is a rule a reader trusts and a designer edits. The
//    stylesheet is 4,000 lines and its comments already record five earlier
//    deletions, so the drift is real rather than theoretical.
// 2. WHICH CLASSES SHOUT? `text-transform: uppercase` puts a string on screen
//    in capitals that the TSX writes in sentence case. A copy reviewer who
//    reads the TSX cannot see that. Every shouting selector is registered
//    below with the reason it shouts.
//
// Both lists fail in BOTH directions. A rule with no element fails, and an
// allowlist entry that nothing needs fails too. An allowlist that only ever
// grows is how this kind of gate rots.
//
// The scan reads `src` through `sourceScan.testkit.ts`, which excludes test
// files. That exclusion is what keeps this spec honest: the class names in the
// allowlist below are literals, and a scan that read this file would find them
// and report every allowlisted rule as alive.

import { describe, expect, it } from "vitest";
import { readSourceFile, readSourceFiles } from "./sourceScan.testkit";

/** The one stylesheet that declares `.mp-*`. Nothing else in `src` does. */
const STYLESHEET = "styles/small-orders.css";

/** The one file that has to `@import` the sheet, or none of it loads. */
const ENTRY_STYLESHEET = "styles.css";

describe("the stylesheet is reachable", () => {
  /**
   * THE DEFECT THIS CASE EXISTS FOR, 2026-09-10.
   *
   * The staging-v2 merge took `styles.css` from staging-v2, which has no
   * small-orders sheet and therefore no import for one. The line vanished and
   * `small-orders.css` stopped being loaded AT ALL — the whole surface rendered
   * as unstyled markup.
   *
   * Nothing caught it. Every test in this file reads the stylesheet off DISK,
   * so they all passed over a sheet the browser never fetched. The merge check
   * that was supposed to catch lost styles compared the classes our components
   * render against the classes the stylesheets DEFINE, and this sheet defines
   * them — so every class looked accounted for. It asked whether the rules
   * existed and never whether the file was reachable.
   *
   * A rule that is defined and not loaded is not a rule.
   */
  it("is imported by the entry stylesheet", () => {
    const entry = readSourceFile(ENTRY_STYLESHEET);
    // Match the import specifically, not a mention in a comment.
    expect(entry).toMatch(/@import\s+["']\.\/styles\/small-orders\.css["']/);
  });
});

/**
 * A class the source builds by joining a prefix to a value, so no literal scan
 * finds the whole name.
 */
interface InterpolatedClass {
  /** The full class name, as the stylesheet declares it. */
  className: string;
  /** The literal prefix the source does carry, before the interpolation. */
  builtFrom: string;
  /** Why the name cannot be found, and what supplies the rest of it. */
  reason: string;
}

/**
 * Every class the sweep cannot find, with the reason it cannot.
 *
 * A name goes here only when the source builds it. A rule nobody renders does
 * NOT go here — it gets deleted.
 */
const INTERPOLATED_CLASSES: InterpolatedClass[] = [
  {
    className: "mp-grp__n--sar",
    builtFrom: "mp-grp__n--",
    reason:
      "small-orders.restricted.tsx builds `mp-grp__n--${g.route}` for the count badge. " +
      '`route` is the union `"sar" | "approved" | "qpl" | "none" | "unknown"` in relevance.ts, and ' +
      "this is the blue branch: DLA has an approved-source form.",
  },
  {
    className: "mp-grp__n--qpl",
    builtFrom: "mp-grp__n--",
    reason:
      "The same interpolation in small-orders.restricted.tsx. The qualified-products-list " +
      "branch: DLA buys only from sellers on its list for the part, and getting on that list " +
      "runs longer than the order.",
  },
  {
    className: "mp-grp__n--unknown",
    builtFrom: "mp-grp__n--",
    reason:
      "The same interpolation in small-orders.restricted.tsx. The amber branch: nobody has " +
      "read the rule for this order yet.",
  },
  {
    className: "mp-grp__n--approved",
    builtFrom: "mp-grp__n--",
    reason:
      "The same interpolation in small-orders.restricted.tsx. The limited-competition branch: " +
      "DLA is competing the order among the sellers it already has, and the paragraph names no " +
      "form.",
  },
  {
    className: "mp-grp__n--none",
    builtFrom: "mp-grp__n--",
    reason:
      "The same interpolation in small-orders.restricted.tsx. The red branch: DLA takes no " +
      "new sellers for the part.",
  },
];

/** A selector that sets its text in capitals. */
interface Eyebrow {
  /** The selector, exactly as the stylesheet writes it. */
  selector: string;
  /** Why capitals are right here, for the reviewer who reads only the TSX. */
  reason: string;
}

/**
 * Every selector that shouts, with the reason.
 *
 * Capitals are a decision, not a stylesheet habit. A new one must be argued
 * here before it ships.
 */
const EYEBROWS: Eyebrow[] = [
  {
    selector: ".mp-h2",
    reason:
      "The box heading, taken from Grant's `.gt-kicker--rule` so the two features label a " +
      "card the same way. It is a LABEL for a card and never a sentence, and the 2px rule " +
      "under it reads as one mark with the words.",
  },
  {
    selector: ".mp-keyfacts dt",
    reason:
      "The term of the four-fact strip on the order page — `Acquisition code`, `Delivery`. " +
      "It is a column heading over a value, at 11px with 0.06em tracking, never a sentence.",
  },
  {
    selector: ".mp-source__table th",
    reason:
      "The column headings of the approved-sources table — `Supplier`, `Their number`. " +
      "Same 11px tracked treatment as the fact strip, so the two tables of government " +
      "facts read alike.",
  },
];

/**
 * The shortest a reason may be.
 *
 * A one-word reason is the failure mode this list exists to prevent: it looks
 * like a justification and carries none. Twenty characters is about four words.
 */
const MINIMUM_REASON_LENGTH = 20;

/** One rule of the stylesheet: its selectors, and the declarations inside it. */
interface CssRule {
  selectors: string[];
  declarations: string;
}

/** A `.mp-*` class name, wherever it stands. */
const MP_CLASS = /\.(mp-[A-Za-z0-9_-]+)/g;

/**
 * A `mp-*` token in source text.
 *
 * The lookbehind is load-bearing. Without it `home2-jump-sect` in `styles.css`
 * reads as the class `mp-sect` and marks a rule alive that nothing renders.
 */
const MP_TOKEN = /(?<![A-Za-z0-9_-])mp-[A-Za-z0-9_-]+/g;

/** A line that is only a comment. A name in prose does not render an element. */
const COMMENT_LINE = /^\s*(\/\/|\*|\/\*)/;

/**
 * Every rule of a stylesheet, comments removed.
 *
 * The pattern matches the innermost blocks, so a rule inside `@media` is
 * returned and the `@media` prelude is skipped. That is what this sweep wants:
 * a class is alive or dead whatever wraps it.
 */
function cssRules(styleSheet: string): CssRule[] {
  const withoutComments = styleSheet.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: CssRule[] = [];
  for (const block of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = block[1]
      .split(",")
      .map((one) => one.trim().replace(/\s+/g, " "))
      .filter((one) => one.length > 0);
    rules.push({ selectors, declarations: block[2] });
  }
  return rules;
}

/** Every `.mp-*` class the stylesheet declares, sorted. */
function declaredClasses(rules: CssRule[]): string[] {
  const found = new Set<string>();
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      for (const match of selector.matchAll(MP_CLASS)) found.add(match[1]);
    }
  }
  return [...found].sort();
}

/** Every selector whose own block sets `text-transform: uppercase`, sorted. */
function shoutingSelectors(rules: CssRule[]): string[] {
  const found = new Set<string>();
  for (const rule of rules) {
    if (!/text-transform:\s*uppercase/.test(rule.declarations)) continue;
    for (const selector of rule.selectors) found.add(selector);
  }
  return [...found].sort();
}

/**
 * Every `mp-*` token the source tree writes, from `src` and its subdirectories.
 *
 * Test files are excluded by the testkit. Comment-only lines are excluded here:
 * the stylesheet and the components both name deleted classes in prose, and a
 * name in prose renders nothing.
 */
function sourceTokens(): Set<string> {
  const tokens = new Set<string>();
  for (const file of readSourceFiles("")) {
    for (const line of file.text.split("\n")) {
      if (COMMENT_LINE.test(line)) continue;
      for (const match of line.matchAll(MP_TOKEN)) tokens.add(match[0]);
    }
  }
  return tokens;
}

const RULES = cssRules(readSourceFile(STYLESHEET));
const DECLARED = declaredClasses(RULES);
const TOKENS = sourceTokens();
const ALLOWED = new Set(INTERPOLATED_CLASSES.map((entry) => entry.className));

describe("small-orders.css — the dead-selector sweep", () => {
  it("reads a stylesheet that still has rules in it", () => {
    // The sweep passes an empty file. This is the guard against a sweep that
    // reports a clean tree it never looked at.
    expect(RULES.length).toBeGreaterThan(100);
    expect(DECLARED.length).toBeGreaterThan(100);
    expect(TOKENS.size).toBeGreaterThan(100);
  });

  it("declares no `.mp-*` rule that no element in src carries", () => {
    const dead = DECLARED.filter((name) => !TOKENS.has(name) && !ALLOWED.has(name));

    // Delete the rule. If the source builds the name by interpolation, add it
    // to INTERPOLATED_CLASSES with the reason instead.
    expect(dead).toEqual([]);
  });

  it("keeps no interpolated-class entry that nothing needs", () => {
    const declared = new Set(DECLARED);
    const stale = INTERPOLATED_CLASSES.filter(
      (entry) =>
        !declared.has(entry.className) ||
        !TOKENS.has(entry.className.slice(0, entry.builtFrom.length)) ||
        TOKENS.has(entry.className),
    ).map((entry) => entry.className);

    // Three ways an entry dies: the stylesheet dropped the rule, the source
    // dropped the interpolation, or the source now writes the name in full and
    // the sweep can find it on its own.
    expect(stale).toEqual([]);
  });

  it("gives a reason for every interpolated class", () => {
    const unexplained = INTERPOLATED_CLASSES.filter(
      (entry) => entry.reason.trim().length < MINIMUM_REASON_LENGTH,
    ).map((entry) => entry.className);

    expect(unexplained).toEqual([]);
  });
});

describe("small-orders.css — the eyebrow allowlist", () => {
  const registered = new Set(EYEBROWS.map((entry) => entry.selector));

  it("registers every selector that sets its text in capitals", () => {
    const unregistered = shoutingSelectors(RULES).filter((selector) => !registered.has(selector));

    // Add the selector to EYEBROWS with the reason capitals are right, or drop
    // the `text-transform`.
    expect(unregistered).toEqual([]);
  });

  it("keeps no eyebrow entry whose selector no longer shouts", () => {
    const shouting = new Set(shoutingSelectors(RULES));
    const stale = EYEBROWS.map((entry) => entry.selector).filter(
      (selector) => !shouting.has(selector),
    );

    expect(stale).toEqual([]);
  });

  it("gives a reason for every eyebrow", () => {
    const unexplained = EYEBROWS.filter(
      (entry) => entry.reason.trim().length < MINIMUM_REASON_LENGTH,
    ).map((entry) => entry.selector);

    expect(unexplained).toEqual([]);
  });
});
