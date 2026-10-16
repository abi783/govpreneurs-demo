import { AlertTriangle, Check, RotateCw, X } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import type {
  GrantFieldKey,
  GrantRecommendation,
  GrantStatus,
  GrantTake,
} from "../../lib/grantsTakeApi";

/**
 * GrantsTakeCard — the six-field Grant's Take panel on the opportunity detail
 * page. Renders the verdict chip + confidence caption (Layer 1), the six-field
 * fit matrix (Layer 2), and the next step. Saving lives in the page header
 * (the product's existing Save action); this card is the analysis, not a new
 * decision surface. Loading, "still analyzing" (null take), and error states are
 * handled here so the page never shows a broken card. See docs/bid-analyst-prd.md §6–§9.
 */

const FIELD_ORDER: { key: GrantFieldKey; label: string }[] = [
  { key: "eligibility", label: "Eligibility" },
  { key: "scope_fit", label: "Scope fit" },
  { key: "location", label: "Location" },
  { key: "contract_size", label: "Contract size" },
  { key: "proposal_readiness", label: "Proposal readiness" },
  { key: "your_edge", label: "Your edge" },
];

/** The big serif verdict word shown at the top of the take (the "Review" call). */
const CALL_LABEL: Record<GrantRecommendation, string> = {
  bid: "Bid",
  lean_bid: "Review",
  pass: "No Bid",
};

const CAPTION: Record<GrantTake["data_completeness"], string> = {
  full: "Based on the full solicitation",
  partial: "Based on partial solicitation detail",
  sparse: "Early-stage notice — limited detail available",
};

/** Grant status → the existing FitMatrix marker classes (ok | warn | bad). */
function markerClass(status: GrantStatus): "ok" | "warn" | "bad" {
  return status === "good" ? "ok" : status;
}

function MarkerIcon({ status }: { status: GrantStatus }) {
  if (status === "good") return <Check size={14} aria-label="Good" />;
  if (status === "warn") return <AlertTriangle size={14} aria-label="Caveat" />;
  return <X size={14} aria-label="Problem" />;
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="grant-verdict" aria-label="Grant's take">
      <div className="grant-verdict__head">
        <AgentAvatar agent="grant" size={32} />
        <div className="grant-verdict__label">Grant's take</div>
      </div>
      {children}
    </section>
  );
}

export function GrantsTakeCard({
  loading,
  error,
  take,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  take: GrantTake | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <CardShell>
        <p className="gt-loading-text">Grant is reading the solicitation…</p>
        <ul className="fit-matrix" aria-hidden>
          {FIELD_ORDER.map((f) => (
            <li key={f.key} className="fit-row gt-row--skeleton">
              <span className="fit-marker gt-shimmer" />
              <div className="fit-row__body">
                <div className="gt-shimmer gt-shimmer--label" />
                <div className="gt-shimmer gt-shimmer--line" />
              </div>
            </li>
          ))}
        </ul>
      </CardShell>
    );
  }

  // No score record yet, or a fetch error → compact, honest, retryable.
  if (error || !take) {
    return (
      <CardShell>
        <p className="gt-analyzing">
          {error
            ? "Grant hit a snag analyzing this one."
            : "Grant is still analyzing this one — check back shortly."}
        </p>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onRetry}>
          <RotateCw size={14} /> Try again
        </button>
      </CardShell>
    );
  }

  // TEMP FIX: show the verdict chip from Hunter's fit-only call, not Grant's
  // reconciled `recommendation`. Grant may override the verdict downward
  // (deadline/readiness), which makes this card disagree with the feed (Hunter's)
  // for the same opp. Until that Grant/Hunter divergence is resolved, we surface
  // Hunter's verdict here so the two surfaces agree. Revert to `take.recommendation`
  // once aligned. (Falls back to `recommendation` if the field is somehow absent.)
  const rec = take.hunter_verdict ?? take.recommendation;

  return (
    <CardShell>
      <div className="verdict-call-row">
        <div className="verdict-call">{CALL_LABEL[rec]}</div>
        <p className="verdict-rationale">
          {take.verdict_summary ?? CAPTION[take.data_completeness]}
        </p>
      </div>

      <ul className="fit-matrix gt-matrix" role="list">
        {FIELD_ORDER.map(({ key, label }) => {
          const field = take.fields[key];
          if (!field) return null;
          const m = markerClass(field.status);
          return (
            <li key={key} className={`fit-row fit-row--${m}`}>
              <span className={`fit-marker fit-marker--${m}`} aria-hidden>
                <MarkerIcon status={field.status} />
              </span>
              <div className="fit-row__body">
                <div className="fit-row__dimension">{label}</div>
                <div className="fit-row__line">{field.line}</div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="next-step">
        <div className="next-step__label">Next step</div>
        <div className="next-step__body">{take.next_step}</div>
      </div>
    </CardShell>
  );
}
