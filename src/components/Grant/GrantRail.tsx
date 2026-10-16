// Grant's rail — the second zone, where the analysis completes in conversation
// (PRD 96 §9). This build delivers the rail LAYOUT on a responsive dock (docked
// ≥1200, collapse-to-slim-rail, mobile bottom sheet — the Hunter panel behavior,
// UX-first) with Grant's identity, the opening briefing, the pinned analysis
// summary, the open-question card, chips, and composer. The live conversation
// loop (classify → retrieve/elicit/re-run + the delta choreography) is Phase 7.
import { demoNavigate } from "../../demo/nav/navigate";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  ChevronRight,
  MessageSquare,
  PencilLine,
  Sparkles,
} from "lucide-react";
import type {
  AnsweredQuestionCard,
  GrantAnalysis,
  OpenQuestion,
  Pin,
  RichLine,
  SuggestedChip,
} from "../../lib/grant/types";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { EvidencePin, RichText } from "./primitives";
import {
  fetchRailReply,
  fetchRailSession,
  MAX_RAIL_MESSAGE,
  recordRailSkip,
  resetRailSession,
  type RailReply,
} from "../../lib/grant/rail";
import { internalRouteTarget } from "../../lib/sourceLink";

/** Reply kinds that mean the open question was actually ACCEPTED. `offscope` is
 *  a refusal, `unavailable`/`pending` are failures — none of them answer it. */
const LANDED = new Set<RailReply["kind"]>(["interrogate", "supply"]);

/** Plain text of a rich line (for sending an open-question answer with context). */
const flatten = (line: RichLine): string => line.map((s) => s.text).join("");

// Interrogative openers — mirror the backend rail's `looksLikeQuestion`. Used so a
// member can ASK their own question from the open-question card without it being
// recorded as the ANSWER to what Grant asked. Ends with '?' or opens with one.
const QUESTION_OPENERS = new Set([
  "who", "what", "when", "where", "why", "how", "which", "whose", "whom",
  "is", "are", "was", "were", "do", "does", "did", "can", "could", "should",
  "would", "will", "has", "have", "had", "am",
]);
function looksLikeQuestion(text: string): boolean {
  const m = text.trim().toLowerCase();
  if (!m) return false;
  if (m.endsWith("?")) return true;
  return QUESTION_OPENERS.has(m.split(/\s+/)[0]);
}

type ThreadMessage = {
  role: "user" | "grant";
  text: string;
  /** The pins Grant's brief was built from that the reply cited, on a Grant
   *  turn. Rendered as source chips under the bubble so a chatbox answer is as
   *  checkable as a canvas claim. Absent on a rehydrated turn — the stored
   *  session keeps the words, not the sources, so an old bubble shows none
   *  rather than the wrong ones. */
  sources?: Pin[];
  /** A platform action offered under the bubble (the drafting deflection's
   *  mentor-call button). Like `sources`, absent on a rehydrated turn. */
  cta?: "mentor";
};

function OpenQuestionCard({
  q,
  onAnswer,
  onAsk,
  onSkip,
  skipLabel = "Skip",
  disabled,
}: {
  q: OpenQuestion;
  onAnswer: (value: string) => void;
  /** The member typed a QUESTION in the answer box — ask Grant it instead of
   *  recording it as the answer (so they never have to answer to ask). */
  onAsk: (text: string) => void;
  onSkip: () => void;
  /** The dismiss control's label — "Skip" for a fresh question, "Cancel" when
   *  the card is revising an already-recorded answer (dismissing keeps it). */
  skipLabel?: string;
  disabled?: boolean;
}) {
  const [val, setVal] = useState("");
  const submit = () => {
    const t = val.trim();
    if (!t || disabled) return;
    // Over the cap the rail refuses to send and shows a "trim it" notice — so
    // keep the text in the box for them to trim instead of throwing it away.
    if (t.length > MAX_RAIL_MESSAGE) {
      onAsk(t); // routes to the rail's guard, which raises the notice
      return;
    }
    setVal("");
    // A free-form question is an ASK, not an answer to Grant's question — it goes
    // to the chat and leaves the open question in place. Yes/no and a plain value
    // (currency/date, or any non-question text) are recorded as the answer.
    if (q.input.kind !== "yesno" && looksLikeQuestion(t)) onAsk(t);
    else onAnswer(t);
  };
  return (
    <div className="grant-oq" role="group">
      <p className="grant-oq__q">
        <RichText line={q.question} />
      </p>
      <p className="grant-oq__payoff">
        <RichText line={q.payoff} />
      </p>
      <form
        className="grant-oq__input"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {q.input.kind === "yesno" ? (
          <div className="grant-oq__toggle">
            <button type="button" onClick={() => onAnswer("Yes")} disabled={disabled}>
              Yes
            </button>
            <button type="button" onClick={() => onAnswer("No")} disabled={disabled}>
              No
            </button>
          </div>
        ) : (
          <>
            <input
              className="grant-oq__field"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              inputMode={q.input.kind === "currency" ? "decimal" : undefined}
              type={q.input.kind === "date" ? "date" : "text"}
              placeholder={
                q.input.kind === "currency"
                  ? "$ amount, or ask me anything"
                  : q.input.kind === "date"
                    ? ""
                    : "Type your answer, or ask me anything"
              }
              aria-label="Answer"
              disabled={disabled}
            />
            <button
              type="submit"
              className="grant-oq__send"
              disabled={disabled || !val.trim()}
              aria-label="Answer"
            >
              <ArrowUp size={14} strokeWidth={2.4} aria-hidden />
            </button>
          </>
        )}
        <button
          type="button"
          className="grant-oq__skip"
          onClick={onSkip}
          disabled={disabled}
        >
          {skipLabel}
        </button>
      </form>
    </div>
  );
}

export function GrantRail({
  analysis,
  open,
  onOpenChange,
  sourcePath,
  onAnswered,
  onReviewWithMentor,
  mentorDisabledReason,
}: {
  analysis: GrantAnalysis;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The issuing agency's posting for this opportunity, so a solicitation pin in
   *  the thread can reach the real source. Never a vendor link. */
  sourcePath?: string | null;
  /** Fired after the member answers an open question — the owner re-fetches the
   *  analysis so the canvas + this queue regenerate from the new answer (§9.6). */
  onAnswered?: () => void;
  /** Fired by the mentor-call button under the drafting deflection. The owner
   *  routes it exactly like the canvas CTA (send-to-mentor modal, or the
   *  upgrade prompt when the plan lacks it) — the rail never decides that. */
  onReviewWithMentor?: () => void;
  /** When set, the mentor-call button renders disabled with this as its
   *  `title` (e.g. the 3-day deadline gate — mirrors the header action button
   *  and GrantCanvas's mentor CTA). */
  mentorDisabledReason?: string | null;
}) {
  const oppKey = analysis.opportunityId;
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [sending, setSending] = useState(false);
  // True from the moment an answer lands until the parent hands back the fresh
  // analysis — so the rail shows "updating the take…" instead of "ready" while the
  // canvas silently rebuilds (the regen runs an LLM phrasing pass, ~seconds).
  const [regenerating, setRegenerating] = useState(false);
  // A one-line, member-facing note about their own input (currently: too long).
  // Not a chat turn — nothing was sent — so it lives outside the thread.
  const [notice, setNotice] = useState<string | null>(null);
  // Index into the VOI-ranked queue — one card at a time; answering/skipping
  // advances to the next (PRD §9.3), and the card is gone once the queue is dry.
  const [qIndex, setQIndex] = useState(0);
  // Questions the member skipped, counted per id: a skip is a "not this one"
  // that must OUTLIVE the regen the next answer triggers, or the rail re-asks
  // what they just waved off. Counted (not a Set) because the server can raise
  // two questions under one id — skipping one must not drop its twin.
  const [skipped, setSkipped] = useState<Record<string, number>>({});
  // Start-over in flight — the thread is about to be wiped, so the control
  // disables rather than letting a second press race the first.
  const [resetting, setResetting] = useState(false);
  const queue = useMemo(() => {
    const budget: Record<string, number> = { ...skipped };
    // Defensive `?? []`: a degraded/older payload without the array must not
    // blank the whole rail (it is the member's only way to reach Grant).
    return (analysis.rail.openQuestions ?? []).filter((q) => {
      if ((budget[q.id] ?? 0) > 0) {
        budget[q.id] -= 1;
        return false;
      }
      return true;
    });
  }, [analysis, skipped]);
  const openQuestion = queue[qIndex];
  const needCount = Math.max(0, queue.length - qIndex);

  // The member is revising a recorded answer. The edit card takes the open-
  // question slot while active; dismissing it keeps the current answer.
  const [editing, setEditing] = useState<AnsweredQuestionCard | null>(null);
  const answered = analysis.rail.answeredQuestions ?? [];
  // An OpenQuestion-shaped card for the revision, so the whole existing
  // answer path (looksLikeQuestion routing, the composer, send-with-anchor,
  // regen-on-landed) is reused verbatim. Free-text input on purpose: the
  // original input kind is not carried on the answered card, and text accepts
  // every kind's value.
  const editingQuestion: OpenQuestion | null = editing
    ? {
        id: editing.id,
        question: editing.question,
        payoff: [
          { text: "You said: " },
          { text: `“${editing.value}”`, bold: true },
          { text: ". A new answer replaces it and refreshes the take." },
        ],
        verdictSwing: 0,
        input: { kind: "text" },
        status: "open",
      }
    : null;

  function answerEdit(value: string) {
    if (!editing || sending) return;
    const card = editing;
    setEditing(null); // optimistic: close the edit card
    void send(value, flatten(card.question)).then((r) => {
      // The revision didn't land — reopen the card instead of silently
      // pretending the stored answer changed.
      if (!r || !LANDED.has(r.kind)) setEditing(card);
    });
  }

  // When the analysis regenerates (an answer resolved a gap, the queue was
  // re-ranked server-side), snap back to the top of the fresh queue so we show
  // the highest-value REMAINING question, not a stale index into the old list —
  // and clear the "updating" state now that the fresh take has arrived. Skips
  // are deliberately NOT cleared here — they belong to the opportunity, not to
  // one revision of the take.
  useEffect(() => {
    setQIndex(0);
    setRegenerating(false);
    // A fresh analysis re-lists the answered cards with their CURRENT values —
    // an edit card left open would show a stale "You said" against them.
    setEditing(null);
  }, [analysis]);

  // Safety net: if the parent's re-fetch never returns a new analysis (e.g. it
  // failed), don't leave the rail stuck on "updating" forever.
  useEffect(() => {
    if (!regenerating) return;
    const id = setTimeout(() => setRegenerating(false), 15000);
    return () => clearTimeout(id);
  }, [regenerating]);

  // Swap the conversation when the OPPORTUNITY changes — not on a same-opp regen
  // (which re-fetches a new analysis object but must keep the conversation).
  // Without this, navigating to another opp without remounting would show the
  // previous opp's chat under the new briefing, mis-attributed to the wrong opp.
  //
  // The thread is per member per opportunity and DURABLE: it is loaded back from
  // the server here, so a refresh — or a visit days later — reopens the same
  // conversation, with the questions the member skipped still skipped. A failed
  // load yields an empty session, so the rail opens fresh rather than not at all.
  useEffect(() => {
    let current = true;
    setMessages([]);
    setDraft("");
    setSkipped({});
    setNotice(null);
    void fetchRailSession(oppKey).then((s) => {
      // Another opportunity was selected while this was loading — its session is
      // not this one's, so drop it rather than mixing the two threads.
      if (!current) return;
      if (s.messages.length) {
        setMessages(s.messages.map((m) => ({ role: m.role, text: m.text })));
      }
      if (Object.keys(s.skipped).length) setSkipped(s.skipped);
    });
    return () => {
      current = false;
    };
  }, [oppKey]);

  // The opportunity a turn was sent FOR. A reply is only ever applied while this
  // still matches — otherwise a slow answer about the previous opportunity lands
  // in the new one's thread, attributed to the wrong solicitation.
  const oppKeyRef = useRef(oppKey);
  useEffect(() => {
    oppKeyRef.current = oppKey;
  }, [oppKey]);

  // Keep the newest turn in view — without this the thread stays pinned at the
  // top, so a sent question and Grant's reply render below the fold and the chat
  // looks dead (mirrors the Companion rail's scroll-to-bottom, Companion.tsx).
  const threadRef = useRef<HTMLDivElement>(null);
  // The open-question card — the Improve chip scrolls here and focuses it.
  const cardWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, openQuestion]);

  async function send(
    text: string,
    openQuestion?: string,
  ): Promise<RailReply | undefined> {
    const t = text.trim();
    if (!t || sending) return undefined;
    // The backend DTO caps a message at MAX_RAIL_MESSAGE chars. Without this the
    // request 400s and the member is told "Grant is unavailable" — which is both
    // wrong and unactionable. Tell them what to do instead, and don't send.
    if (t.length > MAX_RAIL_MESSAGE) {
      setNotice(
        `That's a bit long for me — trim it to about ${MAX_RAIL_MESSAGE.toLocaleString()} characters and send it again.`,
      );
      return undefined;
    }
    setNotice(null);
    const sentFor = oppKey;
    setDraft("");
    setMessages((m) => [...m, { role: "user", text: t }]);
    setSending(true);
    try {
      const r = await fetchRailReply(oppKey, t, openQuestion);
      // The member moved to another opportunity while this was in flight — the
      // thread they're looking at is not the one this answers. Drop it.
      if (oppKeyRef.current !== sentFor) return undefined;
      setMessages((m) => [
        ...m,
        // `sources` is wire data; every value is narrowed again at render by
        // resolveSource, so a malformed pin degrades to an explained chip
        // rather than throwing inside the thread.
        {
          role: "grant",
          text: r.reply,
          sources: Array.isArray(r.sources) ? r.sources : [],
          cta: r.cta,
        },
      ]);
      // Only regenerate when the answer actually LANDED. A failed ("unavailable"),
      // still-analyzing ("pending"), or refused ("offscope") reply did not accept
      // it, so regenerating would just replay the same take and bounce the
      // question back — and would silently burn the question off the queue.
      if (openQuestion && LANDED.has(r.kind)) {
        setRegenerating(true);
        onAnswered?.();
      }
      return r;
    } finally {
      // ALWAYS clear, even when the opportunity changed mid-flight: a new turn
      // can never have started (send() refuses while `sending`), so leaving it
      // set would lock the composer on the opportunity they just moved to.
      setSending(false);
    }
  }

  function answerOpenQuestion(value: string) {
    if (!openQuestion || sending) return;
    const answered = openQuestion;
    setQIndex((i) => i + 1); // optimistic: slide the next question in
    void send(value, flatten(answered.question)).then((r) => {
      // The answer didn't land — restore the question instead of silently
      // skipping it (the regen won't fire to bring it back on a failed reply).
      // `offscope` counts as not-landed: Grant told the member the message was
      // out of scope, so the question is still unanswered.
      if (!r || !LANDED.has(r.kind)) {
        setQIndex((i) => Math.max(0, i - 1));
      }
    });
  }

  /** Skip = "not this one" — remembered for the opportunity so neither the next
   *  regen nor a visit days later re-asks it. Advancing happens by the question
   *  dropping OUT of the queue, so qIndex stays put. The local update is
   *  optimistic; the server write is fire-and-forget. */
  function skipOpenQuestion() {
    if (!openQuestion) return;
    const id = openQuestion.id;
    setSkipped((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
    void recordRailSkip(oppKey, id);
  }

  /**
   * Start over — clear the conversation for this opportunity.
   *
   * The server is cleared FIRST and the local thread only follows on success:
   * wiping locally while the stored session survives means the old conversation
   * silently returns on the next visit, which is worse than the button not
   * working. Skips go too — a "start over" that kept them would hand the member
   * a fresh thread with a permanently shortened question queue.
   */
  async function startOver() {
    if (sending || resetting) return;
    setResetting(true);
    setNotice(null);
    const ok = await resetRailSession(oppKey);
    setResetting(false);
    if (!ok) {
      setNotice("Couldn't start over just now — try again in a moment.");
      return;
    }
    setMessages([]);
    setSkipped({});
    setDraft("");
    setQIndex(0);
  }

  // Suggested chips dispatch on their kind (Doc 132 AD-6): an `ask` chip is sent
  // as a chat turn; an `elicit` chip focuses the open-question card (no chat
  // message); a `route` chip navigates. Only `ask` chips reach the rail LLM.
  function onChip(chip: SuggestedChip) {
    if (sending) return;
    if (chip.kind === "elicit") {
      const idx = queue.findIndex((q) => q.id === chip.target);
      // The target question may not be in the QUEUE even though the chip names
      // it: the queue hides questions the member skipped, and a regen re-ranks
      // it, so the chip can be authored against a different revision than the
      // one on screen. Falling through silently is what made "answer the buyer
      // question" look broken — the member taps a suggestion and nothing
      // whatsoever happens.
      //
      // NOT sent as a chat turn on the fallback: an elicit chip carries no
      // , so that would post its LABEL ("Answer the buyer question") as
      // if the member had typed it, and Grant would answer a sentence nobody
      // asked. Show them a question they can actually answer instead, and say so
      // plainly when there is none left.
      if (idx < 0) {
        if (queue.length === 0) {
          setNotice("You have answered everything I had — ask me anything below.");
          return;
        }
        setQIndex(0);
      } else {
        setQIndex(idx);
      }
      // Let the card re-render at the new index, then bring it into view + focus.
      requestAnimationFrame(() => {
        const el = cardWrapRef.current;
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        el.querySelector<HTMLElement>("input, button")?.focus();
      });
      return;
    }
    if (chip.kind === "route") {
      // The target is authored by the backend/LLM, so it is untrusted input on a
      // navigation sink: only a same-origin path may be followed (never
      // javascript:, never another host). An unusable target does nothing.
      const to = internalRouteTarget(chip.target);
      if (!to) return;
      const qs = chip.search
        ? "?" + new URLSearchParams(chip.search as Record<string, string>)
        : "";
      // DEMO: move inside the app without a page load.
      demoNavigate(to + qs);
      return;
    }
    // Send the PINNED original wording (query), not the reworded display label —
    // so what Grant answers can't drift from the answerable question (PR #25).
    void send(chip.query ?? chip.label);
  }

  if (!open) {
    return (
      <>
        <button
          type="button"
          className="grant-slim"
          onClick={() => onOpenChange(true)}
          aria-label="Open Grant"
        >
          <AgentAvatar agent="grant" size={28} />
          <span className="grant-slim__label">Grant</span>
          {needCount > 0 ? <span className="grant-slim__dot" aria-hidden /> : null}
        </button>
        <button
          type="button"
          className="grant-launcher"
          onClick={() => onOpenChange(true)}
          aria-label="Ask Grant"
        >
          <MessageSquare size={16} strokeWidth={2} aria-hidden />
          Ask Grant
        </button>
      </>
    );
  }

  return (
    <aside className="grant-dock" aria-label="Grant chat">
      <header className="grant-dock__head">
        {/* Collapse sits at the panel's own left edge — the edge nearest the
            content it's collapsing back toward, same idea as a sidebar
            handle. */}
        <button
          type="button"
          className="grant-dock__collapse"
          onClick={() => onOpenChange(false)}
          aria-label="Collapse Grant"
        >
          <ChevronRight size={18} strokeWidth={2} aria-hidden />
        </button>
        <AgentAvatar agent="grant" size={32} />
        <div className="grant-dock__id">
          <span className="grant-dock__name">
            Grant <span className="grant-dock__role">· your bid analyst</span>
          </span>
          <span className="grant-dock__status">
            <Sparkles size={11} strokeWidth={2} aria-hidden />{" "}
            {sending ? "thinking…" : regenerating ? "updating the take…" : "ready"}
          </span>
        </div>
        {/* Start over — Hunter's format (HunterChatOverlay): a plain text
            link flush right in the header, not down by the composer. Still
            only offered once there is a thread to clear (UAT #46 item 3), so
            it never reads as a control that does nothing. */}
        {messages.length > 0 ? (
          <button
            type="button"
            className="chip-inline-link"
            onClick={() => void startOver()}
            disabled={resetting || sending}
            aria-label="Start over — clear this conversation"
          >
            Start over
          </button>
        ) : null}
      </header>

      {/* pinned analysis summary — the rail's glance layer (§9.1).
          The counts are a claim about work done, so they are rendered only when
          work was done. An unanalyzed opportunity reports 0/0, and printing
          "0 checks · 0 sources" states the absence as a measurement; the
          briefing below already says plainly that nothing has been analyzed. */}
      {analysis.meta.checksRun > 0 || needCount > 0 ? (
        <div className="grant-dock__summary">
          {analysis.meta.checksRun > 0 ? (
            <b>
              <span className="mono">{analysis.meta.checksRun}</span> checks ·{" "}
              <span className="mono">{analysis.meta.sourcesConsulted}</span> sources
            </b>
          ) : null}
          {needCount > 0 ? (
            <span className="grant-dock__need">
              {analysis.meta.checksRun > 0 ? "· " : null}
              <span className="mono">{needCount}</span> I still need
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="grant-dock__thread" ref={threadRef}>
        {/* opening briefing, in Grant's voice (§9.2) */}
        <div className="grant-msg grant-msg--agent">
          {analysis.rail.briefing.map((ln, i) => (
            <p key={i}>
              <RichText line={ln} />
            </p>
          ))}
        </div>

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "grant-msg grant-msg--user"
                : "grant-msg grant-msg--agent"
            }
          >
            <p>{m.text}</p>
            {/* What Grant READ — never a claim that a given pin proves a given
                sentence. The reply is grounded in the whole brief, and we cannot
                establish which source backs which clause; asserting that mapping
                would be the one thing the source pattern exists to prevent. */}
            {m.role === "grant" && m.sources && m.sources.length > 0 ? (
              <div className="grant-msg__sources">
                <span className="grant-msg__sourceslabel">Grant read</span>
                {m.sources.map((p, j) => (
                  <EvidencePin
                    key={j}
                    pin={p}
                    claim={m.text}
                    noticeId={analysis.opportunityId}
                    sourcePath={sourcePath}
                  />
                ))}
              </div>
            ) : null}
            {/* The drafting deflection points at a mentor call, and a message
                renders as plain text — so the action arrives as data and is
                offered as a button, dispatched by the owner exactly like the
                canvas's mentor CTA. */}
            {m.role === "grant" && m.cta === "mentor" && onReviewWithMentor ? (
              <div className="grant-msg__cta">
                {mentorDisabledReason ? (
                  <span title={mentorDisabledReason}>
                    <button type="button" className="grant-chip-btn" disabled>
                      Schedule a mentor call
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="grant-chip-btn"
                    onClick={onReviewWithMentor}
                  >
                    Schedule a mentor call
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {sending ? (
          <div className="grant-msg grant-msg--agent grant-msg--typing">
            <p>Grant is thinking…</p>
          </div>
        ) : null}

        {editingQuestion ? (
          <div ref={cardWrapRef}>
            <OpenQuestionCard
              key={`edit-${editingQuestion.id}`}
              q={editingQuestion}
              onAnswer={answerEdit}
              onAsk={(t) => void send(t)}
              onSkip={() => setEditing(null)}
              skipLabel="Cancel"
              disabled={sending}
            />
          </div>
        ) : openQuestion ? (
          <div ref={cardWrapRef}>
            <OpenQuestionCard
              key={openQuestion.id}
              q={openQuestion}
              onAnswer={answerOpenQuestion}
              onAsk={(t) => void send(t)}
              onSkip={skipOpenQuestion}
              disabled={sending}
            />
          </div>
        ) : null}

        {/* What the member already told Grant, each row a doorway back into its
            question. Hidden while an edit is in progress — one revision at a
            time, in the same slot the questions use. */}
        {answered.length > 0 && !editingQuestion ? (
          <div className="grant-answered" role="group" aria-label="Your answers">
            <p className="grant-answered__kicker">You told me</p>
            {answered.map((a) => (
              <button
                key={a.id}
                type="button"
                className="grant-answered__row"
                onClick={() => setEditing(a)}
                disabled={sending}
                aria-label={`Edit answer: ${flatten(a.question)}`}
              >
                <span className="grant-answered__q">
                  <RichText line={a.question} />
                </span>
                <span className="grant-answered__v">{a.value}</span>
                <PencilLine size={12} strokeWidth={2} aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {notice ? (
        <p className="grant-dock__notice" role="status">
          {notice}
        </p>
      ) : null}

      <div className="grant-dock__chips">
        {(analysis.rail.suggestedChips ?? []).map((c, i) => (
          <button
            key={`${c.slot}-${i}`}
            type="button"
            // An ELICIT chip does not ask Grant anything — it hands the member a
            // box to fill in. Styling it like the ask chips is what made it read
            // as broken: identical affordance, completely different outcome. It
            // gets its own chrome and a pencil, so the doorway matches the room.
            className={
              c.kind === "elicit" ? "grant-chip-btn grant-chip-btn--elicit" : "grant-chip-btn"
            }
            onClick={() => onChip(c)}
            disabled={sending}
          >
            {c.kind === "elicit" ? (
              <PencilLine size={12} strokeWidth={2} aria-hidden />
            ) : null}
            {c.label}
          </button>
        ))}
      </div>

      <form
        className="grant-dock__composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(draft);
            }
          }}
          placeholder="Ask Grant about this opportunity…"
          aria-label="Ask Grant"
          disabled={sending}
        />
        <button
          type="submit"
          className="grant-dock__send"
          aria-label="Send"
          disabled={!draft.trim() || sending}
        >
          <ArrowUp size={16} strokeWidth={2.4} aria-hidden />
        </button>
      </form>
    </aside>
  );
}
