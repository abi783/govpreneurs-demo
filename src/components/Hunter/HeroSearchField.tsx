import { useEffect, useRef, useState, forwardRef } from "react";
import { Search, Sparkles, X } from "lucide-react";
// `Command` icon was only used by the Ctrl+K badge (disabled below).

// DEMO: the examples are true for Haddad Catering, a woman-owned caterer in Fayetteville, NC.
const ROTATING_PLACEHOLDERS = [
  "Catering under $500K near Fayetteville…",
  "Fort Bragg dining and field meals…",
  "Woman-owned set-asides closing this month…",
  "School and hospital meal programs in NC…",
];

export const HeroSearchField = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (v: string) => void;
    onSubmit: (v: string) => void;
    onAskHunter: () => void;
    parsing?: boolean;
  }
>(function HeroSearchField({ value, onChange, onSubmit, onAskHunter, parsing }, ref) {
  const [local, setLocal] = useState(value);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const innerRef = useRef<HTMLInputElement>(null);
  // Ctrl+K badge disabled — platform detection no longer needed.
  // const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (focused || local) return;
    const id = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [focused, local]);

  const handleInput = (v: string) => {
    setLocal(v);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => onChange(v), 120);
  };

  // Same reset path as clearing the text by hand — cancels any pending debounce
  // and applies immediately (no need to wait the 120ms) — then keeps focus in
  // the input rather than dropping it.
  const handleClear = () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setLocal("");
    onChange("");
    innerRef.current?.focus();
  };

  return (
    <form
      className={`hero-search${focused ? " is-focused" : ""}${parsing ? " is-parsing" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        const v = local.trim();
        if (v) onSubmit(v);
      }}
      role="search"
    >
      <Search size={15} className="hero-search__icon" aria-hidden />
      <input
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="search"
        className="hero-search__input"
        value={local}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={ROTATING_PLACEHOLDERS[placeholderIdx]}
        aria-label="Search opportunities"
      />
      {local && (
        <button
          type="button"
          className="hero-search__clear"
          onClick={handleClear}
          aria-label="Clear search"
          title="Clear search"
        >
          <X size={13} />
        </button>
      )}
      <button
        type="button"
        className="hero-search__ask"
        onClick={onAskHunter}
        title="Ask Hunter in plain English"
      >
        <Sparkles size={13} />
        <span>Ask Hunter</span>
      </button>
      {/* Ctrl+K shortcut disabled — badge removed.
      <span className="hero-search__kbd" aria-hidden>
        {isMac ? <Command size={11} /> : <span style={{ fontFamily: "var(--font-mono)" }}>Ctrl</span>}
        <span style={{ fontFamily: "var(--font-mono)" }}>K</span>
      </span>
      */}
    </form>
  );
});
