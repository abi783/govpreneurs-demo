// First visit only: Grant says who he is and what he cannot know, before his first
// read of a forecast. The same card as on Opportunities (MeetGrant in
// src/components/Companion/FirstMeeting.tsx, same classes), with the limits a
// forecast has: nobody knows who will bid, and a forecast is a plan, not a promise.
// The tracking promise follows the limits only while watching is on.

import { ArrowRight, X } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import { meetBounds } from "../../lib/forecasts/grant";
import { MEET } from "../../lib/forecasts/grantCopy";
import type { WatchCopyState } from "../../lib/forecasts/watch";

/** Grant's first-visit card on a forecast. */
export function ForecastMeetGrant({
  title,
  watchState,
  onDismiss,
}: {
  title: string;
  watchState: WatchCopyState;
  onDismiss: () => void;
}) {
  return (
    <section className="meet ai-surface fc-meet" aria-labelledby="meet-grant-forecast-h">
      <button type="button" className="meet__close" onClick={onDismiss} aria-label={MEET.close}>
        <X size={15} strokeWidth={2} aria-hidden />
      </button>
      <div className="meet__head">
        <AgentAvatar agent="grant" size={96} />
        <div>
          <h2 className="meet__name" id="meet-grant-forecast-h">
            Grant
            <span className="meet__isai">AI</span>
          </h2>
          <p className="meet__role">{MEET.role}</p>
        </div>
      </div>
      <p className="meet__say">{MEET.say(title)}</p>
      <p className="meet__bounds">{meetBounds(watchState)}</p>
      <div className="meet__openers">
        <button type="button" className="meet__opener meet__opener--solo" onClick={onDismiss}>
          {MEET.cta}
          <ArrowRight size={13} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </section>
  );
}
