import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ChevronRight, Info, Send } from "lucide-react";
import { HunterMark } from "./HunterMark";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { Button } from "@/components/ui";

export interface HunterChatHandle {
  appendHunterMessage: (text: string) => void;
}

interface ActionChip {
  label: string;
  variant: "primary" | "ghost";
  onClick: () => void;
}

interface ChatMsg {
  id: string;
  from: "hunter" | "user";
  text: string;
  stamp?: string;
  actions?: ActionChip[];
}

// DEMO: unused prototype. The copy is true for the sample member, Amira Haddad.
const SEED: ChatMsg = {
  id: "seed",
  from: "hunter",
  text: "Hi Amira — I'm Hunter, and I find government contracts that match your business. I've already pulled 14 matches for you. Want me to walk you through the top one?",
  stamp: "just now",
};

const SUGGESTIONS = [
  "Walk me through the top match",
  "What's a WOSB set-aside?",
  "Compare the top 3",
  "Show me opportunities I'd team up for",
] as const;

type Suggestion = (typeof SUGGESTIONS)[number];

function scriptedReplyFor(prompt: string): { text: string; actions?: ActionChip[] } | null {
  switch (prompt as Suggestion) {
    case "Walk me through the top match":
      return {
        text: "The top match is field meals for Camp Mackall training rotations — about $660K, a woman-owned set-aside, 45 miles from your kitchen. It uses your food-service code. Want me to open it?",
        actions: [
          {
            label: "Open this opportunity",
            variant: "primary",
            onClick: () => console.log("Open top match"),
          },
          { label: "Show me #2 instead", variant: "ghost", onClick: () => console.log("Show #2") },
        ],
      };
    case "What's a WOSB set-aside?":
      return {
        text: "SDVOSB stands for Service-Disabled Veteran-Owned Small Business. Only firms owned by a service-disabled veteran can compete for these set-asides. You are not an SDVOSB. Your set-asides are Small Business and Woman-Owned (WOSB).",
      };
    case "Compare the top 3":
      return { text: "Pulling them up side by side…" };
    case "Show me opportunities I'd team up for":
      return {
        text: "Switching to stretches mode. Showing 47 opportunities that fit your profile but need a partner, certification, or capacity stretch. Each card explains the gap.",
      };
    default:
      return null;
  }
}

const FALLBACK_REPLIES = [
  "Good question. Open the card and I'll have Grant pull together a full bid/no-bid in about a minute.",
  "Looking at the agency's history — they've awarded similar work to firms your size 4 of the last 6 times. I'd lean toward bidding.",
  "I can re-rank by that. Hold on — refreshing your feed.",
];

export const HunterChat = forwardRef<
  HunterChatHandle,
  {
    onCollapse: () => void;
    onEnterStretches: () => void;
  }
>(function HunterChat({ onCollapse, onEnterStretches }, ref) {
  const [messages, setMessages] = useState<ChatMsg[]>([SEED]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    appendHunterMessage: (text: string) => {
      setMessages((m) => [
        ...m,
        { id: `h-${Date.now()}`, from: "hunter", text, stamp: "just now" },
      ]);
    },
  }));

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing]);

  const submitPrompt = (text: string, isSuggestion: boolean) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSuggestionsVisible(false);
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, from: "user", text: trimmed, stamp: "just now" },
    ]);
    setTyping(true);
    setTimeout(() => {
      const scripted = isSuggestion ? scriptedReplyFor(trimmed) : null;
      const reply = scripted ?? {
        text: FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)],
      };
      setMessages((m) => [
        ...m,
        {
          id: `h-${Date.now()}`,
          from: "hunter",
          text: reply.text,
          stamp: "just now",
          actions: reply.actions,
        },
      ]);
      setTyping(false);
      if (trimmed === "Show me opportunities I'd team up for") onEnterStretches();
    }, 800);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
    submitPrompt(text, false);
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    const max = 24 * 3 + 20; // ~3 lines
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  };

  return (
    <aside className="hunter-pane" aria-label="Hunter chat">
      <header className="hunter-pane-head">
        <AgentAvatar agent="hunter" size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hunter-pane-name">Hunter</div>
          <div className="hunter-pane-role">Your discovery agent</div>
        </div>
        <button
          type="button"
          className="hunter-pane-min"
          onClick={onCollapse}
          aria-label="Collapse chat"
        >
          <ChevronRight size={18} />
        </button>
      </header>

      <div className="chat-demo-note" role="note">
        <Info size={12} aria-hidden />
        <span>Demo — chat responses are sample replies, not live AI.</span>
      </div>

      <div ref={listRef} className="hunter-msg-list">
        {messages.map((m, idx) => (
          <div key={m.id} className={`hunter-msg-row from-${m.from}`}>
            <div className={`hunter-bubble from-${m.from}`}>{m.text}</div>
            {m.actions && (
              <div className="hunter-action-row">
                {m.actions.map((a) => (
                  <Button
                    key={a.label}
                    variant={a.variant === "primary" ? "primary" : "secondary"}
                    size="sm"
                    onClick={a.onClick}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
            {m.stamp && <div className="hunter-msg-stamp">{m.stamp}</div>}
            {idx === 0 && suggestionsVisible && m.from === "hunter" && (
              <div className="hunter-suggestion-chips">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="hunter-suggestion-chip"
                    onClick={() => submitPrompt(s, true)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div className="hunter-msg-row from-hunter">
            <div className="hunter-bubble from-hunter" style={{ display: "inline-flex", gap: 3 }}>
              <span className="stream-dot" />
              <span className="stream-dot" style={{ animationDelay: "0.2s" }} />
              <span className="stream-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
      </div>

      <div className="hunter-composer-wrap">
        <div className="hunter-composer">
          <textarea
            ref={taRef}
            rows={1}
            placeholder="Ask Hunter anything…"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoGrow(e.currentTarget);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            className="hunter-send-btn"
            onClick={send}
            disabled={!draft.trim()}
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="hunter-composer-help">
          Hunter scopes fit. For deep bid analysis, click into an opportunity to ask Grant.
        </div>
      </div>
    </aside>
  );
});

export function HunterChatLauncher({ onExpand }: { onExpand: () => void }) {
  return (
    <aside className="hunter-pane is-collapsed" aria-label="Hunter chat (collapsed)">
      <div className="hunter-collapsed-rail">
        <button onClick={onExpand} aria-label="Open Hunter chat" title="Open Hunter chat">
          <div className="ai-glyph" aria-hidden>
            <HunterMark size={12} />
          </div>
        </button>
      </div>
    </aside>
  );
}
