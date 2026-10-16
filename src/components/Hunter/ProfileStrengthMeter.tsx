// A quiet profile-strength meter: leads with a tier WORD ("just started" → "sharp"),
// count trails. Segmented (discrete) fill, not a smooth bar — matches how the rail's
// answered/total maps to steps. One calm neutral encoding at every level (no alarm
// state) — this is progress chrome, not an AI-authored surface. Strength is derived
// from the real backend rail, never a fabricated completeness figure.
import { deriveStrength, type MilestoneRailItem } from "../../lib/enrichment";

/** Renders the segmented profile-strength meter derived from the milestone rail. */
export function ProfileStrengthMeter({ rail }: { rail: MilestoneRailItem[] }) {
  const s = deriveStrength(rail);
  return (
    <div
      className="hunter-enrich-strength"
      role="group"
      aria-label={`Profile strength: ${s.label}`}
    >
      <span className="hunter-enrich-strength__label">Profile strength</span>
      <span className="hunter-enrich-strength__segs" aria-hidden>
        {Array.from({ length: s.of }).map((_, i) => (
          <span key={i} className={`hunter-enrich-strength__seg${i < s.level ? " is-on" : ""}`} />
        ))}
      </span>
      <span className="hunter-enrich-strength__val">
        {s.label} · {s.level} of {s.of}
      </span>
    </div>
  );
}
