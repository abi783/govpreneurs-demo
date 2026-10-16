import { useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Crown, Lock } from "lucide-react";
import { UpgradePlanModal } from "./UpgradePlanModal";

interface PilotUpsellGateProps {
  /**
   * When true, `children` render normally. When false (Pilot plan), the page is
   * blurred and non-interactive behind an "Upgrade to Expert" upsell panel that
   * opens the plan-selection journey — mirroring the v1 pilot upsell.
   */
  unlocked: boolean;
  children: ReactNode;
}

const BENEFITS = [
  "Hunter matches every federal and state/local (SLED) opportunity to your profile",
  "AI fit scoring & compliance gap analysis",
  "Save, track and send opportunities to a mentor",
];

/**
 * Full-page Pilot gate for the Opportunities feed. Blurs the feed and floats
 * the Expert-plan upsell; the CTA opens the upgrade → checkout → confirm flow.
 */
export function PilotUpsellGate({ unlocked, children }: PilotUpsellGateProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (unlocked) return <>{children}</>;

  return (
    <div className="pilot-gate">
      <div className="pilot-gate__content" aria-hidden="true">
        {children}
      </div>

      <div
        className="pilot-gate__overlay"
        role="dialog"
        aria-label="Upgrade to unlock opportunities"
      >
        <div className="pilot-upsell">
          <span className="pilot-upsell__badge">
            <Crown size={12} /> Expert plan
          </span>
          <div className="pilot-upsell__lock" aria-hidden>
            <Lock size={20} strokeWidth={2} />
          </div>
          <h2 className="pilot-upsell__title">Unlock opportunity discovery</h2>
          <p className="pilot-upsell__lead">
            Opportunity matching is an Expert-plan feature. Upgrade to let Hunter surface the
            contracts you're most likely to win.
          </p>

          <ul className="pilot-upsell__benefits">
            {BENEFITS.map((b) => (
              <li key={b}>
                <Check size={14} /> {b}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="btn btn-primary pilot-upsell__cta"
            onClick={() => setUpgradeOpen(true)}
          >
            <Crown size={15} /> Upgrade to Expert
            <ArrowUpRight size={15} />
          </button>
          <p className="pilot-upsell__foot">Unlock AI matching on every opportunity</p>
        </div>
      </div>

      <UpgradePlanModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
