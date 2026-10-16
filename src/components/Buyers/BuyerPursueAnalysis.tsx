// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  ChevronDown,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Trophy,
} from "lucide-react";
import { VERDICT_LABEL, type GovBuyer, type PursueVerdict } from "@/lib/mock/governmentBuyers";

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function VerdictIcon({ v }: { v: PursueVerdict }) {
  if (v === "worth-it") return <CheckCircle2 size={14} />;
  if (v === "maybe") return <AlertCircle size={14} />;
  return <PauseCircle size={14} />;
}

function pctReadLabel(pct: number, strongAt: number): string {
  if (pct >= strongAt) return "strong";
  if (pct >= strongAt - 10) return "ok";
  return "weak";
}

export function BuyerPursueAnalysis({
  buyer,
  openOppsCount,
}: {
  buyer: GovBuyer;
  openOppsCount: number;
}) {
  const a = buyer.analysis;
  const years = useMemo(() => (a ? a.annualSpendByYear.map((r) => r.year) : []), [a]);

  if (!a) {
    // Light fallback: we don't have a seeded analysis. Keep the section
    // honest rather than fabricate numbers.
    return (
      <section className="cs-pursue cs-pursue--light" aria-label="Should you pursue this buyer?">
        <header className="cs-pursue-head">
          <span className="cs-pursue-eyebrow">Should you pursue this buyer?</span>
          <h3 className="cs-pursue-title">Not enough signal yet.</h3>
        </header>
        <p className="t-body-sm" style={{ color: "var(--text-2)" }}>
          We don't have a food service spend baseline for {buyer.name} in our current dataset. Use "Your
          move" below to make a low-cost intro and watch the Opportunities feed for their next post.
        </p>
      </section>
    );
  }

  return (
    <section className="cs-pursue" aria-label="Should you pursue this buyer?">
      <header className="cs-pursue-head">
        <span className="cs-pursue-eyebrow">Should you pursue this buyer?</span>
        <div className="cs-pursue-verdict-row">
          <span className={`cs-verdict cs-verdict--${a.verdict}`}>
            <VerdictIcon v={a.verdict} /> {VERDICT_LABEL[a.verdict]}
          </span>
          <p className="cs-pursue-why">{a.why}</p>
        </div>
      </header>

      <ul className="cs-pursue-facts">
        <li>
          <BarChart3 size={12} />
          <span className="cs-fact-label">Annual food service spend</span>
          <span className="cs-fact-value fr-mono">
            {a.annualSpendByYear.map((r) => formatDollars(r.trade)).join(" · ")}
          </span>
          <span className="cs-fact-sub">
            {years[0]}–{years[years.length - 1]}
          </span>
        </li>
        <li>
          <Users size={12} />
          <span className="cs-fact-label">Goes to small business</span>
          <span className="cs-fact-value fr-mono">{a.smallBizPct}%</span>
          <span className={`cs-fact-read cs-fact-read--${pctReadLabel(a.smallBizPct, 40)}`}>
            {pctReadLabel(a.smallBizPct, 40)}
          </span>
        </li>
        <li>
          <TrendingUp size={12} />
          <span className="cs-fact-label">Goes to woman-owned firms (your edge)</span>
          <span className="cs-fact-value fr-mono">{a.wosbPct}%</span>
          <span className={`cs-fact-read cs-fact-read--${pctReadLabel(a.wosbPct, 10)}`}>
            {pctReadLabel(a.wosbPct, 10)}
          </span>
        </li>
        <li>
          <Calendar size={12} />
          <span className="cs-fact-label">Seasonality</span>
          <span className="cs-fact-value">{a.seasonalityNote}</span>
        </li>
        <li>
          <Trophy size={12} />
          <span className="cs-fact-label">Open opportunities matching you</span>
          <span className="cs-fact-value fr-mono">{openOppsCount}</span>
          <span className="cs-fact-sub">see below</span>
        </li>
      </ul>

      <details className="cs-pursue-layer">
        <summary>
          What they buy &amp; how much
          <ChevronDown size={12} className="cs-pursue-chev" />
        </summary>
        <div className="cs-pursue-layer-body">
          <table className="cs-spend-table">
            <thead>
              <tr>
                <th>Category</th>
                {years.map((y) => (
                  <th key={y}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.spendBreakdown.map((row) => {
                const maxAmt = Math.max(...row.byYear.map((c) => c.amount));
                return (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    {row.byYear.map((c) => (
                      <td key={c.year}>
                        <div className="cs-spend-cell">
                          <div
                            className="cs-spend-bar"
                            style={{ width: `${Math.max(8, (c.amount / maxAmt) * 100)}%` }}
                          />
                          <span className="fr-mono">{formatDollars(c.amount)}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="cs-pursue-foot">Same buyer, last 3 fiscal years. Sample analysis.</p>
        </div>
      </details>

      <details className="cs-pursue-layer">
        <summary>
          Who usually wins
          <ChevronDown size={12} className="cs-pursue-chev" />
        </summary>
        <div className="cs-pursue-layer-body">
          <ul className="cs-awardee-list">
            {a.topAwardees.map((w) => (
              <li key={w.company}>
                <span className="cs-awardee-name">{w.company}</span>
                <span className="cs-awardee-meta">
                  <span className="fr-mono">{w.awardsCount}</span> {w.awardsCount === 1 ? "award" : "awards"} ·{" "}
                  <span className="fr-mono">{formatDollars(w.totalDollars)}</span>
                </span>
                <Link
                  to="/partners"
                  search={{ view: "find", q: w.company } as never}
                  className="cs-awardee-link"
                >
                  Teaming →
                </Link>
              </li>
            ))}
          </ul>
          <p className="cs-pursue-foot">
            Cross-references the Awarded tab — see the Partners directory for outreach.
          </p>
        </div>
      </details>
    </section>
  );
}
