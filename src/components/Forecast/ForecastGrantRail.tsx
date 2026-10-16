// Grant's chat on a forecast (v5 box 13): the slim rail and dock from Opportunities
// (src/components/Grant/GrantRail.tsx), with its classes, so the two feel the same.
// It opens with what Grant took from My Business, so it can be corrected, then asks
// what the read is missing, one question at a time. An answer is said back before
// anything on the page changes, and "Not sure" changes nothing. Steps that say
// "Grant drafts it" open here with the draft. The chat never repeats the page.
// Below the chips, a composer sends free text to Grant about this one forecast; the
// questions, drafts and starter chips stay local and make no network call.

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUp, Check, ChevronDown, Copy, MessageSquare, Sparkles } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import type { RailFocus } from "./StepAction";
import type { ForecastRead, RailQuestion } from "../../lib/forecasts/grant";
import { RAIL, RAIL_CHAT } from "../../lib/forecasts/grantCopy";
import {
  MESSAGE_MAX,
  fetchForecastGrantSession,
  sendForecastGrantMessage,
  toReadSummary,
  type ForecastGrantMessage,
} from "../../lib/forecasts/grantChatApi";

/** `chat` marks a free-text turn, which is not an answer to one of the read's questions. */
type TextMsg = {
  role: "agent" | "user";
  text: string;
  questionId?: string;
  notSure?: boolean;
  chat?: boolean;
};
type NewMsg = TextMsg | { role: "draft"; title: string; body: string };
type Msg = NewMsg & { id: number };

/** Whether a message may go to Grant: not blank, and inside the server's bound. */
function sendable(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MESSAGE_MAX;
}

function fromSaved(m: ForecastGrantMessage): NewMsg {
  return { role: m.role === "grant" ? "agent" : "user", text: m.text, chat: true };
}

/** The free-text box, in the markup of the opportunity rail. */
function Composer({
  draft,
  onDraft,
  sending,
  onSend,
}: {
  draft: string;
  onDraft: (text: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  const canSend = !sending && sendable(draft);
  return (
    <form
      className="grant-dock__composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSend();
      }}
    >
      <textarea
        rows={1}
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={RAIL_CHAT.placeholder}
        aria-label={RAIL_CHAT.label}
        disabled={sending}
      />
      <button
        type="submit"
        className="grant-dock__send"
        aria-label={RAIL_CHAT.send}
        disabled={!canSend}
      >
        <ArrowUp size={16} strokeWidth={2.4} aria-hidden />
      </button>
    </form>
  );
}

/** Who a draft is from: the member's own record, never a constant (D-A3). */
export interface DraftSender {
  name: string | null;
  address: string | null;
}

/** Fills a draft's placeholders from the member's record, or names what is missing. */
function fill(body: string, sender: DraftSender): string {
  return body
    .replace(/\{company\}/g, sender.name ?? RAIL.yourBusiness)
    .replace(/\{hq\}/g, sender.address ?? RAIL.yourAddress);
}

function DraftMessage({ title, body }: { title: string; body: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grant-msg grant-msg--agent grant-msg--in fc-draft">
      <p>
        <b>{title}</b>
      </p>
      <p className="fc-draft__body">{body}</p>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={async () => {
          // "Copied" is a claim, so it waits for the write. If the write rejects, the
          // draft is still on screen above the button to select by hand.
          try {
            await navigator.clipboard.writeText(body);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
        {copied ? RAIL.copied : RAIL.copy}
      </button>
    </div>
  );
}

function QuestionCard({
  q,
  index,
  total,
  given,
  onAnswer,
  onSkip,
}: {
  q: RailQuestion;
  index: number;
  total: number;
  /** The answer already given, when the customer came back to change it. */
  given?: string;
  onAnswer: (value: string) => void;
  onSkip: () => void;
}) {
  const [value, setValue] = useState("");
  const send = () => {
    const v = value.trim();
    if (!v) return;
    onAnswer(v.startsWith("$") ? v : `$${v}`);
    setValue("");
  };
  return (
    <div className="grant-oq fc-oq" role="group" aria-label={q.ask}>
      <span className="gt-kicker">{RAIL.questionOf(index, total)}</span>
      <p className="grant-oq__q">{q.ask}</p>
      {given !== undefined && <p className="fc-oq__given">{RAIL.youSaid(given)}</p>}
      <div className="grant-oq__input">
        {q.input === "choice" ? (
          <div className="grant-oq__toggle">
            {(q.options ?? []).map((o) => (
              <button key={o} type="button" onClick={() => onAnswer(o)}>
                {o}
              </button>
            ))}
          </div>
        ) : (
          <>
            <input
              className="grant-oq__field"
              inputMode="decimal"
              placeholder="$ amount"
              aria-label={RAIL.moneyLabel}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9.$]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
            />
            {value.trim() && (
              <button
                type="button"
                className="grant-oq__send"
                onClick={send}
                aria-label={RAIL.moneySend}
              >
                <ArrowUp size={15} strokeWidth={2.4} aria-hidden />
              </button>
            )}
          </>
        )}
        <button type="button" className="grant-oq__skip" onClick={onSkip}>
          {RAIL.skipQuestion}
        </button>
      </div>
    </div>
  );
}

export function ForecastGrantRail({
  oppKey,
  read,
  open,
  onOpenChange,
  focus,
  answers,
  onAnswer,
  pageChanged,
  canRaise,
  sender,
}: {
  /** The forecast's id, which the chat is about. */
  oppKey: string;
  read: ForecastRead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set when a step or a "Still unknown" item opens the rail for a reason. */
  focus: (RailFocus & { nonce: number }) | null;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string) => void;
  /** Whether this answer would change anything the customer can see on the page. */
  pageChanged: (questionId: string, value: string) => boolean;
  /** Whether answering an open question could raise Grant's confidence. */
  canRaise: boolean;
  sender: DraftSender;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const loadedFor = useRef<string | null>(null);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [asked, setAsked] = useState<string | null>(null);
  const idRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const push = (m: NewMsg): number => {
    const id = (idRef.current += 1);
    setMessages((ms) => [...ms, { ...m, id }]);
    return id;
  };

  const questions = read.rail.questions;
  const pending = questions.filter((q) => answers[q.id] === undefined && !skipped.includes(q.id));
  // A question asked on purpose, answered or not, comes first: that is how an answer changes.
  const active = questions.find((q) => q.id === asked) ?? pending[0] ?? null;
  // "Not sure" and a skip leave the question open; only a real answer closes it.
  const unsettled = questions.filter((q) => !answers[q.id] || answers[q.id] === RAIL.notSure);

  useEffect(() => {
    if (!focus) return;
    if (focus.draft) {
      const d = read.rail.drafts?.[focus.draft];
      if (d)
        push({
          role: "draft",
          title: d.title,
          body: d.lines.map((line) => fill(line, sender)).join("\n"),
        });
    }
    if (focus.question) {
      const q = questions.find((x) => x.id === focus.question);
      if (q) {
        setSkipped((s) => s.filter((x) => x !== q.id));
        setAsked(q.id);
      }
    }
  }, [focus?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, asked, open, sending]);

  // The saved thread is read once, the first time the dock opens. A failed read shows nothing.
  useEffect(() => {
    if (!open || loadedFor.current === oppKey) return;
    loadedFor.current = oppKey;
    void fetchForecastGrantSession(oppKey).then((saved) => {
      if (!saved || saved.length === 0) return;
      const earlier = saved.map((m) => ({ ...fromSaved(m), id: (idRef.current += 1) }));
      setMessages((ms) => [...earlier, ...ms]);
    });
  }, [open, oppKey]);

  const sendChat = async () => {
    const text = draft.trim();
    if (sending || !sendable(text)) return;
    setFailed(false);
    setSending(true);
    const userId = push({ role: "user", text, chat: true });
    const result = await sendForecastGrantMessage(oppKey, text, toReadSummary(read));
    setSending(false);
    if (result.ok) {
      push({ role: "agent", text: result.reply, chat: true });
      setDraft("");
      return;
    }
    // Her text stays in the box to send again. The bubble goes, because nothing answered it.
    setMessages((ms) => ms.filter((m) => m.id !== userId));
    setFailed(true);
  };
  const chatEmpty = !sending && !messages.some((m) => m.role !== "draft" && m.chat);

  const answer = (q: RailQuestion, value: string) => {
    // Say exactly what happened, judged on the whole page before and after the answer.
    const changed = pageChanged(q.id, value);
    const notSure = value === RAIL.notSure;
    push({ role: "user", text: value });
    onAnswer(q.id, value);
    const text = notSure
      ? changed
        ? RAIL.reverted(q.noun)
        : RAIL.notSureReply
      : changed
        ? RAIL.got(q.noun, value)
        : RAIL.gotNoChange(q.noun, value);
    push({ role: "agent", text, questionId: q.id, notSure });
    setAsked(null);
  };
  // Only the latest real answer to a question offers a change, so it is clear which one
  // counts. After "Not sure" the question is open again, and the question card asks it.
  const latestFor = new Map<string, Msg>();
  for (const m of messages) if (m.role !== "draft" && m.questionId) latestFor.set(m.questionId, m);

  if (!open) {
    return (
      <>
        <button
          type="button"
          className="grant-slim"
          onClick={() => onOpenChange(true)}
          aria-label={RAIL.open}
        >
          <AgentAvatar agent="grant" size={28} />
          <span className="grant-slim__label">Grant</span>
          {pending.length > 0 ? <span className="grant-slim__dot" aria-hidden /> : null}
        </button>
        <button
          type="button"
          className="grant-launcher"
          onClick={() => onOpenChange(true)}
          aria-label={RAIL.ask}
        >
          <MessageSquare size={16} strokeWidth={2} aria-hidden />
          {RAIL.ask}
        </button>
      </>
    );
  }

  return (
    <aside className="grant-dock fc-grant-dock" aria-label={RAIL.ask}>
      <header className="grant-dock__head">
        <AgentAvatar agent="grant" size={32} />
        <div className="grant-dock__id">
          <span className="grant-dock__name">
            Grant <span className="grant-dock__role">{RAIL.role}</span>
          </span>
          <span className="grant-dock__status">
            <Sparkles size={11} strokeWidth={2} aria-hidden /> {RAIL.ready}
          </span>
        </div>
        <button
          type="button"
          className="grant-dock__collapse"
          onClick={() => onOpenChange(false)}
          aria-label={RAIL.collapse}
        >
          <ChevronDown size={18} strokeWidth={2} aria-hidden />
        </button>
      </header>

      <div className="grant-dock__thread">
        {read.rail.assumed ? (
          <div className="grant-msg grant-msg--agent">
            <p>
              {RAIL.assumed(read.rail.assumed)}{" "}
              <Link to="/business-profile" search={{ tab: "positioning" }} className="fc-textlink">
                {RAIL.correct}
              </Link>
            </p>
          </div>
        ) : questions.length === 0 && messages.length === 0 ? (
          <div className="grant-msg grant-msg--agent">
            <p>{read.rail.starters.length > 0 ? RAIL.pick : RAIL.empty}</p>
          </div>
        ) : null}

        {messages.map((m) =>
          m.role === "draft" ? (
            <DraftMessage key={m.id} title={m.title} body={m.body} />
          ) : (
            <div key={m.id} className={`grant-msg grant-msg--${m.role} grant-msg--in`}>
              <p>{m.text}</p>
              {m.questionId && latestFor.get(m.questionId) === m && !m.notSure && (
                <button
                  type="button"
                  className="fc-textlink"
                  onClick={() => setAsked(m.questionId ?? null)}
                >
                  {RAIL.change}
                </button>
              )}
            </div>
          ),
        )}

        {active ? (
          <QuestionCard
            key={active.id}
            q={active}
            index={questions.indexOf(active) + 1}
            total={questions.length}
            given={answers[active.id]}
            onAnswer={(v) => answer(active, v)}
            onSkip={() => {
              setSkipped((s) => [...s, active.id]);
              setAsked(null);
            }}
          />
        ) : questions.length > 0 &&
          (messages.some((m) => m.role === "user" && !m.chat) || skipped.length > 0) ? (
          <div className="grant-msg grant-msg--agent">
            <p>
              {unsettled.length === 0
                ? RAIL.done
                : (canRaise ? RAIL.stillNeed : RAIL.stillNeedPlain)(
                    unsettled.map((q) => q.noun).join(", "),
                  )}
            </p>
          </div>
        ) : null}

        {sending ? (
          <div className="grant-msg grant-msg--agent grant-msg--typing">
            <p>{RAIL_CHAT.thinking}</p>
          </div>
        ) : null}

        {chatEmpty ? (
          <div className="grant-msg grant-msg--agent">
            <p>{RAIL_CHAT.intro}</p>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      {failed ? (
        <p className="grant-dock__notice" role="status">
          {RAIL_CHAT.failed}
        </p>
      ) : null}

      {read.rail.starters.length > 0 && (
        <div className="grant-dock__chips">
          {read.rail.starters.map((s) => (
            <button
              key={s.ask}
              type="button"
              className="grant-chip-btn"
              onClick={() => {
                push({ role: "user", text: s.ask });
                push({ role: "agent", text: s.answer });
              }}
            >
              {s.ask}
            </button>
          ))}
        </div>
      )}

      <Composer draft={draft} onDraft={setDraft} sending={sending} onSend={() => void sendChat()} />
    </aside>
  );
}
