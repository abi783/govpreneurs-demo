// DEMO: examples for Haddad Catering, a woman-owned caterer in Fayetteville, NC.
const PICKS = [
  "Catering NC $250K–$1M",
  "Woman-owned set-asides closing in 30 days",
  "Fort Bragg dining and field meals",
  "VA patient meals I qualify for",
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
