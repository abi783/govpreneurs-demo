// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import { Link } from "@tanstack/react-router";
import { ExternalLink, MapPin } from "lucide-react";
import {
  PREVAILING_WAGES_CUMBERLAND_NC,
  PREVAILING_WAGE_META,
  COMPARABLE_FOOD_AWARDS,
  fmtRate,
  fmtMoney,
} from "../../lib/mock/laborRates";
import { JargonGloss } from "../Layout/JargonGloss";
import { byMember } from "../../demo/member";

// DEMO: each member's words. The agency's determination is real; the caterer's is sample.
const COPY = byMember({
  pack: {
    floor: "you can pay staff in these titles on a federal service contract here. You can pay more — you can't pay less. From the current Department of Labor determination.",
    compare: "Wage floors are the bottom; here's where comparable NC advertising jobs landed on total price.",
  },
  caterer: {
    floor: "you can pay on a federal food service contract here. You can pay more — you can't pay less. These are sample figures.",
    compare: "Wage floors are the bottom; here's where comparable NC food service jobs landed on total price.",
  },
});

export function PrevailingWageTable() {
  return (
    <section className="wage-section">
      <header className="wage-head">
        <h2 className="t-display-sm">Your wage floor (Cumberland County, NC)</h2>
        <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: 700 }}>
          The{" "}
          <JargonGloss term="Service Contract Act wage determination">
            By law, federal service contracts over $2,500 must pay at least the local wage set by the
            U.S. Department of Labor for each job title.
          </JargonGloss>{" "}
          rates below are the <em>minimum</em> {COPY.floor}
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
              <th>Job title</th>
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
          {COPY.compare}
        </p>
        <ul className="wage-compare-list">
          {COMPARABLE_FOOD_AWARDS.map((c) => (
            <li key={c.awardId} className="wage-compare-row">
              <div className="wage-compare-main">
                <Link
                  to="/awards/$awardId"
                  params={{ awardId: c.awardId }}
                  className="wage-compare-title"
                >
                  {c.title} <ExternalLink size={11} aria-hidden />
                </Link>
                <div className="wage-compare-sub">
                  {c.agency} · {c.location}
                </div>
              </div>
              <div className="wage-compare-figs">
                <div className="mono wage-compare-total">{fmtMoney(c.awardValue)}</div>
                <div className="wage-compare-psf">{c.unitNote}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
