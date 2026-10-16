// A quiet line above the composer for the claims Hunter overheard that the
// member's capability statement refused. The capability statement is the source
// of truth, so the refusal already happened server-side — this only makes it
// visible. Deliberately NOT a chat message and not part of a turn response:
// passive extraction runs after the reply is composed, so the hint is read on
// its own, once per mount.
//
// It renders nothing when there is nothing pending, when the read fails, or once
// dismissed — the failure mode of a whisper is silence.
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  fetchProfileConflicts,
  resolveProfileConflict,
  type ConflictDecision,
  type ProfileConflictHint,
} from "../../lib/hunterChat";
import { useDismissibleHint } from "@/lib/uiState";
import { stripInvisible } from "../../lib/displayText";
import { boundedList, MAX_CONFLICT_HINTS } from "../../lib/renderLimits";

/** The passive "that doesn't match your capability statement" hint. */
export function CapabilityConflictHint() {
  const [hints, setHints] = useState<ProfileConflictHint[]>([]);
  // Fields the member said their OWN answer was right about. Tracked rather than
  // just removed, because the useful half of that decision is what we tell them
  // next: the statement still says something else, and only editing the document
  // changes what Hunter matches on.
  const [keptMine, setKeptMine] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const { dismissed, dismiss } = useDismissibleHint("capability-conflict");

  useEffect(() => {
    let active = true;
    void fetchProfileConflicts().then((pending) => {
      if (active) setHints(pending);
    });
    return () => {
      active = false;
    };
  }, []);

  /**
   * Settles one row. The row is removed only once the write has LANDED — an
   * optimistic removal would tell the member their decision was recorded when it
   * was not, and the same conflict would return later with no explanation.
   */
  async function settle(hint: ProfileConflictHint, decision: ConflictDecision) {
    setBusy(hint.field);
    const ok = await resolveProfileConflict(hint.field, hint.heardValue, decision);
    setBusy(null);
    if (!ok) return; // leave the row exactly where it is; they can try again
    setHints((current) => current.filter((h) => h.field !== hint.field));
    if (decision === "keep_mine") setKeptMine((current) => [...current, hint.field]);
  }

  if (dismissed || (hints.length === 0 && keptMine.length === 0)) return null;

  // A whisper at both ends: the server caps pending conflicts at
  // MAX_PENDING_CONFLICTS, and the component renders no more than a whisper's
  // worth whatever it is handed. The quoted value is what Hunter HEARD, so it is
  // stripped of bidi/invisible controls and isolated — a hint the member cannot
  // read in the order it was stored tells them nothing.
  const { shown } = boundedList(hints, MAX_CONFLICT_HINTS);

  return (
    <div className="hunter-conflict-hint" role="note">
      {shown.length > 0 && (
        <>
          <div className="hunter-conflict-hint__copy">
            Hunter heard something that doesn't match your capability statement, so nothing changed:
          </div>
          <ul className="hunter-conflict-hint__list">
            {shown.map((hint) => (
              <li key={hint.field}>
                <bdi>{stripInvisible(hint.label)}</bdi>: “
                <bdi>{stripInvisible(hint.heardValue)}</bdi>”
                {/* Per ROW, not per block: conflicts are keyed by field AND value,
                    so settling one must never silently clear the others. */}
                <span className="hunter-conflict-hint__actions">
                  <button
                    type="button"
                    className="hunter-conflict-hint__action"
                    disabled={busy === hint.field}
                    onClick={() => void settle(hint, "prefer_document")}
                  >
                    Go with the document
                  </button>
                  <button
                    type="button"
                    className="hunter-conflict-hint__action"
                    disabled={busy === hint.field}
                    onClick={() => void settle(hint, "keep_mine")}
                  >
                    Go with the new info
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {keptMine.length > 0 && (
        <div className="hunter-conflict-hint__guidance">
          Hunter won't raise that again — but it can't override your capability statement on its
          own. Update the document and Hunter will match you on the new details.
        </div>
      )}
      <button
        type="button"
        className="hunter-conflict-hint__dismiss"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}
