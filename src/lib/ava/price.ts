// Ava's price build-up. Pure arithmetic over the effective bid and the
// member's answers.
//
// THE RULES (concept §7):
//   • What you pay, not what you charge: every hourly cost starts from the
//     member's own pay rate, then adds each line with its source.
//   • Company cost lines come only from the member's documents or entries. A
//     legal rate (Social Security and Medicare) is the one fixed fact.
//   • An unknown input makes the result unknown. Every function here returns
//     null rather than a default (D-A2, D-A3): no constant ever stands in for a
//     member fact.
//   • One staffing plan: the hours priced are `price.roles`, the same object
//     the writing describes.
//   • Ava never chooses the profit. Until the member enters it, there is no price.

import type { BidState } from "./store";
import { askResolved, PRICE_YOURSELF_KEY, YOUR_PRICES_ASK } from "./derive";
import type { AvaBid, BurdenLine, OtherCost, PriceLine, PriceModel, PriceRole } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The bid's price. Only for a step that shows the price: a bid the buyer
 *  allows no price for (`price: null`) never reaches one. */
export function priceOf(bid: AvaBid): PriceModel {
  if (!bid.price) throw new Error(`${bid.noticeId} has no price: the buyer allows none.`);
  return bid.price;
}

// ─── "Price it yourself" (docs/ava/build-progression.md, item 1) ───
//
// Ava has one recipe: staff hours × weeks, spread over the buyer's lines. When
// a sheet does not fit it, the member types each unit price herself. Ava adds
// the lines up, checks every line has a price and asks her to approve the
// total, as for a price it built. The build-up inputs are not asked.

export { PRICE_YOURSELF_KEY, YOUR_PRICES_ASK };

export function yourPriceRef(line: PriceLine): { askId: string; fieldId: string } {
  return { askId: YOUR_PRICES_ASK, fieldId: line.id };
}

/** True when the member prices the sheet herself. */
export function pricedByYou(bid: AvaBid): boolean {
  return bid.price?.builtBy === "you";
}

/** A number the member entered or approved, or null. */
export function fieldValue(
  bid: AvaBid,
  s: BidState,
  ref: { askId: string; fieldId: string },
): number | null {
  if (!askResolved(bid, s, ref.askId)) return null;
  const direct = s.answers[ref.askId];
  const v = direct?.values?.[ref.fieldId];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

// ─── Hourly cost, built from what the member pays ───

export interface CostLine {
  id: string;
  label: string;
  perHour: number | null;
  /** Where the number came from, in plain words. */
  from: string;
  /** Still needed from the member. */
  askId?: string;
}

export interface RoleCost {
  role: PriceRole;
  pay: number | null;
  lines: CostLine[];
  /** Pay plus every line. Null while any input is missing. */
  loaded: number | null;
  /** Set when the entered pay is under the buyer's or the law's floor. */
  belowFloor: { floor: number } | null;
}

/** Amounts per hour paid as cash (health and welfare paid in the pay
 *  packet). Payroll taxes apply to them, so they join the taxable base. */
export function cashPerHour(bid: AvaBid, s: BidState): number {
  let n = 0;
  for (const b of bid.price?.burden ?? []) {
    if (b.from.kind !== "per-hour" || !b.from.cashWhen) continue;
    const a = s.answers[b.from.cashWhen.askId];
    if (a?.status === "done" && a.choiceId === b.from.cashWhen.choiceId) n += b.from.amount;
  }
  return n;
}

function burdenPerHour(bid: AvaBid, s: BidState, b: BurdenLine, pay: number | null): CostLine {
  // Percent lines apply to everything paid as wages: the pay rate plus any
  // benefit paid as cash.
  const taxable = pay === null ? null : pay + cashPerHour(bid, s);
  switch (b.from.kind) {
    case "law":
      return {
        id: b.id,
        label: b.label,
        perHour: taxable === null ? null : round2((taxable * b.from.rate) / 100),
        from: b.from.text,
      };
    case "per-hour":
      return { id: b.id, label: b.label, perHour: b.from.amount, from: b.from.text };
    case "ask": {
      const rate = fieldValue(bid, s, b.from);
      return {
        id: b.id,
        label: b.label,
        perHour: taxable === null || rate === null ? null : round2((taxable * rate) / 100),
        from: b.from.text,
        askId: rate === null ? b.from.askId : undefined,
      };
    }
  }
}

export function roleCost(bid: AvaBid, s: BidState, role: PriceRole): RoleCost {
  const pay = fieldValue(bid, s, role.pay);
  const lines = (bid.price?.burden ?? []).map((b) => burdenPerHour(bid, s, b, pay));
  const loaded =
    pay === null || lines.some((l) => l.perHour === null)
      ? null
      : round2(pay + lines.reduce((n, l) => n + (l.perHour ?? 0), 0));
  const floor = role.wageFloor?.perHour;
  return {
    role,
    pay,
    lines,
    loaded,
    belowFloor: pay !== null && floor !== undefined && pay < floor ? { floor } : null,
  };
}

/** Yearly labor cost for the whole staffing plan, or null. */
export function yearlyLabor(bid: AvaBid, s: BidState): number | null {
  const p = bid.price;
  if (!p) return null;
  let total = 0;
  for (const r of p.roles) {
    const c = roleCost(bid, s, r);
    if (c.loaded === null) return null;
    total += c.loaded * r.count * r.hoursPerWeek * p.weeks;
  }
  return round2(total);
}

/** Paid hours a week across the plan. */
export function weeklyHours(roles: { count: number; hoursPerWeek: number }[]): number {
  return roles.reduce((n, r) => n + r.count * r.hoursPerWeek, 0);
}

// ─── Other yearly costs, and which the price carries ───

export function otherCostAmount(bid: AvaBid, s: BidState, c: OtherCost): number | null {
  if (c.yearly.kind === "fixed") return c.yearly.amount;
  const from = c.yearly;
  const a = s.answers[from.askId];
  if (a?.status === "dont-have") {
    const ask = bid.asks.find((x) => x.id === from.askId);
    const opt = ask?.dontHave?.find((o) => o.id === a.optionId);
    // The stand-in has no fee (a certified check instead of a bid bond):
    // the member's own answer, not a default standing in for one.
    if (opt?.noFee) return 0;
    // Otherwise the cost comes from the stand-in's own answer, or stays unknown.
    return c.altFrom ? fieldValue(bid, s, c.altFrom) : null;
  }
  return fieldValue(bid, s, from);
}

/** Carried in the price: included by the fixture, or added by the member's fix. */
export function costInPrice(s: BidState, c: OtherCost): boolean {
  return c.inPrice || !!s.fixes[`deliver:${c.id}`];
}

/** Yearly costs the price carries as their own line: the ones Ava put in
 *  (a leased cart, a vehicle for this contract) and the ones the member added
 *  with "Add it to the price". They are spread over the lines by labor share,
 *  so the build-up shows each one instead of hiding it inside overhead. */
function addedCostsYearly(bid: AvaBid, s: BidState): number | null {
  let n = 0;
  for (const c of bid.price?.otherCosts ?? []) {
    if (costInPrice(s, c)) {
      const amt = otherCostAmount(bid, s, c);
      if (amt === null) return null;
      n += amt;
    }
  }
  return n;
}

// ─── Unit prices on the buyer's sheet ───

export interface LinePrice {
  line: PriceLine;
  labor: number | null;
  direct: number | null;
  added: number | null;
  overhead: number | null;
  /** The member's reserve for costs that run over. 0 when the bid has none. */
  contingency: number | null;
  profit: number | null;
  /** Sales tax the price must include, when the buyer's files say so. */
  tax: number | null;
  unitPrice: number | null;
  /** qty × unit price, rounded to the cent like the buyer's sheet. */
  extended: number | null;
}

export function overheadPct(bid: AvaBid, s: BidState): number | null {
  return bid.price ? fieldValue(bid, s, bid.price.overhead) : null;
}

export function profitPct(bid: AvaBid, s: BidState): number | null {
  return bid.price ? fieldValue(bid, s, bid.price.profit) : null;
}

/** The member's contingency, as a percent of cost. A bid with no contingency
 *  input carries none (0); one with the input waits for the member's answer. */
export function contingencyPct(bid: AvaBid, s: BidState): number | null {
  return bid.price?.contingency ? fieldValue(bid, s, bid.price.contingency) : 0;
}

export function linePrices(bid: AvaBid, s: BidState): LinePrice[] {
  const p = bid.price;
  if (!p) return [];
  // Priced by the member: her unit price is the price. Ava adds nothing to it.
  if (p.builtBy === "you") {
    return p.lines.map((line) => {
      const v = fieldValue(bid, s, yourPriceRef(line));
      const unitPrice = v === null ? null : round2(v);
      return {
        line,
        labor: null,
        direct: null,
        added: null,
        overhead: null,
        contingency: null,
        profit: null,
        tax: null,
        unitPrice,
        extended: unitPrice === null || line.qty === null ? null : round2(unitPrice * line.qty),
      };
    });
  }
  const labor = yearlyLabor(bid, s);
  const added = addedCostsYearly(bid, s);
  const oh = overheadPct(bid, s);
  const pr = profitPct(bid, s);
  const ct = contingencyPct(bid, s);
  const taxPct = p.tax ? fieldValue(bid, s, p.tax) : 0;
  return p.lines.map((line) => {
    const laborPer =
      labor === null || line.qty === null || line.qty <= 0
        ? null
        : (labor * line.laborShare) / line.qty;
    const direct = line.direct ? fieldValue(bid, s, line.direct) : 0;
    const addedPer =
      added === null || line.qty === null || line.qty <= 0
        ? null
        : (added * line.laborShare) / line.qty;
    const base =
      laborPer === null || direct === null || addedPer === null
        ? null
        : laborPer + direct + addedPer;
    const overhead = base === null || oh === null ? null : (base * oh) / 100;
    const contingency =
      base === null || overhead === null || ct === null ? null : ((base + overhead) * ct) / 100;
    const profit =
      base === null || overhead === null || contingency === null || pr === null
        ? null
        : ((base + overhead + contingency) * pr) / 100;
    const beforeTax =
      base === null || overhead === null || contingency === null || profit === null
        ? null
        : base + overhead + contingency + profit;
    const tax = beforeTax === null || taxPct === null ? null : (beforeTax * taxPct) / 100;
    const unitPrice = beforeTax === null || tax === null ? null : round2(beforeTax + tax);
    return {
      line,
      labor: laborPer === null ? null : round2(laborPer),
      direct: direct === null ? null : round2(direct),
      added: addedPer === null ? null : round2(addedPer),
      overhead: overhead === null ? null : round2(overhead),
      contingency: contingency === null ? null : round2(contingency),
      profit: profit === null ? null : round2(profit),
      tax: tax === null ? null : round2(tax),
      unitPrice,
      extended: unitPrice === null || line.qty === null ? null : round2(unitPrice * line.qty),
    };
  });
}

/** The sheet total, recalculated independently from quantity × unit price. */
export function sheetTotal(prices: LinePrice[]): number | null {
  if (prices.some((p) => p.extended === null)) return null;
  return round2(prices.reduce((n, p) => n + (p.extended ?? 0), 0));
}

/** Price points under "lowest ÷ yours × max", when this price is `pctAbove`
 *  percent above the lowest bid. */
export function pointsIfAbove(max: number, pctAbove: number): number {
  return Math.round((max / (1 + pctAbove / 100)) * 10) / 10;
}

// ─── Can this price deliver? ───

export interface DeliveryCheck {
  /** Null while the price is incomplete. */
  covers: boolean | null;
  /** Yearly costs the price does not carry, with their amounts (null = unknown yet). */
  notCovered: { cost: OtherCost; amount: number | null }[];
  yearlyPrice: number | null;
  yearlyCost: number | null;
}

export function deliveryCheck(bid: AvaBid, s: BidState): DeliveryCheck {
  // Ava knows her costs only when it built the price.
  if (!bid.price || pricedByYou(bid))
    return { covers: null, notCovered: [], yearlyPrice: null, yearlyCost: null };
  const prices = linePrices(bid, s);
  const total = sheetTotal(prices);
  const notCovered = bid.price.otherCosts
    .filter((c) => !costInPrice(s, c))
    .map((cost) => ({ cost, amount: otherCostAmount(bid, s, cost) }));
  if (total === null) return { covers: null, notCovered, yearlyPrice: null, yearlyCost: null };
  // Cost is what the price must pay for. Profit is the margin on top, and the
  // contingency is a reserve the price carries for costs that run over.
  const costBeforeProfit = round2(
    prices.reduce(
      (n, p) =>
        n + ((p.unitPrice ?? 0) - (p.profit ?? 0) - (p.contingency ?? 0)) * (p.line.qty ?? 0),
      0,
    ),
  );
  const missing = notCovered.reduce((n, x) => n + (x.amount ?? 0), 0);
  const yearlyCost = round2(costBeforeProfit + missing);
  return {
    covers: notCovered.length === 0,
    notCovered,
    yearlyPrice: total,
    yearlyCost,
  };
}

/** Roles paid under a floor. Warned, never blocked. */
export function wageWarnings(bid: AvaBid, s: BidState): RoleCost[] {
  if (!bid.price || pricedByYou(bid)) return [];
  return bid.price.roles.map((r) => roleCost(bid, s, r)).filter((c) => c.belowFloor);
}

/** Every input the price still needs, as ask ids (deduplicated, in order). */
export function missingPriceAsks(bid: AvaBid, s: BidState): string[] {
  const out: string[] = [];
  const need = (ref: { askId: string; fieldId: string }) => {
    if (fieldValue(bid, s, ref) === null && !out.includes(ref.askId)) out.push(ref.askId);
  };
  if (!bid.price) return out;
  if (pricedByYou(bid)) {
    for (const l of bid.price.lines) need(yourPriceRef(l));
    if (bid.price.periods) need(bid.price.periods.escalation);
    return out;
  }
  for (const r of bid.price.roles) need(r.pay);
  for (const b of bid.price.burden) if (b.from.kind === "ask") need(b.from);
  for (const l of bid.price.lines) if (l.direct) need(l.direct);
  need(bid.price.overhead);
  if (bid.price.contingency) need(bid.price.contingency);
  need(bid.price.profit);
  for (const c of bid.price.otherCosts) {
    if (costInPrice(s, c) && c.yearly.kind === "ask" && otherCostAmount(bid, s, c) === null) {
      const askId =
        s.answers[c.yearly.askId]?.status === "dont-have" && c.altFrom
          ? c.altFrom.askId
          : c.yearly.askId;
      if (!out.includes(askId)) out.push(askId);
    }
  }
  if (bid.price.tax) need(bid.price.tax);
  if (bid.price.periods) need(bid.price.periods.escalation);
  return out;
}

// ─── Every period the buyer prices ───

export interface PeriodTotal {
  index: number;
  label: string;
  total: number | null;
}

/** Year one, then each option period at the member's own yearly increase,
 *  compounded. Each line is rounded to the cent the way a sheet would be. */
export function periodTotals(bid: AvaBid, s: BidState): PeriodTotal[] {
  const prices = linePrices(bid, s);
  const base = sheetTotal(prices);
  const out: PeriodTotal[] = [{ index: 0, label: "Year one", total: base }];
  const per = bid.price?.periods;
  if (!per) return out;
  const esc = fieldValue(bid, s, per.escalation);
  for (let n = 1; n <= per.count; n++) {
    const total =
      base === null || esc === null || prices.some((p) => p.line.qty === null)
        ? null
        : round2(
            prices.reduce(
              (sum, p) =>
                sum + round2((p.unitPrice ?? 0) * Math.pow(1 + esc / 100, n)) * (p.line.qty ?? 0),
              0,
            ),
          );
    out.push({ index: n, label: `${per.label} ${n}`, total });
  }
  return out;
}

/** What the buyer evaluates: every period when there are option periods. */
export function evaluatedTotal(bid: AvaBid, s: BidState): number | null {
  const periods = periodTotals(bid, s);
  if (periods.some((p) => p.total === null)) return null;
  return round2(periods.reduce((n, p) => n + (p.total ?? 0), 0));
}

/** The total the member approves. With option periods, all of them. */
export function approvalTotal(bid: AvaBid, s: BidState): number | null {
  if (!bid.price) return null;
  return bid.price.periods ? evaluatedTotal(bid, s) : sheetTotal(linePrices(bid, s));
}

// ─── A rate list: her price per item, and no total ───

/** True when the buyer gives no quantities: every line is a rate, and the
 *  sheet has no total (build-progression.md item 1, PRD "A line with no
 *  quantity"). */
export function isRateList(bid: AvaBid): boolean {
  return !!bid.price && bid.price.lines.length > 0 && bid.price.lines.every((l) => l.qty === null);
}

/** Her rate on every line, once each has one. Null until then. What she
 *  approves on a rate list, in place of a total. */
export function rates(bid: AvaBid, s: BidState): Record<string, number> | null {
  if (!isRateList(bid)) return null;
  const out: Record<string, number> = {};
  for (const p of linePrices(bid, s)) {
    if (p.unitPrice === null) return null;
    out[p.line.id] = p.unitPrice;
  }
  return out;
}

/** True when she approved these exact rates. Any change reopens it. */
export function ratesApproved(bid: AvaBid, s: BidState): boolean {
  const now = rates(bid, s);
  const got = s.priceApproval?.rates;
  if (!now || !got) return false;
  return Object.keys(now).every((k) => Math.abs((got[k] ?? NaN) - now[k]) < 0.005);
}

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export const usd0 = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
