// The two-phase workspace's frame (docs/ava/ava-two-phase.html, "How to read
// the pictures"): the bid across the top, the checklist on the left that
// folds to a strip; Ava's portrait and name in the bid row, and the seven
// steps, small, over the left column only. What she is doing now is said in
// the chat, so the chat and the right column get the height (Shyam, 7
// October 2026).

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, List, MessageSquare, Users } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { FoldRail, PhaseStepper, type MarkKind, type StepperStep } from "../ds/AgentWorkspace";
import { daysLeft, dueDay } from "../../lib/ava/derive";
import { fullDate, weekdayDate } from "../../lib/ava/dates";
import { buyerWord, dueDayLine, railCount, railGroups } from "../../lib/ava/flow";
import { ChecklistDetail } from "./ChecklistDetail";
import { SourcePin } from "./primitives";
import type { AvaContext } from "./useAva";
import type { FlowView } from "./useFlow";

/** The phases and their captions, as the header shows them. */
export const PHASES = [
  { label: "Build your bid together", steps: 3 },
  { label: "Review and finish it", steps: 3 },
];

// ─── The bid, across the top ───

export function BidTop({
  ctx,
  av,
  view,
  phase2,
  onMentor,
}: {
  ctx: AvaContext;
  av: "live" | "still" | "done";
  view?: FlowView;
  phase2?: boolean;
  /** Bring a mentor in: the header's one blue button (Shyam, 8 October 2026). */
  onMentor?: () => void;
}) {
  const { bid, id } = ctx;
  const left = daysLeft(bid);
  const d = bid.deadline;
  const dueLine = dueDayLine(bid);
  const review = view?.bidReview ?? null;
  const first = review?.mentorName ? review.mentorName.split(" ")[0] : null;
  const [dueOpen, setDueOpen] = useState(false);
  // Until Ava has read the buyer's files there is no due date to show: the
  // listing's date can be wrong, and its zone is a guess (PRD TD-09, R21, 8
  // October 2026).
  const notRead = !!view && ["stopped", "mentor-no", "reading"].includes(view.flow.stage);
  return (
    <header className="ava2-top">
      <Link
        to="/opportunities/$noticeId"
        params={{ noticeId: id }}
        className="ava2-top__back"
        aria-label="Back to Grant's read of this bid"
      >
        <ArrowLeft size={20} aria-hidden />
      </Link>
      <AvaBadge av={av} />
      <div className="ava2-top__t">
        <h1>{bid.officialTitle}</h1>
        <p>
          {bid.buyer} · <span className="mono">{bid.bidNumber}</span>
        </p>
      </div>
      {/* Her other bids, one tap away on every bid (review panel, 7 October 2026). */}
      <Link to="/ava" className="btn btn-ghost btn-sm ava2-top__bids">
        <List size={16} aria-hidden /> Your bids
      </Link>
      {/* Days left only; the exact day and time show on hover or tap (Shyam,
          8 October 2026). */}
      <div
        className={`ava2-top__days${dueOpen ? " is-open" : ""}`}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDueOpen(false);
        }}
      >
        <button
          type="button"
          className="ava2-top__left"
          aria-expanded={dueOpen}
          aria-controls="ava2-due"
          onClick={() => setDueOpen((v) => !v)}
        >
          {notRead ? (
            <>
              <span className="ava2-top__dl">Due date</span>
              <span>not read yet</span>
            </>
          ) : dueLine ? (
            <span className="ava2-top__past">{dueLine}</span>
          ) : (
            <>
              <span className="mono">{left}</span>
              <span>{left === 1 ? "day left" : "days left"}</span>
            </>
          )}
        </button>
        <div className="ava2-top__duepop" id="ava2-due">
          {notRead ? (
            <>
              <b>Ava shows the due date once she has read the buyer's files.</b>
              <span>The date on the listing can be wrong.</span>
            </>
          ) : (
            <>
              <b>
                Due {weekdayDate(dueDay(bid))}{" "}
                <SourcePin
                  bid={bid}
                  source={d.source}
                  claim={`Due ${fullDate(dueDay(bid))}, ${d.time}`}
                />
              </b>
              <span>
                {d.time} {d.zone ?? "(the time zone is not stated)"}
              </span>
            </>
          )}
        </div>
      </div>
      {onMentor && !dueLine ? (
        review ? (
          <Link
            to="/mentors/$reviewId"
            params={{ reviewId: review.id }}
            className="btn btn-secondary ava2-top__mentor"
          >
            <MessageSquare size={16} aria-hidden />
            {review.status === "pending"
              ? `${first ?? "Your mentor"} is reviewing`
              : `Read ${review.mentorName ? `${review.mentorName}'s` : "your mentor's"} review`}
          </Link>
        ) : (
          <button type="button" className="btn btn-primary ava2-top__mentor" onClick={onMentor}>
            <Users size={16} aria-hidden />
            {phase2 ? "Review with a mentor" : "Build with a mentor"}
          </button>
        )
      ) : null}
    </header>
  );
}

// ─── Ava's steps ───

export function AvaHead({ view }: { view: FlowView }) {
  const { head, steps, flow } = view;
  return <AvaSteps said={head.s} steps={steps} phase={flow.phase} />;
}

/** The seven steps, small, across the top of the left column only: the
 *  right column runs to the top (Shyam, 7 October 2026). Ava herself sits in
 *  the bid row. */
export function AvaSteps({
  said,
  steps,
  phase,
}: {
  /** What she is doing now. Said in the chat; a screen reader hears it here. */
  said: string;
  steps: StepperStep[];
  phase: number;
}) {
  return (
    <div className="ava2-stepbar">
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
      <PhaseStepper phases={PHASES} steps={steps} current={phase} compact />
    </div>
  );
}

/** Ava in the bid row: her portrait (it pulses while she works) and name. */
export function AvaBadge({ av }: { av: "live" | "still" | "done" }) {
  return (
    <span className="ava2-top__ava">
      <span className={`ava2-av ava2-av--${av}`}>
        <AgentAvatar agent="ava" size={32} />
      </span>
      Ava <span className="ava2-ai mono">AI</span>
    </span>
  );
}

// ─── The checklist ───

const RAIL_KEY = "ava2-rail-open";

/** The mark on a checklist row, by its group. */
function rowMark(group: string, act?: string): MarkKind {
  if (group === "Needs you") return "need";
  if (group === "Only if you win") return "next";
  if (group !== "Rules to check") return "done";
  const open = ["Asking you now", "Grant could not tell", "Not checked yet"];
  return act && open.includes(act) ? "need" : "done";
}

/** Open or folded, remembered on this device only. */
export function useRailOpen(): [boolean, () => void] {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(RAIL_KEY) === "1");
    } catch {
      /* private window: the rail starts folded */
    }
  }, []);
  const toggle = () =>
    setOpen((v) => {
      try {
        window.localStorage.setItem(RAIL_KEY, v ? "0" : "1");
      } catch {
        /* nothing to remember */
      }
      return !v;
    });
  return [open, toggle];
}

const SIDE_KEY = "ava2-side-open";

/** The right column, open or folded, remembered on this device only. Open
 *  by default. `show` opens it when something is sent there. */
export function useSideOpen(): { open: boolean; toggle: () => void; show: () => void } {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(SIDE_KEY) !== "0");
    } catch {
      /* private window: the column starts open */
    }
  }, []);
  const set = (v: boolean) => {
    setOpen(v);
    try {
      window.localStorage.setItem(SIDE_KEY, v ? "1" : "0");
    } catch {
      /* nothing to remember */
    }
  };
  return { open, toggle: () => set(!open), show: () => set(true) };
}

/** What the right column carries to a view: open or folded, and its ways. */
export type Side = ReturnType<typeof useSideOpen>;

export function Checklist({
  ctx,
  view,
  open,
  onToggle,
  onOpen,
}: {
  ctx: AvaContext;
  view: FlowView;
  open: boolean;
  onToggle: () => void;
  /** Open a row: its question in the chat, or its part of the bid. */
  onOpen: (key: string) => void;
}) {
  const { bid, s } = ctx;
  const groups = railGroups(bid, s, view.flow);
  const count = railCount(bid, s, view.flow);
  const [a, b] = count.split("/");
  return (
    <FoldRail
      open={open}
      onToggle={onToggle}
      title={`What the ${buyerWord(bid)} asks for`}
      count={count}
      openCount={
        b
          ? view.flow.stage === "must"
            ? `${a} of ${b} rules checked`
            : `${a} of ${b} filled`
          : undefined
      }
      empty={`Ava builds this list as it reads the ${buyerWord(bid)}'s files.`}
      groups={groups.map((g) => ({
        h: g.h,
        needs: g.needs,
        rows: g.rows.map((r) => ({
          key: r.key,
          title: r.title,
          act: r.act,
          mark: rowMark(g.h, r.act),
          onOpen: g.needs ? () => onOpen(r.key) : undefined,
        })),
      }))}
    >
      {/* Opened, the rail is V1's detailed checklist (7 October 2026). While
          Ava is still reading there is nothing to list yet. */}
      {groups.length > 0 ? <ChecklistDetail ctx={ctx} view={view} onOpen={onOpen} /> : null}
    </FoldRail>
  );
}
