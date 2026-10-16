const PICKS = [
  "Roofing NC $250K–$1M",
  "SDVOSB set-asides closing in 30 days",
  "Fort Bragg roofing & envelope work",
  "VA roof replacements I qualify for",
  "Partner opportunities — local NC primes",
];

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
