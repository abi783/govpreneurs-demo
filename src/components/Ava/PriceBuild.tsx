// The two build-up tables: the hourly cost of each role, starting from what
// the member pays, and the buyer's own sheet, line by line. Every number comes
// from price.ts. An unknown is "?" with the ask that supplies it (D-A2, D-A3).

import { useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { AvaAttr, AvaCard, SourcePin } from "./primitives";
import {
  costInPrice,
  fieldValue,
  linePrices,
  otherCostAmount,
  roleCost,
  sheetTotal,
  usd,
  usd0,
  weeklyHours,
  priceOf,
} from "../../lib/ava/price";
import { ava } from "../../lib/ava/store";
import type { BurdenLine } from "../../lib/ava/types";
import type { AvaContext } from "./useAva";
import {
  AskLink,
  CostOrigin,
  Money,
  pct,
  qtyChanges,
  qtyText,
  QuietNeed,
  Unknown,
  type Go,
} from "./PriceParts";

/** Health and welfare paid as cash is wages: payroll taxes apply to it.
 *  Says which way the member pays it, or that Ava asks. */
function CashNote({ ctx, b }: { ctx: AvaContext; b: BurdenLine }) {
  if (b.from.kind !== "per-hour" || !b.from.cashWhen) return null;
  const when = b.from.cashWhen;
  const a = ctx.s.answers[when.askId];
  if (a?.status === "done" && a.choiceId === when.choiceId) {
    return (
      <span className="ava-p-src ava-p-src__note">
        You pay it as cash, so payroll taxes apply to it. Ava counts it in every line figured on
        pay.
      </span>
    );
  }
  if (a?.status === "done") {
    return (
      <span className="ava-p-src ava-p-src__note">
        You pay it as benefits. Ava adds payroll taxes only to pay made in cash.
      </span>
    );
  }
  return (
    <span className="ava-p-src ava-p-src__note">
      If you pay it as cash, payroll taxes apply to it too. Ava asks how you pay it.
    </span>
  );
}

// ─── Hourly cost, one role at a time ───

export function HourlyCard({ ctx, go }: { ctx: AvaContext; go: Go }) {
  const { bid, s } = ctx;
  const roles = priceOf(bid).roles;
  const [roleId, setRoleId] = useState<string | undefined>(roles[0]?.id);
  const role = roles.find((r) => r.id === roleId) ?? roles[0];

  if (!role) {
    return (
      <AvaCard label="Hourly cost, starting with what you pay">
        <p className="ava-muted">
          This price has no paid roles. It comes only from the lines on the buyer&apos;s sheet
          below.
        </p>
      </AvaCard>
    );
  }

  const cost = roleCost(bid, s, role);
  // One button per missing answer: a payroll report can feed three lines.
  const firstAsk: Record<string, string> = {};
  if (cost.pay === null) firstAsk[role.pay.askId] = "pay";
  for (const l of cost.lines) if (l.askId && !(l.askId in firstAsk)) firstAsk[l.askId] = l.id;
  const payAnswer = s.answers[role.pay.askId];
  const hasWriting = bid.sections.length > 0;

  return (
    <AvaCard label="Hourly cost, starting with what you pay" className="ava-p-hourly">
      {roles.length > 1 ? (
        <div className="ava-p-roles" role="group" aria-label="Pick a role to see its hourly cost">
          {roles.map((r) => {
            const c = roleCost(bid, s, r);
            const on = r.id === role.id;
            return (
              <button
                key={r.id}
                type="button"
                className={`ava-p-roles__btn${on ? " is-on" : ""}`}
                aria-pressed={on}
                onClick={() => setRoleId(r.id)}
              >
                {r.name}
                {c.belowFloor ? (
                  <span className="ava-p-roles__warn">
                    <TriangleAlert size={12} strokeWidth={2.25} aria-hidden />
                    <span className="ava-p-sr">Pay is under the lowest wage allowed</span>
                  </span>
                ) : null}
                {c.pay === null ? (
                  <span className="ava-p-roles__q">
                    <span aria-hidden="true">?</span>
                    <span className="ava-p-sr">Pay not known yet</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <table className="ava-table ava-p-table">
        <caption className="ava-p-sr">Hourly cost for {role.name}</caption>
        <thead>
          <tr>
            <th scope="col">{role.name}</th>
            <th scope="col" className="num">
              Per hour
            </th>
            <th scope="col">Where it comes from</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className="ava-p-rowhead">
              What you pay
            </th>
            <td className="num">
              <Money n={cost.pay} />
            </td>
            <td>
              {cost.pay === null ? (
                <>
                  <QuietNeed bid={bid} askId={role.pay.askId} />
                  {role.wageFloor ? (
                    <span className="ava-p-src ava-p-src__ok">
                      Lowest wage allowed for this work:{" "}
                      <span className="mono">{usd(role.wageFloor.perHour)}</span>
                      <SourcePin bid={bid} source={role.wageFloor.source} />
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="ava-p-src">
                  {payAnswer?.fileName ? `From ${payAnswer.fileName}` : "You entered it"}
                  {role.wageFloor && !cost.belowFloor ? (
                    <span className="ava-p-src__ok">
                      <Check size={12} strokeWidth={2.25} aria-hidden /> At or above the lowest wage
                      allowed, <span className="mono">{usd(role.wageFloor.perHour)}</span>
                      <SourcePin bid={bid} source={role.wageFloor.source} />
                    </span>
                  ) : null}
                </span>
              )}
            </td>
          </tr>

          {cost.belowFloor && role.wageFloor ? (
            <tr className="ava-p-warnrow">
              <td colSpan={3}>
                <p className="ava-p-warnrow__head">
                  <TriangleAlert size={14} strokeWidth={2.25} aria-hidden />
                  <span>
                    Under the lowest wage allowed for this work:{" "}
                    <span className="mono">{usd(cost.belowFloor.floor)}</span> an hour.
                  </span>
                  <SourcePin bid={bid} source={role.wageFloor.source} />
                </p>
                <p className="ava-p-warnrow__body">
                  This is a warning only. Ava does not stop your bid. Pay under this rate can break
                  the rule quoted here.
                </p>
                <AskLink bid={bid} s={s} askId={role.pay.askId} go={go} />
              </td>
            </tr>
          ) : null}

          {cost.lines.map((l) => {
            const b = priceOf(bid).burden.find((x) => x.id === l.id);
            const src = b && b.from.kind !== "ask" ? b.from.source : undefined;
            return (
              <tr key={l.id}>
                <th scope="row" className="ava-p-rowhead">
                  {l.label}
                </th>
                <td className="num">
                  <Money n={l.perHour} />
                </td>
                <td>
                  <span className="ava-p-src">
                    {l.from}{" "}
                    {src ? (
                      <SourcePin bid={bid} source={src} claim={`${l.label}: ${l.from}`} />
                    ) : null}
                  </span>
                  {b ? <CashNote ctx={ctx} b={b} /> : null}
                  {l.askId && firstAsk[l.askId] !== l.id ? (
                    <span className="ava-p-src ava-p-src--wait">
                      Waiting for the same answer as above.
                    </span>
                  ) : l.askId ? (
                    <QuietNeed bid={bid} askId={l.askId} />
                  ) : l.perHour === null ? (
                    <span className="ava-p-src ava-p-src--wait">
                      Ava adds this once it knows what you pay.
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="ava-p-rowhead">
              Hourly cost to you
            </th>
            <td className="num ava-p-strong">
              <Money n={cost.loaded} />
            </td>
            <td className="ava-p-src">
              {cost.loaded === null
                ? "Known once every line above has a number."
                : "What you pay plus every line above. Overhead and profit come on the sheet below."}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="ava-p-plan">
        <p className="ava-p-plan__lead">
          {hasWriting
            ? "One staffing plan: the people and hours in your writing are the hours priced here."
            : "One staffing plan: these are the people and hours priced here."}
        </p>
        <ul className="ava-p-plan__list">
          {roles.map((r) => (
            <li key={r.id}>
              <span>{r.name}</span>
              <span className="mono">
                {r.count} {r.count === 1 ? "person" : "people"}, {r.hoursPerWeek} hours a week
              </span>
            </li>
          ))}
        </ul>
        <p className="ava-p-plan__sum">
          <span className="mono">{weeklyHours(roles)}</span> paid hours a week in all, for{" "}
          <span className="mono">{priceOf(bid).weeks}</span> weeks in year one.
        </p>
      </div>
    </AvaCard>
  );
}

// ─── The buyer's sheet, line by line ───

export function SheetCard({ ctx, go }: { ctx: AvaContext; go: Go }) {
  const { bid, s, fixture, id } = ctx;
  const price = priceOf(bid);
  const prices = linePrices(bid, s);
  const total = sheetTotal(prices);
  const changed = qtyChanges(fixture, bid, s);
  // Sales tax is its own column when the buyer's files say the price includes it.
  const tax = price.tax;
  const taxRate = tax ? fieldValue(bid, s, tax) : null;
  const showContingency = !!priceOf(bid).contingency;
  const carried = price.otherCosts.filter((c) => costInPrice(s, c));
  // Optional columns: other costs, contingency and sales tax.
  const columns = 9 + [carried.length !== 0, showContingency, !!tax].filter(Boolean).length;
  const showAdded = carried.length > 0;

  return (
    <AvaCard
      label="Your price, line by line"
      className="ava-p-sheet"
      aside={<AvaAttr subtitle="calculated from your answers" />}
    >
      <p className="ava-p-sheet__name">
        Ava fills the buyer&apos;s sheet. Every cost column and the unit price are per unit.
      </p>
      <div className="ava-p-scroll">
        <table className="ava-table ava-p-table ava-p-sheettable">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Unit</th>
              <th scope="col" className="num">
                Quantity
              </th>
              <th scope="col" className="num">
                Labor
              </th>
              <th scope="col" className="num">
                Direct cost
              </th>
              {showAdded ? (
                <th scope="col" className="num">
                  Other costs
                </th>
              ) : null}
              <th scope="col" className="num">
                Overhead
              </th>
              {showContingency ? (
                <th scope="col" className="num">
                  Contingency
                </th>
              ) : null}
              <th scope="col" className="num">
                Profit
              </th>
              {tax ? (
                <th scope="col" className="num">
                  Sales tax
                </th>
              ) : null}
              <th scope="col" className="num">
                Unit price
              </th>
              <th scope="col" className="num">
                Line total
              </th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => {
              const ch = changed[p.line.id];
              return (
                <tr key={p.line.id}>
                  <th scope="row" className="ava-p-rowhead">
                    {p.line.item}
                  </th>
                  <td className="ava-p-unit">{p.line.unit}</td>
                  <td className="num">
                    <span className="ava-p-qty">
                      {qtyText(p.line.qty)}
                      <SourcePin bid={bid} source={p.line.qtySource} />
                    </span>
                    {ch ? (
                      <span className="ava-p-qty__was">
                        {ch.addendum !== null
                          ? `Addendum ${ch.addendum} changed it. `
                          : "Changed. "}
                        Was <s className="mono">{qtyText(ch.before)}</s>
                      </span>
                    ) : null}
                  </td>
                  <td className="num">
                    <Money n={p.labor} />
                  </td>
                  <td className="num">
                    {p.line.direct ? (
                      <Money n={p.direct} />
                    ) : (
                      <span className="ava-p-none">None</span>
                    )}
                  </td>
                  {showAdded ? (
                    <td className="num">
                      <Money n={p.added} />
                    </td>
                  ) : null}
                  <td className="num">
                    <Money n={p.overhead} />
                  </td>
                  {showContingency ? (
                    <td className="num">
                      <Money n={p.contingency} />
                    </td>
                  ) : null}
                  <td className="num">
                    <Money n={p.profit} />
                  </td>
                  {tax ? (
                    <td className="num">
                      <Money n={p.tax} />
                    </td>
                  ) : null}
                  <td className="num ava-p-strong">
                    <Money n={p.unitPrice} />
                  </td>
                  <td className="num ava-p-strong">
                    <Money n={p.extended} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={columns - 1} className="ava-p-totalhead">
                Year one total
              </th>
              <td className="num ava-p-total">
                <Money n={total} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {total !== null ? (
        <p className="ava-p-caption">Recalculated by Ava from quantity times unit price.</p>
      ) : (
        <p className="ava-p-caption">
          <Unknown /> The total appears once the price is complete.
        </p>
      )}

      {tax ? (
        <div className="ava-p-tax" role="note">
          <p className="ava-p-tax__h">
            Sales tax <SourcePin bid={bid} source={tax.source} claim={tax.text} />
          </p>
          <p className="ava-p-tax__p">
            {tax.text.replace(/[.\s]+$/, "")}.{" "}
            {taxRate === null
              ? "Ava needs the rate from you."
              : `You entered ${pct(taxRate)}. Ava adds it to each unit price.`}{" "}
            Ava does not decide if tax applies.
          </p>
          <AskLink bid={bid} s={s} askId={tax.askId} go={go} />
        </div>
      ) : null}

      {carried.length > 0 ? <OtherCosts ctx={ctx} /> : null}

      {price.templateError ? (
        <div className="ava-p-template" role="note">
          <p className="ava-p-template__label">A question for the buyer</p>
          <p className="ava-p-template__text">
            <strong>The buyer&apos;s sheet has a formula error.</strong> {price.templateError}
          </p>
          <p className="ava-p-template__text">
            Ava&apos;s total above comes from quantity times unit price, not from the buyer&apos;s
            formula.
          </p>
          <div className="ava-actions">
            {s.fixes["template-answered"] ? (
              <>
                <span className="ava-p-template__done">
                  <Check size={13} strokeWidth={2.25} aria-hidden /> The buyer answered your
                  question.
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => ava.unfix(id, "template-answered")}
                >
                  Undo
                </button>
              </>
            ) : s.fixes["template"] ? (
              <>
                <span className="ava-p-template__done">
                  <Check size={13} strokeWidth={2.25} aria-hidden /> You told Ava you asked the
                  buyer.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => ava.fix(id, "template-answered")}
                >
                  The buyer answered
                </button>
              </>
            ) : (
              <>
                <span className="ava-muted">
                  Check lists this until you tell Ava you asked the buyer.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => go("check")}
                >
                  Go to Check
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </AvaCard>
  );
}

// ─── Other costs for this contract ───

/** The yearly costs the price carries as their own column: the ones Ava put
 *  in and the ones the member added. Each is spread over the lines by its
 *  share of the work (price.ts). */
function OtherCosts({ ctx }: { ctx: AvaContext }) {
  const { bid, s } = ctx;
  const carried = priceOf(bid).otherCosts.filter((c) => costInPrice(s, c));
  return (
    <div className="ava-p-others">
      <p className="ava-p-others__label">Other costs for this contract</p>
      <p className="ava-muted">Ava spreads each one across the lines by its share of the work.</p>
      <ul className="ava-p-others__list">
        {carried.map((c) => {
          const amt = otherCostAmount(bid, s, c);
          const noFee =
            c.yearly.kind === "ask" && s.answers[c.yearly.askId]?.status === "dont-have";
          return (
            <li key={c.id}>
              <div className="ava-p-others__row">
                <span className="ava-p-others__name">
                  {c.label}
                  {!c.inPrice ? (
                    <>
                      <span className="ava-p-others__you"> · You added it</span>
                      <button
                        type="button"
                        className="ava-linkbtn"
                        onClick={() => ava.unfix(ctx.id, `deliver:${c.id}`)}
                      >
                        Take it out of the price
                      </button>
                    </>
                  ) : null}
                </span>
                <span className="ava-p-others__amt">
                  {amt === null ? <Unknown /> : <span className="mono">{usd0(amt)} a year</span>}
                </span>
              </div>
              <p className="ava-p-others__from">
                {noFee ? "No fee. You chose another way to meet this rule." : c.yearly.text}{" "}
                <CostOrigin cost={c} />
              </p>
              {amt === null && c.yearly.kind === "ask" ? (
                <QuietNeed
                  bid={bid}
                  askId={
                    s.answers[c.yearly.askId]?.status === "dont-have" && c.altFrom
                      ? c.altFrom.askId
                      : c.yearly.askId
                  }
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
