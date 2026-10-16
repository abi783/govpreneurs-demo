import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronRight, Send } from "lucide-react";
import type {
  AgentIdentity,
  ChatMsg,
  ChatMsgAction,
  CompanionApi,
  CompanionHandle,
} from "./types";
import { Button } from "@/components/ui";

interface CompanionProps {
  identity: AgentIdentity;
  onCollapse: () => void;
}

export const Companion = forwardRef<CompanionHandle, CompanionProps>(function Companion(
  { identity, onCollapse },
  ref,
) {
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    { id: "seed", role: "agent", text: identity.seedMessage, stamp: "just now" },
  ]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const api = useMemo<CompanionApi>(
    () => ({
      appendUserMessage: (text) => {
        setSuggestionsVisible(false);
        setMessages((m) => [
          ...m,
          { id: `u-${Date.now()}-${Math.random()}`, role: "user", text, stamp: "just now" },
        ]);
      },
      appendAgentMessage: (text, opts) => {
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}-${Math.random()}`,
            role: "agent",
            text,
            stamp: opts?.stamp ?? "just now",
            actions: opts?.actions,
          },
        ]);
      },
      setTyping: (on) => setTyping(on),
    }),
    [],
  );

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing]);

  const handleSuggestion = useCallback(
    (label: string, onSelect: (api: CompanionApi) => void) => {
      api.appendUserMessage(label);
      onSelect(api);
    },
    [api],
  );

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
    api.appendUserMessage(text);
    identity.onFreeMessage?.(text, api);
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    const max = 24 * 3 + 20;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  };

  const bubbleClass = (role: ChatMsg["role"]) =>
    role === "agent" ? "from-hunter" : "from-user";

  return (
    <aside className="hunter-pane" aria-label={`${identity.name} chat`}>
      <header className="hunter-pane-head">
        {identity.avatar}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hunter-pane-name">{identity.name}</div>
          <div className="hunter-pane-role">{identity.role}</div>
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

      <div ref={listRef} className="hunter-msg-list">
        {messages.map((m, idx) => (
          <div key={m.id} className={`hunter-msg-row ${bubbleClass(m.role)}`}>
            <div className={`hunter-bubble ${bubbleClass(m.role)}`}>{m.text}</div>
            {m.actions && (
              <div className="hunter-action-row">
                {m.actions.map((a: ChatMsgAction) => (
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
            {idx === 0 && suggestionsVisible && m.role === "agent" && (
              <div className="hunter-suggestion-chips">
                {identity.suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="hunter-suggestion-chip"
                    onClick={() => handleSuggestion(s.label, s.onSelect)}
                  >
                    {s.label}
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
            placeholder={identity.placeholder}
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
        <div className="hunter-composer-help">{identity.footerNote}</div>
      </div>
    </aside>
  );
});
