import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { LeadGate } from "@/components/Tools/LeadGate";
import { useToolsAnalytics } from "@/lib/tools/analytics";
import type { LeadPayload, NaicsStat } from "@/lib/tools/api";

interface LockedSection {
  eyebrow: string;
  bars: number; // how many placeholder bars, and their widths below
}

// Fixed list of every gated section a snapshot can ever carry — used both to
// render the blurred placeholder stack (so it never collapses to nothing when
// the real fields are gated to null/[]) and to compute the "N more findings"
// count. Includes the two sections that used to be a free teaser
// (medianOffers, sizeBands) now that the backend gates them too.
const LOCKED_SECTIONS: LockedSection[] = [
  { eyebrow: "How crowded it is", bars: 1 },
  { eyebrow: "Do small firms win here?", bars: 3 },
  { eyebrow: "The sweet spot", bars: 3 },
  { eyebrow: "Direction", bars: 3 },
  { eyebrow: "When agencies buy", bars: 4 },
  { eyebrow: "How open the market is", bars: 1 },
];

/** Number of gated market-findings sections — the scorecard's "N market
 *  findings" copy uses this so the two pages never drift out of sync. */
export const LOCKED_SECTIONS_COUNT = LOCKED_SECTIONS.length;

// Fixed decorative widths — never derived from real data, since these bars
// must never leak a value before unlock.
const PLACEHOLDER_WIDTHS = [72, 45, 88, 60];

function LockedBar({ width }: { width: number }) {
  return (
    <div>
      <div style={{ height: 14, width: `${width}%`, background: "var(--n-4)", borderRadius: 4 }} />
      <div
        style={{
          marginTop: 6,
          height: 8,
          borderRadius: "var(--r-pill)",
          background: "var(--n-3)",
          width: "100%",
        }}
      />
    </div>
  );
}

/** Thin brand-blue progress bar + "Your ... is N% revealed" label, shared by
 *  SnapshotTeaser and the scorecard route (which computes its own % and
 *  wording — "report", not "snapshot"). */
export function GateProgress({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="tool-gate-progress">
      <span className="tool-gate-progress__bar">
        <span className="tool-gate-progress__fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="t-body-sm tool-gate-progress__label">{label}</span>
    </div>
  );
}

/** Bare blurred placeholder stack — no gate, no findings line. Shared by
 *  SnapshotTeaser and the scorecard route (which needs its own copy/order
 *  around it but the same visual peek). Pass `showBadge={false}` when a
 *  single lock pill already sits elsewhere on the page. */
export function LockedStack({
  onHit,
  showBadge = true,
}: {
  onHit?: () => void;
  showBadge?: boolean;
}) {
  return (
    <div className="tool-locked-stack">
      <button
        type="button"
        className="tool-locked-stack__hit"
        onClick={onHit}
        aria-label="Unlock the full report with your email"
        disabled={!onHit}
      >
        <div className="tool-locked-stack__content" aria-hidden>
          {LOCKED_SECTIONS.map((section) => (
            <Card key={section.eyebrow}>
              <Card.Body>
                <div className="t-label" style={{ color: "var(--n-8)" }}>
                  {section.eyebrow}
                </div>
                <div
                  style={{
                    marginTop: "var(--s-3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--s-3)",
                  }}
                >
                  {Array.from({ length: section.bars }).map((_, i) => (
                    <LockedBar key={i} width={PLACEHOLDER_WIDTHS[i % PLACEHOLDER_WIDTHS.length]} />
                  ))}
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
        <div className="tool-locked-stack__fade" />
        {showBadge && (
          <div className="tool-locked-stack__badge">
            <Lock size={14} aria-hidden />
            <span>Unlocks with your email</span>
          </div>
        )}
      </button>
    </div>
  );
}

interface SnapshotTeaserProps {
  stat: NaicsStat;
  source: LeadPayload["source"];
  context: Omit<LeadPayload, "source" | "consent">;
  onUnlocked: () => void;
  /** Ref forwarded to the gate card wrapper, so a soft-ask bar can scroll to it. */
  gateContainerRef?: React.RefObject<HTMLDivElement | null>;
}

// "Revealed" is visible sections over total sections: the headline card
// (StatHeadline) always shows 4 — code/title, award count, median award
// value, open count — plus however many of LOCKED_SECTIONS are still hidden.
const VISIBLE_HEADLINE_SECTIONS = 4;
const TOTAL_SECTIONS = VISIBLE_HEADLINE_SECTIONS + LOCKED_SECTIONS.length;
export const REVEALED_PCT = Math.round((VISIBLE_HEADLINE_SECTIONS / TOTAL_SECTIONS) * 100);

export function SnapshotTeaser({
  stat,
  source,
  context,
  onUnlocked,
  gateContainerRef,
}: SnapshotTeaserProps) {
  const ownGateRef = useRef<HTMLDivElement>(null);
  const gateRef = gateContainerRef ?? ownGateRef;
  const track = useToolsAnalytics();

  // Reveal the headline first, then slide the gate card in ~400ms later —
  // a beat of "here's your answer" before the ask. Respects
  // prefers-reduced-motion via the CSS transition itself (see tools-gate.css).
  const [gateVisible, setGateVisible] = useState(false);
  useEffect(() => {
    setGateVisible(false);
    const t = setTimeout(() => setGateVisible(true), 400);
    return () => clearTimeout(t);
  }, [stat.code]);

  const focusGate = () => {
    track("tools_teaser_clicked", { tool: source });
    gateRef.current?.querySelector("input")?.focus();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-4)",
        marginTop: "var(--s-4)",
      }}
    >
      <p className="t-body tool-findings-line">
        <strong>{LOCKED_SECTIONS.length} more findings</strong> for {stat.code} are ready.
      </p>

      {/* The ask sits directly under the tease; the blurred stack below is
          the peek at what the email unlocks, not something to scroll past. */}
      <div ref={gateRef} className={`tool-gate-reveal${gateVisible ? " is-visible" : ""}`}>
        <GateProgress pct={REVEALED_PCT} label={`Your snapshot is ${REVEALED_PCT}% revealed`} />
        <LeadGate source={source} context={context} onUnlocked={onUnlocked} />
      </div>

      <LockedStack onHit={focusGate} />
    </div>
  );
}
