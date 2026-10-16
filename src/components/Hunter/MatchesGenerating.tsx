import { Sparkles } from "lucide-react";

const STAGES = [
  "Reading your business profile",
  "Scanning open opportunities",
  "Scoring each against what your business does",
  "Building your ranked list",
];

/**
 * Honest, indeterminate "Hunter is building your ranked list" state, shown
 * inline in the feed while a user's matches are being generated. No fabricated
 * counter or per-stage completion — we don't receive live stage events, so the
 * stages animate an indeterminate shimmer rather than claiming progress.
 */
export function MatchesGenerating() {
  return (
    <div className="mg" role="status" aria-live="polite">
      <div className="mg-card">
        <div className="mg-avatar" aria-hidden="true">
          <Sparkles size={18} />
        </div>
        <h2 className="mg-title">Hunter is building your ranked list</h2>
        <p className="mg-sub">This usually takes a few minutes — you don't need to stay.</p>
        <ul className="mg-stages">
          {STAGES.map((label) => (
            <li key={label} className="mg-stage">
              <span className="mg-stage-dot" aria-hidden="true" />
              <span className="mg-stage-label">{label}</span>
            </li>
          ))}
        </ul>
        <div className="mg-bar" aria-hidden="true">
          <div className="mg-bar-fill" />
        </div>
      </div>
    </div>
  );
}
