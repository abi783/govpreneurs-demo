// Phase 1, "Build your bid together", as a conversation (ava-two-phase.html
// Part 2). Ava is in the middle: her portrait beside her messages, quick
// replies under her questions, a large Talk button in the box. The right
// side shows what she is reading, asking about or writing at that moment.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileUp, MessageSquare } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import {
  AgentMsg,
  AgentTurn,
  ChatCard,
  Composer,
  PersonMsg,
  QuickReplies,
  ThinkingTrace,
  YouMsg,
  type Reply,
} from "../ds/AgentChat";
import { findOpportunity } from "../../demo/ava/opportunity";
import { getGrantSummary } from "../../demo/ava/grantSummary";
import { untellGrant } from "../../demo/ava/grantFacts";
import { createReview } from "../../demo/ava/mentorReviews";
import { ava } from "../../lib/ava/store";
import { bidDecision, DEMO } from "../../lib/ava/derive";
import { fullDate } from "../../lib/ava/dates";
import { buyerWord } from "../../lib/ava/flow";
import { threadOf, type Turn } from "../../lib/ava/thread";
import { currentMember } from "../../demo/ava/member";
import { openOutside } from "./outside";
import { keepPaper } from "./paperFiles";
import { SendToMentorModal } from "./SendToMentorModal";
import {
  answerByWords,
  avaFace,
  matchReply,
  notUnderstood,
  QuestionCard,
  TALK_LINE,
} from "./Asking";
import { initials, Showing } from "./Showing";
import { buildReply } from "./chatReplies";
import { FoldedSide, SideFold } from "../ds/AgentWorkspace";
import type { Side } from "./Frame2";

/** The right column in phase 1, by name. */
const SHOWING_LABEL = "What Ava is showing you";
import type { AvaContext } from "./useAva";
import { mentorNote, type FlowView } from "./useFlow";

/** The question Ava drafts for the buyer when its main file is a scan. */
function askForCopy(bid: AvaContext["bid"]): Extra {
  const main = bid.files.find((f) => f.role === "main");
  return {
    you: `Ask the ${buyerWord(bid)} for one.`,
    voice: false,
    ava: `Here is the question, ready to copy: “The words in ${main?.name ?? "the main file"} come out jumbled. Could you send a copy we can read, so we can see every requirement? ${bid.bidNumber}.” Send it the way the ${buyerWord(bid)} takes questions.`,
  };
}

/** A line Ava wrote to the member ("You have 3 of 5."), as the member would say
 *  it to her mentor ("I have 3 of 5."). */
export function inMyVoice(line: string): string {
  return line
    .replace(/\bYou (have|are|cannot|can't|do not|don't|need|must|lose|did|had)\b/g, "I $1")
    .replace(/\byou (have|are|cannot|can't|do not|don't|need|must|lose|did|had)\b/g, "I $1")
    .replace(/\bYour\b/g, "My")
    .replace(/\byour\b/g, "my");
}

/** How many turns show before "Show earlier messages". */
const RECENT = 14;

export function TurnView({ t }: { t: Turn }) {
  switch (t.kind) {
    case "ava":
      return (
        <AgentTurn avatar={avaFace}>
          {t.lines.map((l) => (
            <AgentMsg key={l}>{l}</AgentMsg>
          ))}
        </AgentTurn>
      );
    case "you":
      return (
        <YouMsg file={t.file} voice={t.voice ? "You said" : undefined}>
          {t.text}
        </YouMsg>
      );
    case "grant":
      return (
        <ChatCard className="ava2-grantcard">
          <div className="ds-msg__who">
            <AgentAvatar agent="grant" size={24} />
            <span>
              <b>Grant says</b> {t.call}
            </span>
          </div>
          <p>{t.gist}</p>
        </ChatCard>
      );
    case "mentor":
      return (
        <PersonMsg
          who={
            <>
              <span className="ava2-mav">{initials(t.name)}</span>
              <span>
                {t.verdict ? (
                  <>
                    <b>{t.name}</b> · your mentor
                  </>
                ) : (
                  <>
                    <b>{t.name.split(" ")[0]}'s note</b> · {t.name}, your mentor
                  </>
                )}
              </span>
            </>
          }
        >
          {t.verdict ? (
            <span className={`ava2-verdict ava2-verdict--${t.verdict === "pursue" ? "go" : "no"}`}>
              {t.verdict === "pursue" ? "Pursue" : "Don't pursue"}
            </span>
          ) : null}
          <p className="ava2-note">“{t.note}”</p>
          <Link to="/mentors/$reviewId" params={{ reviewId: t.reviewId }} className="ava2-help">
            <MessageSquare size={14} aria-hidden /> Open her reply in Mentors
          </Link>
        </PersonMsg>
      );
    case "trace":
      return <ThinkingTrace live={t.live} line={t.line} time={t.time} steps={t.steps} />;
  }
}

/** Her ask to a mentor from the paused card: with the mentor, or the reply. */
function PausedAsk({ review }: { review: NonNullable<FlowView["pausedReview"]> }) {
  const name = review.mentorName ?? "Your mentor";
  return (
    <PersonMsg
      who={
        <>
          <span className="ava2-mav">{initials(name)}</span>
          <span>
            <b>{name}</b> · your mentor
          </span>
        </>
      }
    >
      {review.status === "pending" ? (
        <p>
          <b>With {name.split(" ")[0]}</b> since {fullDate(new Date(review.sentAt))}. You asked
          about the rule you cannot meet.
        </p>
      ) : (
        <p className="ava2-note">“{mentorNote(review)}”</p>
      )}
      <Link to="/mentors/$reviewId" params={{ reviewId: review.id }} className="ava2-help">
        <MessageSquare size={14} aria-hidden /> Open your question in Mentors
      </Link>
    </PersonMsg>
  );
}

/** A short exchange the talk box adds, until the question changes. */
type Extra = { you: string; voice: boolean; ava: string };

export function Talk({
  ctx,
  view,
  onFocus,
  why: whyAtStart,
  dlg,
  top,
  side,
  mentorAsk = 0,
}: {
  ctx: AvaContext;
  view: FlowView;
  onFocus: (key: string | null) => void;
  /** PROTOTYPE: a case opens with "Why?" open. */
  why?: boolean;
  dlg?: string | null;
  /** The steps, over the chat only: the right column runs to the top. */
  top?: ReactNode;
  /** The right column, open or folded. */
  side: Side;
  /** Counts up each time she presses the header's mentor button. */
  mentorAsk?: number;
}) {
  const { bid, s, id } = ctx;
  const { flow } = view;
  const navigate = useNavigate();
  const [why, setWhy] = useState(!!whyAtStart);
  const [show, setShow] = useState<"build" | null>(null);
  const [all, setAll] = useState(false);
  const [extra, setExtra] = useState<Extra[]>([]);
  // A mentor, two ways: her paused bid, or the bid so far from the header's
  // "Build with a mentor" (Shyam, 8 October 2026).
  const [askMentor, setAskMentor] = useState<null | "paused" | "build">(null);
  useEffect(() => {
    if (mentorAsk) setAskMentor("build");
  }, [mentorAsk]);
  const [incoming, setIncoming] = useState<{ text: string; n: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const qKey = flow.current?.key ?? flow.stage;

  // A new question starts clean: no "Why?", no extra lines.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setWhy(false);
    setShow(null);
    setExtra([]);
  }, [qKey]);
  useEffect(() => {
    if (whyAtStart) setWhy(true);
  }, [whyAtStart]);

  const turns = useMemo(
    () =>
      threadOf({
        bid,
        s,
        flow,
        now: view.now,
        memberName: currentMember.ownerName,
        grant: ctx.grant,
        mentor: view.mentorRead,
      }),
    [bid, s, flow, view.now, ctx.grant, view.mentorRead],
  );
  const hidden = all ? 0 : Math.max(0, turns.length - RECENT);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    // DEMO: under 1100px the panes stack and the page scrolls, not the chat
    // (see the stacked rules in ava.css), so the last message comes into view
    // by scrolling the page.
    if (window.matchMedia("(max-width: 1100px)").matches)
      el.lastElementChild?.scrollIntoView({ block: "end" });
  }, [turns.length, qKey, extra.length, why]);

  const opp = findOpportunity(id);
  const replies: Reply[] = [];
  /** Her mentor's name, only from a review that exists. */
  const knownMentor =
    view.pausedReview?.mentorName ??
    view.oppReview?.mentorName ??
    view.bidReview?.mentorName ??
    null;
  const paused = bidDecision(bid, s);
  // The paper that would settle the rule she cannot meet, when it is an upload.
  const pausedAsk = paused?.fromAskId
    ? bid.asks.find((a) => a.id === paused.fromAskId && a.kind === "upload")
    : undefined;
  const pausedPick = useRef<HTMLInputElement>(null);
  // While the file window is open she sees what to do (and the press shows a result).
  const [choosing, setChoosing] = useState(false);
  useEffect(() => {
    if (!choosing) return;
    // The file window closing (a file chosen, or Cancel) gives the page its focus back.
    const done = () => window.setTimeout(() => setChoosing(false), 400);
    window.addEventListener("focus", done, { once: true });
    return () => window.removeEventListener("focus", done);
  }, [choosing]);
  const pausedRule = paused?.reason.replace(/^You cannot meet this rule: /, "").replace(/\.$/, "");
  // "Take my answer back": the answer that paused the bid goes away, and Ava
  // asks the question again. (A bid that starts paused has no saved decision,
  // so the answer itself is what must go.)
  const takeBack = () => {
    ava.keepGoing(id);
    if (bid.failedAtStart) ava.fix(id, "failed-at-start");
    const from = paused?.fromAskId ? bid.asks.find((a) => a.id === paused.fromAskId) : undefined;
    if (!from) return;
    ava.reopenAsk(id, from.id);
    if (from.grantQuestion) untellGrant(id, from.grantQuestion);
  };
  const pick = useRef(null as HTMLInputElement | null);
  const repliesRef = useRef<Reply[]>([]);
  if (flow.stage === "stopped") {
    if (flow.stop === "no-files") {
      replies.push(
        {
          label: "Open the notice on SAM.gov",
          kind: "primary",
          onClick: () => openOutside("The notice on SAM.gov"),
        },
        { label: "Find another bid", onClick: () => void navigate({ to: "/opportunities" }) },
      );
    } else {
      replies.push(
        {
          label:
            flow.stop === "no-main"
              ? `Add the ${buyerWord(bid)}'s main file`
              : "Add a copy I can read",
          kind: "primary",
          onClick: () => pick.current?.click(),
        },
        ...(flow.stop === "unreadable"
          ? [
              {
                label: `Ask the ${buyerWord(bid)} for one`,
                onClick: () => setExtra((x) => [...x, askForCopy(bid)]),
              },
            ]
          : []),
        { label: "Stop working on this bid", kind: "ghost", onClick: () => ava.walkAway(id) },
      );
    }
  } else if (flow.stage === "mentor-no") {
    replies.push(
      {
        label: "Find another bid",
        kind: "primary",
        onClick: () => void navigate({ to: "/opportunities" }),
      },
      { label: "Build it anyway", onClick: () => ava.buildOverMentor(id, true) },
    );
    if (view.mentorRead)
      replies.push({
        label: `Reply to ${view.mentorRead.name.split(" ")[0]}`,
        kind: "ghost",
        onClick: () =>
          void navigate({
            to: "/mentors/$reviewId",
            params: { reviewId: view.mentorRead!.reviewId },
          }),
      });
  } else if (flow.stage === "paused") {
    // A mentor is named only from a real review. Once she has asked, the ask
    // is never offered again: she sees where it stands instead (review panel,
    // round 2).
    replies.push(
      // The rule she cannot meet is a paper: when she has it, she adds it here and
      // the bid goes on. Any file will do in the demo.
      ...(pausedAsk
        ? [
            {
              label: /certificate/i.test(pausedAsk.title)
                ? "Upload the certificates"
                : "Upload the paper",
              kind: "primary" as const,
              icon: <FileUp size={16} aria-hidden />,
              onClick: () => {
                setChoosing(true);
                pausedPick.current?.click();
              },
            },
          ]
        : []),
      {
        label: "See Grant's read",
        kind: pausedAsk ? ("secondary" as const) : ("primary" as const),
        onClick: () => void navigate({ to: "/opportunities/$noticeId", params: { noticeId: id } }),
      },
      ...(view.pausedReview
        ? []
        : [
            {
              label: knownMentor ? `Ask ${knownMentor.split(" ")[0]} · $97` : "Ask a mentor · $97",
              onClick: () => setAskMentor("paused"),
            },
          ]),
      { label: "Take my answer back", onClick: takeBack },
      { label: "Stop working on this bid", kind: "ghost", onClick: () => ava.walkAway(id) },
    );
  } else if (flow.stage === "ready") {
    // Only what she left herself can be filled now; a paper on its way waits
    // on someone else, so it never gets a button that does nothing.
    const mineLeft = flow.holes.filter((h) => s.left[h.key]);
    if (flow.holes.length > 0 || flow.holds.length > 0) {
      replies.push({
        label: "Read my bid",
        kind: "primary",
        onClick: () => ava.openRead(id, true),
      });
      if (mineLeft.length > 0)
        replies.push({
          label: mineLeft.length === 1 ? "Fill it in now" : "Fill them in now",
          onClick: () => mineLeft.forEach((h) => ava.unleave(id, h.key)),
        });
    } else {
      replies.push(
        { label: "Read my bid", kind: "primary", onClick: () => ava.openRead(id, true) },
        {
          label: "I will read it later",
          kind: "ghost",
          onClick: () => void navigate({ to: "/ava" }),
        },
      );
    }
  }

  const onSend = (text: string, how: { voice: boolean }) => {
    if (answerByWords(ctx, flow.current, text, how.voice)) return;
    // "Why?" opens the buyer's own words on the right.
    if (flow.current && /^\s*why\b/i.test(text)) {
      setWhy(true);
      side.show();
      return;
    }
    // Words that mean one of the answers on screen pick it.
    const asking =
      flow.current && (flow.stage === "must" || flow.stage === "answer" || flow.stage === "found");
    const meant = matchReply(text, asking ? repliesRef.current : replies);
    if (meant) {
      // A dialog that opens while the typing box still holds focus closes at
      // once (Radix sees focus outside it), so the box lets go first.
      (document.activeElement as HTMLElement | null)?.blur();
      window.setTimeout(() => meant.onClick(), 0);
      return;
    }
    const ask = flow.current?.ask;
    if (ask?.answer.type === "enter" && ask.answer.fields.some((f) => f.unit === "text")) {
      setIncoming((x) => ({ text, n: (x?.n ?? 0) + 1 }));
      return;
    }
    setExtra((x) => [
      ...x,
      {
        you: text,
        voice: how.voice,
        ava: buildReply(text, bid, view.bidReview ?? view.oppReview) ?? notUnderstood(flow.current),
      },
    ]);
  };

  // What Talk says (the demo does not listen): the answer she would most likely
  // give to the question on screen.
  const spoken = (): string | null => {
    const q = flow.current;
    if (!q) return "Thank you.";
    const ask = q.ask;
    if (ask?.answer.type === "enter" && ask.answer.fields.length === 1) {
      const f = ask.answer.fields[0];
      if (f.unit === "text") return "We cook every meal fresh in our own kitchen.";
      if (f.unit === "phone") return "(910) 555-0100";
      if (f.unit === "email") return "name@example.com";
      return String(f.floor ? Math.ceil(f.floor.value) : 12);
    }
    if (q.kind === "decision") return "Use your words, Ava.";
    const rs = repliesRef.current;
    return (rs.find((r) => r.kind === "primary") ?? rs[0])?.label ?? "Why?";
  };

  return (
    <div className={`ava2-talk${side.open ? "" : " is-folded"}`}>
      <div className="ava2-talk__chat">
        {top}
        <div className="ava2-talk__scroll" ref={scroller}>
          <div className="ds-chat ava2-thread">
            {hidden > 0 ? (
              <button type="button" className="ava2-earlier" onClick={() => setAll(true)}>
                Show {hidden} earlier messages
              </button>
            ) : null}
            {turns.slice(hidden).map((t) => (
              <TurnView key={t.key} t={t} />
            ))}
            {flow.current && view.flow.queue[0]?.key !== flow.current.key ? (
              <YouMsg tapped="You tapped">
                {flow.current.goes
                  ? flow.current.goes.charAt(0).toUpperCase() + flow.current.goes.slice(1)
                  : flow.current.title}
              </YouMsg>
            ) : null}
            {flow.stage === "paused" && choosing ? (
              <p className="ava2-small" role="status">
                Choose the file on your computer. Any file works in this sample.
              </p>
            ) : null}
            {flow.stage === "paused" && view.pausedReview ? (
              <PausedAsk review={view.pausedReview} />
            ) : null}
            {/* What comes after this question is said in its own line above the
                answers; nothing is said under a button (8 October 2026). */}
            {flow.stage === "answer" && flow.current && flow.queue[0]?.key !== flow.current.key ? (
              <p className="ava2-left">
                <button type="button" className="ava2-link" onClick={() => onFocus(null)}>
                  Back to my next question
                </button>
              </p>
            ) : null}
            {flow.current &&
            (flow.stage === "must" || flow.stage === "answer" || flow.stage === "found") ? (
              <QuestionCard
                more={flow.stage === "answer" ? Math.max(0, flow.queue.length - 1) : 0}
                incoming={incoming}
                repliesRef={repliesRef}
                key={flow.current.key}
                ctx={ctx}
                q={flow.current}
                why={why}
                onWhy={() => {
                  setWhy(true);
                  side.show();
                }}
                onShow={(v) => {
                  setShow(v);
                  side.show();
                }}
                dialog={dlg ?? undefined}
              />
            ) : null}
            <QuickReplies replies={replies} />
            {extra.map((x, i) => (
              <div key={i} className="ds-chat">
                <YouMsg voice={x.voice ? "You said" : undefined}>{x.you}</YouMsg>
                <AgentTurn avatar={avaFace}>
                  <AgentMsg>{x.ava}</AgentMsg>
                </AgentTurn>
              </div>
            ))}
          </div>
        </div>
        <div className="ava2-talk__composer">
          <Composer
            onSend={onSend}
            sample={spoken}
            placeholder="Type to Ava, or press Talk"
            typePlaceholder="Type to Ava"
            note={TALK_LINE}
          />
        </div>
      </div>
      {side.open ? (
        <>
          <SideFold label={SHOWING_LABEL} onFold={side.toggle} />
          <Showing ctx={ctx} view={view} why={why} show={show} onHole={(k) => onFocus(k)} />
        </>
      ) : (
        <FoldedSide label={SHOWING_LABEL} onOpen={side.toggle} />
      )}
      <input
        ref={pick}
        type="file"
        hidden
        onChange={(e) => {
          // PROTOTYPE: the file she adds is the one Ava needed, so the stop lifts.
          if (e.target.files?.[0])
            ava.unfix(id, flow.stop === "no-main" ? DEMO.noMain : DEMO.unreadable);
          e.target.value = "";
        }}
      />
      <input
        ref={pausedPick}
        type="file"
        hidden
        onChange={(e) => {
          setChoosing(false);
          const f = e.target.files?.[0];
          if (f && pausedAsk) {
            keepPaper(id, pausedAsk.id, f);
            ava.keepGoing(id);
            ava.answer(id, pausedAsk.id, { status: "done", fileName: f.name });
          }
          e.target.value = "";
        }}
      />
      {opp ? (
        <SendToMentorModal
          opp={opp}
          summary={getGrantSummary(opp)}
          open={askMentor !== null}
          onOpenChange={(o) => {
            if (!o) setAskMentor(null);
          }}
          // What the mentor gets: the rule she cannot meet and Grant's call as
          // this bid shows it now, never an older take (review panel, round 2).
          sending={
            askMentor === "build"
              ? {
                  title: `Your bid so far for ${bid.bidNumber}`,
                  lines: [
                    "Every part Ava has written so far, and what is still open.",
                    `Grant says: ${ctx.grant?.call ?? getGrantSummary(opp).call}.`,
                  ],
                }
              : {
                  title: `Your paused bid for ${bid.bidNumber}`,
                  lines: [
                    pausedRule
                      ? `The rule you cannot meet: ${pausedRule}.`
                      : "Ava paused this bid.",
                    `Grant says: ${ctx.grant?.call ?? getGrantSummary(opp).call}.`,
                  ],
                }
          }
          onConfirm={(note) => {
            if (askMentor === "build") {
              const r = createReview({
                opportunityId: id,
                opportunityTitle: opp.title,
                verdict: ctx.grant?.call ?? getGrantSummary(opp).call,
                rationale: ctx.grant?.gist ?? getGrantSummary(opp).rationale,
                note: note || "Can you help me build this bid?",
                subject: "bid",
              });
              ava.sentToMentor(id, "bid", r.id);
              // The dialog stays open and says it was sent; "Done" closes it.
              return;
            }
            // Its own subject: it never replaces her mentor's read of the
            // opportunity from Grant's page (review panel, 7 October 2026).
            createReview({
              opportunityId: id,
              opportunityTitle: opp.title,
              verdict: ctx.grant?.call ?? getGrantSummary(opp).call,
              rationale: ctx.grant?.gist ?? getGrantSummary(opp).rationale,
              note:
                note ||
                (pausedRule
                  ? `I cannot meet this rule: ${inMyVoice(pausedRule)}. Ava paused the bid. Should I still bid?`
                  : "I cannot meet one rule on this bid, so Ava paused it. Should I still bid?"),
              subject: "paused",
            });
          }}
        />
      ) : null}
    </div>
  );
}
