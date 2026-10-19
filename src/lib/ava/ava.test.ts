// Ava — fixture consistency, the pure logic, and the Test Lab.
//
//   bun test src/lib/ava
//
// The fixtures are the handover: one AvaBid per sample bid, and every screen
// renders it through derive / price / checks / status. A dangling id or a
// price field that points nowhere does not crash anything — it quietly shows
// "?" forever — so the consistency rules (FIXTURE-RULES.md) are enforced here,
// every bid, every run. Each consistency test collects ALL problems for a bid
// and compares the list with [], so one run names every defect at once.

import { beforeEach, describe, expect, test } from "vitest";
import { findOpportunity } from "../../demo/ava/opportunity";
import { blockingFindings, findingState, exactChecks, reviewerChecks } from "./checks";
import { dayFromNow, daysFromToday, fullDate, minusBusinessDays } from "./dates";
import {
  applyRedline,
  commitmentStatus,
  decideBy,
  dueDay,
  effectiveBid,
  visibleAsks,
} from "./derive";
import { ALL_AVA_BIDS, AVA_BIDS } from "./fixtures";
import { FAMILY_ADVOCACY_ID } from "./fixtures/familyAdvocacy";
import { HERO_IDS as CONSTRUCTION_IDS } from "../../demo/members/construction/opportunities";
import { MEMBER } from "../../demo/member";
import { STAFFING_KEY } from "./flow";
import { cumberlandBid } from "./fixtures/cumberland";
import { fayettevilleBid } from "./fixtures/fayetteville";
import { mackallBid } from "./fixtures/mackall";
import { startingState } from "./start";
import { linePrices, missingPriceAsks, pointsIfAbove, sheetTotal, yearlyLabor } from "./price";
import { flags, progress } from "./status";
import {
  ava,
  avaDemo,
  emptyState,
  getBidState,
  resetAva,
  startedIds,
  type BidState,
} from "./store";
import { completeState, labGaps, priceRefs, runLab, seededCases } from "./testLab";
import type { Addendum, AvaBid, Span } from "./types";

const DAY = 86_400_000;
const BIDS = Object.values(AVA_BIDS);
const PACK_AVA = import.meta.glob<typeof import("../../demo/members/agency/ava")>(
  "/src/demo/members/*/ava/index.ts",
  { eager: true },
);
const CATERER_IDS = ["FAYNC-2026-R-08", "CUMCO-2026-014", "SP4701-26-Q-0021", "W912EE-27-S-0004"];
/** Where each bid starts in the demo (src/lib/ava/start.ts). */
const SEEDS: Record<string, Partial<BidState>> = Object.fromEntries(
  Object.keys(AVA_BIDS).map((id) => [id, startingState(id)]),
);

// ─── Walking a fixture ───

type Visit = (key: string, value: unknown, path: string) => void;

function walk(node: unknown, visit: Visit, path = ""): void {
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, visit, `${path}[${i}]`));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      visit(k, v, `${path}.${k}`);
      walk(v, visit, `${path}.${k}`);
    }
  }
}

function strings(node: unknown): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  const go = (n: unknown, path: string) => {
    if (typeof n === "string") out.push({ path, text: n });
    else if (Array.isArray(n)) n.forEach((v, i) => go(v, `${path}[${i}]`));
    else if (n && typeof n === "object")
      for (const [k, v] of Object.entries(n)) go(v, `${path}.${k}`);
  };
  go(node, "");
  return out;
}

const paragraphText = (spans: Span[] | undefined) => (spans ?? []).map((s) => s.text).join("");

function dupes(ids: string[]): string[] {
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
}

/** Every id reference in the bid that points at nothing. */
function danglingRefs(bid: AvaBid): string[] {
  const sets: Record<string, Set<string>> = {
    file: new Set(bid.files.map((f) => f.id)),
    ask: new Set(bid.asks.map((a) => a.id)),
    commitment: new Set(bid.commitments.map((c) => c.id)),
    criterion: new Set(bid.award.criteria.map((c) => c.id)),
    section: new Set(bid.sections.map((s) => s.id)),
    line: new Set((bid.price?.lines ?? []).map((l) => l.id)),
    requirement: new Set(bid.hardRequirements.map((r) => r.id)),
    addendum: new Set(bid.addenda.map((a) => a.id)),
    clarification: new Set(bid.clarifications.map((c) => c.id)),
    role: new Set((bid.price?.roles ?? []).map((r) => r.id)),
  };
  const KEYS: Record<string, keyof typeof sets> = {
    fileId: "file",
    sheetFileId: "file",
    supersededBy: "file",
    askId: "ask",
    uploadAskId: "ask",
    opensAskId: "ask",
    needsAskId: "ask",
    commitmentId: "commitment",
    criterionId: "criterion",
    sectionId: "section",
    lineId: "line",
    requirementId: "requirement",
    addendumId: "addendum",
    acknowledgesAddendumId: "addendum",
    settledByAddendumId: "addendum",
    settlesClarificationId: "clarification",
    clarificationId: "clarification",
    roleId: "role",
  };
  const out: string[] = [];
  walk(bid, (k, v, path) => {
    const kind = KEYS[k];
    if (!kind || v === undefined) return;
    if (typeof v !== "string" || !sets[kind].has(v))
      out.push(`${path} = ${JSON.stringify(v)}: no ${kind} has this id`);
  });
  // Where the plan says each requirement is answered.
  const forms = new Set(bid.forms.map((f) => f.id));
  const checklist = new Set(bid.submission.checklist.map((c) => c.id));
  for (const row of bid.plan) {
    const a = row.answeredIn;
    const ok =
      a.kind === "section"
        ? sets.section.has(a.id)
        : a.kind === "form"
          ? forms.has(a.id)
          : a.kind === "checklist"
            ? checklist.has(a.id)
            : a.id === "price" && bid.price !== null;
    if (!ok) out.push(`plan ${row.id}.answeredIn = ${a.kind} "${a.id}": nothing has this id`);
  }
  return out;
}

/** Price inputs that do not resolve to an enter field or an upload extract. */
function unresolvedPriceRefs(bid: AvaBid): string[] {
  const refs: { where: string; askId: string; fieldId: string }[] = [
    ...priceRefs(bid).map((r) => ({ where: "price input", ...r })),
    ...(bid.price?.otherCosts ?? []).flatMap((c) =>
      c.yearly.kind === "ask"
        ? [{ where: `otherCost ${c.id}`, askId: c.yearly.askId, fieldId: c.yearly.fieldId }]
        : [],
    ),
  ];
  const out: string[] = [];
  for (const r of refs) {
    const ask = bid.asks.find((a) => a.id === r.askId);
    if (!ask) {
      out.push(`${r.where} ${r.askId}/${r.fieldId}: no such ask`);
      continue;
    }
    const spec = ask.answer;
    if (spec.type === "enter") {
      const f = spec.fields.find((x) => x.id === r.fieldId);
      if (!f)
        out.push(`${r.where} ${r.askId}/${r.fieldId}: the enter ask has no field with this id`);
      else if (f.unit === "text" || f.unit === "phone" || f.unit === "email")
        out.push(`${r.where} ${r.askId}/${r.fieldId}: a text field cannot price anything`);
    } else if (spec.type === "upload") {
      if (!spec.extracts?.some((x) => x.fieldId === r.fieldId)) {
        out.push(
          `${r.where} ${r.askId}/${r.fieldId}: the upload has no extract with this field id`,
        );
      }
    } else {
      out.push(`${r.where} ${r.askId}/${r.fieldId}: ask is "${spec.type}", not enter or upload`);
    }
    if (ask.hiddenUntilOpened)
      out.push(`${r.where} ${r.askId}/${r.fieldId}: the ask is hidden until opened`);
  }
  return out;
}

function closesOffset(noticeId: string): number | null {
  return findOpportunity(noticeId)?.closesInDays ?? null;
}

// ─── Fixture consistency ───

describe("fixtures", () => {
  test("there are four sample bids, one of each kind we promised", () => {
    // Four kinds, a reply to a sources sought among them: the caterer's four
    // bids. DEMO: the agency's story has one, its hero (src/demo/member.ts).
    const caterer = CATERER_IDS.map((id) => ALL_AVA_BIDS[id]);
    expect(caterer.every(Boolean)).toBe(true);
    expect(new Set(caterer.map((b) => b.kind)).size).toBe(4);
    // Every pack member that has built its own hero bid adds one (a pack still
    // holding the agency's copy adds none).
    const packHeroes = [...new Set(Object.values(PACK_AVA).map((p) => p.HERO_BID.noticeId))];
    expect(packHeroes).toContain(FAMILY_ADVOCACY_ID);
    expect(packHeroes).toContain(CONSTRUCTION_IDS.hero);
    expect(Object.keys(ALL_AVA_BIDS).sort()).toEqual([...CATERER_IDS, ...packHeroes].sort());
    for (const [id, bid] of Object.entries(ALL_AVA_BIDS)) expect(bid.noticeId).toBe(id);
    if (MEMBER === "caterer") expect(BIDS.map((b) => b.noticeId)).toEqual(CATERER_IDS);
    else expect(BIDS).toHaveLength(1);
  });

  for (const bid of BIDS) {
    describe(bid.noticeId, () => {
      test("every id reference points at something that exists", () => {
        expect(danglingRefs(bid)).toEqual([]);
      });

      test("ids are unique within each list", () => {
        const lists: Record<string, string[]> = {
          asks: bid.asks.map((a) => a.id),
          files: bid.files.map((f) => f.id),
          sections: bid.sections.map((s) => s.id),
          forms: bid.forms.map((f) => f.id),
          commitments: bid.commitments.map((c) => c.id),
          requirements: bid.hardRequirements.map((r) => r.id),
          clarifications: bid.clarifications.map((c) => c.id),
          addenda: bid.addenda.map((a) => a.id),
          criteria: bid.award.criteria.map((c) => c.id),
          lines: (bid.price?.lines ?? []).map((l) => l.id),
          roles: (bid.price?.roles ?? []).map((r) => r.id),
          burden: (bid.price?.burden ?? []).map((b) => b.id),
          otherCosts: (bid.price?.otherCosts ?? []).map((c) => c.id),
          plan: bid.plan.map((p) => p.id),
          packageFiles: bid.submission.files.map((f) => f.id),
          checklist: bid.submission.checklist.map((c) => c.id),
          themes: bid.themes.map((t) => t.id),
          reviewerFindings: bid.reviewerFindings.map((r) => r.id),
        };
        const out = Object.entries(lists).flatMap(([name, ids]) =>
          dupes(ids).map((d) => `${name}: "${d}" appears twice`),
        );
        for (const ask of bid.asks) {
          const fieldIds =
            ask.answer.type === "enter"
              ? ask.answer.fields.map((f) => f.id)
              : ask.answer.type === "upload"
                ? (ask.answer.extracts ?? []).map((x) => x.fieldId)
                : ask.answer.type === "answer"
                  ? ask.answer.choices.map((c) => c.id)
                  : [];
          for (const d of dupes(fieldIds))
            out.push(`ask ${ask.id}: field or choice "${d}" appears twice`);
        }
        expect(out).toEqual([]);
      });

      test("the due date matches the opportunity's closing date", () => {
        const offset = closesOffset(bid.noticeId);
        expect(offset).not.toBeNull();
        expect(bid.deadline.dueDaysFromNow).toBe(offset!);
      });

      test("labor shares on the price lines sum to 1", () => {
        // A bid the buyer allows no price for has no lines to share.
        const sum = bid.price ? bid.price!.lines.reduce((n, l) => n + l.laborShare, 0) : 1;
        expect(Math.abs(sum - 1)).toBeLessThanOrEqual(1e-9);
      });

      test("every price input resolves to an enter field or an upload extract", () => {
        expect(unresolvedPriceRefs(bid)).toEqual([]);
      });

      test("every redline removes text that is in its paragraph", () => {
        const out: string[] = [];
        for (const sec of bid.sections) {
          for (const ch of sec.challenges) {
            for (const opt of ch.options) {
              const text = paragraphText(sec.paragraphs[opt.paragraphIndex]);
              if (!sec.paragraphs[opt.paragraphIndex]) {
                out.push(`${sec.id}/${ch.id}/${opt.id}: no paragraph ${opt.paragraphIndex}`);
              } else if (!opt.redline.remove || !text.includes(opt.redline.remove)) {
                out.push(
                  `${sec.id}/${ch.id}/${opt.id}: "${opt.redline.remove}" is not in paragraph ${opt.paragraphIndex}`,
                );
              }
            }
          }
        }
        expect(out).toEqual([]);
      });

      test("every package file contains parts that exist", () => {
        const ids = {
          section: new Set(bid.sections.map((s) => s.id)),
          form: new Set(bid.forms.map((f) => f.id)),
          upload: new Set(bid.asks.map((a) => a.id)),
        };
        const out: string[] = [];
        for (const f of bid.submission.files) {
          for (const c of f.contains) {
            const ok = c.kind === "price" ? c.id === "price" : ids[c.kind].has(c.id);
            if (!ok) out.push(`${f.id} contains ${c.kind} "${c.id}": nothing has this id`);
          }
        }
        expect(out).toEqual([]);
      });

      test("hidden asks are opened by an option, and options only open hidden asks", () => {
        const out: string[] = [];
        const opened = new Set<string>();
        // An answer choice can open a follow-up too ("Did you sign the sheet?").
        for (const ask of bid.asks) {
          if (ask.answer.type !== "answer") continue;
          for (const c of ask.answer.choices) {
            if (!c.opensAskId) continue;
            opened.add(c.opensAskId);
            const target = bid.asks.find((x) => x.id === c.opensAskId);
            if (!target) out.push(`${ask.id}/${c.id} opens ${c.opensAskId}, which does not exist`);
            else if (!target.hiddenUntilOpened)
              out.push(`${ask.id}/${c.id} opens ${c.opensAskId}, which is not hidden`);
          }
        }
        for (const ask of bid.asks) {
          for (const o of ask.dontHave ?? []) {
            if (o.outcome === "new-ask" && !o.opensAskId)
              out.push(`${ask.id}/${o.id}: a new-ask option opens nothing`);
            if (!o.opensAskId) continue;
            opened.add(o.opensAskId);
            const target = bid.asks.find((a) => a.id === o.opensAskId);
            if (target && !target.hiddenUntilOpened)
              out.push(`${ask.id}/${o.id} opens ${o.opensAskId}, which is not hidden`);
          }
        }
        for (const ask of bid.asks) {
          if (ask.hiddenUntilOpened && !opened.has(ask.id))
            out.push(`${ask.id} is hidden and nothing opens it`);
        }
        expect(out).toEqual([]);
      });

      test("an addendum that arrives later carries its own file", () => {
        const out: string[] = [];
        for (const a of bid.addenda) {
          const file = bid.files.find((f) => f.id === a.fileId);
          if (a.arrivesDuringBuild && file && file.addendumId !== a.id) {
            out.push(
              `addendum ${a.id}: file ${file.id} has addendumId ${JSON.stringify(file.addendumId)}, so it shows before the addendum arrives`,
            );
          }
        }
        expect(out).toEqual([]);
      });

      test("no string mentions HigherGov or a percent complete", () => {
        const bad = [...strings(bid), ...strings(SEEDS[bid.noticeId] ?? {})].filter(
          (s) => /higher\s*gov/i.test(s.text) || /%\s*complete|percent complete/i.test(s.text),
        );
        expect(bad.map((b) => `${b.path}: ${b.text.slice(0, 80)}`)).toEqual([]);
      });

      test("the starting state only names things the bid has", () => {
        const seed = SEEDS[bid.noticeId] ?? {};
        const out: string[] = [];
        const asks = new Map(bid.asks.map((a) => [a.id, a]));
        for (const [id, a] of Object.entries(seed.answers ?? {})) {
          const ask = asks.get(id);
          if (!ask) {
            out.push(`answers.${id}: no such ask`);
            continue;
          }
          if (
            a.choiceId &&
            !(ask.answer.type === "answer" && ask.answer.choices.some((c) => c.id === a.choiceId))
          ) {
            out.push(`answers.${id}.choiceId "${a.choiceId}": no such choice`);
          }
          if (a.optionId && !ask.dontHave?.some((o) => o.id === a.optionId)) {
            out.push(`answers.${id}.optionId "${a.optionId}": no such option`);
          }
          for (const f of Object.keys(a.values ?? {})) {
            const ok =
              (ask.answer.type === "enter" && ask.answer.fields.some((x) => x.id === f)) ||
              (ask.answer.type === "upload" && !!ask.answer.extracts?.some((x) => x.fieldId === f));
            if (!ok) out.push(`answers.${id}.values.${f}: the ask has no such field`);
          }
        }
        for (const id of Object.keys(seed.opened ?? {})) {
          if (!asks.get(id)?.hiddenUntilOpened) out.push(`opened.${id}: not a hidden ask`);
        }
        for (const [id, c] of Object.entries(seed.commitments ?? {})) {
          const cm = bid.commitments.find((x) => x.id === id);
          if (!cm) out.push(`commitments.${id}: no such commitment`);
          else if (cm.text !== c.text)
            out.push(`commitments.${id}: approved text differs from the commitment text`);
        }
        for (const id of Object.keys(seed.clarifications ?? {})) {
          if (!bid.clarifications.some((c) => c.id === id))
            out.push(`clarifications.${id}: no such clarification`);
        }
        for (const id of seed.addendaReceived ?? []) {
          if (!bid.addenda.some((a) => a.id === id))
            out.push(`addendaReceived ${id}: no such addendum`);
        }
        for (const id of Object.keys(seed.addendaSeen ?? {})) {
          if (!bid.addenda.some((a) => a.id === id))
            out.push(`addendaSeen.${id}: no such addendum`);
        }
        for (const [k, optId] of Object.entries(seed.redlines ?? {})) {
          const [secId, chId] = k.split(":");
          const ch = bid.sections
            .find((s) => s.id === secId)
            ?.challenges.find((c) => c.id === chId);
          if (!ch?.options.some((o) => o.id === optId))
            out.push(`redlines.${k} = ${optId}: no such option`);
        }
        for (const id of Object.keys(seed.reviewerLeft ?? {})) {
          if (!bid.reviewerFindings.some((r) => r.id === id))
            out.push(`reviewerLeft.${id}: no such reviewer finding`);
        }
        for (const id of Object.keys(seed.checklist ?? {})) {
          if (!bid.submission.checklist.some((c) => c.id === id))
            out.push(`checklist.${id}: no such item`);
        }
        for (const k of Object.keys(seed.fixes ?? {})) {
          const [kind, id] = k.split(":");
          const ok =
            k === "name-sam" || k === "template" || k === "failed-at-start" || k === STAFFING_KEY
              ? true
              : kind === "pages"
                ? bid.sections.some((s) => s.id === id)
                : kind === "deliver"
                  ? bid.price!.otherCosts.some((c) => c.id === id)
                  : kind === "ack"
                    ? bid.addenda.some((a) => a.id === id)
                    : false;
          if (!ok) out.push(`fixes.${k}: not a fix the check offers for this bid`);
        }
        for (const k of Object.keys(seed.risks ?? {})) {
          if (k.startsWith("file:") && !bid.files.some((f) => f.id === k.slice(5)))
            out.push(`risks.${k}: no such file`);
        }
        if (seed.decision?.fromAskId && !asks.has(seed.decision.fromAskId)) {
          out.push(`decision.fromAskId ${seed.decision.fromAskId}: no such ask`);
        }
        expect(out).toEqual([]);
      });
    });
  }
});

// ─── Price ───

const started = (): BidState => ({ ...emptyState(), started: true, briefConfirmed: true });

describe("price", () => {
  test("pointsIfAbove(35, 10) is about 31.8, and 0% above keeps full points", () => {
    expect(pointsIfAbove(35, 10)).toBeCloseTo(31.8, 5);
    expect(pointsIfAbove(35, 0)).toBe(35);
  });

  for (const bid of BIDS.filter((b) => b.price !== null)) {
    describe(bid.noticeId, () => {
      test("with nothing answered, every price is null, never 0", () => {
        const s = started();
        const eff = effectiveBid(bid, s);
        const prices = linePrices(eff, s);
        if (eff.price!.roles.length > 0) expect(yearlyLabor(eff, s)).toBeNull();
        expect(prices.every((p) => p.unitPrice === null && p.extended === null)).toBe(true);
        expect(sheetTotal(prices)).toBeNull();
        expect(missingPriceAsks(eff, s).length).toBeGreaterThan(0);
      });

      test("with every input answered, the price is a number and adds up", () => {
        const s = completeState(bid);
        const eff = effectiveBid(bid, s);
        const prices = linePrices(eff, s);
        expect(missingPriceAsks(eff, s)).toEqual([]);
        if (eff.price!.roles.length > 0) expect(yearlyLabor(eff, s)).toBeGreaterThan(0);
        for (const p of prices) expect(typeof p.unitPrice).toBe("number");
        const total = sheetTotal(prices);
        expect(total).toBeGreaterThan(0);
        const recalculated = prices.reduce(
          (n, p) => n + Math.round(p.unitPrice! * p.line.qty! * 100) / 100,
          0,
        );
        expect(Math.abs(total! - recalculated)).toBeLessThan(0.01);
      });

      test("one missing input (the profit) makes the total null, not 0", () => {
        const full = completeState(bid);
        const answers = { ...full.answers };
        delete answers[bid.price!.profit.askId];
        const s = { ...full, answers };
        const eff = effectiveBid(bid, s);
        const prices = linePrices(eff, s);
        expect(sheetTotal(prices)).toBeNull();
        expect(prices.every((p) => p.unitPrice === null)).toBe(true);
        expect(missingPriceAsks(eff, s)).toContain(bid.price!.profit.askId);
        const laborUsesProfitAsk =
          bid.price!.roles.some((r) => r.pay.askId === bid.price!.profit.askId) ||
          bid.price!.burden.some(
            (b) => b.from.kind === "ask" && b.from.askId === bid.price!.profit.askId,
          );
        if (!laborUsesProfitAsk && bid.price!.roles.length > 0)
          expect(yearlyLabor(eff, s)).toBeGreaterThan(0);
      });
    });
  }
});

// ─── Redlines ───

describe("applyRedline", () => {
  const claim = { id: "c1", tag: "verified" as const };
  const spans: Span[] = [
    { text: "We serve hot " },
    { text: "meals daily", claim },
    { text: " to staff." },
  ];

  test("a removal that spans two spans keeps both outside parts and the claim", () => {
    const out = applyRedline(spans, "hot meals", [{ text: "fresh food" }]);
    expect(out.map((s) => s.text)).toEqual(["We serve ", "fresh food", " daily", " to staff."]);
    expect(out[2].claim).toBe(claim);
    expect(out[0].claim).toBeUndefined();
    expect(paragraphText(out)).toBe("We serve fresh food daily to staff.");
  });

  test("a removal at the very start and at the very end", () => {
    expect(paragraphText(applyRedline(spans, "We serve ", [{ text: "Ava serves " }]))).toBe(
      "Ava serves hot meals daily to staff.",
    );
    expect(paragraphText(applyRedline(spans, " to staff.", [{ text: "." }]))).toBe(
      "We serve hot meals daily.",
    );
  });

  test("text that is not there leaves the paragraph unchanged", () => {
    expect(applyRedline(spans, "cold soup", [{ text: "x" }])).toBe(spans);
    expect(applyRedline(spans, "", [{ text: "x" }])).toBe(spans);
  });

  test("every fixture redline applies and reads as the insert", () => {
    for (const bid of BIDS) {
      for (const sec of bid.sections) {
        for (const ch of sec.challenges) {
          for (const opt of ch.options) {
            const before = paragraphText(sec.paragraphs[opt.paragraphIndex]);
            const after = paragraphText(
              applyRedline(
                sec.paragraphs[opt.paragraphIndex] ?? [],
                opt.redline.remove,
                opt.redline.insert,
              ),
            );
            expect(after).toBe(
              before.replace(opt.redline.remove, paragraphText(opt.redline.insert)),
            );
          }
        }
      }
    }
  });
});

// ─── Addenda ───

function withLabAddendum(): {
  bid: AvaBid;
  cId: string;
  lineId: string;
  oldText: string;
  oldQty: number;
  oldDue: number;
} {
  const base = structuredClone(
    BIDS.find((b) => b.commitments.length > 0 && b.price!.lines.length > 0)!,
  );
  const c = base.commitments[0];
  c.needsApproval = true;
  const line = base.price!.lines[0];
  const src = base.deadline.source;
  const lab: Addendum = {
    id: "lab-addendum",
    number: 99,
    fileId: "lab-addendum-file",
    postedDaysFromNow: 2,
    arrivesDuringBuild: true,
    otherChanges: 0,
    stillValid: "Everything else.",
    changes: [
      {
        id: "ch-due",
        what: "Due date",
        source: src,
        before: "",
        now: "",
        effect: "updated",
        effectText: "",
        patch: {
          kind: "due",
          dueDaysFromNow: base.deadline.dueDaysFromNow + 7,
          time: "3:00 PM",
          time24: "15:00",
        },
      },
      {
        id: "ch-c",
        what: "Promise",
        source: src,
        before: "",
        now: "",
        effect: "reopened",
        effectText: "",
        patch: { kind: "commitment", commitmentId: c.id, text: `${c.text} Seven days a week.` },
      },
      {
        id: "ch-q",
        what: "Quantity",
        source: src,
        before: "",
        now: "",
        effect: "updated",
        effectText: "",
        patch: { kind: "price-qty", lineId: line.id, qty: line.qty! + 100 },
      },
    ],
  };
  base.addenda = [lab];
  base.files = [
    ...base.files,
    {
      id: "lab-addendum-file",
      name: "Addendum 99.pdf",
      role: "addendum",
      pages: 1,
      postedDaysFromNow: 2,
      readability: "read",
      addendumId: lab.id,
    },
  ];
  base.forms = [
    ...base.forms,
    {
      id: "lab-ack",
      name: "Addendum 99 acknowledgment",
      source: src,
      handling: ["you-sign"],
      acknowledgesAddendumId: lab.id,
    },
  ];
  return {
    bid: base,
    cId: c.id,
    lineId: line.id,
    oldText: c.text,
    oldQty: line.qty!,
    oldDue: base.deadline.dueDaysFromNow,
  };
}

describe("effectiveBid", () => {
  test("an addendum changes nothing until it is received", () => {
    const { bid, cId, lineId, oldText, oldQty, oldDue } = withLabAddendum();
    const eff = effectiveBid(bid, started());
    expect(eff.deadline.dueDaysFromNow).toBe(oldDue);
    expect(eff.commitments.find((c) => c.id === cId)!.text).toBe(oldText);
    expect(eff.price!.lines.find((l) => l.id === lineId)!.qty).toBe(oldQty);
    expect(eff.files.some((f) => f.id === "lab-addendum-file")).toBe(false);
    expect(eff.forms.some((f) => f.id === "lab-ack")).toBe(false);
  });

  test("once received, its due, promise and quantity patches apply, with its file and form", () => {
    const { bid, cId, lineId, oldText, oldQty, oldDue } = withLabAddendum();
    const s = { ...started(), addendaReceived: ["lab-addendum"] };
    const eff = effectiveBid(bid, s);
    expect(eff.deadline.dueDaysFromNow).toBe(oldDue + 7);
    expect(eff.deadline.time24).toBe("15:00");
    expect(eff.commitments.find((c) => c.id === cId)!.text).toBe(`${oldText} Seven days a week.`);
    expect(eff.price!.lines.find((l) => l.id === lineId)!.qty).toBe(oldQty + 100);
    expect(eff.files.some((f) => f.id === "lab-addendum-file")).toBe(true);
    expect(eff.forms.some((f) => f.id === "lab-ack")).toBe(true);
    // The fixture itself is untouched.
    expect(bid.commitments.find((c) => c.id === cId)!.text).toBe(oldText);
  });

  test("a promise approved before the addendum reads as reopened after it", () => {
    const { bid, cId, oldText } = withLabAddendum();
    const before = {
      ...started(),
      commitments: { [cId]: { at: "2026-05-07T12:00:00.000Z", text: oldText } },
    };
    const c0 = effectiveBid(bid, before).commitments.find((c) => c.id === cId)!;
    expect(commitmentStatus(before, c0)).toBe("approved");
    const after = { ...before, addendaReceived: ["lab-addendum"] };
    const c1 = effectiveBid(bid, after).commitments.find((c) => c.id === cId)!;
    expect(commitmentStatus(after, c1)).toBe("reopened");
  });

  test("addenda posted before Ava started apply from the first read", () => {
    for (const bid of BIDS) {
      const eff = effectiveBid(bid, started());
      for (const a of bid.addenda.filter((x) => !x.arrivesDuringBuild)) {
        for (const ch of a.changes) {
          const p = ch.patch;
          if (p.kind === "due") expect(eff.deadline.dueDaysFromNow).toBe(p.dueDaysFromNow);
          if (p.kind === "price-qty")
            expect(eff.price!.lines.find((l) => l.id === p.lineId)!.qty).toBe(p.qty);
          if (p.kind === "commitment")
            expect(eff.commitments.find((c) => c.id === p.commitmentId)!.text).toBe(p.text);
        }
      }
    }
  });
});

// ─── Progress and flags ───

describe("progress", () => {
  for (const bid of BIDS) {
    test(`${bid.noticeId}: not started, understanding, building, then reviewing or ready, then submitted`, () => {
      const empty = emptyState();
      expect(progress(bid, empty).phase).toBe("not-started");

      const s1 = { ...empty, started: true };
      expect(progress(bid, s1).phase).toBe("understanding");

      const s2 = { ...s1, briefConfirmed: true };
      const p2 = progress(bid, s2);
      expect(p2.phase).toBe("building");
      expect(p2.remaining).toBeGreaterThan(0);

      // Everything done but one visible ask: still building, with fewer items.
      const full = completeState(bid);
      const oneAsk = visibleAsks(effectiveBid(bid, full), full)[0];
      const answers = { ...full.answers };
      delete answers[oneAsk.id];
      const p3 = progress(bid, { ...full, answers });
      expect(p3.phase).toBe("building");
      expect(p3.remaining).toBeGreaterThanOrEqual(1);
      expect(p3.remaining).toBeLessThan(p2.remaining);

      // Complete: reviewing only while a reviewer finding is open.
      const eff = effectiveBid(bid, full);
      const openReview = reviewerChecks(eff).filter(
        (f) => f.severity !== "minor" && findingState(eff, full, f) === "open",
      );
      const p4 = progress(bid, full);
      expect(p4.phase).toBe(openReview.length > 0 ? "reviewing" : "ready");
      if (openReview.length > 0) expect(p4.remaining).toBe(openReview.length);

      const left = Object.fromEntries(
        bid.reviewerFindings.map((r) => [r.id, "Left as it is for the test."]),
      );
      const p5 = progress(bid, { ...full, reviewerLeft: left });
      expect(p5.phase).toBe("ready");
      expect(p5.remaining).toBe(0);
      expect(p5.paused).toBe(!!bid.failedAtStart);

      const p6 = progress(bid, {
        ...full,
        receipt: { fileName: "Receipt.pdf", at: "2026-05-20T12:00:00.000Z" },
      });
      expect(p6.phase).toBe("submitted");
    });
  }
});

describe("flags", () => {
  beforeEach(() => resetAva());

  for (const bid of BIDS) {
    test(`${bid.noticeId}: a bid sent back shows "Bid decision changed" until the member goes on`, () => {
      const id = bid.noticeId;
      // From a clean state: the demo starts each bid somewhere (Cumberland starts paused).
      avaDemo.load(id, emptyState());
      ava.start(id);
      ava.confirmBrief(id);
      ava.sendBack(id, { reason: "The bond cannot arrive before the due date." });
      expect(flags(bid, getBidState(id)).map((f) => f.id)).toContain("bid-decision");
      expect(progress(bid, getBidState(id)).paused).toBe(true);
      ava.keepGoing(id);
      const still = !!bid.failedAtStart && !getBidState(id).fixes["failed-at-start"];
      expect(flags(bid, getBidState(id)).some((f) => f.id === "bid-decision")).toBe(still);
    });
  }

  test("no flags before the start or after the receipt", () => {
    for (const bid of BIDS) {
      expect(flags(bid, emptyState())).toEqual([]);
      expect(
        flags(bid, {
          ...completeState(bid),
          receipt: { fileName: "r.pdf", at: "2026-05-20T12:00:00.000Z" },
        }),
      ).toEqual([]);
    }
  });

  test("the list page sees every started bid", () => {
    // DEMO: every member's bid has a seed, so all of them count.
    const all = Object.keys(ALL_AVA_BIDS);
    for (const id of all) ava.start(id);
    expect(startedIds().sort()).toEqual(all.sort());
  });
});

// ─── Decide-by dates ───

describe("decideBy", () => {
  for (const bid of BIDS) {
    test(`${bid.noticeId}: never before today, fixed dates kept, others worked back from the due date`, () => {
      const eff = effectiveBid(bid, completeState(bid));
      const out: string[] = [];
      for (const ask of eff.asks) {
        const d = daysFromToday(decideBy(ask, eff));
        if (d < 0) out.push(`${ask.id}: ${d} days, before today`);
        if (ask.decideByDaysFromNow !== undefined) {
          if (d !== Math.max(0, ask.decideByDaysFromNow))
            out.push(`${ask.id}: ${d}, not the fixed ${ask.decideByDaysFromNow}`);
        } else {
          const back = daysFromToday(minusBusinessDays(dueDay(eff), ask.leadDays + 2));
          if (d !== Math.max(0, back)) out.push(`${ask.id}: ${d}, not ${Math.max(0, back)}`);
          if (d > eff.deadline.dueDaysFromNow) out.push(`${ask.id}: after the due date`);
        }
      }
      expect(out).toEqual([]);
    });
  }

  test("a fixed date in the past becomes today; a lead time too long becomes today", () => {
    const bid = BIDS[0];
    const ask = bid.asks[0];
    expect(daysFromToday(decideBy({ ...ask, decideByDaysFromNow: -3 }, bid))).toBe(0);
    expect(decideBy({ ...ask, decideByDaysFromNow: 4 }, bid).getTime()).toBe(
      dayFromNow(4).getTime(),
    );
    expect(
      daysFromToday(decideBy({ ...ask, decideByDaysFromNow: undefined, leadDays: 1000 }, bid)),
    ).toBe(0);
  });
});

// ─── The Test Lab ───

describe("Test Lab", () => {
  test("every seeded case could be built from the sample bids", () => {
    expect(labGaps()).toEqual([]);
  });

  test("ten or more defects, covering every kind of exact check we promised", () => {
    const defects = seededCases().filter((c) => c.expect.length > 0);
    expect(defects.length).toBeGreaterThanOrEqual(10);
    const covered = new Set(defects.flatMap((c) => c.expect.map((f) => f.split(":")[0])));
    for (const kind of [
      "ack",
      "pages",
      "name-sam",
      "wage",
      "staffing-price",
      "gaps",
      "commitments",
      "price-incomplete",
      "price-approval",
      "deliver",
      "template",
      "file",
      "req",
    ]) {
      expect([kind, covered.has(kind)]).toEqual([kind, true]);
    }
  });

  for (const bid of BIDS) {
    test(`${bid.noticeId}: the complete state has no findings at all`, () => {
      const s = completeState(bid);
      const found = exactChecks(effectiveBid(bid, s), s).findings.map(
        (f) => `${f.id} (${f.severity})`,
      );
      expect(found).toEqual([]);
    });
  }

  test("catches every seeded defect, with no false flags; the only misses are documented known gaps", () => {
    const run = runLab();
    const wrong = run.cases
      .filter((c) => (c.missed.length > 0 && !c.knownGap) || c.falseFlags.length > 0)
      .map(
        (c) =>
          `${c.id}: missed ${JSON.stringify(c.missed)}, false flags ${JSON.stringify(c.falseFlags)}`,
      );
    expect(wrong).toEqual([]);
    expect(run.totals.falseFlags).toBe(0);
    expect(run.totals.missed).toBe(run.totals.knownGaps);
    expect(run.totals.caught + run.totals.missed).toBe(run.totals.defects);
    expect(run.ms).toBeGreaterThanOrEqual(0);
  });

  // Fixed 29 Sep 2026: check 6 used to compare weekly totals only, so hours
  // moved between roles (manager 40 → 45, cook 35 → 30) passed unseen. It now
  // compares each role, and the lab carries no known gaps.
  test("staffing-price compares each role's hours, not only the weekly total", () => {
    const c = seededCases().find((x) => x.id.endsWith(":staffing-roles"))!;
    expect(runLab([c]).cases[0].missed).toEqual([]);
    expect(
      seededCases()
        .filter((x) => x.knownGap)
        .map((x) => x.id),
    ).toEqual([]);
  });

  // The lab must be able to fail. A gate that cannot go red reports confidence
  // it has not earned, so both ways of failing are proved here.
  test("the lab reports a miss when the key names a finding that never comes", () => {
    const control = seededCases().find((c) => c.expect.length === 0)!;
    const run = runLab([{ ...control, id: `${control.bidId}:lab-miss`, expect: ["name-sam"] }]);
    expect(run.cases[0].missed).toEqual(["name-sam"]);
    expect(run.totals.missed).toBe(1);
    expect(run.totals.caught).toBe(0);
  });

  test("the lab reports a false flag when a finding has no seeded defect behind it", () => {
    const named = seededCases().find((c) => c.expect.includes("name-sam"))!;
    const run = runLab([{ ...named, id: `${named.bidId}:lab-false`, expect: [] }]);
    expect(run.cases[0].falseFlags).toEqual(["name-sam"]);
    expect(run.totals.falseFlags).toBe(1);
  });

  test("running the lab never changes the sample bids", () => {
    const before = structuredClone(AVA_BIDS);
    runLab();
    expect(AVA_BIDS).toEqual(before);
  });
});

describe("checks added after the Test Lab review (29 Sep 2026)", () => {
  test("an open ask whose date has passed is reported as late", () => {
    const bid: AvaBid = structuredClone(fayettevilleBid);
    const s = completeState(bid);
    const ask = bid.asks.find((a) => !a.hiddenUntilOpened)!;
    ask.decideByDaysFromNow = -1;
    const open = { ...s, answers: { ...s.answers } };
    delete open.answers[ask.id];
    const ids = exactChecks(effectiveBid(bid, open), open).findings.map((f) => f.id);
    expect(ids).toContain(`late:${ask.id}`);
    // decideBy still never shows a date before today on screen.
    expect(daysFromToday(decideBy(ask, bid))).toBeGreaterThanOrEqual(0);
  });

  test("a price with every input but no quantity still raises a finding", () => {
    const bid: AvaBid = structuredClone(fayettevilleBid);
    const s = completeState(bid);
    bid.price!.lines[0].qty = 0;
    const found = exactChecks(effectiveBid(bid, s), s).findings.map((f) => f.id);
    expect(missingPriceAsks(bid, s)).toEqual([]);
    expect(found).toContain("price-incomplete");
  });
});

describe("going ahead without a blocked file (29 Sep 2026)", () => {
  test("the file's upload ask stops counting, so the bid can reach Ready", () => {
    const bid = fayettevilleBid;
    const blocked = bid.files.find((f) => f.readability !== "read" && f.uploadAskId)!;
    const s = completeState(bid);
    const without = { ...s, answers: { ...s.answers } };
    delete without.answers[blocked.uploadAskId!];
    expect(progress(bid, without).phase).not.toBe("ready");
    const atRisk = {
      ...without,
      risks: {
        ...without.risks,
        [`file:${blocked.id}`]: {
          reason: "The city portal is down",
          severity: blocked.riskIfMissing ?? ("material" as const),
          label: `Ready, not checked against ${blocked.name}`,
          at: "2026-05-07T12:00:00.000Z",
        },
      },
    };
    // Building clears: the upload ask no longer counts.
    expect(progress(bid, atRisk).phase).toBe("reviewing");
    // What remains is honest: a draft statement that needed the file has no
    // proof, so it stays out of the file and the check says so.
    const left = blockingFindings(effectiveBid(bid, atRisk), atRisk).map((f) => f.id);
    expect(left).toEqual(["gaps"]);
    const both = {
      ...atRisk,
      risks: {
        ...atRisk.risks,
        gaps: {
          reason: "No floor plan",
          severity: "material" as const,
          label: "Going ahead at risk",
          at: "2026-05-07T12:00:00.000Z",
        },
      },
    };
    expect(progress(bid, both).phase).toBe("ready");
  });
});

// ─── Fixture fixes after the first review (29 Sep 2026) ───
//
// The three sample bids, wired to the rules the lead added: a requirement is
// judged by the answer, a plan to attend is not attendance, a check is compared
// with the total, option years are priced, an amendment rewrites the draft, and
// no yearly cost in the price is Ava's own figure.

import { bidDecision, reqStatus, sectionParagraphs } from "./derive";
import { approvalTotal, cashPerHour, otherCostAmount, periodTotals } from "./price";
import type { AskAnswer } from "./store";

describe("sample bid fixes after the first review (29 Sep 2026)", () => {
  const at = "2026-05-07T12:00:00.000Z";
  const done = (extra: Partial<AskAnswer> = {}): AskAnswer => ({ status: "done", at, ...extra });
  const base = (answers: Record<string, AskAnswer>, extra: Partial<BidState> = {}): BidState => ({
    ...emptyState(),
    started: true,
    briefConfirmed: true,
    answers,
    ...extra,
  });
  const req = (bid: AvaBid, s: BidState, id: string) => {
    const eff = effectiveBid(bid, s);
    return reqStatus(eff, s, eff.hardRequirements.find((r) => r.id === id)!);
  };
  const findingIds = (bid: AvaBid, s: BidState) =>
    exactChecks(effectiveBid(bid, s), s).findings.map((f) => f.id);

  // The Cumberland pre-bid conference is still ahead (the story: in 4 days), so a
  // plan to attend is only Confirm until the day, and the "did you sign" question
  // waits for its day.
  describe("an event still to come", () => {
    const bid = cumberlandBid;
    const [reqId, askId, followId] = ["req-prebid", "ask-prebid", "ask-prebid-signed"];
    const [yes, signed, missed] = ["prebid-yes", "pbs-signed", "pbs-missed"];
    test(`${bid.noticeId}: a plan to attend is Confirm, a signed sheet Meets, a missed one Not yet`, () => {
      expect(req(bid, base({}), reqId).status).toBe("not-yet");
      const opened = { opened: { [followId]: true as const } };
      const planned = base({ [askId]: done({ choiceId: yes }) }, opened);
      expect(req(bid, planned, reqId)).toEqual({
        status: "confirm",
        evidence: `You plan to attend on ${fullDate(dayFromNow(4))}.`,
      });
      const ok = base(
        { [askId]: done({ choiceId: yes }), [followId]: done({ choiceId: signed }) },
        opened,
      );
      expect(req(bid, ok, reqId).status).toBe("meets");
      const gone = base(
        { [askId]: done({ choiceId: yes }), [followId]: done({ choiceId: missed }) },
        opened,
      );
      expect(req(bid, gone, reqId).status).toBe("not-yet");
      const f = exactChecks(effectiveBid(bid, gone), gone).findings.find(
        (x) => x.id === `req:${reqId}`,
      );
      expect(f?.severity).toBe("critical");
      // The follow-up is due on the day of the event, 4 days from today.
      expect(bid.asks.find((a) => a.id === followId)?.decideByDaysFromNow).toBe(4);
    });
  });

  // The Fayetteville site visit is already past (the story: the proposal is
  // finished): one question, "did you attend", settles it.
  describe("an event already past", () => {
    const bid = fayettevilleBid;
    test(`${bid.noticeId}: attending meets the rule, and missing it fails it`, () => {
      expect(req(bid, base({}), "hr-site-visit").status).toBe("not-yet");
      const went = base({ "ask-site-visit": done({ choiceId: "sv-owner" }) });
      expect(req(bid, went, "hr-site-visit").status).toBe("meets");
      const staff = base({ "ask-site-visit": done({ choiceId: "sv-staff" }) });
      expect(req(bid, staff, "hr-site-visit").status).toBe("meets");
      const missed = base({ "ask-site-visit": done({ choiceId: "sv-none" }) });
      expect(bidDecision(effectiveBid(bid, missed), missed)?.reason).toMatch(/site visit/i);
      // The visit was before today, so nothing about it is asked later.
      expect(
        bid.asks.some((a) => a.decideByDaysFromNow !== undefined && a.id.includes("visit")),
      ).toBe(false);
    });
  });

  test("no yearly cost is Ava's own figure: a fixed amount comes from the buyer's files", () => {
    for (const bid of BIDS) {
      for (const c of bid.price?.otherCosts ?? []) {
        if (c.yearly.kind !== "fixed") continue;
        expect(`${c.id}: ${c.yearly.text}`).toMatch(/Attachment|Exhibit|Section/);
        expect(c.yearly.text).not.toMatch(/estimate|sample|allowance/i);
      }
    }
  });

  test("CUMCO-2026-014: a certified check under 5% of the total bid is critical; a check has no fee", () => {
    const bid = cumberlandBid;
    const clean = completeState(bid);
    const withCheck = (amount: number): BidState => ({
      ...clean,
      answers: {
        ...clean.answers,
        "ask-bid-bond": { status: "dont-have", optionId: "dh-cert-check", at },
        "ask-cert-check": done({ values: { "check-amount": amount } }),
      },
      opened: { ...clean.opened, "ask-cert-check": true },
    });
    const probe = withCheck(1);
    const bondFee = bid.price!.otherCosts.find((c) => c.id === "cost-bid-bond")!;
    expect(otherCostAmount(bid, probe, bondFee)).toBe(0);
    const total = sheetTotal(linePrices(effectiveBid(bid, probe), probe))!;
    expect(total).toBeGreaterThan(0);
    const short = withCheck(Math.floor(total * 0.04));
    expect(findingIds(bid, short)).toContain("security-amount");
    // Section 3.2 allows the check, so the deposit rule is met by the check itself.
    expect(req(bid, short, "req-bid-bond").status).toBe("meets");
    const enough = withCheck(Math.ceil(total * 0.05) + 1);
    expect(findingIds(bid, enough)).not.toContain("security-amount");
  });

  test("CUMCO-2026-014: three references are three asks, and a job under 100 meals a day fails", () => {
    const bid = cumberlandBid;
    const clean = completeState(bid);
    expect(req(bid, clean, "req-refs").status).toBe("meets");
    const two = { ...clean, answers: { ...clean.answers } };
    delete two.answers["ask-ref-2"];
    expect(req(bid, two, "req-refs").status).not.toBe("meets");
    const small = {
      ...clean,
      answers: {
        ...clean.answers,
        "ask-ref-3": done({
          values: {
            "ref3-meals": 60,
            "ref3-name": "x",
            "ref3-title": "x",
            "ref3-phone": "x",
            "ref3-email": "x",
          },
        }),
      },
    };
    expect(req(bid, small, "req-refs").status).toBe("not-yet");
    // Reference 1 replaced by a job the company did: its own ask, judged by its floor.
    const replaced = (meals: number): BidState => ({
      ...clean,
      answers: {
        ...clean.answers,
        "ask-ref-1": { status: "dont-have", optionId: "dh-ref1-other", at },
        "ask-ref-other-1": done({ values: { "other1-meals": meals } }),
      },
      opened: { ...clean.opened, "ask-ref-other-1": true },
    });
    expect(req(bid, replaced(150), "req-refs").status).toBe("meets");
    expect(req(bid, replaced(50), "req-refs").status).toBe("not-yet");
    // Two stand-ins never share one job.
    const opens = bid.asks
      .flatMap((a) => (a.dontHave ?? []).map((o) => o.opensAskId))
      .filter((x): x is string => !!x);
    expect(new Set(opens).size).toBe(opens.length);
  });

  test("CUMCO-2026-014: the sales tax the member enters is in every unit price", () => {
    const bid = cumberlandBid;
    const clean = completeState(bid);
    const withTax = (pct: number): BidState => ({
      ...clean,
      answers: { ...clean.answers, "ask-sales-tax": done({ values: { "sales-tax": pct } }) },
    });
    const p0 = linePrices(effectiveBid(bid, withTax(0)), withTax(0));
    const p7 = linePrices(effectiveBid(bid, withTax(7)), withTax(7));
    expect(p0[0].tax).toBe(0);
    expect(p7[0].unitPrice! / p0[0].unitPrice!).toBeCloseTo(1.07, 2);
    const none = { ...clean, answers: { ...clean.answers } };
    delete none.answers["ask-sales-tax"];
    expect(missingPriceAsks(effectiveBid(bid, none), none)).toContain("ask-sales-tax");
  });

  test("CUMCO-2026-014: Addendum 1 reopens the permit rule until the member confirms it", () => {
    const bid = cumberlandBid;
    const clean = completeState(bid);
    expect(req(bid, clean, "req-permit").status).toBe("meets");
    const fixes = { ...clean.fixes };
    delete fixes["reconfirm:req-permit"];
    expect(req(bid, { ...clean, fixes }, "req-permit").status).toBe("confirm");
    const before = { ...clean, fixes, addendaReceived: [] };
    expect(req(bid, before, "req-permit").status).toBe("meets");
    const change = bid.addenda[0].changes.find((c) => c.patch.kind === "requirement")!;
    expect(change.effectText).toMatch(/Confirm/);
    expect(bid.addenda[0].stillValid).not.toMatch(/permit/i);
  });

  test("FAYNC-2026-R-08: a named new hire meets the manager rule; an exam date does not", () => {
    const bid = fayettevilleBid;
    const hire = base(
      {
        "ask-servsafe": { status: "dont-have", optionId: "dh-ss-hire", at },
        "ask-loi": done({ fileName: "loi.pdf" }),
      },
      { opened: { "ask-loi": true } },
    );
    expect(req(bid, hire, "hr-manager").status).toBe("meets");
    const exam = base(
      {
        "ask-servsafe": { status: "dont-have", optionId: "dh-ss-exam", at },
        "ask-exam": done({ values: { "exam-date": "14 May 2026" } }),
      },
      { opened: { "ask-exam": true } },
    );
    expect(req(bid, exam, "hr-manager").status).toBe("confirm");
  });

  test("FAYNC-2026-R-08: buying insurance now keeps the rule open and prices the quoted premium", () => {
    const bid = fayettevilleBid;
    const s = base(
      {
        "ask-insurance": { status: "dont-have", optionId: "dh-ins-buy", at },
        "ask-insurance-quote": done({
          fileName: "quote.pdf",
          values: { "ins-quote-premium": 1800 },
        }),
      },
      { opened: { "ask-insurance-quote": true } },
    );
    expect(req(bid, s, "hr-insurance").status).toBe("confirm");
    const cost = bid.price!.otherCosts.find((c) => c.id === "oc-insurance")!;
    expect(otherCostAmount(bid, s, cost)).toBe(1800);
  });

  test("SP4701-26-Q-0021: both option years are priced, and approval covers them", () => {
    const bid = mackallBid;
    const s = completeState(bid);
    const eff = effectiveBid(bid, s);
    const periods = periodTotals(eff, s);
    expect(periods.map((p) => p.label)).toEqual(["Year one", "Option year 1", "Option year 2"]);
    for (const p of periods) expect(p.total).toBeGreaterThan(0);
    expect(periods[1].total! / periods[0].total!).toBeCloseTo(1.05, 2);
    expect(approvalTotal(eff, s)).toBeCloseTo(
      periods.reduce((n, p) => n + p.total!, 0),
      2,
    );
    expect(findingIds(bid, s)).not.toContain("price-approval");
  });

  test("SP4701-26-Q-0021: Amendment 0002 rewrites every sentence with the old delivery window", () => {
    const bid = mackallBid;
    const clean = completeState(bid);
    const text = (s: BidState) => {
      const sec = effectiveBid(bid, s).sections.find((x) => x.id === "mk-s-tech")!;
      return sectionParagraphs(s, sec);
    };
    const joined = (paras: Span[][]) =>
      paras
        .flat()
        .map((x) => x.text)
        .join("");
    expect(joined(text({ ...clean, addendaReceived: [] }))).toContain("by 5:30 AM");
    const after = text(clean);
    for (const old of ["by 5:30 AM", "by 3:45 AM", "from 2:00 AM"]) {
      expect(joined(after)).not.toContain(old);
    }
    expect(joined(after)).toContain("by 5:00 AM, weekends included");
    const promise = after.flat().find((x) => x.text.includes("by 5:00 AM"));
    expect(promise?.claim?.commitmentId).toBe("mk-c-window");
    expect(findingIds(bid, clean)).not.toContain("stale-promise:mk-c-window");
  });

  test("SP4701-26-Q-0021: health and welfare paid as cash carries payroll taxes", () => {
    const bid = mackallBid;
    const cash = base({ "mk-ask-hw": done({ choiceId: "hw-cash" }) });
    const benefits = base({ "mk-ask-hw": done({ choiceId: "hw-benefits" }) });
    expect(cashPerHour(bid, cash)).toBeCloseTo(5.36, 2);
    expect(cashPerHour(bid, benefits)).toBe(0);
    const vacation = bid.price!.burden.find((b) => b.id === "mk-b-vacation")!;
    expect(vacation.from.kind === "law" ? vacation.from.source?.fileId : null).toBe("mk-f-wd");
    const holidays = bid.price!.burden.find((b) => b.id === "mk-b-holidays")!;
    expect(holidays.from.kind === "law" ? !!holidays.from.source : false).toBe(true);
  });

  test("both North Carolina bids certify E-Verify for either branch of the law", () => {
    for (const bid of [fayettevilleBid, cumberlandBid]) {
      expect(bid.submission.certifying).toContain(
        "Your company follows North Carolina's E-Verify law, or has fewer than 25 employees there.",
      );
      expect(
        bid.submission.certifying.some((c) => /^Your company (has|employs) fewer than 25/.test(c)),
      ).toBe(false);
    }
  });
});
