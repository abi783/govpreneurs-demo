import type { GrantVerdict } from "../../lib/mock/grantAnalysis";
import { FitMatrix } from "./FitMatrix";
import { AgentAvatar } from "../Companion/AgentAvatar";

export function VerdictHero({
  verdict,
  onCiteClick,
}: {
  verdict: GrantVerdict;
  onCiteClick: (anchor: string) => void;
}) {
  const tierClass =
    verdict.winTier === "Open" ? "tier--open" :
    verdict.winTier === "Competitive" ? "tier--competitive" : "tier--longshot";

  return (
    <section className="grant-verdict" aria-label="Grant's verdict">
      <div className="grant-verdict__head">
        <AgentAvatar agent="grant" size={32} />
        <div className="grant-verdict__label">Grant's take</div>
      </div>

      <div className="verdict-call-row">
        <div className="verdict-call">{verdict.call}</div>
        <p className="verdict-rationale">{verdict.rationale}</p>
      </div>

      <div className={`win-tier-pill ${tierClass}`}>
        <span className="win-tier-pill__label">Win odds: {verdict.winTier}</span>
        <span className="win-tier-pill__reason">— {verdict.winTierReason}</span>
      </div>

      <div className="grant-verdict__subhead">The fit matrix</div>
      <FitMatrix rows={verdict.fitMatrix} onCiteClick={onCiteClick} />

      <div className="next-step">
        <div className="next-step__label">Next step</div>
        <div className="next-step__body">{verdict.nextStep}</div>
      </div>

      {verdict.uncertainty && (
        <div className="uncertainty-note">
          <span className="uncertainty-note__label">Where I'm less sure:</span> {verdict.uncertainty}
        </div>
      )}
    </section>
  );
}
