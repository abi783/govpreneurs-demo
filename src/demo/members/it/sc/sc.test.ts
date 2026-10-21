// The Success Center sample data reads right for the IT services firm.
//   DEMO_MEMBER=it bunx vitest run src/demo/members

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
/** Other members' facts that must not leak into his record. */
const OTHER_WORDS = /kitchen|ServSafe|meals|catering|\bHUB\b|HUBZone|WOSB|woman-owned|Lantern|Ninebark|Dana|Derrick|bucket truck|paid social|cinema/i;

describe.runIf(MEMBER === "it")("My Business seed (it)", () => {
  const seed = buildSeed();
  const payload = buildPayload(seed);
  const score = readyScore(payload.fields, undefined, payload.media);

  it("starts at the story's score, with gaps and five suggestions", () => {
    expect(`${score.settled} of ${score.total}`).toBe("44 of 51");
    expect(payload.counter).toEqual({ answered: 14, total: 14 });
    expect(payload.proposals).toHaveLength(5);
  });

  it("every stored answer and suggestion passes the record's own check", () => {
    for (const row of seed.rows) expect(acceptStoredValue(row.fieldKey, row.value).ok, row.fieldKey).toBe(true);
    for (const p of seed.proposals) expect(acceptStoredValue(p.fieldKey, p.value).ok, p.fieldKey).toBe(true);
  });

  it("holds his story: 8(a) to March 2030, no vehicle seat, no credit line, no other member's facts", () => {
    expect(seed.rows.map((r) => r.fieldKey).filter((k) => FOOD_KEYS.includes(k))).toEqual([]);
    const json = JSON.stringify(seed);
    expect(json).not.toMatch(OTHER_WORDS);
    expect(json).toContain('"expiresAt":"2030-03-15"');
    expect(json).toContain("ITES-3S or 8(a) STARS III");
    expect(json).toContain("92 of 110");
    expect(seed.proposals.find((p) => p.fieldKey === "line_of_credit")?.value).toMatchObject({ value: "no" });
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
    expect(JSON.stringify(plan.proposals[0])).toMatch(/help desk.*desktop support.*video conferencing/);
    expect(plan.dropped.map((d) => d.fieldKey)).toEqual(["payment_terms_tolerance"]);
    expect(plan.leftover).toEqual([]);
  });
});

describe.runIf(MEMBER === "it")("Success Center (it)", () => {
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
    expect(words.join(" ")).not.toMatch(/kitchen|food|cook|meal|catering|ServSafe|campaign|surety|bond line/i);
    expect(plan.steps).toHaveLength(7);
    expect(plan.steps.find((s) => s.resourceUrl?.startsWith("/ava/"))?.resourceUrl).toBe(TASKS.find((t) => t.source === "ava")!.to);
  });

  it("Stay Ready tracks the 8(a) review and his two insurance policies, on the record's dates", () => {
    const items = listTrackedItems();
    expect(items.map((i) => i.id)).toEqual(["sam", "8a-annual-review", "insurance", "insurance-tech-eo"]);
    expect(daysUntil(items.find((i) => i.id === "8a-annual-review")!.dueDate)).toBe(52);
    expect(daysUntil(items.find((i) => i.id === "insurance-tech-eo")!.dueDate)).toBe(210);
  });
});
