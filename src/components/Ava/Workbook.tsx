// The price sheet, as the buyer's own Excel file (ava-two-phase.html 6.1,
// decision D31): lettered columns, numbered rows, the formula bar and the
// sheet tabs. The cells Ava filled are amber with an underline; the buyer's
// own formulas stay, so the totals add up the buyer's way. A tapped cell
// shows its formula in the bar. An empty price cell is a hole.
//
// Option periods get a column each, before she approves (review panel, 7
// October 2026): what she approves is what the sheet shows. Until she
// approves her staffing plan there is no price at all (design 6.5).

import { useState } from "react";
import { InlineHole } from "../ds/AgentWorkspace";
import { buyerWord, staffingOpen } from "../../lib/ava/flow";
import {
  approvalTotal,
  isRateList,
  linePrices,
  priceOf,
  usd,
  YOUR_PRICES_ASK,
} from "../../lib/ava/price";
import type { AvaContext } from "./useAva";
import { periodColumns } from "./PriceParts";
import { SourcePin, fileName } from "./primitives";

const LETTERS = "ABCDEFGHIJKLMNOP";
const WAITS = "Waits on your staffing plan";

export function Workbook({
  ctx,
  holeOn,
  onHole,
}: {
  ctx: AvaContext;
  holeOn?: string | null;
  onHole: (key: string) => void;
}) {
  const { bid, s } = ctx;
  const p = priceOf(bid);
  const prices = linePrices(bid, s);
  const periods = periodColumns(bid, s);
  // One column per period; a bid with no option periods has one.
  const many = periods.length !== 1;
  const waits = staffingOpen(bid, s);
  const total = waits ? null : approvalTotal(bid, s);
  const first = 5;
  const totalRow = first + prices.length + 1;
  const [cell, setCell] = useState<{ ref: string; f: string } | null>(null);
  const yours = p.builtBy === "you";
  const holeKey = (askId?: string) => `ask:${yours ? YOUR_PRICES_ASK : (askId ?? "")}`;
  const totalLabel = isRateList(bid)
    ? "No total: the buyer gives no quantities."
    : many
      ? `Total of every period (${periods.length})`
      : "Total";

  /** A price cell: the price, or a hole saying what it waits on. */
  const priceCell = (x: (typeof prices)[number], v: number | null, i: number) => {
    if (waits)
      return i === 0 ? (
        <InlineHole
          on={holeOn === "staffing"}
          label={`Needs you: ${WAITS.toLowerCase()}`}
          onOpen={() => onHole("staffing")}
        >
          {WAITS}
        </InlineHole>
      ) : null;
    if (v !== null) return usd(v);
    return i === 0 ? (
      <InlineHole
        on={holeOn === holeKey(x.line.direct?.askId)}
        label={`Needs you: the price of ${x.line.item}`}
        onOpen={() => onHole(holeKey(x.line.direct?.askId))}
      >
        {yours ? "Type your price" : "Waits on your costs"}
      </InlineHole>
    ) : (
      ""
    );
  };

  // The Excel look only for the buyer's own Excel file (D31). A price form
  // that is a page is shown as a page.
  if (!/\.xlsx?$/i.test(fileName(bid, p.sheetFileId))) {
    return (
      <div className="ava2-sheet">
        <h4 className="ava2-sheet__h">{p.sheetName}</h4>
        <table className="ava2-pt">
          <thead>
            <tr>
              <th scope="col">Line</th>
              <th scope="col">Item</th>
              <th scope="col">Unit</th>
              <th scope="col" className="num">
                Quantity
              </th>
              {periods.map((pd) => (
                <th key={pd.label} scope="col" className="num">
                  {many ? `${pd.label}, unit price` : "Unit price"}
                </th>
              ))}
              {!many ? (
                <th scope="col" className="num">
                  Extended price
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {prices.map((x, i) => (
              <tr key={x.line.id}>
                <td>{i + 1}</td>
                <td>{x.line.item}</td>
                <td>{x.line.unit}</td>
                <td className="num mono">
                  {x.line.qty === null ? "" : x.line.qty.toLocaleString("en-US")}
                </td>
                {periods.map((pd, k) => (
                  <td key={pd.label} className="num mono">
                    {k === 0 && pd.prices[i] !== null && !waits ? (
                      <span className="ava2-fld__v--yours">{usd(pd.prices[i]!)}</span>
                    ) : (
                      priceCell(x, pd.prices[i], k)
                    )}
                  </td>
                ))}
                {!many ? (
                  <td className="num mono">
                    {x.extended === null || waits ? "" : usd(x.extended)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4 + periods.length - (many ? 1 : 0)}>{totalLabel}</td>
              <td className="num mono">{total === null ? "" : usd(total)}</td>
            </tr>
          </tfoot>
        </table>
        {many ? <PeriodNote ctx={ctx} /> : null}
        <p className="ds-show__note">
          {p.contractType}{" "}
          <SourcePin bid={bid} source={p.contractTypeSource} claim={p.contractType} />
        </p>
      </div>
    );
  }

  // The Excel grid: A Line, B Description, C Unit, D Qty, then a unit price
  // and an extended price for each period, then the total.
  const cols = 4 + periods.length * 2;
  const letters = LETTERS.slice(0, cols).split("");
  const unitCol = (k: number) => letters[4 + k * 2];
  const extCol = (k: number) => letters[5 + k * 2];
  const sumFormula = periods
    .map((_, k) => `SUM(${extCol(k)}${first}:${extCol(k)}${first + prices.length - 1})`)
    .join("+");

  return (
    <div className="ava2-wb">
      <div className="ava2-wb__name">
        <b>{p.sheetName}</b> · the {buyerWord(bid)}'s Excel file
        <span className="mono">{fileName(bid, p.sheetFileId)}</span>
      </div>
      <div className="ava2-wb__sheet">
        <div className="ava2-wb__bar">
          <span className="ava2-wb__ref mono">{cell?.ref ?? "A1"}</span>
          <span className="ava2-wb__fx">fx</span>
          <span className="mono">{cell?.f ?? `${bid.buyer} · ${bid.bidNumber}`}</span>
        </div>
        <div className="ava2-wb__scroll">
          <table className="ava2-wb__grid">
            <thead>
              <tr>
                <th aria-hidden />
                {letters.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">1</th>
                <td colSpan={cols} className="is-head">
                  {bid.buyer} · {bid.bidNumber}
                </td>
              </tr>
              <tr>
                <th scope="row">2</th>
                <td colSpan={cols} className="is-head">
                  {p.sheetName}
                </td>
              </tr>
              <tr>
                <th scope="row">3</th>
                <td colSpan={cols} />
              </tr>
              <tr className="is-cols">
                <th scope="row">4</th>
                <td>Line</td>
                <td>Description</td>
                <td>Unit</td>
                <td className="num">Qty a year</td>
                {periods.flatMap((pd) => [
                  <td key={`${pd.label}-u`} className="num">
                    {many ? `${pd.label}, unit price` : "Unit price"}
                  </td>,
                  <td key={`${pd.label}-x`} className="num">
                    {many ? `${pd.label}, extended` : "Extended price"}
                  </td>,
                ])}
              </tr>
              {prices.map((x, i) => {
                const r = first + i;
                return (
                  <tr key={x.line.id}>
                    <th scope="row">{r}</th>
                    <td>{i + 1}</td>
                    <td>{x.line.item}</td>
                    <td>{x.line.unit}</td>
                    <td className="num mono">
                      {x.line.qty === null ? "" : x.line.qty.toLocaleString("en-US")}
                    </td>
                    {periods.flatMap((pd, k) => {
                      const v = waits ? null : pd.prices[i];
                      const ext = waits ? null : pd.extended[i];
                      return [
                        <td
                          key={`${pd.label}-u`}
                          className={`num mono${v !== null ? " is-ava" : ""}`}
                          onClick={() =>
                            setCell({ ref: `${unitCol(k)}${r}`, f: v === null ? "" : String(v) })
                          }
                        >
                          {priceCell(x, v, k)}
                        </td>,
                        <td
                          key={`${pd.label}-x`}
                          className="num mono"
                          onClick={() =>
                            setCell({ ref: `${extCol(k)}${r}`, f: `=D${r}*${unitCol(k)}${r}` })
                          }
                        >
                          {ext === null ? "" : usd(ext)}
                        </td>,
                      ];
                    })}
                  </tr>
                );
              })}
              <tr>
                <th scope="row">{totalRow - 1}</th>
                <td colSpan={cols} />
              </tr>
              <tr className="is-total">
                <th scope="row">{totalRow}</th>
                <td />
                <td colSpan={cols - 2}>
                  {isRateList(bid)
                    ? totalLabel
                    : many
                      ? `Total evaluated price, every period (${periods.length})`
                      : "Total evaluated price"}
                </td>
                <td
                  className="num mono"
                  onClick={() =>
                    setCell({
                      ref: `${extCol(periods.length - 1)}${totalRow}`,
                      f: `=${sumFormula}`,
                    })
                  }
                >
                  {total === null ? "" : usd(total)}
                </td>
              </tr>
              <tr>
                <th scope="row">{totalRow + 1}</th>
                <td colSpan={cols} />
              </tr>
              <tr>
                <th scope="row">{totalRow + 2}</th>
                <td />
                <td>Offeror</td>
                <td colSpan={cols - 2} className="is-ava">
                  {bid.samLegalName}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="ava2-wb__tabs">
          <span className="is-on">{p.sheetName.split(",")[0]}</span>
          <span>Instructions</span>
        </div>
      </div>
      {waits ? (
        <p className="ds-show__note">
          There is no price yet. I build it once you approve your staffing plan.
        </p>
      ) : (
        <p className="ds-show__note">
          Ava filled the amber cells. The {buyerWord(bid)}'s own formulas add them up. Tap a total
          to see its formula.
        </p>
      )}
      {many ? <PeriodNote ctx={ctx} /> : null}
      <p className="ds-show__note">
        {p.contractType}{" "}
        <SourcePin bid={bid} source={p.contractTypeSource} claim={p.contractType} />
      </p>
    </div>
  );
}

/** Where the option periods' prices come from, with the buyer's words. */
function PeriodNote({ ctx }: { ctx: AvaContext }) {
  const per = ctx.bid.price?.periods;
  if (!per) return null;
  return (
    <p className="ds-show__note">
      Each {per.label.toLowerCase()} uses your yearly price rise on the year-one price.{" "}
      <SourcePin
        bid={ctx.bid}
        source={per.source}
        claim={`Price each ${per.label.toLowerCase()}.`}
      />
    </p>
  );
}
