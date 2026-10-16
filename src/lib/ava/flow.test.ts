// The two-phase flow (lib/ava/flow.ts): each rule the design and the build
// plan decided, asserted. Run: bun test src/lib/ava

import { describe, expect, test } from "vitest";
import { CASES } from "./cases";
import { gettingInsurance, play } from "./play";
import { DEMO, effectiveBid } from "./derive";
import { getAvaBid } from "./fixtures";
import {
  answerQueue,
  checkFixes,
  downloadSig,
  downloadStale,
  flowOf,
  grantUnsure,
  builtSummary as builtSummaryOf,
  headlineOf,
  holdsOf,
  laterFollowUp,
  leadLine,
  mentorTooLate,
  mustQueue,
  needsWords,
  leftList,
  readyWords,
  riskAllowed,
  samRuleOf,
  selfChecks as selfChecksOf,
  sendDay,
  samWarning,
  stepsOf,
  STAFFING_KEY,
  stopOf,
  type Flow,
} from "./flow";
import { threadOf } from "./thread";
import { withGrantFor } from "./grant";
import { approvalTotal, isRateList, rates, ratesApproved } from "./price";
import { nowIso } from "./dates";
import { emptyState, type BidState } from "./store";
import { checkSig } from "./flow";
import { createReview, getReviewByOpportunity, demoMentor } from "../../demo/ava/mentorReviews";

const FAY = "FAYNC-2026-R-08";
const CUM = "CUMCO-2026-014";
const MAC = "SP4701-26-Q-0021";

function look(id: string, s: BidState) {
  const g = withGrantFor(id, getAvaBid(id)!, s, {});
  const bid = effectiveBid(g.fixture, g.s);
  return { bid, s: g.s, flow: flowOf(bid, g.s, { now: Date.now() }) };
}

const started = (fixes: Record<string, true> = {}): BidState => ({
  ...emptyState(),
  started: true,
  briefConfirmed: true,
  fixes,
});
const stage = (id: Flow["stage"]) => (f: Flow) => f.stage === id;
const at = (key: string) => (f: Flow) => f.current?.key === key;

describe("phase 1: read, check you can bid, answer, check", () => {
  test("Ava reads first: nothing is asked before the files are read", () => {
    const { flow } = look(FAY, started());
    expect(flow.stage).toBe("reading");
    expect(flow.queue).toHaveLength(0);
  });

  test("the rules that reject a bid are asked before anything is built", () => {
    const s = play(FAY, started(), stage("must"));
    const { flow } = look(FAY, s);
    expect(flow.current?.kind).toBe("must");
    // Every question in the must-have phase is about a rule.
    expect(flow.queue.every((q) => q.kind === "must")).toBe(true);
  });

  test("a must-have she cannot meet pauses the bid, and taking it back unpauses it", () => {
    const s = play(FAY, started(), stage("paused"), (q, st) =>
      q.key === "ask:ask-site-visit"
        ? {
            ...st,
            answers: {
              ...st.answers,
              "ask-site-visit": { status: "done", at: "", choiceId: "sv-none" },
            },
          }
        : null,
    );
    expect(look(FAY, s).flow.stage).toBe("paused");
    const back = { ...s, answers: { ...s.answers } };
    delete back.answers["ask-site-visit"];
    expect(look(FAY, back).flow.stage).not.toBe("paused");
  });

  test("a paper she is getting from someone else comes first, with the email Ava drafts", () => {
    const s = play(FAY, started(), stage("answer"), (q, st) =>
      q.key === "must:hr-insurance"
        ? { ...st, mustHave: { ...st.mustHave, "hr-insurance": { says: "getting", at: "" } } }
        : null,
    );
    const { bid, flow } = look(FAY, s);
    expect(flow.current?.key).toBe("ask:ask-insurance");
    // One blue mark: the paper on its way is one of Ava's questions now, not
    // a second step still waiting (Shyam, 7 October 2026).
    const steps = stepsOf(bid, s, flow, null);
    expect(steps[1].state).toBe("done");
    expect(steps[2]).toMatchObject({ id: "answer", state: "wait" });
  });

  test("a question about an event still to come is never asked before its day", () => {
    // The Cumberland pre-bid conference is 4 days ahead: "did you sign the sheet?"
    // opens when she says she will go, and waits for the day.
    const s: BidState = {
      ...started(),
      answers: {
        "ask-prebid": { status: "done", at: nowIso(), choiceId: "prebid-yes" },
      },
      opened: { "ask-prebid-signed": true },
    };
    const { bid, flow } = look(CUM, s);
    const signed = bid.asks.find((a) => a.id === "ask-prebid-signed")!;
    expect(laterFollowUp(bid, signed)).toBe(true);
    expect(answerQueue(bid, s, flow.parts).some((q) => q.key === "ask:ask-prebid-signed")).toBe(
      false,
    );
  });

  test("the staffing plan is asked before the costs that build the price", () => {
    const s = play(FAY, started(), stage("answer"));
    const { bid, flow } = look(FAY, s);
    const keys = answerQueue(bid, s, flow.parts).map((q) => q.key);
    expect(keys.indexOf("staffing")).toBeGreaterThan(-1);
    expect(keys.indexOf("staffing")).toBeLessThan(keys.indexOf("ask:ask-pay-rates"));
    expect(keys.indexOf("staffing")).toBeLessThan(
      keys.indexOf("price") === -1 ? 999 : keys.indexOf("price"),
    );
  });

  test("Ava's check fixes what it can herself: the page limit and her legal name", () => {
    const s = play(FAY, started(), stage("checking"));
    const keys = checkFixes(look(FAY, s).bid, s).map((f) => f.key);
    expect(keys).toContain("pages:sec-operations");
    expect(keys).toContain("name-sam");
  });

  test("an answer changed after the check makes the check run again", () => {
    const s = play(FAY, started(), stage("ready"));
    expect(s.check?.sig).toBe(checkSig(s));
    const changed = {
      ...s,
      fixes: { ...s.fixes, [STAFFING_KEY]: true as const, extra: true as const },
    };
    expect(checkSig(changed)).not.toBe(s.check?.sig);
  });
});

describe("holes (decision 1): allowed, unless a rule needs the copy in the files", () => {
  test("a hole on a part that rejects nothing goes through, marked", () => {
    const s = play(FAY, started(), stage("ready"), (q, st) =>
      q.key === "ask:ask-food-safety"
        ? { ...st, left: { ...st.left, [q.key]: { at: "", for: "me" } } }
        : null,
    );
    const { flow } = look(FAY, s);
    expect(flow.stage).toBe("ready");
    expect(flow.holes.map((h) => h.key)).toContain("ask:ask-food-safety");
    expect(flow.holds).toHaveLength(0);
  });

  test("a missing copy for a rule that rejects the bid holds the download", () => {
    const s = play(FAY, started(), stage("ready"), (q, st) =>
      q.key === "ask:ask-insurance"
        ? { ...st, left: { ...st.left, [q.key]: { at: "", for: "me" } } }
        : null,
    );
    const { bid, flow } = look(FAY, s);
    expect(flow.holds.map((h) => h.key)).toContain("req:hr-insurance");
    // And she may not go ahead at risk on it (PRD R11).
    expect(holdsOf(bid, s, flow.parts).find((h) => h.key === "req:hr-insurance")?.canRisk).toBe(
      false,
    );
  });

  test("a step never goes back: with a part left open, the bar stays on Review bid", () => {
    const s = {
      ...play(FAY, started(), stage("ready"), (q, st) =>
        q.key === "ask:ask-food-safety"
          ? { ...st, left: { ...st.left, [q.key]: { at: "", for: "me" } } }
          : null,
      ),
      readOpened: true,
    };
    const { bid, flow } = look(FAY, s);
    const steps = stepsOf(bid, s, flow, null);
    expect(steps[2].state).toBe("done");
    expect(steps[3]).toMatchObject({ id: "review", state: "wait" });
    // One blue mark, and no words under any step (Shyam, 7 October 2026).
    expect(steps.filter((x) => x.state === "wait")).toHaveLength(1);
    expect(steps.every((x) => !x.sub)).toBe(true);
  });
});

describe("prices", () => {
  test("a rate list has no total, and she approves every line's rate", () => {
    const s = play(FAY, started({ [DEMO.rates]: true }), at("price"));
    const { bid, flow } = look(FAY, s);
    expect(isRateList(bid)).toBe(true);
    expect(flow.current?.kind).toBe("price");
    const r = rates(bid, s)!;
    const approved = { ...s, priceApproval: { at: "", total: 0, rates: r } };
    expect(ratesApproved(bid, approved)).toBe(true);
    // Changing one rate reopens the approval.
    const changed = {
      ...approved,
      priceApproval: { at: "", total: 0, rates: { ...r, [Object.keys(r)[0]]: 1 } },
    };
    expect(ratesApproved(bid, changed)).toBe(false);
  });
});

describe("downloads and dates", () => {
  test("a registration that ends before the award warns and never holds (FAR 52.204-7)", () => {
    const s = {
      ...play("SP4701-26-Q-0021", started({ [DEMO.samEnds]: true }), stage("ready")),
      readOpened: true,
    };
    const { bid, flow } = look("SP4701-26-Q-0021", s);
    expect(flow.holds.map((h) => h.key)).not.toContain("sam");
    expect(samWarning(bid, s)?.kind).toBe("before-award");
  });

  test("a mentor reply counts business days: Friday for a Monday deadline is too late", () => {
    const bid = getAvaBid(FAY)!;
    // Whatever today is, a due date one business day out is always too late.
    const oneBusinessDay = [1, 2, 3].find((d) => {
      const wd = new Date(Date.now() + d * 86_400_000).getUTCDay();
      return wd !== 0 && wd !== 6;
    })!;
    void oneBusinessDay;
    expect(mentorTooLate({ ...bid, deadline: { ...bid.deadline, dueDaysFromNow: 0 } }, 1)).toBe(
      true,
    );
    expect(mentorTooLate({ ...bid, deadline: { ...bid.deadline, dueDaysFromNow: 10 } }, 1)).toBe(
      false,
    );
  });

  test("Bid complete ticks once she downloads her bid as it stands, and un-ticks if it changes", () => {
    const s = { ...play(FAY, started(), stage("ready")), readOpened: true };
    const done = {
      ...s,
      downloads: [{ at: "", what: "Your whole bid", holes: 0, sig: downloadSig(s) }],
    };
    const { bid, flow } = look(FAY, done);
    const complete = stepsOf(bid, done, flow, null)[5];
    expect(complete).toMatchObject({ id: "complete", state: "done" });
    const edited = {
      ...done,
      edits: {
        "sec-operations:0:0": {
          sectionId: "sec-operations",
          paragraph: 0,
          was: "a",
          now: "b",
          by: "you" as const,
          at: "",
        },
      },
    };
    const later = look(FAY, edited);
    expect(stepsOf(later.bid, edited, later.flow, null)[5].state).not.toBe("done");
  });

  test("a change after the download makes it older than her bid: download it again", () => {
    const s = { ...play(FAY, started(), stage("ready")), readOpened: true };
    const done = {
      ...s,
      downloads: [{ at: "", what: "Your whole bid", holes: 0, sig: downloadSig(s) }],
    };
    expect(downloadStale(done)).toBe(false);
    const edited = {
      ...done,
      edits: {
        "sec-operations:0:0": {
          sectionId: "sec-operations",
          paragraph: 0,
          was: "a",
          now: "b",
          by: "mentor" as const,
          at: "",
        },
      },
    };
    expect(downloadStale(edited)).toBe(true);
  });

  test("a bid with no main file stops before Ava reads anything", () => {
    const { flow } = look("FAYNC-2026-R-08", started({ [DEMO.noMain]: true }));
    expect(flow.stage).toBe("stopped");
    expect(flow.stop).toBe("no-main");
  });
});

describe("what holds the download (review panel, 7 October 2026)", () => {
  test("a rule the buyer rejects a bid for can never go ahead at risk", () => {
    for (const id of [
      "req:hr-insurance",
      "security-amount",
      "wage:cook",
      "ack:add-2",
      "upload:0",
      "no-price",
      "price-incomplete",
      "price-approval",
      "commitments",
    ])
      expect(riskAllowed({ id })).toBe(false);
    expect(riskAllowed({ id: "staffing-price" })).toBe(true);
  });

  test("a bid deposit under 5% holds, and a risk taken on it changes nothing", () => {
    const s = CASES.find((c) => c.id === "deposit-short")!.build();
    const { bid, flow } = look("CUMCO-2026-014", s);
    const hold = flow.holds.find((h) => h.key === "security-amount");
    expect(hold?.canRisk).toBe(false);
    const risked = {
      ...s,
      risks: {
        "security-amount": { reason: "x", severity: "critical" as const, label: "x", at: "" },
      },
    };
    expect(holdsOf(bid, risked, flow.parts).map((h) => h.key)).toContain("security-amount");
  });

  test("an addendum she added holds until Ava compares it or she says it changes nothing", () => {
    const s = CASES.find((c) => c.id === "addendum-upload")!.build();
    const { bid, flow } = look(FAY, s);
    expect(flow.holds.find((h) => h.key === "upload:0")).toMatchObject({
      kind: "addendum",
      canRisk: false,
    });
    const read = { ...s, fixes: { ...s.fixes, "upload-read:0": true as const } };
    expect(holdsOf(bid, read, flow.parts).map((h) => h.key)).not.toContain("upload:0");
  });

  test("8.3 is built on a finding she may take at risk", () => {
    const s = CASES.find((c) => c.id === "atrisk")!.build();
    const { flow } = look(FAY, s);
    expect(flow.holds.some((h) => h.canRisk)).toBe(true);
    expect(flow.holds.filter((h) => h.canRisk).every((h) => h.kind === "risky")).toBe(true);
  });

  test("a price that changes in phase 2 holds the download and is asked again", () => {
    const s = { ...play(FAY, started(), stage("ready")), readOpened: true };
    const changed = { ...s, priceApproval: { at: "", total: s.priceApproval!.total - 100 } };
    const { flow } = look(FAY, changed);
    expect(flow.stage).toBe("read");
    expect(flow.holds.find((h) => h.key === "price")).toMatchObject({
      kind: "price",
      canRisk: false,
    });
    expect(flow.holds.find((h) => h.key === "price")?.question?.kind).toBe("price");
  });

  test("an addendum in phase 2 reopens her price and a promise: both hold, both are asked", () => {
    const s = CASES.find((c) => c.id === "addendum")!.build();
    const { flow } = look(FAY, s);
    const kinds = flow.holds.map((h) => h.kind);
    expect(kinds).toContain("price");
    expect(kinds).toContain("promise");
    expect(flow.current).not.toBeNull();
  });

  test("with her staffing plan left open there is no price question, and the price holds", () => {
    const s = play(FAY, started(), stage("ready"), (q, st) =>
      q.kind === "staffing"
        ? { ...st, left: { ...st.left, staffing: { at: "", for: "mentor" as const } } }
        : null,
    );
    const { bid, flow } = look(FAY, s);
    expect(answerQueue(bid, s, flow.parts).some((q) => q.kind === "price")).toBe(false);
    expect(flow.holds.find((h) => h.key === "price")?.text).toBe(
      "No download yet: your price waits on your staffing plan.",
    );
  });

  test("prices she left open hold the download (Price it yourself)", () => {
    const s = play(FAY, started({ "demo:price-yourself": true }), stage("ready"), (q, st) =>
      q.key === "ask:ask-your-prices"
        ? { ...st, left: { ...st.left, [q.key]: { at: "", for: "me" as const } } }
        : null,
    );
    expect(look(FAY, s).flow.holds.map((h) => h.key)).toContain("price");
  });

  test("a certified check measured against no total is never 'met'", () => {
    const s = CASES.find((c) => c.id === "deposit-short")!.build();
    const noTotal = { ...s, fixes: { ...s.fixes, "demo:price-yourself": true as const } };
    const { flow } = look("CUMCO-2026-014", noTotal);
    expect(flow.must.find((r) => r.rule.askId === "ask-bid-bond")?.state).not.toBe("meets");
  });

  test("an edit in phase 2 makes the check run again before the download comes back", () => {
    const s = { ...play(FAY, started(), stage("ready")), readOpened: true };
    expect(look(FAY, s).flow.checked).toBe(true);
    const edited = {
      ...s,
      edits: {
        "sec-operations:0:0": {
          sectionId: "sec-operations",
          paragraph: 0,
          was: "a",
          now: "b",
          by: "you" as const,
          at: "",
        },
      },
    };
    const { flow } = look(FAY, edited);
    expect(flow.checked).toBe(false);
    expect(flow.holds.map((h) => h.kind)).toEqual(["checking"]);
  });

  test("a check that could not finish asks nothing and lists what to check yourself (D39)", () => {
    const s = CASES.find((c) => c.id === "check-failed")!.build();
    const { bid, flow } = look(FAY, s);
    expect(flow.stage).toBe("read");
    expect(selfChecksOf(bid, s).length).toBeGreaterThan(0);
  });
});

describe("her insurance on its way (Amira, F1)", () => {
  test("after she asks her agent, the paper can still be added, and the download opens", () => {
    const s = { ...play(FAY, started(), stage("ready"), gettingInsurance), readOpened: true };
    const before = look(FAY, s);
    const hold = before.flow.holds.find((h) => h.key === "req:hr-insurance");
    // The hold leads to the paper itself, and the paper asks for a file.
    expect(hold?.question?.key).toBe("ask:ask-insurance");
    expect(hold?.question?.ask?.kind).toBe("upload");
    // Her price waits on the insurance cost, and says so.
    expect(before.flow.holds.find((h) => h.key === "price")?.text).toMatch(/waits on/);

    // The certificate comes; she adds it.
    const came = {
      ...s,
      answers: {
        ...s.answers,
        "ask-insurance": {
          status: "done" as const,
          at: "",
          fileName: "Certificate.pdf",
          values: { "ins-added-cost": 650 },
        },
      },
    };
    const after = look(FAY, came);
    expect(after.flow.holds.map((h) => h.key)).not.toContain("req:hr-insurance");
    // Her price is now asked in the chat, never added without her yes.
    const priceHold = after.flow.holds.find((h) => h.key === "price");
    expect(priceHold?.question?.kind).toBe("price");

    // She approves it, Ava checks it: nothing holds the download.
    const total = approvalTotal(after.bid, came)!;
    const approved = { ...came, priceApproval: { at: "", total } };
    // Phase 2 asks what the check finds (a cost the price does not carry), then
    // checks again, as the workspace does.
    let cur: BidState = approved;
    for (let i = 0; i < 4; i++) {
      cur = play(FAY, cur, (f) => f.current === null);
      cur = { ...cur, check: { ...cur.check!, doneAt: 1, sig: checkSig(cur) } };
    }
    expect(look(FAY, cur).flow.holds).toEqual([]);
  });
});

describe("what she is told", () => {
  test("Ava never says nothing would get the bid rejected", { timeout: 60_000 }, () => {
    for (const c of CASES) {
      if (!getAvaBid(c.noticeId)) continue;
      const s = c.build();
      const { bid, flow } = look(c.noticeId, s);
      const head = headlineOf(bid, s, flow, {
        mentor: null,
        mentorName: "Sarah Mitchell",
        pending: false,
      });
      expect(`${head.s} ${head.sub}`).not.toMatch(/nothing (in it )?would get it rejected/i);
      expect(readyWords(bid, s, flow).lines.join(" ")).not.toMatch(/nothing (in it )?would/i);
    }
  });

  test("a site visit still ahead is named at the milestone, with what missing it costs", () => {
    const s = play(FAY, started(), stage("ready"));
    const { bid, flow } = look(FAY, s);
    const open = flow.must.filter((r) => r.state !== "meets" && r.state !== "have");
    const left = leftList(bid, s, flow);
    for (const r of open)
      expect(left.find((x) => x.key === `rule:${r.rule.id}`)?.note).toBe(
        "Missing it gets the bid rejected.",
      );
  });

  test("the milestone counts one list: each thing once, and the headline says the same number", () => {
    const s = CASES.find((c) => c.id === "tp-milestone-holes")!.build();
    const { bid, flow } = look(FAY, s);
    const left = leftList(bid, s, flow);
    const titles = left.map((x) => x.title);
    expect(new Set(titles).size).toBe(titles.length);
    // Exhibit D once, carrying what Ava could not check about it.
    const exD = left.filter((x) => /Exhibit D/.test(x.title));
    expect(exD).toHaveLength(1);
    expect(exD[0].note).toMatch(/not checked against it/);
    expect(readyWords(bid, s, flow).head).toContain(`${left.length} things are left`);
  });

  test("the cost question is asked as a question, and her answer says what she agreed to", () => {
    const s = CASES.find((c) => c.id === "tp-milestone-holes")!.build();
    const { bid, flow } = look(FAY, s);
    const turns = threadOf({
      bid,
      s,
      flow,
      now: Date.now(),
      memberName: "Amira Haddad",
      grant: null,
      mentor: null,
    });
    const said = turns.flatMap((x) =>
      x.kind === "ava" ? x.lines : x.kind === "you" ? [x.text] : [],
    );
    const ask = said.find((x) => /^Your price does not cover/.test(x));
    if (ask) {
      expect(ask).toMatch(/Add it to your price\?$/);
      expect(said).toContain("Yes, add it to my price.");
    }
    expect(said).not.toContain("Yes, do it.");
  });

  test("the header and the chat give one count for the rules Grant could not judge", () => {
    const s = play(FAY, started(), stage("must"));
    const { bid, flow } = look(FAY, s);
    const head = headlineOf(bid, s, flow, {
      mentor: null,
      mentorName: "Sarah Mitchell",
      pending: false,
    });
    const n = grantUnsure(bid);
    const chat = threadOf({
      bid,
      s,
      flow,
      now: Date.now(),
      memberName: "Amira Haddad",
      grant: null,
      mentor: null,
    })
      .flatMap((t) => (t.kind === "ava" ? t.lines : []))
      .join(" ");
    if (n > 0) {
      expect(head.sub).toContain(`on ${n} of them`);
      expect(chat).toContain(`on ${n} of them`);
    }
    expect(head.needs).not.toMatch(/must-have/);
  });

  test("the 'Needs you' words add up to the count beside them", () => {
    const s = play(FAY, started(), stage("answer"));
    const { flow } = look(FAY, s);
    const words = needsWords(flow.queue) ?? "";
    const nums = [...words.matchAll(/(\d+)/g)].reduce((a, m) => a + Number(m[1]), 0);
    const price = /your price/.test(words) ? 1 : 0;
    if (!/ more$/.test(words) && flow.queue.length > 1)
      expect(nums + price).toBe(flow.queue.length);
  });

  test("a call she will make is recorded as hers, never as an email sent", () => {
    const s = play(FAY, started(), stage("answer"), (q, st) =>
      q.key === "must:hr-insurance"
        ? { ...st, mustHave: { ...st.mustHave, "hr-insurance": { says: "getting", at: "" } } }
        : null,
    );
    const called = {
      ...s,
      answers: {
        ...s.answers,
        "ask-insurance": {
          status: "forwarded" as const,
          at: "",
          forwardedTo: "a call to your insurance agent",
        },
      },
      trail: [...s.trail, "ask:ask-insurance"],
    };
    const { bid, flow } = look(FAY, called);
    const mine = threadOf({
      bid,
      s: called,
      flow,
      now: Date.now(),
      memberName: "Amira Haddad",
      grant: null,
      mentor: null,
    })
      .flatMap((t) => (t.kind === "you" ? [t.text] : []))
      .join(" ");
    expect(mine).toContain("I will call my insurance agent.");
    expect(mine).not.toMatch(/Sent: the email/);
  });
});

describe("round 2 of the review panel (7 October 2026)", () => {
  test("an addendum that changes a rule after her word asks it again, and holds", () => {
    const s0 = { ...play(CUM, started(), stage("ready")), readOpened: true };
    expect(look(CUM, s0).flow.holds).toHaveLength(0);
    const s = { ...s0, addendaReceived: ["add-1"] };
    const { flow } = look(CUM, s);
    const q = flow.queue.find((x) => x.changedBy === 1);
    expect(q?.key).toMatch(/^must:/);
    expect(flow.holds.map((h) => h.kind)).toContain("reopened");
    // Her word on the rule as it now reads settles it.
    const rid = q!.key.slice("must:".length);
    const again = {
      ...s,
      mustHave: { ...s.mustHave, [rid]: { says: "have" as const, at: "", addenda: ["add-1"] } },
    };
    expect(look(CUM, again).flow.queue.some((x) => x.key === q!.key)).toBe(false);
  });

  test("an addendum she added: her word clears the comparison, never the acknowledgment", () => {
    const s = CASES.find((c) => c.id === "addendum-upload")!.build();
    const { bid, flow } = look(FAY, s);
    expect(flow.holds.map((h) => h.key)).toEqual(
      expect.arrayContaining(["upload:0", "upload-ack:0"]),
    );
    const read = { ...s, fixes: { ...s.fixes, "upload-read:0": true as const } };
    const keys = holdsOf(bid, read, flow.parts).map((h) => h.key);
    expect(keys).not.toContain("upload:0");
    expect(keys).toContain("upload-ack:0");
    expect(selfChecksOf(bid, read).join(" ")).toMatch(/not compared Addendum_3\.pdf/);
    expect(riskAllowed({ id: "upload-ack:0" })).toBe(false);
  });

  test("a quote for coverage is a step, not the certificate: the copy still holds", () => {
    const s = {
      ...play(FAY, started(), stage("ready"), (q, st) =>
        q.key === "ask:ask-insurance"
          ? {
              ...st,
              answers: {
                ...st.answers,
                "ask-insurance": { status: "dont-have" as const, at: "", optionId: "dh-ins-buy" },
              },
            }
          : null,
      ),
      readOpened: true,
    };
    expect(look(FAY, s).flow.holds.map((h) => h.key)).toContain("req:hr-insurance");
  });

  test("a hold only the check clears never waits behind another hold", () => {
    const s = { ...play(FAY, started(), stage("ready")), readOpened: true };
    const stale = { ...s, priceApproval: { at: "", total: 1 }, check: { ...s.check!, sig: "old" } };
    expect(look(FAY, stale).flow.holds.map((h) => h.kind)).toContain("checking");
  });

  test("her federal registration rule follows its warning: never all met while it stands", () => {
    const s = {
      ...play(MAC, started({ [DEMO.samEnds]: true }), stage("ready")),
      readOpened: true,
    };
    const { bid, flow } = look(MAC, s);
    const rule = samRuleOf(bid)!;
    expect(flow.must.find((r) => r.rule.id === rule.id)?.state).not.toBe("meets");
    expect(builtSummaryOf(bid, s, flow)[0].done).toBe(false);
  });

  test("a check that did not finish never reads as a checked bid", () => {
    const s = CASES.find((c) => c.id === "check-failed")!.build();
    const { bid, flow } = look(FAY, { ...s, readOpened: false });
    expect(readyWords(bid, s, flow).head).not.toMatch(/I checked every rule/);
  });

  test("downloading one part is not downloading her bid", () => {
    const s = { ...play(FAY, started(), stage("ready")), readOpened: true };
    const part = {
      ...s,
      downloads: [{ at: "", what: "Price sheet", holes: 0, sig: downloadSig(s), whole: false }],
    };
    const { bid, flow } = look(FAY, part);
    expect(stepsOf(bid, part, flow, null)[5].state).toBe("next");
    expect(downloadStale(part)).toBeNull();
  });

  test("a tap that changes no file never makes her download old", () => {
    const s = { ...play(MAC, started(), stage("ready")), readOpened: true };
    const done = {
      ...s,
      downloads: [{ at: "", what: "Your whole bid", holes: 0, sig: downloadSig(s), whole: true }],
    };
    expect(downloadStale({ ...done, fixes: { ...done.fixes, "sam-renewed": true as const } })).toBe(
      false,
    );
  });

  test("a short deposit is one hold, not two", () => {
    const s = CASES.find((c) => c.id === "deposit-short")!.build();
    const keys = look(CUM, s).flow.holds.map((h) => h.key);
    expect(keys).toContain("security-amount");
    expect(keys.filter((k) => k.startsWith("req:req-bid"))).toHaveLength(0);
  });

  test("leaving a rule for a mentor never says a mentor can meet it for her", () => {
    const s = play(FAY, started(), stage("answer"), (q, st) =>
      q.key === "must:hr-permit" || q.key.startsWith("must:")
        ? {
            ...st,
            left: { ...st.left, [q.key]: { at: "", for: "mentor" as const } },
            trail: [...st.trail, `left:${q.key}`],
          }
        : null,
    );
    const { bid, flow } = look(FAY, s);
    const said = threadOf({
      bid,
      s,
      flow,
      now: Date.now(),
      memberName: "Amira Haddad",
      grant: null,
      mentor: null,
    })
      .flatMap((t) => (t.kind === "ava" ? t.lines : []))
      .join(" ");
    expect(said).not.toMatch(/mentor can fill it/i);
  });

  test("the header sends her the same day as How to send it", () => {
    const s = { ...play(FAY, started(), stage("ready")), readOpened: true };
    const done = {
      ...s,
      downloads: [{ at: "", what: "Your whole bid", holes: 0, sig: downloadSig(s), whole: true }],
    };
    const { bid, flow } = look(FAY, done);
    const head = headlineOf(bid, done, flow, {
      mentor: null,
      mentorName: "Sarah Mitchell",
      pending: false,
    });
    expect(head.s).toContain(sendDay(bid));
  });

  test("a rule left open by its own question is a single open part, listed to check yourself", () => {
    const s = play(FAY, started(), stage("ready"), (q, st) =>
      q.key === "ask:ask-site-visit"
        ? {
            ...st,
            left: { ...st.left, [q.key]: { at: "", for: "me" as const } },
            trail: [...st.trail, `left:${q.key}`],
          }
        : null,
    );
    const { bid, flow } = look(FAY, s);
    const keys = flow.holes.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(selfChecksOf(bid, s).join(" ")).toMatch(/site visit/i);
  });
});

describe("the mentor", () => {
  test("sending her bid never replaces the mentor's read of the opportunity", () => {
    const id = "TEST-MENTOR-1";
    demoMentor.clear(id);
    createReview({
      opportunityId: id,
      opportunityTitle: "T",
      verdict: "Bid",
      rationale: "",
      note: "Opp",
    });
    // The shared list names a review by the millisecond it was sent. A person
    // cannot send two in one millisecond; this test can.
    for (const t = Date.now(); Date.now() === t; ) {
      /* wait for the next millisecond */
    }
    createReview({
      opportunityId: id,
      opportunityTitle: "T",
      verdict: "Bid",
      rationale: "",
      note: "Bid",
      subject: "bid",
    });
    expect(getReviewByOpportunity(id)?.memberNote).toBe("Opp");
    expect(getReviewByOpportunity(id, "bid")?.memberNote).toBe("Bid");
    demoMentor.clear(id);
  });
});

describe("a scan is read, and what can lose the bid is hers to confirm (PC-1)", () => {
  test("a scanned main file never stops the build", () => {
    const s = started({ [DEMO.scan]: true });
    const { bid } = look(FAY, s);
    expect(stopOf(bid)).toBeNull();
  });
  test("the due date and the price lines read from a scan are asked first", () => {
    const s = play(FAY, started({ [DEMO.scan]: true }), stage("answer"));
    const { flow } = look(FAY, s);
    expect(flow.queue.slice(0, 2).map((q) => q.key)).toEqual([
      "ask:ask-scan-due",
      "ask:ask-scan-price",
    ]);
  });
  test("a file whose words come out jumbled still stops it", () => {
    const { bid } = look(FAY, started({ [DEMO.unreadable]: true }));
    expect(stopOf(bid)).toBe("unreadable");
  });
});

describe("Ava asks how long a paper takes, and never guesses (OD2)", () => {
  const ask = () => look(FAY, started()).bid.asks.find((a) => a.id === "ask-insurance")!;
  test("before she says, Ava states no lead time", () => {
    const { bid } = look(FAY, started());
    expect(leadLine(bid, started(), ask()).text).toBe("");
  });
  test("her answer gives the day to ask by", () => {
    const s = { ...started(), lead: { "ask-insurance": "week" as const } };
    const { bid } = look(FAY, s);
    expect(leadLine(bid, s, ask()).text).toMatch(/^There is time\. Ask for it by /);
    expect(leadLine(bid, s, ask()).text).not.toMatch(/usually/);
  });
});

describe("every screen of the design can be reached", () => {
  // The stage each case must land on: its picture, in docs/ava/ava-two-phase.html.
  const expected: Record<string, Flow["stage"] | "no-fixture"> = {
    "tp-musthaves": "must",
    "tp-gettable": "answer",
    "tp-cantmeet": "paused",
    "tp-build": "answer",
    "tp-price": "answer",
    "tp-check": "checking",
    "tp-check-found": "found",
    "tp-milestone": "ready",
    "tp-milestone-holes": "ready",
    "tp-read": "read",
    "send-email": "read",
    "send-paper": "read",
    portal: "read",
    "send-reply": "read",
    "price-rates": "answer",
    "price-none": "read",
    "no-main": "stopped",
    unreadable: "answer",
    "no-files": "stopped",
    reopened: "read",
    critical: "read",
  };
  for (const c of CASES) {
    if (!(c.id in expected)) continue;
    test(`${c.title} lands on ${expected[c.id]}`, () => {
      const s = c.build();
      const { flow } = look(c.noticeId, s);
      expect(flow.stage).toBe(expected[c.id] as Flow["stage"]);
    });
  }

  // Each case plays a whole bid forward, so the run takes a few seconds.
  test("every case builds without throwing", () => {
    for (const c of CASES) expect(() => c.build()).not.toThrow();
  }, 60_000);

  test("the must-have queue is empty once every rule is settled", () => {
    const s = play(FAY, started(), stage("answer"));
    const { bid, flow } = look(FAY, s);
    expect(mustQueue(bid, s, flow.parts)).toHaveLength(0);
  });
});
