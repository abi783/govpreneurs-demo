// Grant's first-meeting card — shown above the analysis, not after it.
//
// He introduces himself BEFORE the verdict, and the analysis stays visible
// underneath once revealed, because an introduction that hides the work is a
// splash screen. Rendered immediately on arrival (before GrantAnalysis has
// even come back from the backend), so the introduction covers the fetch
// latency instead of a bare skeleton: "Show me the analysis" reveals the
// canvas, which is a skeleton for the instant the fetch is still in flight.
//
// The line that does the most work here is the one about not knowing who else
// is bidding: it's the honest boundary, it's legally accurate (bid
// information isn't releasable before award), and it buys more trust than any
// claim of accuracy would — the same boundary this codebase enforces
// everywhere else (no "firms likely to bid" figure, see root CLAUDE.md).
import { ArrowRight, X } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";

export function MeetGrant({
  opportunityTitle,
  onDismiss,
}: {
  opportunityTitle: string;
  onDismiss: () => void;
}) {
  return (
    <section className="meet ai-surface" aria-labelledby="meet-grant-h">
      <button type="button" className="meet__close" onClick={onDismiss} aria-label="Close">
        <X size={15} strokeWidth={2} aria-hidden />
      </button>

      <div className="meet__head">
        <AgentAvatar agent="grant" size={96} />
        <div>
          <h2 className="meet__name" id="meet-grant-h">
            Grant
            <span className="meet__isai">AI</span>
          </h2>
          <p className="meet__role">Reads one job end to end. Tells you to bid or pass.</p>
        </div>
      </div>

      <p className="meet__say">
        Hunter put “{opportunityTitle}” in front of you. I have read the whole solicitation against
        your profile — the requirements, the deadlines, what the agency has bought before — and
        everything below carries a source you can open. If I cannot show you where something came
        from, I do not say it.
      </p>

      <p className="meet__bounds">
        Two things I cannot do. <strong>I cannot know who else is bidding</strong> — nobody can,
        that is not released before award, so I will not guess at it. And I do not decide anything:
        my read goes to your mentor, and a person signs off before you commit to a bid.
      </p>

      <div className="meet__openers">
        <button type="button" className="meet__opener meet__opener--solo" onClick={onDismiss}>
          Show me the analysis
          <ArrowRight size={13} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </section>
  );
}
