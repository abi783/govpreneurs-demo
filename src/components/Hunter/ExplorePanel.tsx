import { Card } from "../ui/Card";

type Mode = "stretches" | "adjacent" | "broaden";

const MODES: Array<{ mode: Mode; count: string; label: string; desc: string }> = [
  {
    mode: "stretches",
    count: "137",
    label: "Stretches",
    desc: "Fit your profile, but you'd need a partner, certification, or capacity stretch.",
  },
  {
    mode: "adjacent",
    count: "84",
    label: "Adjacent ideas",
    desc: "Different scope than your usual, but skills transfer.",
  },
  {
    mode: "broaden",
    count: "56",
    label: "Broaden criteria",
    desc: "Outside your stated location, size, or timing.",
  },
];

export function ExplorePanel({ onSelectMode }: { onSelectMode?: (mode: Mode) => void }) {
  return (
    <div className="explore-panel">
      <div className="explore-panel-head">
        <h3 className="explore-panel-title">Explore beyond strong matches</h3>
        <p className="explore-panel-sub">Hunter found these in adjacent areas</p>
      </div>
      <div className="explore-panel-grid">
        {MODES.map((m) => (
          <Card key={m.mode} asChild interactive className="ui-card--explore-mode">
            <button type="button" onClick={() => onSelectMode?.(m.mode)}>
              <div className="explore-mode-count">{m.count}</div>
              <div className="explore-mode-label">{m.label}</div>
              <div className="explore-mode-desc">{m.desc}</div>
            </button>
          </Card>
        ))}
      </div>
      <div className="explore-panel-foot">
        <button
          type="button"
          className="explore-ask-link"
          onClick={() => console.log("Ask Hunter")}
        >
          Or just ask Hunter what you want →
        </button>
      </div>
    </div>
  );
}
