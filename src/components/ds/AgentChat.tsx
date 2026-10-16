// The agent workspace's conversation primitives (components.css, "AGENT
// WORKSPACE PRIMITIVES"). Generic: an agent's turn with its portrait, her
// replies, a person's message, a card, quick replies, the thinking trace and
// the composer. The agent and its words come from the caller; nothing here
// knows about bids.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronRight, FileText, Image as ImageIcon, Mic, Send, Square } from "lucide-react";
import { wait } from "../../demo/ava/pace";

/** One turn from the agent: the portrait, then its messages and cards. */
export function AgentTurn({ avatar, children }: { avatar: ReactNode; children: ReactNode }) {
  return (
    <div className="ds-turn">
      <span className="ds-turn__av">{avatar}</span>
      <div className="ds-turn__col">{children}</div>
    </div>
  );
}

/** One message in the agent's words. Amber: a machine wrote it. */
export function AgentMsg({ children }: { children: ReactNode }) {
  return <div className="ds-msg ds-msg--agent">{children}</div>;
}

/** Her own message, on the right, in blue. */
export function YouMsg({
  children,
  tapped,
  voice,
  file,
}: {
  children: ReactNode;
  /** "You tapped": the part of the document she tapped. */
  tapped?: string;
  /** She said it rather than typed it. */
  voice?: string;
  file?: { name: string; photo: boolean };
}) {
  return (
    <div className="ds-msg ds-msg--you">
      {tapped ? <span className="ds-msg__tap">{tapped}</span> : null}
      {voice ? (
        <span className="ds-msg__voice">
          <Mic size={13} aria-hidden /> {voice}
        </span>
      ) : null}
      {file ? (
        <span className="ds-msg__file">
          {file.photo ? <ImageIcon size={16} aria-hidden /> : <FileText size={16} aria-hidden />}
          {children}
        </span>
      ) : (
        children
      )}
    </div>
  );
}

/** A person (a mentor): white with a dark edge, never amber. */
export function PersonMsg({ who, children }: { who: ReactNode; children: ReactNode }) {
  return (
    <div className="ds-msg ds-msg--person">
      <div className="ds-msg__who">{who}</div>
      {children}
    </div>
  );
}

/** A card the agent sends: a question, a draft, a choice. */
export function ChatCard({
  children,
  person,
  className,
}: {
  children: ReactNode;
  /** A person's card (a mentor's note): neutral, never amber. */
  person?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`ds-chatcard${person ? " ds-chatcard--person" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}

/** A long file name may wrap after an underscore, never inside a word. */
function breakable(name: string): ReactNode {
  const bits = name.split("_");
  return bits.map((b, i) => (
    <span key={i}>
      {b}
      {i < bits.length - 1 ? (
        <>
          _<wbr />
        </>
      ) : null}
    </span>
  ));
}

/** Files she sends, as attachment rows: an icon, the name and its kind. */
export function FileRows({ files }: { files: { name: string; kind?: string }[] }) {
  return (
    <ul className="ds-files">
      {files.map((f) => (
        <li key={f.name}>
          <FileText size={18} className="ds-files__ic" aria-hidden />
          <span className="ds-files__n">{breakable(f.name)}</span>
          {f.kind ? <span className="ds-files__k">{f.kind}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/** Steps she ticks off as she does them: a circle and the words, struck
 *  through once done. */
export function TodoList({
  items,
  onToggle,
}: {
  items: { id: string; label: ReactNode; done: boolean }[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="ds-todo">
      {items.map((it) => (
        <li key={it.id}>
          <button
            type="button"
            role="checkbox"
            aria-checked={it.done}
            className="ds-todo__row"
            onClick={() => onToggle(it.id)}
          >
            <span className="ds-todo__mark" aria-hidden>
              {it.done ? <Check size={13} strokeWidth={3} /> : null}
            </span>
            <span className="ds-todo__t">{it.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export interface Reply {
  label: string;
  onClick: () => void;
  kind?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
}

/** The answers she can give, as buttons under the question. */
export function QuickReplies({ replies, stack }: { replies: Reply[]; stack?: boolean }) {
  if (replies.length === 0) return null;
  return (
    <div className={`ds-replies${stack ? " ds-replies--stack" : ""}`}>
      {replies.map((r) => (
        <button
          key={r.label}
          type="button"
          className={`btn btn-${r.kind ?? "secondary"}`}
          onClick={r.onClick}
        >
          {r.icon}
          {r.label}
        </button>
      ))}
    </div>
  );
}

/** What a question wants, where the answer goes, and "Why?" on demand. */
export function MetaLine({
  proof,
  later,
  goes,
  after,
  onWhy,
  whyLabel = "Why?",
}: {
  proof: string;
  later?: boolean;
  goes?: string | null;
  /** How many come after this one: said here, above the answers, never
   *  under them. */
  after?: string | null;
  onWhy?: () => void;
  whyLabel?: string;
}) {
  return (
    <div className="ds-meta">
      <span className={`ds-proof${later ? " ds-proof--later" : ""}`}>{proof}</span>
      {goes ? <span className="ds-goes">Goes into {goes}</span> : null}
      {after ? <span className="ds-goes">· {after}</span> : null}
      {onWhy ? (
        <button type="button" className="ds-whylink" onClick={onWhy}>
          {whyLabel}
        </button>
      ) : null}
    </div>
  );
}

// ─── The thinking trace ───

export interface TraceStep {
  done: boolean;
  text: string;
  found?: string | null;
}

/** The agent shows its work. Live: a spinner and a shimmer on what it is
 *  doing now, open by default. Done: one quiet line, folded, that opens into
 *  the steps and what each found. */
export function ThinkingTrace({
  live,
  line,
  time,
  steps,
}: {
  live: boolean;
  line: string;
  time?: string;
  steps: TraceStep[];
}) {
  const [open, setOpen] = useState(live);
  useEffect(() => setOpen(live), [live]);
  // Nothing to open: one moving line, with no arrow that does nothing.
  if (steps.length === 0)
    return (
      <div className={`ds-think${live ? "" : " ds-think--done"}`}>
        <div className="ds-think__row">
          {live ? (
            <span className="ds-spin" aria-hidden />
          ) : (
            <span className="ds-ic ds-ic--done ds-ic--sm" aria-hidden>
              <Check />
            </span>
          )}
          <span className={live ? "ds-shimmer" : undefined} aria-live={live ? "polite" : undefined}>
            {line}
          </span>
          {time ? <span className="ds-think__time">{time}</span> : null}
        </div>
      </div>
    );
  return (
    <div className={`ds-think${live ? "" : " ds-think--done"}`}>
      <button
        type="button"
        className="ds-think__row"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {live ? (
          <span className="ds-spin" aria-hidden />
        ) : (
          <span className="ds-ic ds-ic--done ds-ic--sm" aria-hidden>
            <Check />
          </span>
        )}
        <span className={live ? "ds-shimmer" : undefined}>{line}</span>
        {time ? <span className="ds-think__time">{time}</span> : null}
        <ChevronRight className="ds-think__chev" aria-hidden />
      </button>
      {open && steps.length > 0 ? (
        <ol className="ds-think__steps" aria-live={live ? "polite" : undefined}>
          {steps.map((s, i) => (
            <li key={i}>
              {s.done ? (
                <span className="ds-ic ds-ic--done ds-ic--sm" aria-hidden>
                  <Check />
                </span>
              ) : (
                <span className="ds-spin" aria-hidden />
              )}
              {s.done ? (
                <span>
                  <b>{s.text}</b>
                  {s.found ? <span className="ds-think__found">{s.found}</span> : null}
                </span>
              ) : (
                <span className="ds-shimmer">{s.text}</span>
              )}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

// ─── Talking ───
//
// DEMO: the prototype used the browser's own speech recognition. In Chrome that
// sends the audio to a server outside the app, asks for the microphone and
// fails in a noisy room, so the demo never uses it. Talk is a stand-in: it
// listens for a moment, then says a sample answer that the question supplies
// (`sample`). Where a question has no sample answer, there is no Talk button,
// and the box says to type.

/** Dictation. `can` is true only when the question offers a sample answer. */
export function useDictation(onSaid: (text: string) => void, sample?: () => string | null) {
  const [live, setLive] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const toggle = () => {
    if (!sample) return;
    if (live) {
      window.clearTimeout(timer.current);
      setLive(false);
      return;
    }
    setLive(true);
    timer.current = window.setTimeout(() => {
      setLive(false);
      const said = sample();
      if (said) onSaid(said);
    }, wait(1500));
  };
  return { can: !!sample, live, toggle };
}

/** Where she talks or types to the agent. Talking comes first: a large Talk
 *  button. Where the browser cannot listen, there is no Talk button, and the
 *  box says to type (replace, never disable). */
export function Composer({
  onSend,
  placeholder,
  typePlaceholder,
  note,
  compact,
  inputId,
  sample,
}: {
  onSend: (text: string, how: { voice: boolean }) => void;
  /** What Talk says: a sample answer to the question on screen. */
  sample?: () => string | null;
  /** "Type to Ava, or press Talk". */
  placeholder: string;
  /** Where the browser cannot listen: "Type to Ava". */
  typePlaceholder: string;
  note?: string;
  /** A round microphone and a send button, for a narrow column. */
  compact?: boolean;
  inputId?: string;
}) {
  const [text, setText] = useState("");
  const dictation = useDictation((said) => onSend(said, { voice: true }), sample);
  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t, { voice: false });
    setText("");
  };
  return (
    <div className="ds-composer">
      <div className="ds-composer__box">
        <input
          id={inputId}
          className="ds-composer__input"
          value={text}
          placeholder={dictation.can ? placeholder : typePlaceholder}
          aria-label={dictation.can ? placeholder : typePlaceholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        {compact ? (
          <>
            {dictation.can ? (
              <button
                type="button"
                className={`ds-composer__icon${dictation.live ? " is-live" : ""}`}
                aria-label={dictation.live ? "Stop listening" : "Talk"}
                aria-pressed={dictation.live}
                onClick={dictation.toggle}
              >
                {dictation.live ? <Square size={16} aria-hidden /> : <Mic size={18} aria-hidden />}
              </button>
            ) : null}
            {text.trim() ? (
              <button type="button" className="ds-composer__send" aria-label="Send" onClick={send}>
                <Send size={16} aria-hidden />
              </button>
            ) : null}
          </>
        ) : text.trim() || !dictation.can ? (
          <button type="button" className="ds-composer__talk" onClick={send}>
            <Send size={18} aria-hidden /> Send
          </button>
        ) : (
          <button
            type="button"
            className={`ds-composer__talk${dictation.live ? " is-live" : ""}`}
            aria-pressed={dictation.live}
            onClick={dictation.toggle}
          >
            {dictation.live ? <Square size={16} aria-hidden /> : <Mic size={18} aria-hidden />}
            {dictation.live ? "Stop" : "Talk"}
          </button>
        )}
      </div>
      {note ? <p className="ds-composer__note">{note}</p> : null}
    </div>
  );
}
