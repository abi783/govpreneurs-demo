// The Success Center sample data reads right for the trucking company.
//   DEMO_MEMBER=trucking bunx vitest run src/demo/members

import { describe, expect, it } from "vitest";
import { MEMBER } from "../../../member";
import { buildSeed } from "../../../sc/business/seed";
import { buildPayload } from "../../../sc/business/payload";
import { TELL_SAMPLE, demoExtract } from "../../../sc/business/demoTell";
import { readyScore } from "@sc/lib/businessProfile/score";
import { acceptStoredValue } from "@sc/lib/businessProfile/storedValue";
import { planTell } from "@sc/lib/businessProfile/tell";
import { copyProblem } from "../../../../../qa/copyRules";
import { getActionPlans } from "../../../sc/home/actionPlan";
import { BENCH } from "../../../sc/mentors/bench";
import { buildTasksPayload } from "../../../sc/tasks/payload";
import { TASKS } from "../../../story/workspace";
import { listTrackedItems } from "@/lib/stayReady";
import { daysUntil } from "../../../story/clock";

const FOOD_KEYS = ["health_permits", "food_manager_certifications", "food_handler_cards", "doc_haccp_plan", "health_inspection_score", "facilities", "max_daily_output"];
/** Other members' facts that must not leak into her record. */
const OTHER_WORDS = /kitchen|ServSafe|meals|catering|\bHUB\b|HUBZone|WOSB|woman-owned|Lantern|Dana|video|paid social|surety|488510/i;

describe.runIf(MEMBER === "trucking")("My Business seed (trucking)", () => {
  const seed = buildSeed();
  const payload = buildPayload(seed);
  const score = readyScore(payload.fields, undefined, payload.media);

  it("starts at the story's score, with gaps and five suggestions", () => {
    expect(`${score.settled} of ${score.total}`).toBe("45 of 51");
    expect(payload.counter).toEqual({ answered: 14, total: 14 });
    expect(payload.proposals).toHaveLength(5);
  });

  it("every stored answer and suggestion passes the record's own check", () => {
    for (const row of seed.rows) expect(acceptStoredValue(row.fieldKey, row.value).ok, row.fieldKey).toBe(true);
    for (const p of seed.proposals) expect(acceptStoredValue(p.fieldKey, p.value).ok, p.fieldKey).toBe(true);
  });

  it("holds her story: VetCert ends in 47 days, no SDDC registration, no hazmat, no other member's facts", () => {
    expect(seed.rows.map((r) => r.fieldKey).filter((k) => FOOD_KEYS.includes(k))).toEqual([]);
    const json = JSON.stringify(seed);
    expect(json).not.toMatch(OTHER_WORDS);
    expect(json).toContain("Service-disabled veteran-owned (SBA VetCert)");
    expect(json).toContain("not in SDDC's carrier program");
    expect(json).not.toMatch(/hazmat endorsement"/i);
    expect(score.open.map((f) => f.key)).toContain("key_personnel");
  });

  it("Tell Hunter reads the sample sentence into suggestions, and keeps what is already on file", () => {
    const held = new Map(seed.rows.map((r) => [r.fieldKey, r]));
    const plan = planTell({
      extraction: demoExtract(TELL_SAMPLE),
      held: (k) => {
        const r = held.get(k);
        return r ? { value: r.value, state: r.state, originKey: r.originKey } : null;
      },
      openProposal: () => null,
    });
    expect(plan.proposals.map((p) => p.fieldKey)).toEqual(["search_keywords", "key_personnel", "ninety_day_goal"]);
    expect(JSON.stringify(plan.proposals[0])).toMatch(/routes.*freight.*container/i);
    expect(plan.dropped.map((d) => d.fieldKey)).toEqual(["payment_terms_tolerance"]);
    expect(plan.leftover).toEqual([]);
  });
});

describe.runIf(MEMBER === "trucking")("Success Center (trucking)", () => {
  it("the first open task is Ava's three questions on the hero bid", () => {
    const tasks = buildTasksPayload();
    expect(tasks.sections.all.tasks[0]?.title).toMatch(/^Answer Ava's 3 questions/);
    for (const t of tasks.sections.all.tasks) expect(t.due, t.id).not.toBeNull();
  });

  it("the action plan and the mentor bench read clean and fit the member", () => {
    const plan = getActionPlans()[0]!;
    const words = [plan.title, plan.description, ...plan.steps.flatMap((s) => [s.title, s.content]), ...BENCH.flatMap((m) => [m.title, m.bio, m.consultationDescription])].map(
      (w) => w ?? "",
    );
    for (const w of words) expect(copyProblem(w), w).toBeNull();
    expect(words.join(" ")).not.toMatch(/kitchen|food|cook|meal|catering|ServSafe|video|campaign|surety/i);
    expect(plan.steps).toHaveLength(7);
    expect(plan.steps.find((s) => s.resourceUrl?.startsWith("/ava/"))?.resourceUrl).toBe(TASKS.find((t) => t.source === "ava")!.to);
  });

  it("Stay Ready tracks the VetCert recertification and her insurance, and no bond line", () => {
    const items = listTrackedItems();
    expect(items.map((i) => i.id)).toEqual(["sam", "vetcert", "insurance", "insurance-auto"]);
    expect(daysUntil(items.find((i) => i.id === "vetcert")!.dueDate)).toBe(47);
    expect(items.find((i) => i.id === "insurance-auto")!.name).toMatch(/cargo/);
  });
});
