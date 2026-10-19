// The Success Center sample data reads right for the member on stage.
//   bunx vitest run src/demo/members                    (the caterer)
//   DEMO_MEMBER=agency bunx vitest run src/demo/members (the agency)

import { describe, expect, it } from "vitest";
import { MEMBER, byMember } from "../../../member";
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

const FOOD_KEYS = ["health_permits", "food_manager_certifications", "food_handler_cards", "doc_haccp_plan", "health_inspection_score", "facilities", "max_daily_output"];

describe(`My Business seed (${MEMBER})`, () => {
  const seed = buildSeed();
  const payload = buildPayload(seed);
  const score = readyScore(payload.fields, undefined, payload.media);

  it("starts at the story's score, with gaps and three suggestions", () => {
    expect(`${score.settled} of ${score.total}`).toBe(byMember({ caterer: "47 of 55", agency: "44 of 51" }));
    expect(payload.counter).toEqual({ answered: 14, total: 14 });
    expect(payload.proposals).toHaveLength(3);
  });

  it("every stored answer and suggestion passes the record's own check", () => {
    for (const row of seed.rows) expect(acceptStoredValue(row.fieldKey, row.value).ok, row.fieldKey).toBe(true);
    for (const p of seed.proposals) expect(acceptStoredValue(p.fieldKey, p.value).ok, p.fieldKey).toBe(true);
  });

  it("the agency's record has no kitchen, permit or food-handler rows", () => {
    if (MEMBER !== "agency") return;
    expect(seed.rows.map((r) => r.fieldKey).filter((k) => FOOD_KEYS.includes(k))).toEqual([]);
    expect(JSON.stringify(seed)).not.toMatch(/kitchen|ServSafe|meals|catering|\bHUB\b/i);
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
    expect(plan.proposals.map((p) => p.fieldKey)).toEqual(
      byMember({
        caterer: ["facilities", "equipment", "ninety_day_goal"],
        agency: ["search_keywords", "key_personnel", "ninety_day_goal"],
      }),
    );
    expect(plan.dropped.map((d) => d.fieldKey)).toEqual(["payment_terms_tolerance"]);
    expect(plan.leftover).toEqual([]);
  });
});

describe(`Success Center (${MEMBER})`, () => {
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
    if (MEMBER === "agency") expect(words.join(" ")).not.toMatch(/kitchen|food|cook|meal|catering|ServSafe/i);
    expect(plan.steps.find((s) => s.resourceUrl?.startsWith("/ava/"))?.resourceUrl).toBe(TASKS.find((t) => t.source === "ava")!.to);
  });
});
