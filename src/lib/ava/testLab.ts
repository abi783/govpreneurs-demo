// Ava's Test Lab (build spec §11) — internal only.
//
// It runs the exact checks against seeded bids with a known answer key and
// reports defects caught, missed and falsely flagged. Speed is reported
// separately and is not proof of value.
//
// HOW A CASE WORKS
//   1. completeState() builds a clean member state for a sample bid: every
//      visible ask answered, every promise approved, every clean-up fix
//      applied, the price approved at its recalculated total. A clean bid must
//      produce no findings at all (the controls prove it on every run).
//   2. A case seeds ONE defect into a copy of that bid and state.
//   3. The answer key (`expect`) is written from the fixture's own structure —
//      which ask feeds the price, which file is blocked — never from the
//      checker's output. Some defects rightly cause more than one finding (an
//      open upload ask also leaves its file blocked); the key lists all of them.
//   4. Every finding the checker raises that the key does not list is a false
//      flag. Minor findings count too: nothing is filtered.
//
// Case ids come from the fixtures, so a new sample bid is seeded by the same
// builders. A builder that cannot find the shape it needs says why (LAB_GAPS)
// instead of quietly running fewer cases.

import { exactChecks } from "./checks";
import { daysFromToday, nowIso } from "./dates";
import {
  dateCannotSlip,
  decideBy,
  effectiveBid,
  visibleAsks,
  requirementChangedBy,
} from "./derive";
// DEMO: the lab seeds every member's sample bids, whichever story is on stage.
import { ALL_AVA_BIDS as AVA_BIDS } from "./fixtures";
import { approvalTotal, linePrices, priceOf, sheetTotal } from "./price";
import { decisionKey, emptyState, type AskAnswer, type BidState } from "./store";
import type { Ask, AvaBid, EnterField } from "./types";
import { readable } from "./types";

// ─── The clean state ───

const key = (ref: { askId: string; fieldId: string }) => `${ref.askId}:${ref.fieldId}`;

/** The highest wage floor any role puts on a pay field. */
export function roleFloors(bid: AvaBid): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of bid.price?.roles ?? []) {
    if (!r.wageFloor) continue;
    const k = key(r.pay);
    out.set(k, Math.max(out.get(k) ?? 0, r.wageFloor.perHour));
  }
  return out;
}

/** Words a caterer could type in a box that gives no example, by the box's id.
 *  Each answer is one phrase with no final full stop: the draft adds it. They
 *  match the answers the bids start with (lib/ava/starts), so a screen made by
 *  a prototype control reads like the bid she is building. */
const TEXT_ANSWERS: Record<string, string> = {
  "fb-hire":
    "we ask people we trust for the names of good cooks, and every new cook works one paid trial shift",
  "fb-keep":
    "we give every cook a steady weekly schedule and pay on time, and each cook learns a second station",
  "fb-sites-lead":
    "a lead cook runs the kitchen at each dining facility, and our owner manages both leads",
  "fb-sites-supply":
    "local farms and produce suppliers near Fayetteville, and one restaurant food wholesaler",
  "temp-check": "Every hour during service, and at each handoff",
  "temp-record": "On a signed log sheet at the hot line. The manager reviews it each day",
  "missed-fix": "The cook replaces or reheats the item at once. The manager logs it",
};

/** A plausible value for an entered field. Never under a floor. */
function sampleValue(askId: string, f: EnterField, floors: Map<string, number>): number | string {
  const floor = f.floor?.value;
  switch (f.unit) {
    case "usd-hour": {
      const role = floors.get(`${askId}:${f.id}`);
      return Math.max(floor !== undefined ? floor + 1 : 0, role !== undefined ? role + 1 : 0, 18);
    }
    case "percent":
      return Math.max(5, floor ?? 0);
    case "usd":
      return Math.max(4.25, floor ?? 0);
    case "count":
      return Math.max(4, floor ?? 0);
    case "text": {
      // The field's own example reads like a real answer ("For example: Sam
      // Ortiz, our head cook…"); a bare placeholder would show in the draft.
      const ex = f.hint?.match(/^For example[:,]\s*(.+?)\.?$/i)?.[1];
      return ex ?? TEXT_ANSWERS[f.id] ?? "Sample answer";
    }
    case "phone":
      return "(910) 555-0100";
    case "email":
      return "contact@example.com";
  }
}

export function sampleAnswer(ask: Ask, floors: Map<string, number>, at: string): AskAnswer {
  const spec = ask.answer;
  switch (spec.type) {
    case "enter":
      return {
        status: "done",
        at,
        values: Object.fromEntries(spec.fields.map((f) => [f.id, sampleValue(ask.id, f, floors)])),
      };
    case "upload":
      return {
        status: "done",
        at,
        fileName: "Sample upload.pdf",
        values: spec.extracts
          ? Object.fromEntries(spec.extracts.map((x) => [x.fieldId, x.value]))
          : undefined,
      };
    case "answer":
      return { status: "done", at, choiceId: spec.choices.find((c) => !c.failsGate)?.id };
    case "approve":
      return { status: "done", at };
  }
}

function priceTotal(bid: AvaBid, s: BidState): number | null {
  // What the member approves: every period when the buyer prices option years.
  const eff = effectiveBid(bid, s);
  if (!eff.price) return null;
  return eff.price.periods ? approvalTotal(eff, s) : sheetTotal(linePrices(eff, s));
}

/** Approve the price at whatever it totals now. */
function approvePriceNow(bid: AvaBid, s: BidState): BidState {
  const total = priceTotal(bid, s);
  return { ...s, priceApproval: total === null ? null : { at: nowIso(), total } };
}

/** A full, clean member state for a bid: nothing left for the checker to find.
 *  `keep` carries prototype controls across (a price she types herself). */
export function completeState(bid: AvaBid, keep: Record<string, true> = {}): BidState {
  const at = nowIso();
  let s: BidState = {
    ...emptyState(),
    fixes: { ...keep },
    started: true,
    briefConfirmed: true,
    // Every addendum has arrived and been read.
    addendaReceived: bid.addenda.filter((a) => a.arrivesDuringBuild).map((a) => a.id),
    addendaSeen: Object.fromEntries(bid.addenda.map((a) => [a.id, true as const])),
  };
  const eff = effectiveBid(bid, s);
  const floors = roleFloors(eff);

  const answers: Record<string, AskAnswer> = {};
  const opened: Record<string, true> = {};
  for (const ask of visibleAsks(eff, s)) answers[ask.id] = sampleAnswer(ask, floors, at);
  // Every file Ava could not read is uploaded, even when its ask is hidden.
  for (const f of eff.files) {
    if (readable(f) || !f.uploadAskId || answers[f.uploadAskId]) continue;
    const ask = eff.asks.find((a) => a.id === f.uploadAskId);
    if (!ask) continue;
    if (ask.hiddenUntilOpened) opened[ask.id] = true;
    answers[ask.id] = sampleAnswer(ask, floors, at);
  }
  // An answer that opens a follow-up ("we will attend" → "did you sign the
  // sheet?") is followed through: the follow-up is opened and answered too.
  for (let pass = 0; pass < 5; pass++) {
    let more = false;
    for (const ask of eff.asks) {
      if (ask.answer.type !== "answer") continue;
      const picked = answers[ask.id]?.choiceId;
      const next = ask.answer.choices.find((c) => c.id === picked)?.opensAskId;
      if (!next || answers[next]) continue;
      const follow = eff.asks.find((a) => a.id === next);
      if (!follow) continue;
      if (follow.hiddenUntilOpened) opened[follow.id] = true;
      answers[follow.id] = sampleAnswer(follow, floors, at);
      more = true;
    }
    if (!more) break;
  }

  const commitments: BidState["commitments"] = {};
  for (const c of eff.commitments) commitments[c.id] = { at, text: c.text };

  const clarifications: BidState["clarifications"] = {};
  for (const c of eff.clarifications) {
    clarifications[c.id] = {
      sentAt: at,
      reply: "The buyer answered in writing.",
      replyAt: at,
      readingId: c.readings?.[0]?.id,
      settled: true,
    };
  }

  // The clean-up fixes Ava offers in the check. Acknowledgment forms are not
  // here on purpose: every received addendum must have its form in the fixture.
  const fixes: Record<string, true> = {};
  for (const sec of eff.sections) {
    if (sec.pageLimit && sec.pages > sec.pageLimit) fixes[`pages:${sec.id}`] = true;
  }
  if (eff.nameInDraft !== eff.samLegalName) fixes["name-sam"] = true;
  if (eff.price?.templateError) {
    fixes["template"] = true;
    fixes["template-answered"] = true;
  }
  // A rule an addendum rewrote is re-confirmed by the member.
  for (const r of eff.hardRequirements) {
    if (requirementChangedBy(bid, s, r.id)) fixes[`reconfirm:${r.id}`] = true;
  }
  for (const c of eff.price?.otherCosts ?? []) if (!c.inPrice) fixes[`deliver:${c.id}`] = true;

  const checklist: Record<string, boolean> = {};
  for (const item of eff.submission.checklist) checklist[item.id] = true;

  // Ava's decisions in the writing: she kept each of Ava's choices.
  const decisions: BidState["decisions"] = {};
  for (const sec of eff.sections) {
    for (const d of sec.decisions ?? []) decisions[decisionKey(sec.id, d.id)] = { pick: "ava", at };
  }

  s = {
    ...s,
    answers,
    opened,
    commitments,
    clarifications,
    fixes: { ...keep, ...fixes },
    checklist,
    decisions,
  };
  return approvePriceNow(bid, s);
}

// ─── The answer key helpers (from the fixture's structure, not the checker) ───

type Ref = { askId: string; fieldId: string };

/** Every price input the member supplies. */
export function priceRefs(bid: AvaBid): Ref[] {
  const p = bid.price;
  if (!p) return [];
  const out: Ref[] = p.roles.map((r) => r.pay);
  for (const b of p.burden) if (b.from.kind === "ask") out.push(b.from);
  for (const l of p.lines) if (l.direct) out.push(l.direct);
  out.push(p.overhead, p.profit);
  if (p.contingency) out.push(p.contingency);
  return out;
}

/** Yearly costs whose amount comes from an ask and that the price carries —
 *  put in by Ava, or added by the member's fix. Every carried cost is part of
 *  the unit prices, so without the answer the price cannot be worked out. */
function carriedCostAsks(bid: AvaBid, s: BidState): string[] {
  return (bid.price?.otherCosts ?? []).flatMap((c) =>
    (c.inPrice || s.fixes[`deliver:${c.id}`]) && c.yearly.kind === "ask" ? [c.yearly.askId] : [],
  );
}

/** An open ask whose decide-by date is today is late (the product rule). */
function lateToday(ask: Ask, bid: AvaBid): boolean {
  const d = daysFromToday(decideBy(ask, bid));
  return d < 0 || (dateCannotSlip(ask, bid) && d === 0);
}

/** What SHOULD be found when this ask is open again, everything else clean. */
export function openAskFindings(bid: AvaBid, s: BidState, askId: string): string[] {
  const eff = effectiveBid(bid, s);
  const out = new Set<string>();
  const ask = eff.asks.find((a) => a.id === askId);
  if (priceRefs(eff).some((r) => r.askId === askId) || carriedCostAsks(eff, s).includes(askId)) {
    out.add("price-incomplete");
  }
  for (const r of eff.hardRequirements) {
    // A requirement can need several asks (askIds); any of them open leaves it unshown.
    const needs = r.askId === askId || (r.askIds ?? []).includes(askId);
    if (needs && r.initial !== "meets") out.add(`req:${r.id}`);
  }
  const unsupported = eff.sections.some((sec) =>
    sec.paragraphs.flat().some((sp) => sp.claim?.tag === "unsupported" && sp.claim.askId === askId),
  );
  if (unsupported) out.add("gaps");
  for (const f of eff.files) {
    if (
      f.uploadAskId === askId &&
      !readable(f) &&
      f.riskIfMissing !== "minor" &&
      !s.risks[`file:${f.id}`]
    ) {
      out.add(`file:${f.id}`);
    }
  }
  const visible = ask && (!ask.hiddenUntilOpened || s.opened[ask.id]);
  if (ask && visible && lateToday(ask, eff)) out.add(`late:${askId}`);
  return [...out].sort();
}

/** How much else an open ask would disturb. Builders pick the quietest. */
function spill(bid: AvaBid, s: BidState, askId: string, primary: string): number {
  return openAskFindings(bid, s, askId).filter((f) => f !== primary).length;
}

function withoutAnswer(s: BidState, askId: string): BidState {
  const answers = { ...s.answers };
  delete answers[askId];
  return { ...s, answers };
}

// ─── Seeded cases ───

export interface SeededCase {
  id: string;
  bidId: string;
  /** The seeded defect, in plain words. */
  defect: string;
  /** Every finding id this defect should cause. Empty for a control. */
  expect: string[];
  mutate: (bid: AvaBid, state: BidState) => { bid: AvaBid; state: BidState };
  /** A defect the checks are known to miss today, in plain words. The lab
   *  still counts the miss; the tests fail if the label outlives the gap. */
  knownGap?: string;
}

type Built = SeededCase | { gap: string };

interface Sample {
  id: string;
  bid: AvaBid;
  clean: BidState;
  eff: AvaBid;
}

function sample(id: string): Sample | null {
  const bid = AVA_BIDS[id];
  if (!bid) return null;
  const clean = completeState(bid);
  return { id, bid, clean, eff: effectiveBid(bid, clean) };
}

function samples(): Sample[] {
  return Object.keys(AVA_BIDS)
    .map(sample)
    .filter((x): x is Sample => x !== null);
}

/** The sample bid of a kind, falling back to the first that has the shape. */
function pick(prefer: (b: AvaBid) => boolean, has: (x: Sample) => boolean): Sample | null {
  const all = samples();
  return all.find((x) => prefer(x.bid) && has(x)) ?? all.find(has) ?? null;
}

const isWritten = (b: AvaBid) => b.kind === "written-proposal";
const isPackage = (b: AvaBid) => b.kind === "bid-package";
const isFederalQuote = (b: AvaBid) => /-Q-/.test(b.noticeId);

const BUILDERS: { id: string; build: () => Built }[] = [
  // 1 · An addendum acknowledgment form is missing from the forms.
  {
    id: "ack",
    build: () => {
      const hasAck = (x: Sample) =>
        x.eff.addenda.some((a) => x.eff.forms.some((f) => f.acknowledgesAddendumId === a.id));
      const x = pick(isWritten, hasAck);
      if (!x) return { gap: "No sample bid has an addendum with an acknowledgment form." };
      const a = x.eff.addenda.find((ad) =>
        x.eff.forms.some((f) => f.acknowledgesAddendumId === ad.id),
      )!;
      return {
        id: `${x.id}:ack`,
        bidId: x.id,
        defect: `The form that acknowledges Addendum ${a.number} was removed.`,
        expect: [`ack:${a.id}`],
        mutate: (bid, state) => {
          bid.forms = bid.forms.filter((f) => f.acknowledgesAddendumId !== a.id);
          delete state.fixes[`ack:${a.id}`];
          return { bid, state };
        },
      };
    },
  },

  // 2 · A section over its page limit, with Ava's cut undone.
  {
    id: "pages",
    build: () => {
      const x = pick(isWritten, (s) => s.eff.sections.some((sec) => !!sec.pageLimit));
      if (!x) return { gap: "No sample bid has a section with a page limit." };
      const over = x.eff.sections.find((sec) => sec.pageLimit && sec.pages > sec.pageLimit);
      const sec = over ?? x.eff.sections.find((s2) => !!s2.pageLimit)!;
      const limit = sec.pageLimit!;
      return {
        id: `${x.id}:pages`,
        bidId: x.id,
        defect: over
          ? `${sec.title} is ${sec.pages} pages against a limit of ${limit}, and the cut was undone.`
          : `${sec.title} was made ${limit + 2} pages against a limit of ${limit}.`,
        expect: [`pages:${sec.id}`],
        mutate: (bid, state) => {
          delete state.fixes[`pages:${sec.id}`];
          if (!over)
            bid.sections = bid.sections.map((s2) =>
              s2.id === sec.id ? { ...s2, pages: limit + 2 } : s2,
            );
          return { bid, state };
        },
      };
    },
  },

  // 3 · The company name in the bid differs from the registration.
  {
    id: "name-sam",
    build: () => {
      const x = pick(
        (b) => b.nameInDraft !== b.samLegalName,
        () => true,
      );
      if (!x) return { gap: "No sample bids." };
      const seeded = x.bid.nameInDraft !== x.bid.samLegalName;
      return {
        id: `${x.id}:name`,
        bidId: x.id,
        defect: seeded
          ? `The bid says "${x.bid.nameInDraft}", not the registered name.`
          : "The bid uses a short trade name, not the registered name.",
        expect: ["name-sam"],
        mutate: (bid, state) => {
          delete state.fixes["name-sam"];
          if (!seeded) bid.nameInDraft = "Haddad Catering";
          return { bid, state };
        },
      };
    },
  },

  // 4 · A pay rate under the wage floor (the federal quote request).
  {
    id: "wage",
    build: () => {
      const x = pick(isFederalQuote, (s) => !!s.eff.price?.roles.some((r) => !!r.wageFloor));
      if (!x) return { gap: "No sample bid has a role with a wage floor." };
      const role = priceOf(x.eff).roles.find((r) => !!r.wageFloor)!;
      const floor = role.wageFloor!.perHour;
      const low = Math.round((floor - 1.5) * 100) / 100;
      // Every role paid from the same field falls under its floor too.
      const hit = priceOf(x.eff).roles.filter(
        (r) => key(r.pay) === key(role.pay) && r.wageFloor && low < r.wageFloor.perHour,
      );
      // A hard requirement that reads this pay field, with a floor on the
      // field above the low rate, is failed by the answer too.
      const payAsk = x.eff.asks.find((a) => a.id === role.pay.askId);
      const fieldFloor =
        payAsk?.answer.type === "enter"
          ? payAsk.answer.fields.find((f) => f.id === role.pay.fieldId)?.floor?.value
          : undefined;
      const reqs =
        fieldFloor !== undefined && low < fieldFloor
          ? x.eff.hardRequirements.filter(
              (r) => r.askId === role.pay.askId || (r.askIds ?? []).includes(role.pay.askId),
            )
          : [];
      return {
        id: `${x.id}:wage`,
        bidId: x.id,
        defect: `${role.name} pay entered at ${low.toFixed(2)} dollars an hour. The floor is ${floor.toFixed(2)}.`,
        expect: [...hit.map((r) => `wage:${r.id}`), ...reqs.map((r) => `req:${r.id}`)].sort(),
        mutate: (bid, state) => {
          const a = state.answers[role.pay.askId];
          state.answers[role.pay.askId] = {
            ...a,
            values: { ...(a?.values ?? {}), [role.pay.fieldId]: low },
          };
          // The member approved the price at this pay, so only the wage is wrong.
          return { bid, state: approvePriceNow(bid, state) };
        },
      };
    },
  },

  // 5 · The writing describes different staffing from the price.
  {
    id: "staffing-price",
    build: () => {
      const x = pick(isWritten, (s) => (s.eff.price?.roles.length ?? 0) > 0);
      if (!x) return { gap: "No sample bid has priced roles." };
      const first = priceOf(x.eff).roles[0];
      return {
        id: `${x.id}:staffing`,
        bidId: x.id,
        defect: `The writing gives the ${first.name.toLowerCase()} 8 more hours a week than the price pays for.`,
        expect: ["staffing-price"],
        mutate: (bid, state) => {
          bid.draftStaffing = priceOf(bid).roles.map((r, i) => ({
            roleId: r.id,
            count: r.count,
            hoursPerWeek: i === 0 ? r.hoursPerWeek + 8 : r.hoursPerWeek,
          }));
          return { bid, state };
        },
      };
    },
  },

  // 5b · The writing moves hours between roles; the total still matches.
  {
    id: "staffing-roles",
    build: () => {
      const x = pick(isWritten, (s) => (s.eff.price?.roles.length ?? 0) >= 2);
      if (!x) return { gap: "No sample bid has two priced roles." };
      const [a, b] = priceOf(x.eff).roles;
      // Keep the weekly total equal: a gains what b loses.
      const moved = a.count * b.count * 5;
      if (b.hoursPerWeek - a.count * 5 <= 0)
        return { gap: `${x.id}: ${b.name} has too few hours to move.` };
      return {
        id: `${x.id}:staffing-roles`,
        bidId: x.id,
        defect: `The writing moves ${moved} weekly hours from the ${b.name.toLowerCase()} to the ${a.name.toLowerCase()}. The total is the same.`,
        expect: ["staffing-price"],
        mutate: (bid, state) => {
          bid.draftStaffing = priceOf(bid).roles.map((r) => ({
            roleId: r.id,
            count: r.count,
            hoursPerWeek:
              r.id === a.id
                ? r.hoursPerWeek + b.count * 5
                : r.id === b.id
                  ? r.hoursPerWeek - a.count * 5
                  : r.hoursPerWeek,
          }));
          return { bid, state };
        },
      };
    },
  },

  // 6 · An unsupported statement left without an answer.
  {
    id: "gaps",
    build: () => {
      const claimAsks = (s: Sample) =>
        [
          ...new Set(
            s.eff.sections.flatMap((sec) =>
              sec.paragraphs
                .flat()
                .flatMap((sp) =>
                  sp.claim?.tag === "unsupported" && sp.claim.askId ? [sp.claim.askId] : [],
                ),
            ),
          ),
        ].filter((id) => s.eff.asks.some((a) => a.id === id && !a.hiddenUntilOpened));
      const x = pick(isWritten, (s) => claimAsks(s).length > 0);
      if (!x) return { gap: "No sample bid has an unsupported statement tied to a visible ask." };
      const askId = claimAsks(x).sort(
        (a, b) =>
          spill(x.bid, withoutAnswer(x.clean, a), a, "gaps") -
          spill(x.bid, withoutAnswer(x.clean, b), b, "gaps"),
      )[0];
      const ask = x.eff.asks.find((a) => a.id === askId)!;
      return {
        id: `${x.id}:gaps`,
        bidId: x.id,
        defect: `The ask behind an unsupported statement is still open: ${ask.title}.`,
        expect: openAskFindings(x.bid, withoutAnswer(x.clean, askId), askId),
        mutate: (bid, state) => ({ bid, state: withoutAnswer(state, askId) }),
      };
    },
  },

  // 7 · A promise the member has not approved.
  {
    id: "commitments",
    build: () => {
      const x = pick(isPackage, (s) => s.eff.commitments.some((c) => c.needsApproval));
      if (!x) return { gap: "No sample bid has a promise that needs approval." };
      const c = x.eff.commitments.find((cm) => cm.needsApproval)!;
      return {
        id: `${x.id}:promise`,
        bidId: x.id,
        defect: `A promise is not approved: ${c.text}`,
        expect: ["commitments"],
        mutate: (bid, state) => {
          delete state.commitments[c.id];
          return { bid, state };
        },
      };
    },
  },

  // 8 · A price input is missing.
  {
    id: "price-incomplete",
    build: () => {
      const x = pick(isFederalQuote, (s) => priceRefs(s.eff).length > 0);
      if (!x) return { gap: "No sample bid has price inputs." };
      const ids = [...new Set(priceRefs(x.eff).map((r) => r.askId))].filter((id) =>
        x.eff.asks.some((a) => a.id === id && !a.hiddenUntilOpened),
      );
      if (ids.length === 0) return { gap: `${x.id}: every price input sits behind a hidden ask.` };
      // Prefer the profit ask; otherwise the input that disturbs least.
      const profit = priceOf(x.eff).profit.askId;
      const askId = ids
        .slice()
        .sort(
          (a, b) =>
            spill(x.bid, withoutAnswer(x.clean, a), a, "price-incomplete") -
              spill(x.bid, withoutAnswer(x.clean, b), b, "price-incomplete") ||
            Number(b === profit) - Number(a === profit),
        )[0];
      const ask = x.eff.asks.find((a) => a.id === askId)!;
      return {
        id: `${x.id}:price-input`,
        bidId: x.id,
        defect: `A price input is not answered: ${ask.title}.`,
        expect: openAskFindings(x.bid, withoutAnswer(x.clean, askId), askId),
        mutate: (bid, state) => ({ bid, state: withoutAnswer(state, askId) }),
      };
    },
  },

  // 9 · The price changed after the member approved it.
  {
    id: "price-approval",
    build: () => {
      const x = pick(isPackage, (s) => s.clean.priceApproval !== null);
      if (!x) return { gap: "No sample bid reaches an approved price in the clean state." };
      const ref = priceOf(x.eff).profit;
      return {
        id: `${x.id}:price-changed`,
        bidId: x.id,
        defect: "The profit went from 5 to 7 percent after the price was approved.",
        expect: ["price-approval"],
        mutate: (bid, state) => {
          const a = state.answers[ref.askId];
          state.answers[ref.askId] = { ...a, values: { ...(a?.values ?? {}), [ref.fieldId]: 7 } };
          return { bid, state };
        },
      };
    },
  },

  // 10 · A yearly cost the price does not carry.
  {
    id: "deliver",
    build: () => {
      const x =
        pick(
          () => true,
          (s) => !!s.eff.price?.otherCosts.some((c) => !c.inPrice),
        ) ?? pick(isPackage, () => true);
      if (!x) return { gap: "No sample bids." };
      const out = priceOf(x.eff).otherCosts.find((c) => !c.inPrice);
      const inside = priceOf(x.eff).otherCosts.find((c) => c.inPrice);
      const cost = out ?? inside;
      const costId = cost?.id ?? "lab-cost";
      return {
        id: `${x.id}:cost`,
        bidId: x.id,
        defect: cost
          ? `The price leaves out a yearly cost: ${cost.label.toLowerCase()}.`
          : "The price leaves out a yearly cost of 1,200 dollars.",
        expect: [`deliver:${costId}`],
        mutate: (bid, state) => {
          delete state.fixes[`deliver:${costId}`];
          if (!out && inside) {
            priceOf(bid).otherCosts = priceOf(bid).otherCosts.map((c) =>
              c.id === inside.id ? { ...c, inPrice: false } : c,
            );
          }
          if (!cost) {
            priceOf(bid).otherCosts = [
              ...priceOf(bid).otherCosts,
              {
                id: costId,
                label: "Lab test cost",
                yearly: { kind: "fixed", amount: 1200, text: "Seeded by the lab" },
                inPrice: false,
              },
            ];
          }
          // The member approved the price without the cost.
          return { bid, state: approvePriceNow(bid, state) };
        },
      };
    },
  },

  // 11 · A formula error in the buyer's price sheet (the bid package).
  {
    id: "template",
    build: () => {
      const x =
        pick(isPackage, (s) => !!s.eff.price?.templateError) ??
        pick(isPackage, (s) => s.eff.price !== null);
      if (!x) return { gap: "No sample bids." };
      const seeded = !!priceOf(x.eff).templateError;
      return {
        id: `${x.id}:template`,
        bidId: x.id,
        defect: seeded
          ? "The buyer's price sheet has a formula error, and nobody asked the buyer."
          : "A formula error was put in the buyer's price sheet.",
        expect: ["template"],
        mutate: (bid, state) => {
          // Nobody asked the buyer, and no answer came back.
          delete state.fixes["template"];
          delete state.fixes["template-answered"];
          if (!seeded) priceOf(bid).templateError = "The total cell adds one line twice.";
          return { bid, state };
        },
      };
    },
  },

  // 12 · A file Ava could not read, never uploaded (the written proposal).
  {
    id: "file",
    build: () => {
      const blocked = (s: Sample) =>
        s.eff.files.filter((f) => !readable(f) && f.riskIfMissing !== "minor" && !!f.uploadAskId);
      const x = pick(isWritten, (s) => blocked(s).length > 0);
      if (!x) return { gap: "No sample bid has an unreadable file with an upload ask." };
      const f = blocked(x)[0];
      const askId = f.uploadAskId!;
      return {
        id: `${x.id}:file`,
        bidId: x.id,
        defect: `${f.name} could not be read, and it was not uploaded.`,
        expect: openAskFindings(x.bid, withoutAnswer(x.clean, askId), askId),
        mutate: (bid, state) => ({ bid, state: withoutAnswer(state, askId) }),
      };
    },
  },

  // 13 · A hard requirement not met.
  {
    id: "req",
    build: () => {
      const reqAsks = (s: Sample) =>
        s.eff.hardRequirements.filter(
          (r) =>
            r.askId &&
            r.initial !== "meets" &&
            s.eff.asks.some((a) => a.id === r.askId && !a.hiddenUntilOpened),
        );
      const x = pick(isPackage, (s) => reqAsks(s).length > 0);
      if (x) {
        const r = reqAsks(x).sort(
          (a, b) =>
            spill(x.bid, withoutAnswer(x.clean, a.askId!), a.askId!, `req:${a.id}`) -
            spill(x.bid, withoutAnswer(x.clean, b.askId!), b.askId!, `req:${b.id}`),
        )[0];
        const askId = r.askId!;
        return {
          id: `${x.id}:req`,
          bidId: x.id,
          defect: `A hard requirement is not shown: ${r.label}.`,
          expect: openAskFindings(x.bid, withoutAnswer(x.clean, askId), askId),
          mutate: (bid, state) => ({ bid, state: withoutAnswer(state, askId) }),
        };
      }
      const y = pick(isPackage, (s) => s.eff.hardRequirements.length > 0);
      if (!y) return { gap: "No sample bid has a hard requirement." };
      const r = y.eff.hardRequirements[0];
      return {
        id: `${y.id}:req`,
        bidId: y.id,
        defect: `A hard requirement was marked not met: ${r.label}.`,
        expect: [`req:${r.id}`],
        mutate: (bid, state) => {
          bid.hardRequirements = bid.hardRequirements.map((h) =>
            h.id === r.id ? { ...h, initial: "not-yet", askId: undefined } : h,
          );
          return { bid, state };
        },
      };
    },
  },

  // 14 · An addendum changed a promise after the member approved it.
  {
    id: "addendum-promise",
    build: () => {
      // The addendum, and the promise it rewrites, as the fixture first read it.
      const change = (s: Sample) => {
        for (const a of s.bid.addenda) {
          for (const ch of a.changes) {
            const p = ch.patch;
            if (p.kind !== "commitment") continue;
            const before = s.bid.commitments.find((cm) => cm.id === p.commitmentId);
            if (before && before.needsApproval && before.text !== p.text) return { a, before };
          }
        }
        return null;
      };
      const x = pick(isWritten, (s) => change(s) !== null);
      if (!x) return { gap: "No sample bid has an addendum that changes a promise." };
      const { a, before } = change(x)!;
      return {
        id: `${x.id}:addendum-promise`,
        bidId: x.id,
        defect: `Addendum ${a.number} changed a promise after it was approved.`,
        expect: ["commitments"],
        mutate: (bid, state) => {
          state.commitments[before.id] = { at: nowIso(), text: before.text };
          return { bid, state };
        },
      };
    },
  },

  // 15 · An addendum changed a quantity after the member approved the price.
  {
    id: "addendum-qty",
    build: () => {
      const moves = (s: Sample) =>
        s.bid.addenda.find((a) => {
          if (!a.changes.some((c) => c.patch.kind === "price-qty")) return false;
          const without = { ...s.bid, addenda: s.bid.addenda.filter((ad) => ad.id !== a.id) };
          const old = priceTotal(without, s.clean);
          return (
            old !== null &&
            s.clean.priceApproval !== null &&
            Math.abs(old - s.clean.priceApproval.total) > 0.005
          );
        });
      const x = pick(
        () => true,
        (s) => !!moves(s),
      );
      if (!x) return { gap: "No sample bid has an addendum that changes a price quantity." };
      const a = moves(x)!;
      return {
        id: `${x.id}:addendum-qty`,
        bidId: x.id,
        defect: `The price was approved before Addendum ${a.number} changed a quantity.`,
        expect: ["price-approval"],
        mutate: (bid, state) => {
          const without = { ...bid, addenda: bid.addenda.filter((ad) => ad.id !== a.id) };
          const old = priceTotal(without, state);
          state.priceApproval = old === null ? null : { at: nowIso(), total: old };
          return { bid, state };
        },
      };
    },
  },
];

/** A control per sample bid: the clean state, no defect. Any finding is a false flag. */
function controls(): SeededCase[] {
  return Object.keys(AVA_BIDS).map((id) => ({
    id: `${id}:control`,
    bidId: id,
    defect: "None. The complete bid, as a control.",
    expect: [],
    mutate: (bid, state) => ({ bid, state }),
  }));
}

function buildCases(): { cases: SeededCase[]; gaps: string[] } {
  const cases: SeededCase[] = [];
  const gaps: string[] = [];
  for (const b of BUILDERS) {
    try {
      const built = b.build();
      if ("gap" in built) gaps.push(`${b.id}: ${built.gap}`);
      else cases.push(built);
    } catch (e) {
      gaps.push(`${b.id}: the builder failed (${e instanceof Error ? e.message : String(e)}).`);
    }
  }
  return { cases: [...cases, ...controls()], gaps };
}

// DEMO: built when first asked for, not when the file loads. The demo's
// starting states (src/lib/ava/starts) use this file through play.ts, and a
// start loads while the sample bids are still loading, so reading them here at
// load time would find an unfinished list.
let built: { cases: SeededCase[]; gaps: string[] } | null = null;
const lab = () => (built ??= buildCases());

/** Every seeded case, controls last. */
export function seededCases(): SeededCase[] {
  return lab().cases;
}
/** Cases the lab could not seed from the sample bids, with the reason. */
export function labGaps(): string[] {
  return lab().gaps;
}
/** The defect kinds the lab must cover (build brief). */
export const LAB_KINDS = BUILDERS.map((b) => b.id);

// ─── Running the lab ───

export interface LabCaseResult {
  id: string;
  bidId: string;
  defect: string;
  /** A control seeds no defect. */
  control: boolean;
  expected: string[];
  found: string[];
  caught: string[];
  missed: string[];
  falseFlags: string[];
  /** Set when the checks are known to miss this defect today. */
  knownGap?: string;
}

export interface LabRun {
  cases: LabCaseResult[];
  totals: {
    /** Seeded defects whose every expected finding was raised. */
    caught: number;
    /** Seeded defects with at least one expected finding not raised. */
    missed: number;
    /** Of the missed, how many are known gaps in the checks. */
    knownGaps: number;
    /** Findings raised that no seeded defect explains, minor ones included. */
    falseFlags: number;
    defects: number;
    controls: number;
  };
  /** Wall time for the whole run, in milliseconds. Not proof of value. */
  ms: number;
}

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function runCase(c: SeededCase): LabCaseResult {
  const base = AVA_BIDS[c.bidId];
  const { bid, state } = c.mutate(structuredClone(base), structuredClone(completeState(base)));
  const found = [
    ...new Set(exactChecks(effectiveBid(bid, state), state).findings.map((f) => f.id)),
  ].sort();
  const expected = [...c.expect].sort();
  return {
    id: c.id,
    bidId: c.bidId,
    defect: c.defect,
    control: expected.length === 0,
    expected,
    found,
    caught: expected.filter((f) => found.includes(f)),
    missed: expected.filter((f) => !found.includes(f)),
    falseFlags: found.filter((f) => !expected.includes(f)),
    knownGap: c.knownGap,
  };
}

export function runLab(cases: SeededCase[] = seededCases()): LabRun {
  const t0 = now();
  const results = cases.map(runCase);
  const ms = now() - t0;
  const defects = results.filter((r) => !r.control);
  return {
    cases: results,
    totals: {
      caught: defects.filter((r) => r.missed.length === 0).length,
      missed: defects.filter((r) => r.missed.length > 0).length,
      knownGaps: defects.filter((r) => r.missed.length > 0 && r.knownGap).length,
      falseFlags: results.reduce((n, r) => n + r.falseFlags.length, 0),
      defects: defects.length,
      controls: results.length - defects.length,
    },
    ms,
  };
}
