import { useState } from "react";
import { AlertTriangle, ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { hasAnyDfy } from "../../lib/mock/businessProfile";
import { AggregatedDfyModal } from "./AggregatedDfyModal";
import { useProfileMode } from "./BusinessProfileMode";
import { Card } from "../ui/Card";
import { useGhlUser } from "../../lib/ghlUser";
import { roadmapUrl } from "../../lib/preview";

// Hardcoded per H2 Step 5 anti-hallucination guard.
const NOT_READY_DEFAULT = [
  "SDVOSB set-asides (need certification document)",
  "SLED in VA, SC, GA (no state vendor registration yet)",
];
const COULD_HELP_DEFAULT = [
  "a capability statement (improves match across the board)",
  "a DSBS profile (so federal buyers can find you)",
];

const NOT_READY_COLD = [
  "SDVOSB set-asides (need cert document)",
  "SLED in NC, VA, SC, GA (no state registrations)",
];
const COULD_HELP_COLD = [
  "your target value range",
  "your set-aside appetite",
  "a capability statement",
];

export function ReadinessHeader() {
  const [dfyOpen, setDfyOpen] = useState(false);
  const showDfy = hasAnyDfy();
  const mode = useProfileMode();
  const { session } = useGhlUser();
  const locationId = session?.locationId;
  const NOT_READY = mode === "onboarding" ? NOT_READY_COLD : NOT_READY_DEFAULT;
  const COULD_HELP = mode === "onboarding" ? COULD_HELP_COLD : COULD_HELP_DEFAULT;

  return (
    <Card asChild className="ui-card--readiness">
      <section>
        {/* KPI */}
        <div className="rh-kpi">
          <div className="rh-kpi-value">
            <span>247</span>
            <span className="rh-kpi-unit">federal</span>
            <span className="rh-kpi-dot">·</span>
            <span>0</span>
            <span className="rh-kpi-unit">SLED</span>
          </div>
          <div className="rh-kpi-caption">
            <span>Opportunities you're ready to bid on today</span>
            <Tooltip.Provider delayDuration={150}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button type="button" className="rh-help-btn" aria-label="About these counts">
                    <HelpCircle size={13} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="rh-tooltip" side="top" sideOffset={6}>
                    Numbers refresh daily. Federal count includes opportunities where you meet all
                    hard prerequisites.
                    <Tooltip.Arrow className="rh-tooltip-arrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>

        {/* Two-column status grid */}
        <div className="rh-status-grid">
          <div className="rh-status-col" aria-labelledby="rh-blocked-title">
            <div className="rh-status-head rh-status-head--blocked">
              <AlertTriangle size={14} aria-hidden />
              <span id="rh-blocked-title">Not ready yet</span>
            </div>
            <ul className="rh-status-list">
              {NOT_READY.map((item) => (
                <li key={item} className="rh-status-item">
                  {locationId ? (
                    <a
                      href={roadmapUrl(locationId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rh-status-link"
                    >
                      {item}
                    </a>
                  ) : (
                    <span className="rh-status-link">{item}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rh-status-col" aria-labelledby="rh-improve-title">
            <div className="rh-status-head rh-status-head--improve">
              <Sparkles size={14} aria-hidden />
              <span id="rh-improve-title">Could match better with</span>
            </div>
            <ul className="rh-status-list">
              {COULD_HELP.map((item) => (
                <li key={item} className="rh-status-item">
                  <button
                    type="button"
                    className="rh-status-link rh-status-btn"
                    onClick={() => console.log("readiness gap clicked:", item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="rh-footer">
          {locationId && (
            <a
              href={roadmapUrl(locationId)}
              target="_blank"
              rel="noopener noreferrer"
              className="rh-btn-primary"
            >
              Open Roadmap
            </a>
          )}
          {showDfy && (
            <button
              type="button"
              className="rh-btn-secondary"
              onClick={() => setDfyOpen(true)}
            >
              Resolve gaps with our services
              <ArrowRight size={14} aria-hidden />
            </button>
          )}
        </div>

        <AggregatedDfyModal open={dfyOpen} onOpenChange={setDfyOpen} />
      </section>
    </Card>
  );
}
