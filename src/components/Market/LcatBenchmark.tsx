// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import { useMemo, useState } from "react";
import { Search, Info } from "lucide-react";
import {
  LCAT_RATES,
  fmtRate,
  type ExperienceTier,
  type EducationLevel,
  type LcatLocation,
} from "../../lib/mock/laborRates";
import { JargonGloss } from "../Layout/JargonGloss";
import { byMember, own } from "../../demo/member";

const copy = own(
  import.meta.glob<typeof import("../../demo/members/agency/copy")>("/src/demo/members/*/copy.tsx", { eager: true }),
);

const { LOCAL_DESIGNER_MEDIAN } = own(
  import.meta.glob<typeof import("../../demo/members/agency/market/laborRates")>("/src/demo/members/*/market/laborRates.ts", { eager: true }),
);

const EXP_OPTIONS: (ExperienceTier | "all")[] = ["all", "0–3 yrs", "3–7 yrs", "7–15 yrs", "15+ yrs"];
const EDU_OPTIONS: (EducationLevel | "all")[] = ["all", "HS", "Associate", "Bachelor", "Master", "PhD"];
// DEMO: the agency's rates are GSA ceiling rates, which are not tied to a place.
const LOC_OPTIONS: (LcatLocation | "all")[] = byMember<(LcatLocation | "all")[]>({
  pack: copy.LCAT_LOCATIONS,
  caterer: ["all", "Nationwide", "Fayetteville", "Raleigh-Durham", "Charlotte", "Norfolk"],
});

// DEMO: each member's note above the table.
const BANNER = byMember({
  pack: copy.LCAT_BANNER,
  caterer: (
    <span>
      This is for <strong>professional service contracts</strong> (people billed by the hour) —
      not how meals and catering are usually priced. Browse for context; don't use it to bid
      your jobs.
    </span>
  ),
});

export function LcatBenchmark() {
  const [q, setQ] = useState("");
  const [exp, setExp] = useState<(typeof EXP_OPTIONS)[number]>("all");
  const [edu, setEdu] = useState<(typeof EDU_OPTIONS)[number]>("all");
  const [loc, setLoc] = useState<(typeof LOC_OPTIONS)[number]>("all");

  const rows = useMemo(() => {
    const lower = q.trim().toLowerCase();
    return LCAT_RATES.filter((r) => {
      if (exp !== "all" && r.experience !== exp) return false;
      if (edu !== "all" && r.education !== edu) return false;
      if (loc !== "all" && r.location !== loc) return false;
      if (lower && !r.category.toLowerCase().includes(lower)) return false;
      return true;
    });
  }, [q, exp, edu, loc]);

  return (
    <div className="lcat-block">
      <div className="lcat-banner" role="note">
        <Info size={13} aria-hidden />
        {BANNER}
      </div>

      <div className="lcat-toolbar">
        <div className="exp-search lcat-search">
          <Search size={13} aria-hidden />
          <input
            className="exp-search-input"
            placeholder={"Search a labor category (LCAT)…"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="forecast-select" value={exp} onChange={(e) => setExp(e.target.value as ExperienceTier | "all")} aria-label="Experience">
          {EXP_OPTIONS.map((o) => (
            <option key={o} value={o}>{o === "all" ? "Any experience" : o}</option>
          ))}
        </select>
        <select className="forecast-select" value={edu} onChange={(e) => setEdu(e.target.value as EducationLevel | "all")} aria-label="Education">
          {EDU_OPTIONS.map((o) => (
            <option key={o} value={o}>{o === "all" ? "Any education" : o}</option>
          ))}
        </select>
        <select className="forecast-select" value={loc} onChange={(e) => setLoc(e.target.value as (typeof LOC_OPTIONS)[number])} aria-label="Location">
          {LOC_OPTIONS.map((o) => (
            <option key={o} value={o}>{o === "all" ? "Any location" : o}</option>
          ))}
        </select>
      </div>

      <div className="wage-table-wrap">
        <table className="wage-table lcat-table">
          <thead>
            <tr>
              <th>
                <JargonGloss term="LCAT">
                  Labor Category — a standardized role title (e.g., "Program Manager (Sr)") used to
                  price people on government service contracts.
                </JargonGloss>
              </th>
              <th>Experience</th>
              <th>Education</th>
              <th>Location</th>
              <th className="num">
                Low{" "}
                <span className="lcat-sub">
                  (
                  <JargonGloss term="fully-burdened">
                    The rate including salary plus overhead, benefits, fees, and profit — what the
                    government actually pays per hour.
                  </JargonGloss>
                  )
                </span>
              </th>
              <th className="num">Median</th>
              <th className="num">High</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.category}</td>
                <td>{r.experience}</td>
                <td>{r.education}</td>
                <td>{r.location}</td>
                <td className="num mono">{fmtRate(r.low)}</td>
                <td className="num mono lcat-median">{fmtRate(r.median)}</td>
                <td className="num mono">{fmtRate(r.high)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-3)", padding: "20px" }}>
                  No labor categories match those filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="lcat-footer">
        Aim for the <strong>median</strong>, not the extremes — contracting officers flag outliers
        automatically. Listed rates are{" "}
        <JargonGloss term="not-to-exceed">
          Ceiling rates set in the contract. Real awarded rates typically run 10–20% below the
          ceiling.
        </JargonGloss>{" "}
        ceilings.
      </p>
    </div>
  );
}
