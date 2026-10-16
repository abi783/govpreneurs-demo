import { X } from "lucide-react";
import { useDismissibleHint } from "@/lib/uiState";

export function ModesPrimer() {
  const { dismissed, dismiss } = useDismissibleHint("modes-primer");

  if (dismissed) return null;

  return (
    <div className="modes-primer" role="note">
      <p className="modes-primer-text">
        Hunter found two kinds of opportunities for you: jobs you can bid on directly (
        <strong>Prime</strong>), and companies already winning this work who you can team up with (
        <strong>Partner</strong>). Tap any badge to learn more.
      </p>
      <button type="button" className="modes-primer-x" aria-label="Dismiss" onClick={dismiss}>
        <X size={14} />
      </button>
    </div>
  );
}
