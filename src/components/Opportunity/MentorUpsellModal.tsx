import { useState } from "react";
import { ArrowRight, CheckCircle, Crown, MessageCircle, Sparkles, XCircle } from "lucide-react";
import { Modal } from "@/components/ui";
import { UpgradePlanModal } from "../Hunter/UpgradePlanModal";
import { ELITE_PLAN } from "../../lib/plans";

interface MentorUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Number of shortlisted opportunities; defaults to 1 (single-opportunity context). */
  selectedCount?: number;
  onContinueSelfQualification: () => void;
}

/**
 * Non-Elite "Send to Mentor" upsell, ported from v1's MentorUpsellModal. Unlike
 * v1 (whose primary CTA was decorative), this opens the real upgrade →
 * checkout journey (UpgradePlanModal) instead of dead-ending.
 */
export function MentorUpsellModal({
  open,
  onOpenChange,
  selectedCount = 1,
  onContinueSelfQualification,
}: MentorUpsellModalProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      <Modal.Root open={open} onOpenChange={onOpenChange}>
        <Modal.Content className="mentor-upsell-modal" aria-describedby={undefined}>
          <Modal.Header
            title={
              <span className="mentor-upsell__title">
                <span className="mentor-upsell__crown" aria-hidden>
                  <Crown size={18} />
                </span>
                Confirm these are winnable before you write.
              </span>
            }
          />

          <Modal.Body>
            <p className="mentor-upsell__lead">
              You've shortlisted{" "}
              <strong>
                {selectedCount} {selectedCount === 1 ? "opportunity" : "opportunities"}
              </strong>
              . On the Elite plan, a GovCon mentor reviews these for compliance pitfalls,
              set-aside validity, and strategic fit—saving you 20+ hours of wasted proposal time.
            </p>

            <div className="mentor-upsell__preview">
              <div className="mentor-upsell__preview-overlay">
                <Sparkles size={26} />
                <p>Mentor Review Preview</p>
              </div>

              <div className="mentor-upsell__preview-rows">
                <div className="mentor-upsell__preview-row mentor-upsell__preview-row--ok">
                  <CheckCircle size={18} />
                  <div>
                    <p className="mentor-upsell__preview-row-title">IT Support Services - DoD</p>
                    <p className="mentor-upsell__preview-row-sub">
                      Strong fit. You meet all set-aside requirements.
                    </p>
                  </div>
                </div>
                <div className="mentor-upsell__preview-row mentor-upsell__preview-row--bad">
                  <XCircle size={18} />
                  <div>
                    <p className="mentor-upsell__preview-row-title">Cloud Migration - GSA</p>
                    <p className="mentor-upsell__preview-row-sub">
                      Missing FedRAMP certification requirement.
                    </p>
                  </div>
                </div>
                <div className="mentor-upsell__preview-row mentor-upsell__preview-row--warn">
                  <MessageCircle size={18} />
                  <div>
                    <p className="mentor-upsell__preview-row-title">Cybersecurity Assessment</p>
                    <p className="mentor-upsell__preview-row-sub">
                      Let's discuss teaming strategy for this one.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mentor-upsell__ctas">
              <button
                type="button"
                className="btn btn-primary mentor-upsell__cta"
                onClick={() => {
                  onOpenChange(false);
                  setUpgradeOpen(true);
                }}
              >
                <Crown size={16} />
                Upgrade to Unlock Mentor Review
                <ArrowRight size={16} className="mentor-upsell__cta-arrow" />
              </button>
              <p className="mentor-upsell__fineprint">
                {ELITE_PLAN.name} plan — ${ELITE_PLAN.price} {ELITE_PLAN.period.toLowerCase()}.
              </p>

              <button
                type="button"
                className="btn btn-ghost mentor-upsell__cta"
                onClick={() => {
                  onContinueSelfQualification();
                  onOpenChange(false);
                }}
              >
                Continue with Self-Qualification
              </button>
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      <UpgradePlanModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
