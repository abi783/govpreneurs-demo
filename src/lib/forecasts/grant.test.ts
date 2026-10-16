// Grant's read of a forecast. These hold the rules a member could be misled by if they
// broke: the call and the path tiles agreeing, Start here and the plan agreeing,
// answers changing only what they should, and one home per fact (v5).

import { describe, expect, it } from "vitest";
import type { ScoredForecast } from "./engine";
import { SCORED_FORECASTS, findForecast } from "./__fixtures__/scored";
import {
  applyAnswers,
  callFromPaths,
  countedSteps,
  nextMove,
  readForecast,
  readSignature,
  stepNumbers,
  type ForecastPath,
  type ForecastRead,
  type RailQuestion,
} from "./grant";
import { PROGRAM_PATHS, SOURCE_NAME } from "./grantCopy";
import { emptyTakeFixture, takeFixture } from "./take.fixture";

const get = (id: string): ScoredForecast => {
  const f = findForecast(id);
  if (!f) throw new Error(`no forecast ${id}`);
  return f;
};

describe("the call follows the paths (v4 §02)", () => {
  const path = (state: ForecastPath["state"]): ForecastPath[] => [
    { key: "prime", state, why: "x" },
    { key: "teaming", state: "no_go", why: "x" },
    { key: "subcontract", state: "not_needed", why: "x" },
  ];

  it("says Prepare when any path is Go, Needs review when one is Not yet, otherwise Skip", () => {
    expect(callFromPaths(path("go"), true)).toBe("prepare");
    expect(callFromPaths(path("not_yet"), true)).toBe("review");
    expect(callFromPaths(path("no_go"), true)).toBe("skip");
    expect(callFromPaths(path("go"), false)).toBe("closed");
  });

  it("never lets a chip and its tiles disagree, on any forecast", () => {
    for (const f of SCORED_FORECASTS) {
      const r = readForecast(f);
      expect(r.call).toBe(callFromPaths(r.paths, f.lifecycle === "open"));
      expect(r.paths.map((p) => p.key)).toEqual(["prime", "teaming", "subcontract"]);
      expect(r.paths.filter((p) => p.best).length).toBeLessThanOrEqual(1);
    }
  });

  it("reads the recorded examples by rule", () => {
    const charlotte = readForecast(get("fed-boxed-meals-charlotte"));
    expect(charlotte.call).toBe("prepare");
    expect(charlotte.paths.find((p) => p.best)?.key).toBe("prime");
    expect(readForecast(get("fed-detainee-meals-atlanta")).call).toBe("skip");
    expect(readForecast(get("fed-food-service-training-norfolk")).call).toBe("review");
    expect(readForecast(get("sled-cumberland-school-meals")).call).toBe("review");
    expect(readForecast(get("sled-wayne-concessions")).call).toBe("closed");
  });
});

describe("a call leaves only the boxes it needs (v5 §06)", () => {
  it("hides How to win it and Get ready on Skip and Closed pages", () => {
    for (const f of SCORED_FORECASTS) {
      const r = readForecast(f);
      if (r.call === "skip" || r.call === "closed") {
        expect(countedSteps(r)).toHaveLength(0);
        expect(r.win).toHaveLength(0);
        expect(r.prepare).toBeNull();
      }
    }
  });

  it("keeps on a Skip page only the unknowns that could change the call", () => {
    for (const f of SCORED_FORECASTS) {
      const r = readForecast(f);
      if (r.call === "skip") expect(r.unknowns.every((u) => u.couldChangeCall)).toBe(true);
    }
    // Atlanta is a Skip page; the two mandatory sources could each take the job.
    const atlanta = readForecast(get("fed-detainee-meals-atlanta"));
    expect(atlanta.unknowns.map((u) => u.label)).toEqual([
      "If a program for blind vendors has first claim",
      "If a program that employs people with disabilities has first claim",
    ]);
  });

  it("shows a Closed page its call and past dates only", () => {
    for (const f of SCORED_FORECASTS) {
      const r = readForecast(f);
      if (r.call !== "closed") continue;
      expect([...r.strengths, ...r.limits, ...r.unknowns]).toHaveLength(0);
      expect(r.timeline.every((m) => m.kind === "past" || m.kind === "today")).toBe(true);
    }
  });

  it("puts the time to prepare under Today, and nowhere else", () => {
    const r = readForecast(get("fed-boxed-meals-charlotte"));
    expect(r.timeline.find((m) => m.kind === "today")?.label).toBe("About 6 months to prepare");
  });
});

describe("Start here is the first unfinished step (v5 box 9)", () => {
  const read = readForecast(get("fed-boxed-meals-charlotte"));

  it("starts at the first step and moves on as steps are done", () => {
    expect(nextMove(read, new Set())?.id).toBe("last_contract");
    expect(nextMove(read, new Set(["last_contract"]))?.id).toBe("renew");
  });

  it("never counts an event step, and numbers the tasks in order", () => {
    const counted = countedSteps(read);
    expect(counted).toHaveLength(2);
    expect(counted.some((s) => s.kind !== "task")).toBe(false);
    expect(nextMove(read, new Set(counted.map((s) => s.id)))).toBeNull();
    // The page places the registration step by its own dates, in Before the bid request.
    expect(stepNumbers(read).get("renew")).toBe(2);
  });

  it("points every Can fix chip at a step that is on the page (D-B5)", () => {
    for (const f of SCORED_FORECASTS) {
      const r = readForecast(f);
      const steps = stepNumbers(r);
      for (const cell of [...r.strengths, ...r.limits]) {
        if (cell.fix?.kind === "yes") expect(steps.has(cell.fix.step)).toBe(true);
      }
    }
  });
});

describe("one home per fact (v5 §02)", () => {
  // Everything on Charlotte's page, by box. The chat is outside the page.
  const boxes = (r: ForecastRead): Record<string, string> => ({
    opportunity: JSON.stringify(r.job),
    timeline: JSON.stringify(r.timeline),
    call: JSON.stringify(r.paths),
    works: JSON.stringify(r.strengths),
    holds: JSON.stringify(r.limits),
    unknown: JSON.stringify(r.unknowns),
    win: JSON.stringify(r.win),
    plan: JSON.stringify(r.plan),
    details: JSON.stringify(r.evidence),
  });
  const homes = (r: ForecastRead, pattern: RegExp) =>
    Object.entries(boxes(r))
      .filter(([, text]) => pattern.test(text))
      .map(([box]) => box);
  const charlotte = readForecast(get("fed-boxed-meals-charlotte"));

  it("writes each of Charlotte's key facts in one box", () => {
    expect(homes(charlotte, /15 April 2027/)).toEqual(["holds"]);
    expect(homes(charlotte, /9 companies bid/)).toEqual(["win"]);
    expect(homes(charlotte, /\$250K/)).toEqual(["opportunity"]);
    expect(homes(charlotte, /February to April 2027/)).toEqual(["timeline"]);
  });

  it("keeps the chat from repeating the page's numbers", () => {
    const chat = JSON.stringify({ ...charlotte.rail, drafts: undefined });
    expect(chat).not.toMatch(/\$9\.3\d|10 a\.m|15 April 2027|February to April/);
  });

  it("never lets a tile repeat a reason from the columns word for word", () => {
    for (const f of SCORED_FORECASTS) {
      const r = readForecast(f);
      const cells = [...r.strengths, ...r.limits].flatMap((c) => [c.title, c.body ?? ""]);
      for (const p of r.paths) {
        expect(
          cells.some((c) => c.replace(/\*\*/g, "").replace(/\.$/, "") === p.why.replace(/\.$/, "")),
        ).toBe(false);
      }
    }
  });
});

// Rail questions are not on any rule-built read yet, so these build the questions into
// Charlotte's read and apply the answers directly.
describe("answers change only what they should (inference proposes, authority writes)", () => {
  const HEALTH: RailQuestion = {
    id: "health",
    noun: "Health report",
    ask: "Do you have a health inspection report from the last 12 months?",
    input: "choice",
    options: ["Yes", "No", "Not sure"],
    effects: [
      {
        when: { equals: "No" },
        addLimit: {
          kind: "risk",
          title: "No current health report",
          sources: ["Your answer"],
          fix: { kind: "yes", step: "renew" },
        },
        firstStep: "renew",
      },
    ],
  };
  const COST: RailQuestion = {
    id: "cost",
    noun: "Your price",
    ask: "What price would you charge for one boxed lunch, delivered?",
    input: "money",
    effects: [
      {
        when: { above: 9.34 },
        addLimit: { kind: "risk", title: "Your price is above our estimate" },
        path: { key: "teaming", state: "not_yet", why: "A partner could lower your price." },
      },
      {
        when: { atMost: 9.34 },
        path: { key: "teaming", state: "not_yet", why: "Under our estimate." },
      },
    ],
  };
  const base = readForecast(get("fed-boxed-meals-charlotte"));
  const read: ForecastRead = {
    ...base,
    paths: base.paths.map((p) =>
      p.key === "teaming" ? { ...p, state: "not_yet", why: "Grant needs your price." } : p,
    ),
    rail: { ...base.rail, questions: [HEALTH, COST] },
  };

  it("changes nothing on Not sure", () => {
    expect(applyAnswers(read, { health: "Not sure" })).toBe(read);
  });

  it("moves the step an answer names to Start here, and points its gap at it", () => {
    const next = applyAnswers(read, { health: "No" });
    expect(nextMove(next, new Set())?.id).toBe("renew");
    const limit = next.limits.find((l) => l.title === "No current health report");
    expect(limit?.fix).toEqual({ kind: "yes", step: "renew" });
    expect(stepNumbers(next).get("renew")).toBe(1);
    expect(next.confidence).toBe("medium");
  });

  it("never lets our price estimate set Go: a price above it adds a gap and keeps teaming Not yet", () => {
    const next = applyAnswers(read, { health: "Yes", cost: "$10.20" });
    const teaming = next.paths.find((p) => p.key === "teaming");
    expect(teaming?.state).toBe("not_yet");
    expect(next.limits.some((c) => c.title === "Your price is above our estimate")).toBe(true);
    expect(next.paths.find((p) => p.key === "prime")?.best).toBe(true);
    // No way in changed state, so confidence stays where it was.
    expect(next.confidence).toBe("medium");
  });

  it("never marks teaming Not needed from our estimate", () => {
    const next = applyAnswers(read, { cost: "9.10" });
    expect(next.paths.find((p) => p.key === "teaming")?.state).toBe("not_yet");
    expect(next.call).toBe("prepare");
  });
});

describe("Grant's take feeds How to win it and Sources only (D-C4)", () => {
  const TAKE_NAMES = new Set([
    SOURCE_NAME.awardRecords,
    SOURCE_NAME.officeRecord,
    SOURCE_NAME.officeForecasts,
  ]);
  /** Everything a take must leave as it is: the call, the ways in, the boxes and the plan. */
  const withoutTakeParts = (r: ForecastRead) => ({
    ...r,
    win: r.win.filter((w) => !w.counted),
    evidence: { ...r.evidence, sources: r.evidence.sources.filter((s) => !TAKE_NAMES.has(s)) },
  });
  const byCall = (calls: ForecastRead["call"][]) =>
    SCORED_FORECASTS.filter((f) => calls.includes(readForecast(f).call));

  it("reads exactly as before with no take, and with a take where nothing was checked", () => {
    for (const f of SCORED_FORECASTS) {
      const plain = readForecast(f);
      expect(readForecast(f, {}, null)).toEqual(plain);
      expect(readForecast(f, {}, emptyTakeFixture(f.id))).toEqual(plain);
    }
  });

  it("never changes the call, a way in, a gap, an unknown, the plan or the timeline", () => {
    for (const f of SCORED_FORECASTS) {
      const plain = readForecast(f);
      const read = readForecast(f, {}, takeFixture(f.id));
      expect(withoutTakeParts(read)).toEqual(plain);
      expect(readSignature(read)).toBe(readSignature(plain));
    }
  });

  it("adds its rows after the read's own rows on a Prepare or Needs review page", () => {
    const open = byCall(["prepare", "review"]);
    expect(open.length).toBeGreaterThan(0);
    for (const f of open) {
      const plain = readForecast(f);
      const read = readForecast(f, {}, takeFixture(f.id));
      expect(read.win.slice(0, plain.win.length)).toEqual(plain.win);
      expect(read.win.slice(plain.win.length).map((w) => w.key)).toEqual(["won", "paid", "office"]);
      for (const name of TAKE_NAMES) expect(read.evidence.sources).toContain(name);
    }
  });

  it("hides its rows on a Skip or Closed page, as every B8 row, and names no source there", () => {
    const quiet = byCall(["skip", "closed"]);
    expect(quiet.length).toBeGreaterThan(0);
    for (const f of quiet) {
      const read = readForecast(f, {}, takeFixture(f.id));
      expect(read.win).toHaveLength(0);
      for (const name of TAKE_NAMES) expect(read.evidence.sources).not.toContain(name);
    }
  });

  it("keeps the take's rows through the member's answers, and the answers keep their effect", () => {
    const f = get("fed-boxed-meals-charlotte");
    const answers = { health: "Yes", cost: "$10.20" };
    const answered = readForecast(f, answers, takeFixture(f.id));
    expect(readSignature(answered)).toBe(readSignature(readForecast(f, answers)));
    expect(answered.win.some((w) => w.key === "paid")).toBe(true);
  });
});

describe("a program set-aside on a forecast reads as the buyer's plan today (rule 7a)", () => {
  // No recorded forecast is a program set-aside that reaches rule 7a, so the case is built:
  // an open forecast that gets past the earlier rules, re-read as kept for 8(a) and HUBZone.
  const programOf = (f: ScoredForecast, program: string): ScoredForecast => ({
    ...f,
    whoMayBid: { kind: "program", text: "Kept for a program.", term: null, note: null, program },
  });
  const passesEarlierRules = SCORED_FORECASTS.filter(
    (f) => f.lifecycle === "open" && readForecast(f).paths[0].state !== "no_go",
  );
  const rule7a = passesEarlierRules
    .flatMap((f) => [programOf(f, "8(a)"), programOf(f, "HUBZone")])
    .map((f) => ({ f, read: readForecast(f) }))
    // An earlier rule (e.g. outside her states) closes every path; rule 7a leaves subcontract.
    .filter(
      ({ read }) =>
        read.paths[0].state === "no_go" &&
        read.paths[1].state === "no_go" &&
        read.paths[2].state === "not_yet",
    );

  it("has a recorded forecast that reaches rule 7a", () => {
    expect(rule7a.length).toBeGreaterThan(0);
  });

  it("names the program on the prime and teaming cards, and keeps both No-go", () => {
    for (const { f, read } of rule7a) {
      expect(read.paths[0].why).toBe(PROGRAM_PATHS.prime(f.whoMayBid.program));
      expect(read.paths[0].why).toContain(f.whoMayBid.program ?? "certified");
      expect(read.paths[1].why).toBe(PROGRAM_PATHS.teaming(f.whoMayBid.program));
      expect(read.paths[2]).toMatchObject({ state: "not_yet", why: PROGRAM_PATHS.subcontract });
    }
  });

  it("adds the plan note under the cards, and the note says the plan can change", () => {
    for (const { read } of rule7a) expect(read.pathsNote).toBe(PROGRAM_PATHS.note);
    expect(PROGRAM_PATHS.note).toMatch(/can change/);
    expect(PROGRAM_PATHS.note).not.toMatch(/deadline|\bdue\b|closes/i);
  });

  it("does not repeat the card's state word in the reason", () => {
    for (const { read } of rule7a) {
      expect(read.paths[0].why).not.toMatch(/no-go/i);
      expect(read.paths[1].why).not.toMatch(/no-go/i);
    }
  });

  it("puts no plan note on a read that is not a program set-aside", () => {
    for (const f of SCORED_FORECASTS.filter((x) => x.whoMayBid.kind !== "program")) {
      expect(readForecast(f).pathsNote).toBeUndefined();
    }
  });

  it("falls back to plain words when the program has no short name", () => {
    expect(PROGRAM_PATHS.prime(undefined)).toBe("The buyer plans this for certified firms today.");
    expect(PROGRAM_PATHS.teaming(undefined)).toBe("You cannot lead without the certificate.");
  });
});
