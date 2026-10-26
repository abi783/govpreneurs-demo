// Bids Ava is building — one card per bid, soonest due first.
//
// Each card says only what the member needs to pick one: what the bid is, when
// it is due, where it stands and what needs them (the flags). The whole card
// opens the bid.
//
// A bid only starts from Grant's read of an opportunity, so this page never
// offers a "new bid" button of its own. It says where to start instead.
//
// DEMO: the list is the four bids in the story (src/demo/story). Until the
// visitor changes a bid, its card shows the story's own status line, so the
// list, the Pipeline and the Tasks page say the same thing. After that, the
// card follows the bid.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CircleDashed,
  FileWarning,
  ListChecks,
  MessageCircleQuestion,
  Pause,
} from "lucide-react";
import type { ReactNode } from "react";
import "../components/Ava/ava.css";
import "../components/ds/ds.css";
import { AgentAvatar } from "../components/Companion/AgentAvatar";
import { dueLine } from "../components/Ava/AvaChrome";
import { KIND_LABEL } from "../components/Ava/primitives";
import { useAvaState } from "../components/Ava/useAva";
import { usePageMeta } from "../components/Layout/page-meta";
import { fullDate } from "../lib/ava/dates";
import {
  downloadStale,
  headlineOf,
  lastWholeDownload,
  mentorTooLate,
  flowOf,
  type Flow,
  type MentorStatus,
} from "../lib/ava/flow";
import { isUntouched, type BidState } from "../lib/ava/store";
import type { AvaBid } from "../lib/ava/types";
import { bidDecision, daysLeft, effectiveBid } from "../lib/ava/derive";
import { getAvaBid } from "../lib/ava/fixtures";
import { withGrantFor } from "../lib/ava/grant";
import { grantFacts } from "../demo/ava/grantFacts";
import type { Flag } from "../lib/ava/status";
import { useLiveSlice } from "../lib/eventBus";
import { getAvaStory, STORY_BIDS, valueLine } from "../demo/ava/story";
import { findOpportunity } from "../demo/ava/opportunity";
import { getOpportunity } from "../demo/story/opportunities";
import { useDemoState } from "../demo/runtime/store";
import {
  HANDOFF_SEEN_KEY,
  HANDOFF_STATE_KEY,
  NO_HANDOFF,
  type HandoffState,
} from "../demo/ava/handoffSeen";
import { theirs } from "../components/Ava/HandoffView";
import { getReviewByOpportunity, MENTOR_REPLY_DAYS } from "../demo/ava/mentorReviews";

export const Route = createFileRoute("/ava/")({
  head: () => ({
    meta: [
      { title: "Bids Ava is building · GovPreneurs" },
      {
        name: "description",
        content:
          "Ava builds the whole bid with you: the forms, the price and the writing. You read it and send it.",
      },
    ],
  }),
  component: AvaIndexPage,
});

// ─── Words ───

function leftText(days: number): string {
  if (days > 1) return `${days} days left`;
  if (days === 1) return "Due tomorrow";
  if (days === 0) return "Due today";
  return "The deadline has passed";
}

const FLAG_LOOK: Record<Flag["id"], { cls: string; icon: ReactNode }> = {
  "needs-you": {
    cls: "ava-flagchip--you",
    icon: <ListChecks size={12} strokeWidth={2} aria-hidden />,
  },
  clarification: {
    cls: "ava-flagchip--clar",
    icon: <MessageCircleQuestion size={12} strokeWidth={2} aria-hidden />,
  },
  blocked: {
    cls: "ava-flagchip--blocked",
    icon: <FileWarning size={12} strokeWidth={2} aria-hidden />,
  },
  "bid-decision": {
    cls: "ava-flagchip--decision",
    icon: <Pause size={12} strokeWidth={2} aria-hidden />,
  },
};

type Tone = "paused" | "done" | "quiet" | "active";

function PhaseMark({ tone, label }: { tone: Tone; label: string }) {
  const icon =
    tone === "paused" ? (
      <Pause size={13} strokeWidth={2.25} aria-hidden />
    ) : tone === "done" ? (
      <Check size={13} strokeWidth={2.25} aria-hidden />
    ) : tone === "quiet" ? (
      <CircleDashed size={13} strokeWidth={2} aria-hidden />
    ) : (
      <span className="ava-idx__dot" aria-hidden />
    );
  return (
    <span className={`ava-idx__phase ava-idx__phase--${tone}`}>
      {icon}
      {label}
    </span>
  );
}

/** One line for a bid's state, in the two phases' words, and whether it
 *  needs her. Once her bid is built, the card IS the bid's own header
 *  (flow.ts headlineOf), with her mentor's review, so the two cannot disagree
 *  (review panel, round 2). "Downloaded" is as far as Ava can know: there is
 *  no "I sent it" step (Shyam, 7 October 2026). */
function cardLine(
  bid: AvaBid,
  s: BidState,
  f: Flow,
  mentor: MentorStatus | null,
): { label: string; note: string | null; needs: boolean } {
  if (!s.started)
    return { label: "Not started", note: "Nothing is built until you start.", needs: false };
  if (s.walkedAway)
    return {
      label: "You stopped working on this bid",
      note: "You can start again from its page.",
      needs: false,
    };
  if (daysLeft(bid) < 0)
    return {
      label: "The deadline passed",
      note: lastWholeDownload(s)
        ? `You downloaded this bid on ${fullDate(new Date(lastWholeDownload(s)!.at))}.`
        : null,
      needs: false,
    };
  const n = f.queue.length;
  switch (f.stage) {
    case "stopped":
      return { label: "Ava needs a file it can read", note: null, needs: true };
    case "mentor-no":
      return {
        label: "Your mentor said not to pursue it",
        note: "Ava has not started. It is your call.",
        needs: true,
      };
    case "reading":
      return { label: "Ava is reading the buyer's files", note: null, needs: false };
    case "must":
      return {
        label: `Check you can bid · ${n} ${n === 1 ? "rule" : "rules"} to check`,
        note: null,
        needs: true,
      };
    case "paused":
      return { label: "Paused: you cannot meet one rule", note: null, needs: true };
    case "answer":
      return { label: `Answer my questions · ${n} waiting on you`, note: null, needs: true };
    case "checking":
      return { label: "Ava is checking for mistakes", note: null, needs: false };
    case "found":
      return {
        label: `Check for mistakes · ${n} ${n === 1 ? "question" : "questions"}`,
        note: null,
        needs: true,
      };
    case "ready":
    case "read": {
      const head = headlineOf(bid, s, f, {
        mentor,
        mentorName: mentor?.name ?? "Your mentor",
        pending: false,
        late: mentorTooLate(bid, MENTOR_REPLY_DAYS),
      });
      // It needs her while something holds, changed, is left open, is older
      // than her bid, or was not checked. Not while a mentor reads, and not
      // once she downloaded her current bid: sending is hers, and Ava does
      // not nag.
      const needs =
        f.queue.length > 0 ||
        f.holds.some((h) => h.kind !== "checking") ||
        f.holes.length > 0 ||
        !!s.check?.failed ||
        !!downloadStale(s);
      return { label: head.s, note: head.sub, needs };
    }
  }
}

/** "pending|Diana Potts" back to the mentor status the header reads. */
function reviewOf(key: string): MentorStatus | null {
  if (!key) return null;
  const [status, name] = key.split("|");
  return { name: name || "Your mentor", status: status as MentorStatus["status"] };
}

// ─── One bid ───

function BidCard({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const raw = useAvaState(id);
  const told = useLiveSlice("ava", () => grantFacts(id));
  // Her mentor's read of the opportunity: a "Don't pursue" stops Ava before
  // she reads, here as on the bid's own page.
  const mentorNo = useLiveSlice(
    "mentorReviews",
    () => getReviewByOpportunity(id)?.verdict === "dont-pursue",
  );
  // Her mentor's review of her bid, as one string so it compares by value.
  const bidReview = useLiveSlice("mentorReviews", () => {
    const r = getReviewByOpportunity(id, "bid");
    return r ? `${r.status}|${r.mentorName ?? ""}` : "";
  });
  const untouched = useLiveSlice("ava", () => isUntouched(id));
  const story = getAvaStory(id);
  const base = getAvaBid(id);
  if (!base || !story) return null;
  // Grant's results laid on, as on the bid's own pages, so the counts agree.
  const { fixture, s } = withGrantFor(id, base, raw, told);

  const bid = effectiveBid(fixture, s);
  const title = bid.officialTitle;
  const buyer = bid.buyer;
  const number = bid.bidNumber;
  const kind = KIND_LABEL[bid.kind].label;
  const due = dueLine(bid);
  const left = daysLeft(bid);
  // The two phases (lib/ava/flow): the same words as the bid's own header.
  const f = flowOf(bid, s, { now: Date.now(), mentorNo });
  const card = cardLine(bid, s, f, reviewOf(bidReview));
  const tone: Tone =
    f.stage === "paused"
      ? "paused"
      : !s.started || s.walkedAway
        ? "quiet"
        : f.stage === "ready" || f.stage === "read"
          ? "done"
          : "active";
  let chips: Flag[] = card.needs ? [{ id: "needs-you", label: "Needs you" }] : [];
  if (f.stage === "paused") chips = [{ id: "bid-decision", label: "Paused" }];
  let note = card.note;
  const decision = bidDecision(bid, s);
  if (decision && f.stage === "paused") note = decision.reason;
  // Until she changes the bid, the card says what the story says: its line, and
  // whether it needs her or is paused.
  const phaseLabel = untouched ? story.statusLine : card.label;
  if (untouched) {
    note = null;
    chips = story.state.paused
      ? [{ id: "bid-decision", label: "Paused" }]
      : story.state.needsYou
        ? [{ id: "needs-you", label: "Needs you" }]
        : [];
  }

  const open = (e: { currentTarget: HTMLElement }) => {
    // Release focus before the route changes (design system: clickable cards).
    e.currentTarget.blur();
    onOpen(id);
  };

  return (
    <article
      className="ava-idx__card is-clickable-card"
      role="link"
      tabIndex={0}
      aria-label={[title, due, phaseLabel, ...chips.map((c) => c.label)].join(". ")}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(e);
        }
      }}
    >
      <div className="ava-idx__top">
        <div className="ava-idx__what">
          <p className="ava-idx__eyebrow">
            <span className="ava-kind">{kind}</span>
            <span className="ava-idx__num mono">{number}</span>
          </p>
          <h2 className="ava-idx__name">{title}</h2>
          <p className="ava-idx__buyer">
            {buyer}
            {story.value ? ` · ${story.value}` : ""}
          </p>
        </div>
        <div className="ava-idx__when">
          <p className="ava-idx__due">{due}</p>
          <p className="ava-idx__left">{leftText(left)}</p>
        </div>
      </div>
      <div className="ava-idx__foot">
        <div className="ava-idx__state">
          <PhaseMark tone={tone} label={phaseLabel} />
          {chips.map((c) => (
            <span key={c.id} className={`ava-flagchip ${FLAG_LOOK[c.id].cls}`}>
              {FLAG_LOOK[c.id].icon}
              {c.label}
            </span>
          ))}
        </div>
        <span className="ava-idx__go" aria-hidden>
          Open the bid <ArrowRight size={14} strokeWidth={2} />
        </span>
      </div>
      {note ? <p className="ava-idx__note">{note}</p> : null}
    </article>
  );
}

// ─── One bid Ava has been handed but has not read ───

/** A bid whose handoff page the visitor opened. Ava has not read it, so the card
 *  shows no due date of her own: only what the listing says. */
function HandoffCard({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const [all] = useDemoState<Record<string, HandoffState>>(HANDOFF_STATE_KEY, {});
  const opp = findOpportunity(id);
  const story = getOpportunity(id);
  if (!opp || !story) return null;
  const mine = all[id] ?? NO_HANDOFF;
  const waiting = opp.scope === "sled" && mine.files.length === 0;
  const value = valueLine(story);
  const label = waiting
    ? `Ava needs ${theirs(opp)} files`
    : opp.scope === "sled"
      ? `Ava is reading ${mine.files.length} ${mine.files.length === 1 ? "file" : "files"}`
      : "Ava is reading the notice and its files";
  const listing = leftText(opp.closesInDays);
  const open = (e: { currentTarget: HTMLElement }) => {
    e.currentTarget.blur();
    onOpen(id);
  };
  return (
    <article
      className="ava-idx__card is-clickable-card"
      role="link"
      tabIndex={0}
      aria-label={[
        opp.title,
        "Due date not read yet",
        label,
        ...(waiting ? ["Needs you"] : []),
      ].join(". ")}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(e);
        }
      }}
    >
      <div className="ava-idx__top">
        <div className="ava-idx__what">
          <p className="ava-idx__eyebrow">
            <span className="ava-kind">{opp.noticeType}</span>
            <span className="ava-idx__num mono">{id}</span>
          </p>
          <h2 className="ava-idx__name">{opp.title}</h2>
          <p className="ava-idx__buyer">
            {opp.agency}
            {value ? ` · ${value}` : ""}
          </p>
        </div>
        <div className="ava-idx__when">
          <p className="ava-idx__due">Due date not read yet</p>
          <p className="ava-idx__left">The listing says {listing.toLowerCase()}</p>
        </div>
      </div>
      <div className="ava-idx__foot">
        <div className="ava-idx__state">
          <PhaseMark tone={waiting ? "quiet" : "active"} label={label} />
          {waiting ? (
            <span className={`ava-flagchip ${FLAG_LOOK["needs-you"].cls}`}>
              {FLAG_LOOK["needs-you"].icon}
              Needs you
            </span>
          ) : null}
        </div>
        <span className="ava-idx__go" aria-hidden>
          Open the bid <ArrowRight size={14} strokeWidth={2} />
        </span>
      </div>
    </article>
  );
}

// ─── The page ───

function AvaIndexPage() {
  usePageMeta({ layout: "wide" });
  const navigate = useNavigate();

  // The four bids in the story, soonest due first (the story sorts them).
  const ids = STORY_BIDS.map((b) => b.id);
  // Then the bids she was handed and Ava has not read, soonest closing first.
  const [seen] = useDemoState<string[]>(HANDOFF_SEEN_KEY, []);
  const handed = seen
    .filter((id) => !ids.includes(id))
    .sort(
      (a, b) => (findOpportunity(a)?.closesInDays ?? 0) - (findOpportunity(b)?.closesInDays ?? 0),
    );

  const openBid = (id: string) => {
    void navigate({ to: "/ava/$noticeId", params: { noticeId: id } });
  };

  return (
    <div className="ava-page ava-idx">
      <header className="ava-idx__head">
        <AgentAvatar agent="ava" size={48} />
        <div className="ava-idx__intro">
          <h1 className="ava-idx__title">Bids Ava is building</h1>
          <p className="ava-lede">
            Ava builds the whole bid with you: the forms, the price and the writing. You read it and
            send it.
          </p>
        </div>
      </header>

      <div className="ava-idx__start">
        <p>
          A bid starts from Grant&apos;s read of an opportunity. Open an opportunity and choose{" "}
          <strong>Build this bid with Ava</strong>.
        </p>
        <Link to="/opportunities" className="btn btn-secondary btn-sm">
          Open your opportunities
        </Link>
      </div>

      <ul
        className="ava-idx__list"
        aria-label="Your bids, soonest due first. Bids Ava has not read yet are last."
      >
        {ids.map((id) => (
          <li key={id}>
            <BidCard id={id} onOpen={openBid} />
          </li>
        ))}
        {handed.map((id) => (
          <li key={id}>
            <HandoffCard id={id} onOpen={openBid} />
          </li>
        ))}
      </ul>
    </div>
  );
}
