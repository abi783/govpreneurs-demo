import { Link } from "@tanstack/react-router";
import { ExternalLink, MapPin } from "lucide-react";
import {
  PREVAILING_WAGES_CUMBERLAND_NC,
  PREVAILING_WAGE_META,
  COMPARABLE_ROOFING_AWARDS,
  fmtRate,
  fmtMoney,
} from "../../lib/mock/laborRates";
import { JargonGloss } from "../Layout/JargonGloss";

export function PrevailingWageTable() {
  return (
    <section className="wage-section">
      <header className="wage-head">
        <h2 className="t-display-sm">Your wage floor (Cumberland County, NC)</h2>
        <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: 700 }}>
          The{" "}
          <JargonGloss term="Davis-Bacon prevailing wage">
            By law, federal construction contracts over $2,000 must pay at least the local prevailing
            wage set by the U.S. Department of Labor.
          </JargonGloss>{" "}
          rates below are the <em>minimum</em> you can pay on a federal roofing job here. You can pay
          more — you can't pay less.
        </p>
        <div className="wage-meta">
          <span><MapPin size={11} aria-hidden /> {PREVAILING_WAGE_META.county}</span>
          <span className="veh-sep" aria-hidden>·</span>
          <span className="mono">{PREVAILING_WAGE_META.determination}</span>
          <span className="veh-sep" aria-hidden>·</span>
          <span>Effective {PREVAILING_WAGE_META.effectiveDate}</span>
        </div>
      </header>

      <div className="wage-table-wrap">
        <table className="wage-table">
          <thead>
            <tr>
              <th>Trade</th>
              <th className="num">Base / hr</th>
              <th className="num">
                <JargonGloss term="Fringe">
                  Additional hourly amount for benefits (health, pension, vacation). You can pay it as
                  benefits or as added cash wage.
                </JargonGloss>{" "}
                / hr
              </th>
              <th className="num">Total / hr</th>
            </tr>
          </thead>
          <tbody>
            {PREVAILING_WAGES_CUMBERLAND_NC.map((w) => (
              <tr key={w.trade}>
                <td>
                  <div>{w.trade}</div>
                  {w.notes ? <div className="wage-notes">{w.notes}</div> : null}
                </td>
                <td className="num mono">{fmtRate(w.baseHourly)}</td>
                <td className="num mono">{fmtRate(w.fringeHourly)}</td>
                <td className="num mono wage-total">{fmtRate(w.baseHourly + w.fringeHourly)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="wage-compare">
        <h3 className="t-body-md" style={{ fontWeight: 600 }}>What similar jobs actually awarded for</h3>
        <p className="t-body-sm" style={{ color: "var(--text-2)", marginTop: "var(--s-1)" }}>
          Wage floors are the bottom; here's where comparable NC roofing jobs landed on total price.
        </p>
        <ul className="wage-compare-list">
          {COMPARABLE_ROOFING_AWARDS.map((c) => (
            <li key={c.contractId} className="wage-compare-row">
              <div className="wage-compare-main">
                <Link
                  to="/opportunities/awarded/$contractId"
                  params={{ contractId: c.contractId }}
                  className="wage-compare-title"
                >
                  {c.title} <ExternalLink size={11} aria-hidden />
                </Link>
                <div className="wage-compare-sub">
                  {c.agency} · {c.location}
                  {c.squareFootage ? ` · ${c.squareFootage}` : ""}
                </div>
              </div>
              <div className="wage-compare-figs">
                <div className="mono wage-compare-total">{fmtMoney(c.awardValue)}</div>
                {c.pricePerSqFt ? (
                  <div className="mono wage-compare-psf">${c.pricePerSqFt.toFixed(2)}/sq ft</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
