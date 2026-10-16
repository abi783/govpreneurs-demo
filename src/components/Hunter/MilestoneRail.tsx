// The A→D progress rail shown while the enrichment journey is active. Presentational
// only — it renders the `rail` the backend supplies (status + label per milestone),
// never computing milestone order itself. The current step gets federal-blue
// emphasis (progress chrome), done steps a solid positive fill, upcoming stay muted.
// A plain-language caption ("Step n of N — {label}") anchors the visual.
//
// With `onJump` the steps become NAVIGATION: clicking one revisits that milestone
// (the server re-offers its fields, pre-filled). Without it the rail is the plain
// progress chrome it has always been — and stays `aria-hidden`, since decorative
// letters carry nothing the caption does not already say. Interactive letters are
// NOT hidden: a control screen readers cannot reach is a defect, so each one gets
// its milestone label as its accessible name.
import type { Milestone, MilestoneRailItem } from "../../lib/enrichment";

const ALPHABET_SIZE = 26;
const LETTER_A = 65;

/** The step letter for position `i`: A…Z, then AA, AB… — a spreadsheet column.
 *  `String.fromCharCode(65 + i)` ran off the end of the alphabet at step 27 and
 *  rendered `[`, `\`, `]`, `^` as milestone labels; `rail` is server-supplied and
 *  its length was never checked against the alphabet. */
export function stepLetter(i: number): string {
  let n = i;
  let letters = "";
  do {
    letters = String.fromCharCode(LETTER_A + (n % ALPHABET_SIZE)) + letters;
    n = Math.floor(n / ALPHABET_SIZE) - 1;
  } while (n >= 0);
  return letters;
}

/** One step: a static letter, or a button that revisits that milestone. Both
 *  carry `__chip`, so the two forms are the same pill — the step is a chip on
 *  the connector line whether or not it is live. */
function RailStep({
  item,
  letter,
  onJump,
}: {
  item: MilestoneRailItem;
  letter: string;
  onJump?: (milestone: Milestone) => void;
}) {
  return (
    <li
      className={`hunter-enrich-rail__step is-${item.status}`}
      data-testid={`rail-step-${item.milestone}`}
    >
      {onJump ? (
        <button
          type="button"
          className="hunter-enrich-rail__chip hunter-enrich-rail__jump"
          // Already here — nothing to go back to, so the control says so rather
          // than firing a re-entry that changes nothing.
          disabled={item.status === "active"}
          aria-label={`Go to ${item.label}`}
          title={`Go to ${item.label}`}
          onClick={() => onJump(item.milestone)}
        >
          {letter}
        </button>
      ) : (
        <span className="hunter-enrich-rail__chip">{letter}</span>
      )}
    </li>
  );
}

/** Renders the four-milestone progress rail from the backend rail rows. */
export function MilestoneRail({
  rail,
  onJump,
}: {
  rail: MilestoneRailItem[];
  /** Revisit a milestone. Omitted → the rail is read-only progress chrome. */
  onJump?: (milestone: Milestone) => void;
}) {
  if (rail.length === 0) return null;
  const activeIdx = rail.findIndex((r) => r.status === "active");
  // A journey sitting at a checkpoint has no "active" row — fall back to the last done.
  const currentIdx =
    activeIdx >= 0 ? activeIdx : rail.filter((r) => r.status === "done").length - 1;
  const current = rail[Math.max(0, currentIdx)];
  return (
    <div
      className="hunter-enrich-rail"
      role="group"
      aria-label={`Enrichment step ${currentIdx + 1} of ${rail.length} — ${current?.label ?? ""}`}
    >
      <ol className="hunter-enrich-rail__steps" aria-hidden={onJump ? undefined : true}>
        {rail.map((r, i) => (
          <RailStep key={r.milestone} item={r} letter={stepLetter(i)} onJump={onJump} />
        ))}
      </ol>
      <span className="hunter-enrich-rail__caption">
        Step {currentIdx + 1} of {rail.length} — {current?.label}
      </span>
    </div>
  );
}
