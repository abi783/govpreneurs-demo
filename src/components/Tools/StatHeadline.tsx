import { Card } from "@/components/ui/Card";
import type { NaicsStat } from "@/lib/tools/api";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

interface StatHeadlineProps {
  stat: NaicsStat;
  /** Overrides the third mini-stat's label + value, e.g. scorecard's "open in your code". */
  openLine?: string;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="t-label" style={{ color: "var(--n-8)" }}>
        {label}
      </div>
      <div className="tool-mono t-body" style={{ fontWeight: 600, marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

export function StatHeadline({ stat, openLine }: StatHeadlineProps) {
  const years = stat.fiscalYears;
  const yearRange =
    years.length > 0
      ? years.length === 1
        ? `FY${years[0]}`
        : `FY${Math.min(...years)}–FY${Math.max(...years)}`
      : null;

  return (
    <Card>
      <Card.Body>
        <div className="tool-mono t-label" style={{ color: "var(--n-8)" }}>
          NAICS {stat.code} · {stat.title}
        </div>
        <div
          className="t-display-lg"
          style={{
            marginTop: "var(--s-1)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {compactUsd.format(stat.obligated)} awarded{yearRange ? ` ${yearRange}` : ""}
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--s-6)",
            marginTop: "var(--s-4)",
            paddingTop: "var(--s-4)",
            borderTop: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <MiniStat label="Awards" value={stat.awardCount.toLocaleString()} />
          <MiniStat
            label="Median"
            value={stat.medianValue != null ? compactUsd.format(stat.medianValue) : "n/a"}
          />
          <MiniStat label={openLine ?? "Open now"} value={stat.openOppCount.toLocaleString()} />
        </div>
      </Card.Body>
    </Card>
  );
}
