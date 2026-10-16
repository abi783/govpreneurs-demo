// Standing guardrail for the Hunter PR-39 port (GOAL.md feature 11).
//
// The port promised two invariants. Neither is visible in a diff once the diff
// is merged, so each one is asserted here as a test that a future change fails:
//
//   1. No mock data. The shipped UI reads the real backend feed. A NEW runtime
//      (value) import from `src/lib/mock/*` must not appear.
//   2. No shared base CSS rule modified. Every `styles.css` change is a new
//      `__element` / `--modifier` selector or a Hunter-owned family.
//
// This file scans the tree, so it has no module under test and cannot sit
// beside one. `src/test/` is already the home for cross-cutting test
// infrastructure (`vitest.setup.ts`); the guardrail lives there for the same
// reason.
//
// The `.scope-pill` half of invariant 2 is NOT repeated here. Feature 8 already
// asserts it in `components/Hunter/OpportunityCard.test.tsx` ("leaves the
// shared .scope-pill base rule free of gloss-term overrides"). Duplicating it
// would give the repo two places to fix when the rule changes.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_DIR = resolve(process.cwd(), "src");

/** The one directory this guardrail is about. A specifier counts only if it resolves inside. */
const MOCK_DIR = join(SRC_DIR, "lib", "mock");
/** The only path alias the build declares (`tsconfig.json` paths, `vite.config.ts` resolve). */
const ALIAS_PREFIX = "@/";
const TEST_FILE_RE = /\.test\.tsx?$/;
const SOURCE_FILE_RE = /\.tsx?$/;

// `import <clause> from "<module>";` — the clause may span lines.
const IMPORT_RE = /import\s+([\s\S]*?)\s+from\s*["']([^"']+)["'];/g;
// `import "<module>";` — a side-effect import, which is always runtime.
const SIDE_EFFECT_RE = /^\s*import\s+["']([^"']+)["'];/gm;
const SIDE_EFFECT_SPECIFIER = "<side-effect>";

/**
 * Every runtime (value) import of a `src/lib/mock/*` module the tree holds today,
 * keyed by the importing path relative to `src/`.
 *
 * The list is an UPPER BOUND, not an equality check. A pair that is not listed
 * fails the test; a pair that is listed and later removed does not. Deleting a
 * mock dependency is the direction this repo is travelling, and a guardrail
 * that punished it would be edited away within a week.
 *
 * Re-baselined at feature 16, against the widened `isMockModule`. The list GREW
 * from 54 pairs to 63 even though the tree's real mock dependency shrank: the
 * nine `lib/*` entries below were always there, and the old specifier pattern
 * never saw them. `lib/smartList.ts` importing `OPPORTUNITIES` is the finding
 * that matters — that is fabricated opportunity DATA, not vocabulary, and it is
 * pinned here rather than fixed, because fixing it is another feature's work.
 *
 * The descoped pages — pipeline, government-buyers, forecasts, market,
 * whos-winning — keep their mock data on purpose. This list makes it visible.
 *
 * Feature V8 removed six entries — three components and three `lib/*` modules —
 * when `WORK_TYPES`, `WORK_TYPE_TO_NAICS` and `workTypeLabel()` moved to
 * `lib/vocab/trades.ts`. That vocabulary was never mock data; it only lived
 * under `lib/mock/`.
 *
 * `routes/index.tsx` is the entry that matters to this port. Its remaining
 * `lib/mock/opportunities` value is inert — `STRETCH_MODE_OPPORTUNITIES` is
 * `[]`, so it carries no fabricated data. It is listed so that adding another
 * value there, such as `OPPORTUNITIES`, fails.
 */
const ALLOWED_MOCK_VALUE_IMPORTS: Readonly<Record<string, readonly string[]>> = {
  // ── Arrived with the small-orders merge, 2026-09-10 ───────────────────────
  //
  // THESE ARE DEBT, NOT ENDORSEMENT, and they are listed rather than silently
  // permitted so the ratchet keeps ratcheting from here.
  //
  // `feat/small-orders` was cut from staging-v2 before this guardrail existed,
  // so its five runtime mock imports were never scanned. Each is a real
  // dependency of a shipped surface, not an oversight:
  //
  //   · `relevance.ts` reads MICRO_ORDERS and TODAY for the BUNDLED SAMPLE the
  //     board draws on first paint, before the feed answers. That is a design
  //     decision the route documents, and removing it would show a member an
  //     empty board for the length of a request.
  //   · the board and the wins page read the member context and the wins
  //     fixture the same way every other listed surface does.
  //
  // What retires them is the same work that retires the entries below: a live
  // source for each. Adding them here does not make them right; it makes them
  // countable.
  "lib/microPurchases/relevance.ts": ["MICRO_ORDERS", "TODAY"],

  // The forecasts entries that stood here (the recorded forecasts, prior awards,
  // buyer pages and documents) are gone: the recorded data moved to test-only
  // fixtures, and "forecasts code reads no fixture and no mock" below forbids
  // any import of them, type-only included.
  "routes/small-orders.index.tsx": ["useCurrentMember"],
  "components/Bids/BidCard.tsx": ["contextLineFor"],
  "components/Bids/BidsBoard.tsx": ["formatAwardValue", "groupByColumn"],
  "components/Buyers/BuyerCard.tsx": ["getOpenOppsForBuyer"],
  "components/Buyers/BuyerDetailPanel.tsx": ["getOpenOppsForBuyer", "getRoofingAwardsForBuyer"],
  "components/Buyers/BuyerPursueAnalysis.tsx": ["VERDICT_LABEL"],
  "components/Companion/identities/grantIdentity.tsx": ["getGrantVerdict"],
  "components/Hunter/HunterKnowsYouEmbed.tsx": ["useCurrentMember"],
  "components/Layout/MobileTabBar.tsx": ["useJourney"],
  "components/Layout/Sidebar.tsx": ["useCurrentMember", "useJourney"],
  "components/Market/LcatBenchmark.tsx": ["LCAT_RATES", "fmtRate"],
  "components/Market/PrevailingWageTable.tsx": [
    "COMPARABLE_ROOFING_AWARDS",
    "PREVAILING_WAGES_CUMBERLAND_NC",
    "PREVAILING_WAGE_META",
    "fmtMoney",
    "fmtRate",
  ],
  "components/Market/VehicleTypeChip.tsx": ["VEHICLE_TYPE_GLOSS"],
  "components/Market/VehiclesList.tsx": ["formatCeiling"],
  "components/profile/ReadinessHeader.tsx": ["hasAnyDfy"],
  "components/profile/tabs/PastPerformanceTab.tsx": ["businessProfile"],
  // The entries below were invisible to the scan before feature 16. Three of
  // the original nine went at feature V8, and a fourth shrank to one symbol.
  "lib/naicsCatalog.ts": ["NAICS_BY_CODE"],
  "lib/onboardingTrees.ts": ["naicsDescription"],
  "lib/smartList.ts": ["OPPORTUNITIES"],
  "lib/sources/records.ts": ["businessProfile"],
  "lib/sources/resolve.ts": ["OPPORTUNITIES", "getSolicitation"],
  "lib/tasks.ts": ["currentMember", "currentRoadmap", "findNextSubStep", "listBids"],
  "routes/cap-statement.builder.tsx": ["useCurrentMember"],
  "routes/government-buyers.tsx": ["GOV_BUYERS", "getBuyer", "searchBuyers"],
  "routes/home.tsx": ["NEXT_STEP_COPY", "currentMember", "findNextSubStep", "useJourney"],
  "routes/index.tsx": ["STRETCH_MODE_OPPORTUNITIES"],
  "routes/opportunities.$noticeId.tsx": ["getGrantVerdict", "getSolicitation"],
  "routes/pipeline.tsx": ["expiredBidCount", "pickHunterNudge"],
  "routes/vehicles.tsx": ["VEHICLES", "vehiclesByFit"],
  "routes/whos-winning.tsx": ["WINNERS"],
};

/**
 * Reports whether `specifier`, read from `fromFile`, resolves inside `src/lib/mock/`.
 *
 * The specifier is resolved the way the bundler resolves it — relative to the
 * importing file's directory, or to `src/` for the `@/` alias. A pattern match on
 * the specifier text cannot do this: `"./mock/govTaxonomy"` and `"../mock/bids"`
 * are the forms modules under `src/lib/` use, and a pattern loose enough to catch
 * them also catches a `mock/` directory somewhere else in the tree. Resolution
 * decides on the file the import actually reaches, so it can do neither.
 */
function isMockModule(specifier: string, fromFile: string): boolean {
  let target: string;
  if (specifier.startsWith(ALIAS_PREFIX)) {
    target = resolve(SRC_DIR, specifier.slice(ALIAS_PREFIX.length));
  } else if (specifier.startsWith(".")) {
    target = resolve(dirname(fromFile), specifier);
  } else {
    return false;
  }
  return target.startsWith(MOCK_DIR + sep);
}

/** Lists every `.ts` / `.tsx` file under `dir`, recursively. */
function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) listSourceFiles(path, out);
    else if (SOURCE_FILE_RE.test(path)) out.push(path);
  }
  return out;
}

/**
 * Returns the names an import clause binds at RUNTIME. A clause that is
 * `import type ...`, or whose every specifier carries an inline `type`, binds
 * nothing and returns an empty list.
 */
function runtimeSpecifiers(clause: string): string[] {
  const text = clause.trim();
  if (text.startsWith("type ")) return [];
  const braced = /^\{([\s\S]*)\}$/.exec(text);
  if (!braced) return [text];
  return braced[1]
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "" && !name.startsWith("type "));
}

/** Returns the runtime `lib/mock/*` specifiers that the file at `fromFile` imports. */
function mockValueImports(source: string, fromFile: string): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    if (isMockModule(match[2], fromFile)) names.push(...runtimeSpecifiers(match[1]));
  }
  for (const match of source.matchAll(SIDE_EFFECT_RE)) {
    if (isMockModule(match[1], fromFile)) names.push(SIDE_EFFECT_SPECIFIER);
  }
  return names;
}

/** Collects `"<path> imports <name>"` for every runtime mock import under `src/`. */
function scanRuntimeMockImports(): string[] {
  const pairs: string[] = [];
  for (const file of listSourceFiles(SRC_DIR)) {
    const path = relative(SRC_DIR, file).split(/[\\/]/).join("/");
    if (TEST_FILE_RE.test(path) || path.startsWith("lib/mock/")) continue;
    for (const name of mockValueImports(readFileSync(file, "utf8"), file)) {
      pairs.push(`${path} imports ${name}`);
    }
  }
  return pairs;
}

const allowedPairs = new Set(
  Object.entries(ALLOWED_MOCK_VALUE_IMPORTS).flatMap(([path, names]) =>
    names.map((name) => `${path} imports ${name}`),
  ),
);

/** Comments, so a note ABOUT the corpus is not read as a claim made to a member. */
const COMMENT_RE = /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;

/**
 * A corpus size written as a literal: a magnitude figure (`8M+`, `50K`) or a
 * grouped one (`50,000`) standing within three words of "opportunity" or
 * "notice". The count is a measurement the feed reports — `FeedIntro` prints
 * whatever `/opportunities/all` returns and prints nothing when it has no
 * answer — so any literal here is a claim nothing checks.
 */
const CORPUS_LITERAL_RE =
  /\b\d[\d,.]*\s*[MKmk]?\+?\s+(?:[A-Za-z/()&-]+\s+){0,3}(?:opportunit|notice)/;
/** The overstatement this guardrail retired. Named so it cannot come back quietly. */
const RETIRED_CORPUS_CLAIM = "8M+";

/** Collects `"<path>:<line>"` for every corpus figure written as a literal. */
function scanCorpusLiterals(): string[] {
  const hits: string[] = [];
  for (const file of listSourceFiles(SRC_DIR)) {
    const path = relative(SRC_DIR, file).split(/[\\/]/).join("/");
    if (TEST_FILE_RE.test(path)) continue;
    readFileSync(file, "utf8")
      .replace(COMMENT_RE, "")
      .split("\n")
      .forEach((line, i) => {
        const grouped = /\b\d{1,3}(?:,\d{3})+\b/.test(line);
        const magnitude = /\b\d[\d,.]*\s*[MKmk]\+?\s/.test(line);
        if ((grouped || magnitude) && CORPUS_LITERAL_RE.test(line)) hits.push(`${path}:${i + 1}`);
      });
  }
  return hits;
}

describe("the corpus size is measured, never asserted", () => {
  // `8M+` shipped in the page header, the Pilot upsell and the spotlight. The
  // real corpus is about fifty thousand notices, so the page overstated it by
  // roughly 160x to every member who read it. This is a correctness rule, not a
  // copy rule: the figure is the feed's own total or it is absent.
  it("writes no corpus figure as a literal", () => {
    expect(scanCorpusLiterals()).toEqual([]);
  });

  it("does not name the retired 8M+ claim anywhere", () => {
    const named = listSourceFiles(SRC_DIR)
      .filter((file) => !TEST_FILE_RE.test(file))
      .filter((file) => readFileSync(file, "utf8").includes(RETIRED_CORPUS_CLAIM));
    expect(named).toEqual([]);
  });

  it("catches the shapes it is written for, so an empty result is not a pass", () => {
    for (const line of ["scans 8M+ federal and SLED opportunities", "50,000 opportunities"]) {
      expect(CORPUS_LITERAL_RE.test(line)).toBe(true);
    }
    // A small in-prose count is not a corpus claim, and neither is a comment.
    expect(scanCorpusLiterals()).not.toContain("lib/grant/index.ts:149");
  });
});

describe("no new runtime dependency on lib/mock", () => {
  it("adds no runtime mock import beyond the set this port inherited", () => {
    const added = scanRuntimeMockImports().filter((pair) => !allowedPairs.has(pair));
    expect(added).toEqual([]);
  });

  it("scans a tree that really holds mock imports, so an empty result is not a pass", () => {
    // Without this, deleting the walk would make the test above vacuously green.
    // The widened scan finds 63 pairs, against 48 before feature 16. The floor
    // stays well under that, so removing a mock import never fails this test.
    expect(scanRuntimeMockImports().length).toBeGreaterThan(40);
  });

  it("counts a type-only import as no dependency and a mixed import as one", () => {
    const from = join(SRC_DIR, "routes", "index.tsx");
    const typeOnly = 'import type { CardOpportunity } from "../lib/mock/opportunities";';
    const inlineType = 'import { type CardOpportunity } from "../lib/mock/opportunities";';
    const mixed =
      'import { OPPORTUNITIES, type CardOpportunity } from "../lib/mock/opportunities";';
    expect(mockValueImports(typeOnly, from)).toEqual([]);
    expect(mockValueImports(inlineType, from)).toEqual([]);
    expect(mockValueImports(mixed, from)).toEqual(["OPPORTUNITIES"]);
  });

  it("sees every specifier form that reaches lib/mock, and no other module named mock", () => {
    // The `"./mock/…"` form is the hole feature 16 closed: modules inside
    // `src/lib/` write it, and the old specifier pattern matched none of them.
    const inLib = join(SRC_DIR, "lib", "smartList.ts");
    const inRoutes = join(SRC_DIR, "routes", "index.tsx");
    const inNested = join(SRC_DIR, "lib", "sources", "resolve.ts");
    expect(isMockModule("./mock/opportunities", inLib)).toBe(true);
    expect(isMockModule("../mock/opportunities", inNested)).toBe(true);
    expect(isMockModule("../lib/mock/opportunities", inRoutes)).toBe(true);
    expect(isMockModule("@/lib/mock/currentMember", inRoutes)).toBe(true);
    expect(isMockModule("./mock/server", inRoutes)).toBe(false);
    expect(isMockModule("vitest-mock/data", inLib)).toBe(false);
  });
});

/** The recorded forecasts and everything keyed by their ids: test data only. */
const FORECAST_FIXTURES_DIR = join(SRC_DIR, "lib", "forecasts", "__fixtures__");
/** Module names that held recorded forecast data, wherever they reappear. */
const FORECAST_FIXTURE_NAMES = /(^|\/)(forecastRecords|demoMember|grantReads)(\.tsx?)?$/;
/** The forecasts surface: its library, its components, its routes and its API client. */
const FORECAST_CODE_RE =
  /^(lib\/forecasts\/|components\/Forecast\/|routes\/forecasts[.$]|lib\/forecastsApi\.ts$)/;
// Every module specifier: `from "x"`, `import "x"`, `import("x")`.
const SPECIFIER_RE = /(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+)["']/g;

/** Resolves a relative or `@/` specifier to an absolute path, or null for a package. */
function resolveSpecifier(specifier: string, fromFile: string): string | null {
  if (specifier.startsWith(ALIAS_PREFIX)) return resolve(SRC_DIR, specifier.slice(2));
  if (specifier.startsWith(".")) return resolve(dirname(fromFile), specifier);
  return null;
}

/**
 * Returns why one import breaks the forecasts rule, or null. ANY import counts, type-only
 * included: a type from a fixture still ties production code to the recorded ids.
 */
function forecastImportBreach(specifier: string, fromFile: string, path: string): string | null {
  const target = resolveSpecifier(specifier, fromFile);
  if (!target) return null;
  if (target.startsWith(FORECAST_FIXTURES_DIR + sep)) return "a forecast test fixture";
  if (!FORECAST_CODE_RE.test(path)) return null;
  if (target.startsWith(MOCK_DIR + sep)) return "a lib/mock module";
  if (FORECAST_FIXTURE_NAMES.test(target.split(sep).join("/"))) return "recorded forecast data";
  return null;
}

/** Collects `"<path> imports <specifier> (<why>)"` for every breach in production code. */
function scanForecastFixtureImports(): string[] {
  const hits: string[] = [];
  for (const file of listSourceFiles(SRC_DIR)) {
    const path = relative(SRC_DIR, file).split(/[\\/]/).join("/");
    if (TEST_FILE_RE.test(path) || file.startsWith(FORECAST_FIXTURES_DIR + sep)) continue;
    for (const match of readFileSync(file, "utf8").matchAll(SPECIFIER_RE)) {
      const why = forecastImportBreach(match[1], file, path);
      if (why) hits.push(`${path} imports ${match[1]} (${why})`);
    }
  }
  return hits;
}

describe("forecasts code reads no fixture and no mock", () => {
  // The forecast pages once looked up a prototype's 40 recorded forecasts by id, beside
  // the live data. No live `oppKey` matched, so every lookup found nothing in production,
  // but the data shipped and the code read as if it might. The recorded data is now
  // test-only, under `lib/forecasts/__fixtures__/`, and this keeps it there.
  it("imports no forecast fixture, no lib/mock module and no recorded data", () => {
    expect(scanForecastFixtureImports()).toEqual([]);
  });

  it("catches each import form it is written for, so an empty result is not a pass", () => {
    const engine = join(SRC_DIR, "lib", "forecasts", "engine.ts");
    const route = join(SRC_DIR, "routes", "forecasts.$forecastId.tsx");
    const other = join(SRC_DIR, "lib", "smartList.ts");
    const breach = (spec: string, from: string) =>
      forecastImportBreach(spec, from, relative(SRC_DIR, from).split(sep).join("/"));
    expect(breach("./__fixtures__/scored", engine)).toBe("a forecast test fixture");
    expect(breach("@/lib/forecasts/__fixtures__/facts", route)).toBe("a forecast test fixture");
    expect(breach("./forecasts/__fixtures__/scored", other)).toBe("a forecast test fixture");
    expect(breach("../mock/currentMember", engine)).toBe("a lib/mock module");
    expect(breach("../lib/mock/forecastRecords", route)).toBe("a lib/mock module");
    expect(breach("./demoMember", engine)).toBe("recorded forecast data");
    expect(breach("./grantReads", engine)).toBe("recorded forecast data");
    expect(breach("./records", engine)).toBeNull();
    expect(breach("./mock/opportunities", other)).toBeNull();
    const forms = [
      'import { X } from "./__fixtures__/scored";',
      'import type { X } from "./__fixtures__/scored";',
      'export { X } from "./__fixtures__/scored";',
      'const m = await import("./__fixtures__/scored");',
    ];
    for (const line of forms)
      expect([...line.matchAll(SPECIFIER_RE)].map((m) => m[1])).toEqual(["./__fixtures__/scored"]);
  });
});

describe("no shared base CSS rule modified", () => {
  const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

  /** Returns the declarations inside the first top-level block for `selector`. */
  function ruleBody(selector: string): string {
    const escaped = selector.replace(/[.\\+*?[^\]$(){}=!<>|:#/-]/g, "\\$&");
    return new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, "m").exec(css)?.[1] ?? "";
  }

  it("keeps .opp-facts-grid__k a block dt, so the label sits above the value", () => {
    // PR 39 stacks key over value. An inline key collapses every cell to one
    // line. This regressed once and was fixed against a visual diff of the
    // prototype; the rule must never set `display: inline`.
    const body = ruleBody(".opp-facts-grid__k");
    expect(body).not.toBe("");
    expect(body).not.toMatch(/display:\s*inline/);
  });

  it("draws ONE rule between the mid-journey strength row and the rail band", () => {
    // The strength row and the rail band each carry their own padding and closing
    // border. Stacked mid-journey that drew two rules, so the strip modifier drops
    // its own — the base dock rule must keep its border for the IDLE dock, which
    // still needs it.
    expect(ruleBody(".hunter-enrich-dock--strip")).toMatch(/border-bottom:\s*0/);
    expect(ruleBody(".hunter-enrich-dock")).toMatch(/border-bottom:\s*1px/);
  });

  it("keeps the dock CTA full width, with nothing left aligning it to the start", () => {
    // Feature 10 lifted the CTA out of the cream coaching card so it spans the
    // dock. `align-self: flex-start` is what inset it before; the styles.css
    // diff proved it gone, but a diff stops being evidence once this merges.
    const body = ruleBody(".hunter-enrich-cta");
    expect(body).toMatch(/width:\s*100%/);
    expect(css).not.toMatch(/\.hunter-enrich-cta[^{]*\{[^}]*align-self:\s*flex-start/);
  });

  // Feature 14 moved four artifact bodies from the 360px chat dock onto the
  // full-width stage card and kept their dock sizing, so each one rendered in a
  // narrow column with the rest of the card blank. The fix is scoped, because
  // `.hunter-act` STILL renders in the dock (`EnrichmentJourney`) and needs the
  // dock sizing there.
  const STAGE_ARTIFACTS = [".hunter-compare", ".hunter-matches", ".hunter-act", ".hunter-research"];

  it("keeps the dock sizing on the base artifact rules", () => {
    for (const selector of STAGE_ARTIFACTS) {
      expect(ruleBody(selector)).toMatch(/max-width:\s*360px/);
    }
  });

  // The profile-builder column renders four Hunter-authored cards in ~327px.
  // The prototype gives them three DIFFERENT surfaces — a white ask, an
  // `.ai-surface` checkpoint, an `.ai-surface-subtle` offer — and a closing line
  // that is not a card at all. That split is the prototype's design decision, so
  // it is ported as it stands; unifying it here would be this app rewriting the
  // prototype rather than matching it.
  //
  // What was wrong was SCALE and absence, not colour. `.ai-surface*` carry page
  // padding, and `.enrich-offer` arrived with the prototype's class names and
  // NO rules at all, so it rendered 14px prose and 36px buttons beside 12px /
  // 29.4px siblings. Neither failure is visible in a diff once merged.
  const TURN_CARDS = [".hunter-enrich-checkpoint", ".enrich-offer", ".hunter-enrich-complete"];

  it("gives every ported .enrich-offer class a rule, at the column's scale", () => {
    expect(ruleBody(".enrich-offer__prompt")).toMatch(/font-size:\s*12px/);
    expect(ruleBody(".enrich-offer__chips")).toMatch(/display:\s*flex/);
  });

  it("caps all four cards at ONE measure, so the column has one edge", () => {
    expect(ruleBody(".hunter-ask")).toMatch(/max-width:\s*320px/);
    const [, selectors, body] = /(\.hunter-enrich-checkpoint,[^{]*)\{([^}]*)\}/.exec(css) ?? [];
    expect(selectors).toBeTruthy();
    for (const selector of TURN_CARDS) expect(selectors).toContain(selector);
    expect(body).toMatch(/max-width:\s*320px/);
    // Measure and type only. A surface declared here would put a card round the
    // closing line, which the prototype leaves as plain text.
    expect(body).not.toMatch(/background:/);
  });

  it("keeps each card's prototype surface, overriding only its page scale", () => {
    // The shared DS classes supply the colour; these rules change padding alone.
    // Re-declaring the background here would fork `.ai-surface` for one column.
    expect(ruleBody(".hunter-enrich-checkpoint.ai-surface")).toMatch(/padding:\s*10px 12px/);
    expect(ruleBody(".enrich-offer.ai-surface-subtle")).toMatch(/padding:\s*10px 12px/);
  });

  it("frees every stage artifact of the dock's 360px cap", () => {
    // Read off the stage-scoped block, not the base rules: a member reading a
    // comparison table wants the whole card, and a member reading the same card
    // in the dock wants it to fit the dock.
    const stageBlock = /\.stage-card \.hunter-compare[^{]*\{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(stageBlock).toMatch(/max-width:\s*none/);
    for (const selector of STAGE_ARTIFACTS) {
      expect(css).toMatch(new RegExp(`\\.stage-card \\${selector}\\b`));
    }
  });
});
