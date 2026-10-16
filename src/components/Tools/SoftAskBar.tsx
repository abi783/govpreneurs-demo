import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useToolsAnalytics } from "@/lib/tools/analytics";
import type { ToolName } from "@/lib/tools/analytics";

const DWELL_MS = 10_000;
const SESSION_KEY_PREFIX = "tools:softask:dismissed:";

/**
 * One soft ask per session: a compact bottom bar (never a modal) shown once
 * the visitor scrolls past the visible content or dwells 10s on an unlocked
 * snapshot page. Dismissable, remembered in sessionStorage, never shown when
 * signed in.
 */
export function SoftAskBar({
  tool,
  code,
  unlocked,
  gateRef,
}: {
  tool: ToolName;
  code: string;
  unlocked: boolean;
  gateRef: React.RefObject<HTMLDivElement | null>;
}) {
  const track = useToolsAnalytics();
  const sessionKey = `${SESSION_KEY_PREFIX}${tool}`;
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(false);

  const alreadyDismissed = () => {
    try {
      return window.sessionStorage.getItem(sessionKey) === "1";
    } catch {
      return false;
    }
  };

  const show = () => {
    if (shownRef.current || unlocked || alreadyDismissed()) return;
    shownRef.current = true;
    setVisible(true);
    track("tools_soft_ask_shown", { tool });
  };

  useEffect(() => {
    if (unlocked) return undefined;

    const dwellTimer = setTimeout(show, DWELL_MS);

    const onScroll = () => {
      const pastFold = window.scrollY + window.innerHeight > document.body.scrollHeight - 200;
      if (pastFold) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(dwellTimer);
      window.removeEventListener("scroll", onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(sessionKey, "1");
    } catch {
      /* ignore — private browsing / storage blocked */
    }
  };

  const handleClick = () => {
    track("tools_soft_ask_clicked", { tool });
    dismiss();
    gateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (!visible || unlocked) return null;

  return (
    <div className="tool-soft-ask" role="complementary">
      <button type="button" className="tool-soft-ask__body" onClick={handleClick}>
        Unlock the other 6 findings for {code} →
      </button>
      <button
        type="button"
        className="tool-soft-ask__dismiss"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
