import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { HelpPopover } from "./HelpPopover";
import { AggregatedDfyModal, useDfyCandidates } from "./AggregatedDfyModal";
import { Card } from "../ui/Card";
import { FOR_YOU } from "../../demo/story/opportunities";
import { MEMBER, byMember } from "../../demo/member";
import { PERSONA } from "../../demo/story/persona";
import { FIELD_DEFS, effectiveField } from "../../demo/profile/fields";
import { useFieldOverrides } from "../../demo/profile/store";
import { useSledRegistrations } from "../../demo/profile/sled";
import { usePastPerformance } from "../../demo/profile/pastPerformance";
import type { TabSlug } from "./TabNavigation";

interface Gap {
  key: string;
  label: string;
  tab: TabSlug;
}

// DEMO: the counts and both lists are worked out from the story and the profile, so
// they change as the visitor fills in fields. Each line opens the tab that fixes it.
export function ReadinessHeader() {
  const [dfyOpen, setDfyOpen] = useState(false);
  const overrides = useFieldOverrides();
  const sled = useSledRegistrations();
  const pp = usePastPerformance();
  const candidates = useDfyCandidates();
  const showDfy = candidates.length > 0;

  // The opportunities on Hunter's "for you" list that he rates a priority or a strong fit.
  const ready = FOR_YOU.filter(
    (o) => o.closesInDays > 6 && (o.hunter.tier === "priority" || o.hunter.tier === "strong"),
  );
  const fed = ready.filter((o) => o.scope === "fed").length;
  const sledCount = ready.filter((o) => o.scope === "sled").length;

  const state = (id: string) => effectiveField(FIELD_DEFS[id], overrides).state;
  const open = sled.filter((r) => r.status !== "registered");

  const notReady: Gap[] = [];
  if (open.length > 0) {
    notReady.push({
      key: "sled",
      label: `SLED in ${open.map((r) => r.state).join(", ")} (no state vendor registration yet)`,
      tab: "sled",
    });
  }
  if (state("ein") === "missing") {
    notReady.push({ key: "ein", label: "Federal payments and invoices (your EIN is not on file)", tab: "identity" });
  }
  // DEMO: the agency's gaps from the story pack: no GSA schedule, no named PM and
  // alternate. The lists show three lines, so these come before the general ones.
  if (MEMBER === "agency" && state("vehicles") === "missing") {
    notReady.push({ key: "gsa", label: "Buys open only to GSA schedule holders (no GSA schedule yet)", tab: "capabilities" });
  }
  if (PERSONA.clearances.length === 0) {
    notReady.push({
      key: "clearance",
      label: "Bids that need cleared staff (no one on your team holds a clearance)",
      tab: "capabilities",
    });
  }

  const couldHelp: Gap[] = [];
  if (state("dsbs") === "missing") {
    couldHelp.push({ key: "dsbs", label: "a DSBS profile (so federal buyers can find you)", tab: "certifications" });
  }
  if (pp.some((e) => e.cpars === "Awaiting rating")) {
    const job = byMember({ caterer: "your Womack job", pack: "your NC Guard campaign" });
    couldHelp.push({ key: "cpars", label: `a performance rating (CPARS) for ${job}`, tab: "past-performance" });
  }
  if (MEMBER === "agency" && state("key-personnel") === "missing") {
    couldHelp.push({ key: "key-personnel", label: "your project manager and alternate (most service buys name both)", tab: "positioning" });
  }
  if (state("win-themes") === "missing") {
    couldHelp.push({ key: "win", label: "your win themes (so Ava drafts in your voice)", tab: "positioning" });
  }
  if (state("psc-codes") === "missing") {
    couldHelp.push({ key: "psc", label: "your PSC codes (another way buyers search)", tab: "capabilities" });
  }

  return (
    <Card asChild className="ui-card--readiness">
      <section>
        {/* KPI */}
        <div className="rh-kpi">
          <div className="rh-kpi-value">
            <span>{fed}</span>
            <span className="rh-kpi-unit">federal</span>
            <span className="rh-kpi-dot">·</span>
            <span>{sledCount}</span>
            <span className="rh-kpi-unit">SLED</span>
          </div>
          <div className="rh-kpi-caption">
            <span>Opportunities you're ready to bid on today</span>
            <HelpPopover label="About these counts" buttonClass="rh-help-btn" size={13}>
              Numbers refresh daily. Federal count includes opportunities where you meet all
              hard prerequisites.
            </HelpPopover>
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
              {notReady.length === 0 && <li className="rh-status-item">Nothing is blocking you.</li>}
              {notReady.slice(0, 3).map((item) => (
                <li key={item.key} className="rh-status-item">
                  <Link to="/business-profile" search={{ tab: item.tab }} className="rh-status-link">
                    {item.label}
                  </Link>
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
              {couldHelp.length === 0 && <li className="rh-status-item">Your profile is complete for matching.</li>}
              {couldHelp.slice(0, 3).map((item) => (
                <li key={item.key} className="rh-status-item">
                  <Link
                    to="/business-profile"
                    search={{ tab: item.tab }}
                    className="rh-status-link rh-status-btn"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="rh-footer">
          <Link to="/roadmap" className="rh-btn-primary">
            Open Roadmap
          </Link>
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
