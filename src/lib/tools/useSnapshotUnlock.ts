import { useRef, useState } from "react";
import { useToolsAnalytics } from "@/lib/tools/analytics";
import type { ToolName } from "@/lib/tools/analytics";

/**
 * Shared unlock UX for the three snapshot-gated tool pages: fires
 * tools_gate_viewed once per result, tools_unlocked on unlock, scrolls the
 * heading into view, and shows a short-lived "Unlocked" toast line.
 */
export function useSnapshotUnlock(tool: ToolName) {
  const track = useToolsAnalytics();
  const [justUnlocked, setJustUnlocked] = useState(false);
  const viewedFor = useRef<string | null>(null);
  const headingRef = useRef<HTMLElement | null>(null);

  const trackGateViewed = (naics: string) => {
    if (viewedFor.current === naics) return;
    viewedFor.current = naics;
    track("tools_gate_viewed", { tool, naics });
  };

  const onUnlocked = (naics?: string) => {
    track("tools_unlocked", { tool, naics });
    setJustUnlocked(true);
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setJustUnlocked(false), 6000);
  };

  return { headingRef, justUnlocked, trackGateViewed, onUnlocked };
}
