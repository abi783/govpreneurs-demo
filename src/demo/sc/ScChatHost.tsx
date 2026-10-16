// DEMO: "Chat with the GovPreneurs team". A small panel with a canned reply.
// Intercom is not part of the demo, so the Success Center `openIntercomChat()` call
// opens this panel instead.

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { DEMO_CHAT_EVENT } from "./chat";
import { PERSONA } from "../story/persona";

interface ChatMessage {
  id: number;
  from: "team" | "you";
  text: string;
}

const GREETING: ChatMessage = {
  id: 0,
  from: "team",
  text: `Hi ${PERSONA.ownerFirstName}, this is the GovPreneurs team. How can we help today?`,
};

const CANNED_REPLY =
  "Thanks for the message. A member of the GovPreneurs team will answer by email within one business day. For a faster answer, ask your mentor from the Mentors page.";

export function ScChatHost() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((m) => [...m, { id: nextId.current++, from: "you", text: clean }]);
    const t = window.setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, from: "team", text: CANNED_REPLY }]);
    }, 800);
    timers.current.push(t);
  }

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const message = (e as CustomEvent<{ message?: string }>).detail?.message;
      if (message) send(message);
    };
    window.addEventListener(DEMO_CHAT_EVENT, onOpen);
    return () => {
      window.removeEventListener(DEMO_CHAT_EVENT, onOpen);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-label="Chat with the GovPreneurs team"
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 1100,
        width: "min(360px, calc(100vw - 32px))",
        height: "min(480px, calc(100dvh - 40px))",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        color: "#1a2233",
        borderRadius: 14,
        boxShadow: "0 18px 50px rgba(8,12,22,0.35)",
        overflow: "hidden",
        fontFamily: "var(--font-ui)",
        fontSize: 14,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          background: "#0d1420",
          color: "#fff",
        }}
      >
        <MessageCircle size={18} aria-hidden style={{ color: "#e5383b" }} />
        <strong style={{ flex: 1, fontSize: 14 }}>Chat with the GovPreneurs team</strong>
        <button
          type="button"
          aria-label="Close chat"
          onClick={() => setOpen(false)}
          style={{ background: "none", border: 0, color: "#cfd8ea", cursor: "pointer", display: "flex" }}
        >
          <X size={18} aria-hidden />
        </button>
      </header>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.from === "you" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "9px 12px",
              borderRadius: 12,
              lineHeight: 1.45,
              overflowWrap: "anywhere", // a long word wraps inside the bubble
              background: m.from === "you" ? "#0d1420" : "#eef1f8",
              color: m.from === "you" ? "#fff" : "#1a2233",
            }}
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
          setDraft("");
        }}
        style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #e3e7ef" }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your message"
          aria-label="Your message"
          style={{ flex: 1, padding: "9px 11px", borderRadius: 8, border: "1px solid #d3d9e4", font: "inherit" }}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim()}
          style={{
            padding: "0 12px",
            borderRadius: 8,
            border: 0,
            background: "#e5383b",
            color: "#fff",
            cursor: draft.trim() ? "pointer" : "not-allowed",
            opacity: draft.trim() ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Send size={16} aria-hidden />
        </button>
      </form>
    </section>
  );
}
