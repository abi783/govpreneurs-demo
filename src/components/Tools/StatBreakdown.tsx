import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { NaicsStat, SetAsideKey, SizeBandKey } from "@/lib/tools/api";
import { downloadSnapshotPdf } from "@/lib/tools/snapshotPdf";
import { useToolsAnalytics } from "@/lib/tools/analytics";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

// Aggregates only: agencies, states, set-aside mix, size bands, fiscal-year
// and quarter breakdowns are all counted over award records. Individual
// postings/awards/firm names are never listed here (HigherGov-sourced rows
// stay server-side); the open-postings COUNT lives on the headline card.
interface StatBreakdownProps {
  stat: NaicsStat;
}

const SET_ASIDE_LABELS: Record<SetAsideKey, string> = {
  "8a": "8(a)",
  sdvosb: "SDVOSB",
  wosb: "WOSB/EDWOSB",
  hubzone: "HUBZone",
  sb: "Small business set-aside",
  none: "Full and open",
  other: "Other",
};

export const SIZE_BAND_LABELS: Record<SizeBandKey, string> = {
  under25k: "Under $25K",
  "25k-250k": "$25K–$250K",
  over250k: "Over $250K",
};

const QUARTER_LABELS: Record<number, string> = {
  1: "Oct–Dec",
  2: "Jan–Mar",
  3: "Apr–Jun",
  4: "Jul–Sep",
};

export function crowdTakeaway(medianOffers: number): string {
  if (medianOffers <= 2) return "Thin competition";
  if (medianOffers <= 5) return "Normal field";
  return "Crowded";
}

function concentrationTakeaway(top5Share: number): string {
  const pct = top5Share * 100;
  if (pct <= 25) return "Wide open";
  if (pct <= 50) return "Some incumbents";
  return "Concentrated";
}

/** Horizontal bar: label + value on top, an 8px filled track below. */
export function Bar({
  label,
  valueText,
  share,
  highlight,
}: {
  label: string;
  valueText: string;
  share: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        className="t-body-sm"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--s-2)",
          fontWeight: highlight ? 700 : 400,
        }}
      >
        <span>{label}</span>
        <span className="tool-mono">{valueText}</span>
      </div>
      <div
        style={{
          marginTop: 4,
          height: 8,
          borderRadius: "var(--r-pill)",
          background: "var(--n-3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(1, share)) * 100}%`,
            background: "var(--blue-5)",
            borderRadius: "var(--r-pill)",
          }}
        />
      </div>
    </div>
  );
}

export function Section({
  eyebrow,
  takeaway,
  children,
}: {
  eyebrow: string;
  takeaway: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <Card.Body>
        <div className="t-label" style={{ color: "var(--n-8)" }}>
          {eyebrow}
        </div>
        <p className="t-body" style={{ marginTop: 4 }}>
          {takeaway}
        </p>
        {children && <div style={{ marginTop: "var(--s-3)" }}>{children}</div>}
      </Card.Body>
    </Card>
  );
}

export function StatBreakdown({ stat }: StatBreakdownProps) {
  const hasAgencies = stat.topAgencies.length > 0;
  const hasStates = stat.topStates.length > 0;
  const track = useToolsAnalytics();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-4)",
        marginTop: "var(--s-4)",
      }}
    >
      <div className="tool-snapshot-head">
        <h2 className="t-heading">Market snapshot</h2>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            track("tools_pdf_downloaded", { naics: stat.code });
            void downloadSnapshotPdf(stat);
          }}
        >
          <Download size={14} aria-hidden /> Download snapshot (PDF)
        </button>
      </div>

      {/* 1. How crowded it is */}
      {stat.medianOffers != null && (
        <Section
          eyebrow="How crowded it is"
          takeaway={`${crowdTakeaway(stat.medianOffers)} — ${stat.medianOffers} bidders per award, typically.`}
        >
          <div className="tool-mono t-display-lg" style={{ fontVariantNumeric: "tabular-nums" }}>
            {stat.medianOffers}
          </div>
        </Section>
      )}

      {/* 2. Do small firms win here? */}
      {stat.setAsideMix && stat.setAsideMix.length > 0 && (
        <Section
          eyebrow="Do small firms win here?"
          takeaway={`${Math.round(
            stat.setAsideMix.filter((m) => m.key !== "none").reduce((sum, m) => sum + m.share, 0) *
              100,
          )}% of dollars went to set-asides.`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {stat.setAsideMix.map((m, i) => (
              <Bar
                key={m.key}
                label={SET_ASIDE_LABELS[m.key] ?? m.key}
                valueText={`${Math.round(m.share * 100)}%`}
                share={m.share}
                highlight={i === 0 && m.key !== "none"}
              />
            ))}
          </div>
        </Section>
      )}

      {/* 3. The sweet spot */}
      {stat.sizeBands && stat.sizeBands.length > 0 && (
        <Section
          eyebrow="The sweet spot"
          takeaway={(() => {
            const largest = stat.sizeBands.reduce((a, b) => (b.share > a.share ? b : a));
            return `Most awards here are ${
              largest.key === "under25k"
                ? "under $25K — micro-purchase territory"
                : SIZE_BAND_LABELS[largest.key]
            }.`;
          })()}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {stat.sizeBands.map((b) => (
              <Bar
                key={b.key}
                label={SIZE_BAND_LABELS[b.key] ?? b.key}
                valueText={`${Math.round(b.share * 100)}%`}
                share={b.share}
              />
            ))}
          </div>
        </Section>
      )}

      {/* 4. Direction */}
      {stat.byFiscalYear && stat.byFiscalYear.length > 0 && (
        <Section
          eyebrow="Direction"
          takeaway={(() => {
            // The last entry is the current, partial fiscal year ("so far"),
            // so year-over-year compares the two most recent COMPLETE years.
            const full = stat.byFiscalYear!.slice(0, -1);
            const last = full[full.length - 1];
            const prev = full.length > 1 ? full[full.length - 2] : null;
            if (!last || !prev || prev.obligated <= 0) return "Not enough history yet.";
            const pct = Math.round(((last.obligated - prev.obligated) / prev.obligated) * 100);
            const span = `FY${prev.fy} to FY${last.fy}`;
            if (pct > 5) return `Up ${pct}% from ${span}.`;
            if (pct < -5) return `Down ${Math.abs(pct)}% from ${span}.`;
            return `Flat from ${span}.`;
          })()}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${stat.byFiscalYear.length}, 1fr)`,
              gap: "var(--s-3)",
            }}
          >
            {stat.byFiscalYear.map((f, i) => {
              const max = Math.max(...stat.byFiscalYear!.map((x) => x.obligated), 1);
              const isCurrent = i === stat.byFiscalYear!.length - 1;
              return (
                <div key={f.fy}>
                  <div className="t-body-sm" style={{ fontWeight: 600 }}>
                    FY{f.fy}
                    {isCurrent ? " (so far)" : ""}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      height: 8,
                      borderRadius: "var(--r-pill)",
                      background: "var(--n-3)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(f.obligated / max) * 100}%`,
                        background: "var(--blue-5)",
                        borderRadius: "var(--r-pill)",
                      }}
                    />
                  </div>
                  <div
                    className="tool-mono t-caption"
                    style={{ marginTop: 4, color: "var(--n-8)" }}
                  >
                    {compactUsd.format(f.obligated)} · {f.count.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* 5. When agencies buy */}
      {stat.byQuarter && stat.byQuarter.length > 0 && (
        <Section
          eyebrow="When agencies buy"
          takeaway={(() => {
            const peak = stat.byQuarter!.reduce((a, b) => (b.share > a.share ? b : a));
            return `Most awards land ${QUARTER_LABELS[peak.q]} — the fiscal year-end rush.`;
          })()}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s-3)" }}
          >
            {stat.byQuarter.map((q) => {
              const max = Math.max(...stat.byQuarter!.map((x) => x.share), 0.0001);
              return (
                <div key={q.q}>
                  <div className="t-body-sm" style={{ fontWeight: 600 }}>
                    {QUARTER_LABELS[q.q]}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      height: 8,
                      borderRadius: "var(--r-pill)",
                      background: "var(--n-3)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(q.share / max) * 100}%`,
                        background: "var(--blue-5)",
                        borderRadius: "var(--r-pill)",
                      }}
                    />
                  </div>
                  <div
                    className="tool-mono t-caption"
                    style={{ marginTop: 4, color: "var(--n-8)" }}
                  >
                    {Math.round(q.share * 100)}%
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* 6. How open the market is */}
      {stat.top5Share != null && (
        <Section
          eyebrow="How open the market is"
          takeaway={`${concentrationTakeaway(stat.top5Share)} — top 5 firms hold ${Math.round(
            stat.top5Share * 100,
          )}% of dollars.`}
        >
          <div
            style={{
              height: 8,
              borderRadius: "var(--r-pill)",
              background: "var(--n-3)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(stat.top5Share * 100)}%`,
                background: "var(--blue-5)",
                borderRadius: "var(--r-pill)",
              }}
            />
          </div>
        </Section>
      )}

      {/* 7. Who buys, and where */}
      {(hasAgencies || hasStates) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: hasAgencies && hasStates ? "1fr 1fr" : "1fr",
            gap: "var(--s-4)",
          }}
          className="tool-breakdown-grid"
        >
          {hasAgencies && (
            <Card>
              <Card.Body>
                <div className="t-label" style={{ marginBottom: "var(--s-2)" }}>
                  Top buying agencies
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
                  {stat.topAgencies.map((a) => (
                    <li
                      key={a.name}
                      className="t-body-sm"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "var(--s-2)",
                      }}
                    >
                      <span
                        style={{
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.name}
                      </span>
                      <span className="tool-mono" style={{ color: "var(--n-8)", flexShrink: 0 }}>
                        {a.count.toLocaleString()} · {compactUsd.format(a.obligated)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}

          {hasStates && (
            <Card>
              <Card.Body>
                <div className="t-label" style={{ marginBottom: "var(--s-2)" }}>
                  Top states
                </div>
                <ul style={{ display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
                  {stat.topStates.map((s) => (
                    <li
                      key={s.state}
                      className="t-body-sm"
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>{s.state}</span>
                      <span className="tool-mono" style={{ color: "var(--n-8)" }}>
                        {s.count.toLocaleString()} awards
                      </span>
                    </li>
                  ))}
                </ul>
              </Card.Body>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
