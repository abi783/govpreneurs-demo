// The rules the first PRD review found broken or unstated (17 September 2026). Each case
// fails against the code before that review's fixes: who may bid, the registration gap,
// unknown sizes and states, a direct award on a thin record, a stale forecast's reason,
// a meeting of another body, and the page's shape after an answer moves the call.

import { afterEach, describe, expect, it } from "vitest";
import type { ForecastFirm, ScoredForecast } from "./engine";
import { REASON } from "./copy";
import { CALL } from "./grantCopy";
import { FORECAST_FACTS } from "./__fixtures__/facts";
import { HIGHERGOV_FORECASTS } from "./__fixtures__/forecastRecords";
import { DEMO_FIRM, SCORED_FORECASTS, scoreRecorded } from "./__fixtures__/scored";
import {
  applyAnswers,
  deriveRead,
  readForecast,
  readSignature,
  type ForecastRead,
  type RailQuestion,
} from "./grant";
import type { HigherGovForecast } from "./records";

const record = (id: string): HigherGovForecast => {
  const r = HIGHERGOV_FORECASTS.find((x) => x.id === id);
  if (!r) throw new Error(`no record ${id}`);
  return r;
};
const firm = (over: Partial<ForecastFirm> = {}): ForecastFirm => ({ ...DEMO_FIRM, ...over });
const score = (id: string, over: Partial<HigherGovForecast> = {}, f = firm()): ScoredForecast =>
  scoreRecorded({ ...record(id), ...over }, f);

// A good-fit federal forecast in North Carolina, with a contact and a value.
const EPA = "fed-epa-cafeteria-rtp";

describe("who may bid, by set-aside code", () => {
  it("never reads a veteran-owned set-aside as open to all", () => {
    const f = score(EPA, { setAsideCode: "VSA" });
    expect(f.whoMayBid.kind).toBe("program");
    expect(f.whoMayBid.text).toContain("owned by veterans");
    expect(deriveRead(f).paths[0].state).toBe("no_go");
  });

  it("does not let a women-owned certificate count for an EDWOSB set-aside", () => {
    const f = score(EPA, { setAsideCode: "EDWOSB" }, firm({ certs: ["wosb"] }));
    expect(f.whoMayBid.kind).toBe("program");
  });

  it("says the customer qualifies when the certificate is held, and shows it as a job fact", () => {
    const f = score(EPA, { setAsideCode: "WOSB" }, firm({ certs: ["wosb"] }));
    expect(f.whoMayBid.kind).toBe("held");
    expect(f.whoMayBid.text).toContain("you hold that certificate");
    expect(deriveRead(f).job.facts.some((x) => x.label === "Who may bid")).toBe(true);
  });

  it("reads a sole-source code as one chosen company without the certificate", () => {
    const f = score(EPA, { setAsideCode: "WOSBSS" }, firm({ certs: [] }));
    expect(f.whoMayBid.kind).toBe("program_one");
    expect(deriveRead(f).paths.map((p) => p.state)).toEqual(["no_go", "no_go", "not_yet"]);
  });

  it("gives a certified customer a sole-source way in to raise with the office, not a Go", () => {
    const f = score(EPA, { setAsideCode: "WOSBSS" }, firm({ certs: ["wosb"] }));
    expect(f.whoMayBid.kind).toBe("program_one_held");
    const read = deriveRead(f);
    expect(read.paths.map((p) => p.state)).toEqual(["not_yet", "not_yet", "not_yet"]);
    // Outside 8(a), the office picks alone; SBA does not choose the company.
    expect(read.paths[0].why).toBe("Tell the office you are certified.");
    const eightA = deriveRead(score(EPA, { setAsideCode: "8AN" }, firm({ certs: ["8a"] })));
    expect(eightA.paths[0].why).toBe("Tell the office and your SBA specialist you are certified.");
  });

  it("waits on the customer's certificates when they have not said, never a No-go", () => {
    const f = score(EPA, { setAsideCode: "HZC" }, firm({ certs: [], certsKnown: false }));
    expect(f.whoMayBid.kind).toBe("program_unknown");
    const read = deriveRead(f);
    expect(read.paths.every((p) => p.state === "not_yet")).toBe(true);
    expect(read.waiting).toBe("your certificates, in My Business");
  });

  it("asks the office, not a watch, about a code it cannot read", () => {
    const read = deriveRead(score(EPA, { setAsideCode: "LAS" }));
    expect(read.unknowns.find((u) => u.label === "Who may bid")?.how).toBe("ask_office");
  });

  it("never promises to watch a local record for a set-aside", () => {
    for (const f of SCORED_FORECASTS.filter((x) => x.lane === "sled")) {
      const who = deriveRead(f).unknowns.find((u) => u.label === "Who may bid");
      if (who) expect(who.how).not.toBe("watch");
    }
  });

  it("warns that size is checked on every small-business set-aside, with the industry code", () => {
    const f = score(EPA, { setAsideCode: "SBA" });
    expect(f.sizeCheck).toBe(true);
    const size = readForecast(f).limits.find(
      (c) => c.title === "Check you are small for this work",
    );
    expect(size?.body).toContain("722310");
    expect(size?.kind).toBe("risk");
  });

  it("names each program by its own term, not 8(a)", () => {
    expect(score(EPA, { setAsideCode: "HZC" }).whoMayBid.term).toBe("Set-aside: HUBZone");
    expect(score(EPA, { setAsideCode: "SDVOSBC" }).whoMayBid.term).toBe("Set-aside: SDVOSB");
  });

  it("matches 8(a), HUBZone and SDVOSB certificates, not only women-owned ones", () => {
    for (const [code, cert] of [
      ["8A", "8a"],
      ["HZC", "hubzone"],
      ["SDVOSBC", "sdvosb"],
    ]) {
      expect(score(EPA, { setAsideCode: code }, firm({ certs: [cert] })).whoMayBid.kind).toBe(
        "held",
      );
    }
  });

  it("waits, and asks who may bid, on a code it cannot read", () => {
    const f = score(EPA, { setAsideCode: "LAS" });
    expect(f.whoMayBid.kind).toBe("unlisted");
    expect(f.unknowns).toContain("Who may bid");
    const read = deriveRead(f);
    expect(read.call).toBe("review");
    expect(read.waiting).toBe("who may bid");
  });
});

describe("the registration gap", () => {
  it("warns a customer who is not registered, even on a Skip page", () => {
    const f = score(
      "fed-boxed-meals-amarillo",
      {},
      firm({ registration: { status: "not_registered", endsOn: null } }),
    );
    expect(f.registration.gap).toBe("not_registered");
    const read = readForecast(f);
    expect(read.call).toBe("skip");
    expect(read.limits.map((c) => c.title)).toContain("No active registration found");
  });

  it("warns a customer whose registration has lapsed", () => {
    const f = score(EPA, {}, firm({ registration: { status: "expired", endsOn: null } }));
    expect(f.registration.gap).toBe("lapsed");
  });

  it("warns on a low-confidence forecast too, and keeps the task that fixes it", () => {
    const f = score(
      "fed-army-food-service-order",
      {},
      firm({ registration: { status: "active", endsOn: "2026-10-01" } }),
    );
    expect(f.confidence).toBe("low");
    expect(f.registration.gap).toBe("ends_soon");
    expect(f.steps.some((s) => s.kind === "renew")).toBe(true);
    expect(deriveRead(f).limits.map((c) => c.title)).toContain("Registration ends too soon");
  });

  it("counts a registration that ends on the last day of the window as ending too soon", () => {
    const base = score(EPA);
    const end = base.timing.end as string;
    expect(
      score(EPA, {}, firm({ registration: { status: "active", endsOn: end } })).registration.gap,
    ).toBe("ends_soon");
  });

  it("dates the renew step at least 30 days before the registration's end", () => {
    const f = score(EPA);
    const before = deriveRead(f).plan.find((ph) => ph.id === "before");
    expect(before?.when).toBe("by 16 March 2027");
  });

  it("never reads a registration with no end date as fine", () => {
    const f = score(EPA, {}, firm({ registration: { status: "active", endsOn: null } }));
    expect(f.registration.gap).toBe("unknown_end");
    const read = deriveRead(f);
    expect(read.limits.map((c) => c.title)).toContain("Registration end date not known");
    const now = read.plan.find((ph) => ph.id === "now");
    expect(now?.steps.some((s) => s.id === "check_registration")).toBe(true);
  });

  it("counts a registration whose end date has passed as lapsed, even when marked active", () => {
    const f = score(EPA, {}, firm({ registration: { status: "active", endsOn: "2026-01-01" } }));
    expect(f.registration.gap).toBe("lapsed");
    const now = deriveRead(f).plan.find((ph) => ph.id === "now");
    expect(now?.steps.some((s) => s.id === "renew")).toBe(true);
  });

  it("keeps the registration gap and its step on the read", () => {
    const f = score(
      "fed-boxed-meals-charlotte",
      {},
      firm({ registration: { status: "not_registered", endsOn: null } }),
    );
    const read = readForecast(f);
    expect(read.limits.map((c) => c.title)).toContain("No active registration found");
    expect(read.plan.flatMap((ph) => ph.steps).some((s) => s.id === "register")).toBe(true);
  });
});

describe("unknown data never reads as Go", () => {
  it("waits for past job sizes when none are on record", () => {
    const f = score(
      "fed-boxed-meals-charlotte",
      { hgText: "Boxed lunches for applicants at the Charlotte station." },
      firm({ biggestPastJob: null }),
    );
    expect(f.sizeKnown).toBe(false);
    const read = deriveRead(f);
    expect(read.paths.every((p) => p.state !== "go")).toBe(true);
    expect(read.waiting).toBe("your past job sizes, in My Business");
  });

  it("never calls the job the right size when her past job sizes are not on record", () => {
    const hgText = "Boxed lunches for applicants at the Charlotte station.";
    const unknown = score("fed-boxed-meals-charlotte", { hgText }, firm({ biggestPastJob: null }));
    expect(unknown.sizeKnown).toBe(false);
    expect(unknown.reasons.map((r) => r.text)).not.toContain(REASON.rightSize);
    expect(unknown.facts.why).not.toContain(REASON.rightSize);

    // Control: with a past job on record the same forecast can be the right size.
    const known = score("fed-boxed-meals-charlotte", { hgText }, firm({ biggestPastJob: 250000 }));
    expect(known.sizeKnown).toBe(true);
    expect(known.reasons.map((r) => r.text)).toContain(REASON.rightSize);
  });

  it("never says 'outside your area' when the customer's states are not on record", () => {
    const f = score("fed-detainee-meals-atlanta", {}, firm({ states: [] }));
    expect(f.statesKnown).toBe(false);
    expect(f.reasons.some((r) => r.text.includes("outside"))).toBe(false);
    expect(f.heldBack).not.toBe("other_state");
  });
});

describe("the call's reasons", () => {
  const facts = FORECAST_FACTS["sled-wallingford-canteen"];
  afterEach(() => {
    FORECAST_FACTS["sled-wallingford-canteen"] = facts;
  });

  it("closes leading or teaming on a direct award, even when the record is too thin to rate", () => {
    FORECAST_FACTS["sled-wallingford-canteen"] = { ...facts, directAward: "It goes to one vendor" };
    // Connecticut served, so the out-of-area rule does not decide first.
    const f = score("sled-wallingford-canteen", {}, firm({ states: [...DEMO_FIRM.states, "CT"] }));
    expect(f.published).toBe(false);
    const read = deriveRead(f);
    // The chosen party may still hire a partner, so the subcontract way stays open to check.
    expect(read.paths.map((p) => p.state)).toEqual(["no_go", "no_go", "not_yet"]);
    expect(read.paths[0].why).toBe("No other company can bid.");
    // Sure of the closed ways, but not of the one left to check.
    expect(read.confidence).toBe("low");
  });

  it("gives a forecast past its expected date the passed reason, never closed or out of date", () => {
    const f = score("fed-army-food-service-order", { dueOn: "2026-01-14" });
    expect(f.lifecycle).toBe("stale");
    const read = deriveRead(f);
    expect(read.paths[0].why).toBe(
      "The expected date has passed. The bid request may already be posted, or may not come.",
    );
    expect(read.call).toBe("closed");
    expect(CALL[read.call].word).toBe("Expected date passed");
    expect(JSON.stringify(read).toLowerCase()).not.toMatch(/out of date|bids have closed/);
  });
});

describe("steps", () => {
  it("emails the buyer as any small business when who may bid is not decided", () => {
    const f = score(EPA, {}, firm({ certs: [] }));
    const email = f.steps.find((s) => s.kind === "email_buyer");
    expect(email?.first).toContain("a small business that can do this work");
  });

  it("gives a meeting of another body no link to the source's meetings page", () => {
    const f = SCORED_FORECASTS.find((x) => x.id === "sled-durham-garden-coordinator");
    const meeting = f?.steps.find((s) => s.kind === "meeting");
    expect(meeting?.title).toContain("Durham City Council");
    expect(meeting?.link).toBeNull();
    expect(meeting?.body).toContain("Durham City Council website");
  });
});

describe("sources", () => {
  it("names every derived chip the way the Sources line does", () => {
    for (const f of SCORED_FORECASTS) {
      const read = readForecast(f);
      const listed = new Set(read.evidence.sources);
      for (const c of [...read.strengths, ...read.limits])
        for (const s of c.sources ?? []) expect(listed.has(s)).toBe(true);
      for (const w of read.win) for (const s of w.sources ?? []) expect(listed.has(s)).toBe(true);
    }
  });
});

// Rail questions are not on any rule-built read yet, so these build the question into
// the read and apply the answers directly.
describe("an answer that moves the call", () => {
  const ID = "fed-army-food-service-order";

  it("turns the call to Skip once answers close every way in", () => {
    const no = (key: "prime" | "teaming" | "subcontract"): RailQuestion => ({
      id: key,
      noun: key,
      ask: `About ${key}?`,
      input: "choice",
      options: ["Yes", "No", "Not sure"],
      effects: [{ when: { equals: "No" }, path: { key, state: "no_go", why: "Not for you." } }],
    });
    const base = readForecast(SCORED_FORECASTS.find((x) => x.id === ID) as ScoredForecast);
    const read: ForecastRead = {
      ...base,
      paths: [
        { key: "prime", state: "not_yet", why: "Grant needs an answer." },
        { key: "teaming", state: "not_yet", why: "Same reason." },
        { key: "subcontract", state: "not_yet", why: "Same reason." },
      ],
      call: "review",
      rail: { questions: [no("prime"), no("teaming"), no("subcontract")], starters: [] },
    };
    const after = applyAnswers(read, { prime: "No", teaming: "No", subcontract: "No" });
    expect(after.call).toBe("skip");
  });
});

describe("answers", () => {
  const epa = () => SCORED_FORECASTS.find((x) => x.id === EPA) as ScoredForecast;

  it("takes a gap and its step off the page when an answer settles them", () => {
    const base = readForecast(epa());
    const cafe: RailQuestion = {
      id: "cafe",
      noun: "Café",
      ask: "Do you run a café?",
      input: "choice",
      options: ["Yes", "No", "Not sure"],
      effects: [
        { when: { equals: "Yes" }, removeLimit: "No café of your own", removeStep: "partner" },
      ],
    };
    const before: ForecastRead = {
      ...base,
      limits: [...base.limits, { kind: "risk", title: "No café of your own" }],
      plan: [
        ...base.plan,
        { id: "later", name: "Later", steps: [{ id: "partner", kind: "task", title: "Partner" }] },
      ],
      rail: { ...base.rail, questions: [cafe] },
    };
    const after = applyAnswers(before, { cafe: "Yes" });
    expect(after.limits.some((c) => c.title === "No café of your own")).toBe(false);
    expect(after.plan.flatMap((ph) => ph.steps).some((s) => s.id === "partner")).toBe(false);
  });

  it("raises confidence only when an answer moves a way in", () => {
    // A named place in a served state, with sizes known, so the facts allow Go.
    const f = score("fed-army-food-service-order", {
      popState: "NC",
      popCity: "Fort Bragg",
      setAsideCode: "SBA",
      valHigh: 100000,
    });
    const base = readForecast(f);
    const read: ForecastRead = {
      ...base,
      confidence: "medium",
      paths: [
        { key: "prime", state: "not_yet", why: "Grant needs an answer." },
        { key: "teaming", state: "not_yet", why: "Same reason." },
        { key: "subcontract", state: "not_yet", why: "Same reason." },
      ],
      rail: {
        questions: [
          {
            id: "kitchen",
            noun: "Kitchen",
            ask: "Do you have a kitchen?",
            input: "choice",
            options: ["Yes", "No", "Not sure"],
            effects: [
              { when: { equals: "No" }, addLimit: { kind: "risk", title: "No kitchen" } },
              {
                when: { equals: "Yes" },
                path: { key: "prime", state: "go", why: "You can cook it." },
              },
            ],
          },
        ],
        starters: [],
      },
    };
    expect(applyAnswers(read, { kitchen: "No" }).confidence).toBe("medium");
    expect(applyAnswers(read, { kitchen: "Yes" }).confidence).toBe("high");
  });
});

describe("rivals", () => {
  it("says the holder held the contract until its current end once that date has passed", () => {
    const f = SCORED_FORECASTS.find(
      (x) => x.id === "fed-food-service-training-norfolk",
    ) as ScoredForecast;
    // A current end date can lag an extension, so a past date is "at least", never "until".
    expect(deriveRead(f).win[0]?.body).toContain("had it through at least 31 July 2026");
  });
});

describe("a renew step comes before the registration ends", () => {
  it("never dates the phase holding a renew step later than 30 days before the end", () => {
    for (const f of SCORED_FORECASTS) {
      const read = readForecast(f);
      const ends = f.registration.endsOn;
      if (!ends) continue;
      for (const phase of read.plan) {
        if (!phase.when || !phase.steps.some((s) => s.id === "renew")) continue;
        const by = new Date(`${phase.when.replace(/^by /, "")} 00:00:00 UTC`);
        const limit = new Date(`${ends}T00:00:00Z`).getTime() - 30 * 86_400_000;
        expect(by.getTime()).toBeLessThanOrEqual(limit);
      }
    }
  });
});

describe("review round 3", () => {
  const CHARLOTTE = "fed-boxed-meals-charlotte";

  it("gives one registration card and one step, with the page's own dates", () => {
    const f = score(
      CHARLOTTE,
      {},
      firm({ registration: { status: "active", endsOn: "2026-10-06" } }),
    );
    const read = readForecast(f);
    const cards = read.limits.filter((c) => /^Registration/.test(c.title));
    expect(cards).toHaveLength(1);
    expect(cards[0].body).toContain("6 October 2026");
    expect(JSON.stringify(read)).not.toContain("15 April 2027");
    const renews = read.plan.flatMap((ph) => ph.steps.filter((s) => s.id === "renew"));
    expect(renews).toHaveLength(1);
    // Renew-by is already past, so the step goes to Now.
    expect(read.plan[0].steps[0].id).toBe("renew");
  });

  it("shows no registration card when the customer has no gap", () => {
    const f = score(
      "fed-epa-cafeteria-rtp",
      {},
      firm({ registration: { status: "active", endsOn: "2029-06-30" } }),
    );
    expect(readForecast(f).limits.some((c) => /^Registration/.test(c.title))).toBe(false);
  });

  it("lets no answer remove a page warning or open a way the facts close", () => {
    const f = score(
      CHARLOTTE,
      { setAsideCode: "8A" },
      firm({ certs: [], registration: { status: "not_registered", endsOn: null } }),
    );
    const read = readForecast(f);
    const q: RailQuestion = {
      id: "x",
      noun: "X",
      ask: "X?",
      input: "choice",
      options: ["Yes"],
      effects: [
        {
          when: { equals: "Yes" },
          removeLimit: "No active registration found",
          removeStep: "register",
          path: { key: "prime", state: "go", why: "Go." },
        },
      ],
    };
    const after = applyAnswers({ ...read, rail: { ...read.rail, questions: [q] } }, { x: "Yes" });
    expect(after.limits.some((c) => c.title === "No active registration found")).toBe(true);
    expect(after.plan.flatMap((ph) => ph.steps).some((s) => s.id === "register")).toBe(true);
    expect(after.paths.find((p) => p.key === "prime")?.state).toBe("no_go");
  });

  it("applies every matching effect of one answer", () => {
    const f = SCORED_FORECASTS.find((x) => x.id === CHARLOTTE) as ScoredForecast;
    const read = readForecast(f);
    const q: RailQuestion = {
      id: "k",
      noun: "Kitchen",
      ask: "Kitchen?",
      input: "choice",
      options: ["No"],
      effects: [
        { when: { equals: "No" }, addLimit: { kind: "risk", title: "No kitchen" } },
        {
          when: { equals: "No" },
          path: { key: "prime", state: "no_go", why: "You need a kitchen." },
        },
      ],
    };
    const after = applyAnswers({ ...read, rail: { ...read.rail, questions: [q] } }, { k: "No" });
    expect(after.limits.some((c) => c.title === "No kitchen")).toBe(true);
    expect(after.paths.find((p) => p.key === "prime")?.state).toBe("no_go");
  });

  it("holds the read to Not yet when the customer's states are not on record", () => {
    const read = readForecast(score("fed-epa-cafeteria-rtp", {}, firm({ states: [] })));
    expect(read.paths.some((p) => p.state === "go")).toBe(false);
  });

  it("keeps who may bid on the read, and names the program on a waiting read", () => {
    const epa = readForecast(
      score(
        "fed-epa-cafeteria-rtp",
        { setAsideCode: "8A" },
        firm({ certs: [], certsKnown: false }),
      ),
    );
    expect(epa.job.facts.some((x) => x.label === "Who may bid")).toBe(true);
    const army = deriveRead(
      score(
        "fed-army-food-service-order",
        { setAsideCode: "8A", popState: "NC" },
        firm({ certs: [], certsKnown: false }),
      ),
    );
    expect(army.job.facts.find((x) => x.label === "Who may bid")?.value).toContain(
      "Add your certificates",
    );
  });

  it("reads the buyer's own record: a contract's holders only, and work not competed", () => {
    // Georgia served, so the out-of-area rule does not decide first.
    const atlanta = score(
      "fed-detainee-meals-atlanta",
      {},
      firm({ states: [...DEMO_FIRM.states, "GA"] }),
    );
    expect(atlanta.whoMayBid.kind).toBe("vehicle_only");
    expect(deriveRead(atlanta).paths.map((p) => p.state)).toEqual(["no_go", "no_go", "not_yet"]);
    const orleans = SCORED_FORECASTS.find(
      (x) => x.id === "fed-mess-attendants-new-orleans",
    ) as ScoredForecast;
    expect(orleans.whoMayBid.kind).toBe("not_competed");
    expect(orleans.steps.some((s) => s.kind === "email_buyer")).toBe(false);
    // The buyer's release date has passed.
    expect(deriveRead(orleans).prepare).toBe("The bid request may already be out");
  });

  it("reads an undecided recompete of an 8(a) contract as likely 8(a), tagged as our read", () => {
    const kodiak = SCORED_FORECASTS.find(
      (x) => x.id === "fed-full-food-service-kodiak",
    ) as ScoredForecast;
    expect(kodiak.whoMayBid.kind).toBe("program");
    expect(kodiak.whoMayBid.text.startsWith("Likely")).toBe(true);
    expect(kodiak.whoMayBid.ourRead).toBeTruthy();
    expect(deriveRead(kodiak).paths[0].state).toBe("no_go");
  });

  it("raises the AbilityOne question on food service, with a note, kept on a Skip page", () => {
    const f = score("fed-army-food-service-order");
    expect(f.unknowns).toContain(
      "If a program that employs people with disabilities has first claim",
    );
    const u = deriveRead(f).unknowns.find((x) => x.label.includes("disabilities"));
    expect(u?.note).toBeTruthy();
    expect(u?.couldChangeCall).toBe(true);
  });

  it("never says outside your area when we cannot tell if the work is done on site", () => {
    const f = score("fed-detainee-meals-atlanta", { naicsCode: null }, firm());
    expect(f.reasons.some((r) => r.text.includes("outside"))).toBe(false);
    expect(f.unknowns).toContain("If the work is done on site");
    const supplies = score("fed-detainee-meals-atlanta", { naicsCode: "424410" }, firm());
    expect(supplies.reasons.some((r) => r.text.includes("outside"))).toBe(false);
  });

  it("gives the registration step on a weak-fit Needs review page", () => {
    const f = score(
      "fed-mess-attendants-new-orleans",
      { setAsideCode: "8A", popState: "NC" },
      firm({ naics: ["541330"], registration: { status: "not_registered", endsOn: null } }),
    );
    // The buyer's record says not competed, so use a record without one.
    const g = score(
      "fed-army-food-service-order",
      { setAsideCode: "8A", popState: "NC" },
      firm({
        naics: ["541330"],
        certs: [],
        registration: { status: "not_registered", endsOn: null },
      }),
    );
    void f;
    const read = readForecast(g);
    expect(read.call).toBe("review");
    expect(read.plan.flatMap((ph) => ph.steps).some((s) => s.id === "register")).toBe(true);
  });

  it("warns about partner rules on the partner route of work kept for small businesses", () => {
    const f = score(
      "fed-full-food-service-cape-may",
      { setAsideCode: "SBA" },
      firm({ states: [...DEMO_FIRM.states, "NJ"] }),
    );
    const read = deriveRead(f);
    if (f.partnerRoute) {
      expect(read.limits.some((c) => c.title === "A partner can cost you this job")).toBe(true);
      expect(read.paths.find((p) => p.key === "teaming")?.why).toBe(
        "Only with a small partner of the same kind.",
      );
    }
  });

  it("says an estimated local date is an estimate, not the buyer's date", () => {
    const f = SCORED_FORECASTS.find(
      (x) => x.id === "sled-petersburg-nutrition-plan",
    ) as ScoredForecast;
    const read = readForecast(f);
    expect(JSON.stringify(read.timeline)).not.toContain("The buyer's date");
    expect(read.prepare ?? "").not.toContain("the buyer's date");
  });

  it("tells the chat whether the whole page changed, not whether one answer had an effect", () => {
    const base = readForecast(SCORED_FORECASTS.find((x) => x.id === CHARLOTTE) as ScoredForecast);
    const health: RailQuestion = {
      id: "health",
      noun: "Health report",
      ask: "Do you have a health report?",
      input: "choice",
      options: ["Yes", "No", "Not sure"],
      effects: [
        { when: { equals: "No" }, addLimit: { kind: "risk", title: "No current health report" } },
      ],
    };
    const read: ForecastRead = { ...base, rail: { ...base.rail, questions: [health] } };
    const none = readSignature(read);
    // Yes to the health report changes nothing a customer can see.
    expect(readSignature(applyAnswers(read, { health: "Yes" }))).toBe(none);
    // No adds a gap.
    expect(readSignature(applyAnswers(read, { health: "No" }))).not.toBe(none);
  });

  it("hides Grant can help where the chat holds nothing for the step", () => {
    const read = readForecast(
      SCORED_FORECASTS.find((x) => x.id === "fed-epa-cafeteria-rtp") as ScoredForecast,
    );
    for (const s of read.plan.flatMap((ph) => ph.steps))
      if (s.owners?.includes("grant_help")) expect(s.action?.kind).toBe("rail");
  });
});
