// Small pieces the price view shares: the "?" for a number Ava does not have,
// money in mono, and the button that takes the member to the ask that
// supplies a missing number.
//
// THE RULE (concept §7, price.ts): an unknown input is never shown as 0. It is
// "?" plus the name of what Ava needs, with a way to give it.

import { CircleDashed, FileText, Sparkles } from "lucide-react";
import { askResolved, receivedAddenda } from "../../lib/ava/derive";
import { fieldValue, linePrices, usd, usd0 } from "../../lib/ava/price";
import type { BidState } from "../../lib/ava/store";
import type { AskKind, AvaBid, OtherCost } from "../../lib/ava/types";
import type { AvaView, Focus } from "./views";

export type Go = (view: AvaView, focus?: Focus) => void;

const ASK_ACTION: Record<AskKind, string> = {
  approve: "Approve it on your list",
  upload: "Upload it on your list",
  enter: "Enter it on your list",
  answer: "Answer it on your list",
};

export function askTitle(bid: AvaBid, askId: string): string {
  return bid.asks.find((a) => a.id === askId)?.title ?? "An answer from you";
}

/** A number Ava does not have yet. Never a zero. */
export function Unknown() {
  return (
    <span className="ava-p-q">
      <span aria-hidden="true">?</span>
      <span className="ava-p-sr">Not known yet</span>
    </span>
  );
}

export function Money({ n, whole }: { n: number | null; whole?: boolean }) {
  if (n === null) return <Unknown />;
  return <span className="mono">{whole ? usd0(n) : usd(n)}</span>;
}

export function pct(n: number): string {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

/** Every period the buyer prices, each with every line's unit price: the
 *  base year, then each option period at her own yearly increase,
 *  compounded and rounded to the cent like price.ts periodTotals. A period
 *  borrows the base year's quantities: the gap the build notes record. One
 *  column each, in the sheet on screen and in the file she downloads. */
export function periodColumns(
  bid: AvaBid,
  s: BidState,
): { label: string; prices: (number | null)[]; extended: (number | null)[] }[] {
  const lines = linePrices(bid, s);
  const per = bid.price?.periods;
  const base = per && /year/i.test(per.label) ? "Base year" : "Base period";
  const out = [
    {
      label: base,
      prices: lines.map((x) => x.unitPrice),
      extended: lines.map((x) => x.extended),
    },
  ];
  if (!per) return out;
  const esc = fieldValue(bid, s, per.escalation);
  const cents = (n: number) => Math.round(n * 100) / 100;
  for (let n = 1; n <= per.count; n++) {
    const prices = lines.map((x) =>
      x.unitPrice === null || esc === null ? null : cents(x.unitPrice * Math.pow(1 + esc / 100, n)),
    );
    out.push({
      label: `${per.label} ${n}`,
      prices,
      extended: prices.map((u, i) =>
        u === null || lines[i].line.qty === null ? null : cents(u * (lines[i].line.qty ?? 0)),
      ),
    });
  }
  return out;
}

/** A buyer's quantity, or "No quantity" on a rate list. */
export function qtyText(n: number | null): string {
  return n === null ? "No quantity" : n.toLocaleString("en-US");
}

/** The button to the ask that supplies a number. Names what happens there. */
export function AskLink({
  bid,
  s,
  askId,
  go,
  primary,
}: {
  bid: AvaBid;
  s: BidState;
  askId: string;
  go: Go;
  primary?: boolean;
}) {
  const ask = bid.asks.find((a) => a.id === askId);
  const done = askResolved(bid, s, askId);
  const label = done
    ? "Change it on your list"
    : ask
      ? ASK_ACTION[ask.kind]
      : "Open 2. Compliance and inputs";
  return (
    <button
      type="button"
      className={`btn ${primary ? "btn-primary" : "btn-secondary"} btn-sm`}
      onClick={() => go("list", { ask: askId })}
    >
      {label}
    </button>
  );
}

/** "Ava needs: …" with the button to that ask. */
export function NeedLine({
  bid,
  s,
  askId,
  go,
}: {
  bid: AvaBid;
  s: BidState;
  askId: string;
  go: Go;
}) {
  return (
    <span className="ava-p-need">
      <span className="ava-p-need__text">
        <CircleDashed size={13} strokeWidth={2} aria-hidden />
        <span>
          Ava needs: <strong>{askTitle(bid, askId)}</strong>
        </span>
      </span>
      <AskLink bid={bid} s={s} askId={askId} go={go} />
    </span>
  );
}

/** A number Ava is still waiting for, said quietly: no button. The one
 *  summary at the top of the price names what is missing and goes there. */
export function QuietNeed({ bid, askId }: { bid: AvaBid; askId: string }) {
  return (
    <span className="ava-p-src ava-p-src--wait">
      Not in yet. It comes from: {askTitle(bid, askId).replace(/[.\s]+$/, "")}.
    </span>
  );
}

/** Where a fixed yearly cost comes from. It is not the member's number, so it
 *  is never shown as a plain fact: a figure the buyer's files state is labeled
 *  so, and anything else is Ava's figure, for the member to check. */
export function fixedCostOrigin(c: OtherCost): "buyer" | "ava" | null {
  if (c.yearly.kind !== "fixed") return null;
  const t = c.yearly.text;
  const guessed = /\b(estimate|estimated|sample|allowance|assum\w*|guess)\b/i.test(t);
  const buyers = /\b(attachment|exhibit|section|schedule|wage determination)\b|§|the buyer/i.test(
    t,
  );
  return buyers && !guessed ? "buyer" : "ava";
}

/** The label a fixed cost carries. Ava's figure sits in Ava's own chrome. */
export function CostOrigin({ cost }: { cost: OtherCost }) {
  const origin = fixedCostOrigin(cost);
  if (origin === "buyer") {
    return (
      <span className="ava-p-origin ava-p-origin--buyer">
        <FileText size={11} strokeWidth={2} aria-hidden /> From the buyer&apos;s files
      </span>
    );
  }
  if (origin === "ava") {
    return (
      <span className="ava-p-origin ava-p-origin--ava">
        <Sparkles size={11} strokeWidth={2} aria-hidden /> Ava&apos;s figure — check the amount
      </span>
    );
  }
  return null;
}

/** The same label in words, for a line of text (the approval dialog). */
export function costOriginText(cost: OtherCost): string {
  const origin = fixedCostOrigin(cost);
  if (origin === "buyer") return " (from the buyer's files)";
  if (origin === "ava") return " (Ava's figure — check the amount)";
  return "";
}

/** Quantities an addendum changed, keyed by price line id. */
export function qtyChanges(
  fixture: AvaBid,
  bid: AvaBid,
  s: BidState,
): Record<string, { before: number | null; after: number | null; addendum: number | null }> {
  const out: Record<
    string,
    { before: number | null; after: number | null; addendum: number | null }
  > = {};
  for (const line of bid.price?.lines ?? []) {
    const before = fixture.price?.lines.find((l) => l.id === line.id)?.qty;
    if (before === undefined || before === line.qty) continue;
    let addendum: number | null = null;
    for (const a of receivedAddenda(fixture, s)) {
      if (a.changes.some((c) => c.patch.kind === "price-qty" && c.patch.lineId === line.id))
        addendum = a.number;
    }
    out[line.id] = { before, after: line.qty, addendum };
  }
  return out;
}
