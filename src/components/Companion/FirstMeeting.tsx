// The first time a member meets Hunter.
//
// WHY THIS EXISTS. Until now nobody introduced themselves. Hunter's chat opened
// with a good line, but it was a chat seed — inside a panel you had to open
// first, fired every time, and never said what Hunter could NOT do.
// `MET_HUNTER_KEY` was defined in `lib/onboardingStorage.ts` and never used.
//
// AND IT IS NOW A REQUIREMENT. EU AI Act Article 50(1) took effect 2 Aug 2026:
// a system that interacts directly with a person must inform them they are
// interacting with an AI, "at the latest at the time of the first interaction",
// and the guidelines confirm agents are covered. There is an "unless obvious"
// exemption; our audience is a first-time federal bidder who has never used an
// AI product, so it is not one we should want to rely on.
//
// THE EIGHT RULES THIS COMPONENT HOLDS:
//   1 · disclose it is AI, in the first frame
//   2 · at first interaction, not on login and not in settings
//   3 · name, role and SCOPE in one breath — the boundary is the half everyone omits
//   4 · say what it cannot know, before the first verdict rather than after the
//       first complaint
//   5 · show with tappable openers, do not describe in a paragraph
//   6 · name the handoff to the other agent
//   7 · one face, the same portrait everywhere
//   8 · introduce once, then get out of the way
//
// NOT A MODAL. A modal blocks the work the member came to do and gets dismissed
// unread. This sits at the head of the feed it introduces, and the work stays
// visible underneath.

import { ArrowRight, X } from "lucide-react";
import { AgentAvatar } from "./AgentAvatar";

const COUNT_LOCALE = "en-US";

/* ── Hunter · at the top of the feed, first visit only ────────────────────
   Three openers rather than a description. Tapping one asks the chat that
   question — useful output from one tap, which is the whole of the
   sixty-second budget the research gives us. */

/** The three questions the first-meeting hero offers instead of a description. */
export const HUNTER_OPENERS = [
  "What's out there for me right now?",
  "What's new since last week?",
  "Which of these am I actually ready for?",
] as const;

/** Hunter's first-meeting hero: who he is, what he cannot do, and three openers. */
/** DEMO: "Morning", "Afternoon" or "Evening", by the hour on the visitor's clock. */
function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
}

export function MeetHunter({
  memberName,
  count,
  onAsk,
  onDismiss,
}: {
  memberName: string;
  /** Notices in the browsable feed. Null when the feed has not reported a
   *  count yet — the sentence then omits the number rather than invent one. */
  count: number | null;
  onAsk: (question: string) => void;
  onDismiss: () => void;
}) {
  const countClause =
    count === null ? "" : ` — about ${count.toLocaleString(COUNT_LOCALE)} of them —`;
  return (
    <section className="meet ai-surface" aria-labelledby="meet-hunter-h">
      <button type="button" className="meet__close" onClick={onDismiss} aria-label="Close">
        <X size={15} strokeWidth={2} aria-hidden />
      </button>

      <div className="meet__head">
        <AgentAvatar agent="hunter" size={96} />
        <div>
          <h2 className="meet__name" id="meet-hunter-h">
            Hunter
            {/* Rule 1. Plainly, in the first frame, in the member's language —
                not a tooltip and not a footer. */}
            <span className="meet__isai">AI</span>
          </h2>
          <p className="meet__role">Finds the work. Explains why it fits.</p>
        </div>
      </div>

      <p className="meet__say">
        {/* DEMO: the greeting follows the hour, because a sales call can happen at any time of day. */}
        {greeting()}, {memberName}. I read every federal and state notice published overnight
        {countClause} and put the ones that match how you actually work at the top. I will always
        tell you why something is here.
      </p>

      {/* Rule 3 and 6. The boundary, and who owns what is on the other side of it. */}
      <p className="meet__bounds">
        I am not the one who decides whether to bid. When you want a proper read on a single job —
        the requirements, the competition, whether you would clear it — open the opportunity and{" "}
        <strong>Grant</strong> takes it from there. And I get things wrong; tell me when I do and
        your feed changes.
      </p>

      <div className="meet__openers">
        {HUNTER_OPENERS.map((q) => (
          <button key={q} type="button" className="meet__opener" onClick={() => onAsk(q)}>
            {q}
            <ArrowRight size={13} strokeWidth={2} aria-hidden />
          </button>
        ))}
      </div>
    </section>
  );
}

/** What is left once he has met Hunter. Rule 8 — available, never repeated. */
export function HunterStrip({ onAsk }: { onAsk: (q: string) => void }) {
  return (
    <div className="meet-strip">
      <AgentAvatar agent="hunter" size={24} />
      <span className="meet-strip__text">
        <strong>Hunter</strong> ranked today&rsquo;s feed. Ask him why anything is here.
      </span>
      <button type="button" className="meet-strip__cta" onClick={() => onAsk(HUNTER_OPENERS[0])}>
        Ask Hunter
      </button>
    </div>
  );
}
