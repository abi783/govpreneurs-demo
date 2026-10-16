import { Sparkles, Loader2 } from "lucide-react";
import type { Ref } from "react";

export function AISearchBar({
  value,
  onChange,
  onSubmit,
  parsing,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  parsing: boolean;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div className="ai-search-wrap">
      <form
        className="ai-search"
        onSubmit={(e) => {
          e.preventDefault();
          const v = value.trim();
          if (v) onSubmit(v);
        }}
      >
        <Sparkles className="ai-search-icon" />
        <input
          ref={inputRef}
          className="ai-search-input"
          type="text"
          aria-label="Ask Hunter"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask Hunter — location, value, set-asides, deadlines, scope…"
        />
        <div className="ai-search-right">
          {value.length === 0 ? (
            <span className="ai-search-kbd">↵ Search</span>
          ) : (
            <button type="submit" className="ai-search-send">
              Send
            </button>
          )}
        </div>
      </form>
      {parsing && (
        <div className="ai-search-parsing">
          <Loader2 className="ai-spin" size={12} />
          Hunter parsing your request…
        </div>
      )}
    </div>
  );
}
