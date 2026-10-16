import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  fetchPipeline,
  PIPELINE_STAGES,
  removeFromPipeline,
  setPipelineStage,
  STAGE_LABEL,
  STAGE_NEXT_ACTION,
  STAGE_TERM,
  type PipelineEntry,
  type PipelineStage,
} from "../../lib/partnersApi";

/**
 * "My partners" — the outreach list the member works through, persisted.
 *
 * Grouped by stage rather than listed flat, because the question a member asks here
 * is "where do I stand with each?", not "who did I save?". Empty stages are hidden:
 * six always-visible headings with nothing under them reads as failure.
 */
export function MyPartnersView({ onSwitchToFind }: { onSwitchToFind: () => void }) {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Last move, so a mis-tap is never a dead end (D6). Cleared as soon as another
   *  move happens or undo is used — "for one beat", not indefinitely. */
  const [lastMove, setLastMove] = useState<{ awardeeKey: number; from: PipelineStage } | null>(
    null,
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPipeline(ctrl.signal)
      .then(setEntries)
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load your list.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  /** Optimistic, with rollback — a dropdown that waits on a round trip feels broken.
   *  Records `lastMove` on success so an in-place Undo can appear for one beat (D6). */
  const move = async (awardeeKey: number, from: PipelineStage, stage: PipelineStage) => {
    const before = entries;
    setEntries((prev) => prev.map((e) => (e.awardeeKey === awardeeKey ? { ...e, stage } : e)));
    try {
      await setPipelineStage(awardeeKey, stage);
      setLastMove({ awardeeKey, from });
    } catch {
      setEntries(before);
    }
  };

  /** Reverses the last move by issuing the opposite PATCH — does not re-arm undo. */
  const undo = async (awardeeKey: number, from: PipelineStage) => {
    const before = entries;
    setLastMove(null);
    setEntries((prev) => prev.map((e) => (e.awardeeKey === awardeeKey ? { ...e, stage: from } : e)));
    try {
      await setPipelineStage(awardeeKey, from);
    } catch {
      setEntries(before);
    }
  };

  const drop = async (awardeeKey: number) => {
    const before = entries;
    setEntries((prev) => prev.filter((e) => e.awardeeKey !== awardeeKey));
    try {
      await removeFromPipeline(awardeeKey);
    } catch {
      setEntries(before);
    }
  };

  if (loading) return <p className="awards-note">Loading your list…</p>;

  if (error) {
    return (
      <div className="card card-padded">
        <p className="t-body-sm">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="card card-padded">
        <h2 className="t-heading">Your list is empty</h2>
        <p className="t-body-sm">
          Save a company from Find partners and it shows up here, so you can keep track of where you
          stand with each one.
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={onSwitchToFind}>
          Find partners
        </button>
      </div>
    );
  }

  // A BOARD, not a filtered list: every stage renders whether or not it holds
  // anything, so a member can see the whole journey and where they are in it. That
  // is the opposite of the old rule (hide empties) and it is deliberate — on a
  // board the empty columns ARE the information, because they show what is ahead.
  return (
    <div className="kanban" role="list" aria-label="Your partner pipeline">
      {PIPELINE_STAGES.map((stage, stageIndex) => {
        const inStage = entries.filter((e) => e.stage === stage);
        const isWon = stage === "worked_together";
        return (
          <section
            key={stage}
            className={`kanban__col${isWon ? " is-won" : ""}`}
            role="listitem"
          >
            <h2 className="kanban__head">
              <span className="kanban__step">{stageIndex + 1}</span>
              <span className="kanban__name">{STAGE_LABEL[stage]}</span>
              <span className="kanban__count">{inStage.length}</span>
              {/* The government's word, small, underneath — never the label she
                  reads first. Same pattern the profile uses on jobs_done. */}
              {STAGE_TERM[stage] && <span className="kanban__term">{STAGE_TERM[stage]}</span>}
            </h2>
            <div className="kanban__cards">
              {inStage.length === 0 ? (
                <p className="kanban__empty">Nothing here yet</p>
              ) : (
                inStage.map((e) => {
                  const undoable = lastMove?.awardeeKey === e.awardeeKey;
                  const next = STAGE_NEXT_ACTION[stage];
                  return (
                    <article key={e.awardeeKey} className="kanban-card">
                      {/* Opens the same drawer the feed uses — same route+search shape
                          as FindPartnersView/PrimeDetailPanel's company links. Only the
                          name is a link (not the whole card): the move/remove buttons
                          below must keep working without a nav underneath them. */}
                      <Link
                        to="/partners"
                        search={{ view: "find", company: String(e.awardeeKey) } as never}
                        className="kanban-card__name"
                      >
                        {e.companyName}
                      </Link>
                      <span className="kanban-card__source">{e.sourceTag}</span>
                      <div className="kanban-card__actions">
                        {/* Arrows, not a dropdown: a board moves left-to-right, and one
                          tap beats opening a select and finding the next label. The
                          ends disable rather than wrap — there is nothing before
                          "Saved" and nothing after "Working together". Movement is
                          NOT forced forward: a real relationship goes backwards, and
                          a pipeline that refuses to record that stops being used. */}
                        <button
                          type="button"
                          className="kanban-card__move"
                          disabled={stageIndex === 0}
                          aria-label={`Move ${e.companyName} back to ${
                            STAGE_LABEL[PIPELINE_STAGES[stageIndex - 1]] ?? ""
                          }`}
                          onClick={() => move(e.awardeeKey, stage, PIPELINE_STAGES[stageIndex - 1])}
                        >
                          <ChevronLeft size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="kanban-card__move"
                          disabled={stageIndex === PIPELINE_STAGES.length - 1}
                          // Says the destination and the next real event, in her words
                          // — with eight columns a bare direction is not enough (D6).
                          aria-label={
                            next
                              ? `${next}. Moves ${e.companyName} to ${
                                  STAGE_LABEL[PIPELINE_STAGES[stageIndex + 1]] ?? ""
                                }.`
                              : `Move ${e.companyName} on to ${
                                  STAGE_LABEL[PIPELINE_STAGES[stageIndex + 1]] ?? ""
                                }`
                          }
                          onClick={() => move(e.awardeeKey, stage, PIPELINE_STAGES[stageIndex + 1])}
                        >
                          <ChevronRight size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="kanban-card__drop"
                          aria-label={`Remove ${e.companyName}`}
                          onClick={() => drop(e.awardeeKey)}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                      {undoable && lastMove && (
                        <button
                          type="button"
                          className="kcard__undo"
                          onClick={() => undo(lastMove.awardeeKey, lastMove.from)}
                        >
                          Undo
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
