import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MapPin, Trash2, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  fetchPartnerCompany,
  fetchPartners,
  fetchPipeline,
  removeFromPipeline,
  setPipelineStage,
  type PipelineEntry,
  type PipelineStage,
  type PrimeCandidate,
} from "../../lib/partnersApi";
import { PrimeDetailPanel } from "./PrimeDetailPanel";
import { stateName } from "../../lib/vocab/usStates";
import { hydrateJourneys, useJourney } from "../../lib/state/partnerJourney";
import { SavedStep, VendorStep } from "./journey/BasicSteps";
import { PursuingStep } from "./journey/PursuingStep";
import { WorkingStep } from "./journey/WorkingStep";
import { FinishedStep } from "./journey/FinishedStep";
import type { StepProps } from "./journey/types";

/**
 * "My partners" — the outreach list the member works through, as a board.
 *
 * Five columns, not the eight stored stages. The backend keeps Ernie's eight
 * stages unchanged. Each column holds one or more of them, and a move into a
 * column writes that column's `moveTo` stage. So this is a UI change only.
 */
interface BoardColumn {
  id: string;
  label: string;
  /** The government's word, shown small under the label. */
  term?: string;
  /** The stored stages that this column shows. */
  stages: PipelineStage[];
  /** The stage that a card gets when it moves into this column. */
  moveTo: PipelineStage;
  /** The next step that the card shows in this column. */
  Step: (props: StepProps) => ReactNode;
}

const BOARD: BoardColumn[] = [
  { id: "saved", label: "Saved", stages: ["saved"], moveTo: "saved", Step: SavedStep },
  {
    id: "pursuing",
    label: "Pursuing",
    stages: ["researching", "contacted", "following_up"],
    moveTo: "researching",
    Step: PursuingStep,
  },
  {
    id: "vendor",
    label: "On their vendor list",
    term: "Qualified",
    stages: ["on_their_bench", "teaming"],
    moveTo: "on_their_bench",
    Step: VendorStep,
  },
  {
    id: "working",
    label: "Working together",
    stages: ["active_partner"],
    moveTo: "active_partner",
    Step: WorkingStep,
  },
  {
    id: "finished",
    label: "Finished a job for them",
    term: "Past performance",
    stages: ["worked_together"],
    moveTo: "worked_together",
    Step: FinishedStep,
  },
];

const columnOf = (stage: PipelineStage): number =>
  Math.max(
    0,
    BOARD.findIndex((c) => c.stages.includes(stage)),
  );

/** The board column a stage shows in, e.g. "Pursuing". Find partners names it in its confirm. */
export const boardColumnLabel = (stage: PipelineStage): string => BOARD[columnOf(stage)].label;

/** "Fort Bragg, North Carolina" — the place they work most. Null when unknown. */
function mainPlace(p: PrimeCandidate): string | null {
  const city = p.geography.topCitiesByCount[0]?.city;
  const state = p.geography.statesPerformed[0];
  if (!state) return null;
  if (!city) return stateName(state);
  const title = city
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return `${title}, ${stateName(state)}`;
}

export function MyPartnersView({
  onSwitchToFind,
  profileReady,
}: {
  onSwitchToFind: () => void;
  /** False when My Business lacks what we need to find partners. */
  profileReady: boolean;
}) {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [companies, setCompanies] = useState<Map<number, PrimeCandidate>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The company window opens here, on the board. She does not leave My partners.
  const [openKey, setOpenKey] = useState<number | null>(null);
  // The save button in the window removes the company. On the board it always asks first.
  const [confirmDrop, setConfirmDrop] = useState<PipelineEntry | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  // Where the card was on the board when it was removed, so focus can move to its neighbour.
  const droppedAt = useRef(-1);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPipeline(ctrl.signal)
      .then((list) => {
        void hydrateJourneys(list);
        setEntries(list);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        console.warn("my partners load failed", err);
        setError("Could not load your list.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    // The facts on each card come from the ranked feed. If it fails, the cards
    // show the name only.
    fetchPartners(ctrl.signal)
      .then((feed) =>
        setCompanies((prev) => {
          const next = new Map(prev);
          for (const p of [...feed.partners, ...(feed.hidden ?? [])]) next.set(p.awardeeKey, p);
          return next;
        }),
      )
      .catch(() => undefined);
    return () => ctrl.abort();
  }, []);

  // A company saved from Awards may not be in her ranked feed. Look each one up by key,
  // so its card still has a place and a website.
  const lookedUp = useRef(new Set<number>());
  useEffect(() => {
    if (loading) return;
    const ctrl = new AbortController();
    for (const e of entries) {
      if (companies.has(e.awardeeKey) || lookedUp.current.has(e.awardeeKey)) continue;
      lookedUp.current.add(e.awardeeKey);
      fetchPartnerCompany(e.awardeeKey, ctrl.signal)
        .then((r) => {
          if (r) setCompanies((prev) => new Map(prev).set(r.company.awardeeKey, r.company));
        })
        .catch(() => undefined);
    }
    return () => ctrl.abort();
  }, [entries, companies, loading]);

  // When the window closes, focus goes back to the name that opened it.
  const closeWindow = () => {
    const key = openKey;
    setOpenKey(null);
    if (key === null) return;
    // Radix returns focus after its own close, so wait one beat.
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-board-key="${key}"]`)?.focus();
    }, 30);
  };

  /** Optimistic, with rollback. The card's next-step buttons are the only way to move it. */
  const move = async (awardeeKey: number, stage: PipelineStage) => {
    const before = entries;
    setEntries((prev) => prev.map((e) => (e.awardeeKey === awardeeKey ? { ...e, stage } : e)));
    try {
      await setPipelineStage(awardeeKey, stage);
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

  // A new member has saved nobody. Send her to search, or to My Business first
  // when we cannot search for her yet.
  if (entries.length === 0) {
    return (
      <div className="card card-padded pboard-empty">
        <h2 className="t-heading">You have not saved any partners yet</h2>
        {profileReady ? (
          <>
            <p className="t-body-sm">Search for companies that win the kind of work you do.</p>
            <button type="button" className="pstep-btn pboard-empty__btn" onClick={onSwitchToFind}>
              Search for partners
            </button>
          </>
        ) : (
          <>
            <p className="t-body-sm">
              Fill in your My Business page first. Then we can find the right partners for you.
            </p>
            <Link
              to="/business-profile"
              search={{ tab: "positioning" }}
              className="pstep-btn pboard-empty__btn"
            >
              Fill in My Business
            </Link>
          </>
        )}
      </div>
    );
  }

  const openEntry =
    openKey === null ? null : (entries.find((e) => e.awardeeKey === openKey) ?? null);
  const openCompany = openKey === null ? null : (companies.get(openKey) ?? null);

  // Every column shows, empty or not: the empty columns show what is ahead.
  return (
    <>
      {openCompany && (
        <PrimeDetailPanel
          partner={openCompany}
          saved={Boolean(openEntry)}
          onToggleSaved={() => {
            if (openEntry) setConfirmDrop(openEntry);
          }}
          onClose={closeWindow}
        />
      )}
      <Dialog.Root open={confirmDrop !== null} onOpenChange={(o) => !o && setConfirmDrop(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="nrfm-overlay" />
          <Dialog.Content
            className="nrfm"
            aria-describedby={undefined}
            onOpenAutoFocus={(e) => {
              // The safe answer has the focus.
              e.preventDefault();
              keepRef.current?.focus();
            }}
            onCloseAutoFocus={(e) => {
              // After a removal the window and the card are gone, so focus the next card.
              // After "No", focus goes back into the window as usual.
              if (droppedAt.current < 0) return;
              e.preventDefault();
              focusBoardCard(droppedAt.current);
              droppedAt.current = -1;
            }}
          >
            <Dialog.Title className="nrfm__title">
              Remove {confirmDrop?.companyName} from My partners?
            </Dialog.Title>
            {confirmDrop && (
              <p className="nrfm__note">
                You will lose its place on your board ({boardColumnLabel(confirmDrop.stage)}).
              </p>
            )}
            <div className="nrfm__acts">
              <button
                type="button"
                className="pstep-btn"
                onClick={() => {
                  if (confirmDrop) {
                    droppedAt.current = boardIndex(confirmDrop.awardeeKey);
                    void drop(confirmDrop.awardeeKey);
                  }
                  setConfirmDrop(null);
                  setOpenKey(null);
                }}
              >
                Yes, remove
              </button>
              <Dialog.Close ref={keepRef} className="pstep-btn pstep-btn--secondary">
                No
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="pboard" role="list" aria-label="Your partner pipeline">
        {BOARD.map((col, colIndex) => {
          const inCol = entries.filter((e) => columnOf(e.stage) === colIndex);
          return (
            <section
              key={col.id}
              className={`pboard__col${col.id === "finished" ? " is-won" : ""}`}
              role="listitem"
            >
              <h2 className="pboard__head">
                <span className="pboard__name">{col.label}</span>
                <span className="pboard__count">{inCol.length}</span>
                {col.term && <span className="pboard__term">{col.term}</span>}
              </h2>
              <div className="pboard__cards">
                {inCol.length === 0 ? (
                  <p className="pboard__empty">Nothing here yet</p>
                ) : (
                  inCol.map((e) => (
                    <BoardCard
                      key={e.awardeeKey}
                      entry={e}
                      partner={companies.get(e.awardeeKey)}
                      col={col}
                      prev={BOARD[colIndex - 1]}
                      onMoveTo={(stage) => move(e.awardeeKey, stage)}
                      onRemove={() => {
                        const at = boardIndex(e.awardeeKey);
                        void drop(e.awardeeKey);
                        focusBoardCard(at);
                      }}
                      onOpen={() => setOpenKey(e.awardeeKey)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

/** The question a card asks: move back one column, or remove. Null when it asks none. */
type Confirming = "back" | "remove" | null;

/**
 * One company on the board.
 *
 * The name opens the company window here, on the board. The X at the top moves the
 * card back one column, after she confirms. A bought registration has no X:
 * GovPreneurs has taken the work on, so it cannot go back. Remove sits in a quiet
 * footer of its own, and it also asks first.
 */
function BoardCard({
  entry,
  partner,
  col,
  prev,
  onMoveTo,
  onRemove,
  onOpen,
}: {
  entry: PipelineEntry;
  partner?: PrimeCandidate;
  col: BoardColumn;
  prev?: BoardColumn;
  onMoveTo: (stage: PipelineStage) => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const j = useJourney(entry.awardeeKey);
  // One question at a time: move back, or remove.
  const [confirming, setConfirming] = useState(null as Confirming);
  const place = partner ? mainPlace(partner) : null;
  const bought = Boolean(j.dfy) && (col.id === "pursuing" || col.id === "vendor");
  const canGoBack = Boolean(prev) && !bought;

  return (
    <article className="pboard-card">
      <div className="pboard-card__top">
        <button
          type="button"
          className="pboard-card__name"
          data-board-key={entry.awardeeKey}
          onClick={onOpen}
        >
          {entry.companyName}
        </button>
        {canGoBack && (
          <button
            type="button"
            className="pboard-card__back"
            aria-label={`Move ${entry.companyName} back to ${prev!.label}`}
            onClick={() => setConfirming("back")}
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </div>
      {place && (
        <p className="pboard-card__place">
          <MapPin size={14} aria-hidden /> {place}
        </p>
      )}
      {confirming === "remove" ? (
        <div className="pboard-card__confirm" role="group" aria-label="Remove">
          <p>
            Remove <b>{entry.companyName}</b> from your board?
          </p>
          <div className="pboard-card__confirm-acts">
            <button
              type="button"
              className="pstep-btn"
              onClick={() => {
                setConfirming(null);
                onRemove();
              }}
            >
              Remove
            </button>
            <button
              type="button"
              className="pstep-btn pstep-btn--secondary"
              onClick={() => setConfirming(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : confirming === "back" && prev ? (
        <div className="pboard-card__confirm" role="group" aria-label="Move back">
          <p>
            Move this back to <b>{prev.label}</b>?
          </p>
          <div className="pboard-card__confirm-acts">
            <button
              type="button"
              className="pstep-btn"
              onClick={() => {
                setConfirming(null);
                onMoveTo(prev.moveTo);
              }}
            >
              Move back
            </button>
            <button
              type="button"
              className="pstep-btn pstep-btn--secondary"
              onClick={() => setConfirming(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <col.Step entry={entry} partner={partner} onMoveTo={onMoveTo} />
      )}
      {/* While a question shows, its own buttons are the only way on. */}
      {confirming === null && (
        <div className="pboard-card__foot">
          <button
            type="button"
            className="pboard-card__remove"
            onClick={() => setConfirming("remove")}
          >
            <Trash2 size={13} aria-hidden /> Remove
          </button>
        </div>
      )}
    </article>
  );
}

/** The place of a card on the board, in reading order, or -1. */
function boardIndex(key: number): number {
  return [...document.querySelectorAll<HTMLElement>("[data-board-key]")].findIndex(
    (c) => c.dataset.boardKey === String(key),
  );
}

/** After a removal, focus the card that now sits in the removed card's place. */
function focusBoardCard(index: number): void {
  // Wait one beat: the board draws again, and Radix returns focus after its own close.
  window.setTimeout(() => {
    const names = [...document.querySelectorAll<HTMLElement>("[data-board-key]")];
    if (index >= 0 && names.length) names[Math.min(index, names.length - 1)].focus();
  }, 30);
}
