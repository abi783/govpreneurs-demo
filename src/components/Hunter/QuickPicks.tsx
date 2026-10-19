import { VOCAB } from "../../demo/hunter/vocab";

// DEMO: examples true for the sample member (src/demo/members/<member>/hunter/vocab.ts).
const PICKS = VOCAB.ui.quickPicks;

export function QuickPicks({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="quick-picks">
      <span className="quick-picks-label">Try:</span>
      {PICKS.map((p) => (
        <button key={p} type="button" className="chip-quick" onClick={() => onPick(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}
