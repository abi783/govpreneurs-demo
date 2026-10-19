// DEMO: Sarah's replies for the presenter's "Sarah answers" control (C1).
//
// In the product a mentor replies in about one business day. On a call, Tim
// sends a review live and then plays the day forward: the demo shows a
// "One business day later" card, then the reply below lands in the thread.
// Written replies are keyed by opportunity id. Any other review gets a short
// reply built from the opportunity, so the control never does nothing.

import { byMember } from "../member";
import * as agency from "../members/agency/mentorReplies";
import * as caterer from "../members/caterer/mentorReplies";
import { getOpportunity } from "./opportunities";
import { PERSONA } from "./persona";

export type MentorVerdict = "pursue" | "discuss" | "pass";

const WRITTEN = byMember({ agency: agency.MENTOR_REPLIES, caterer: caterer.MENTOR_REPLIES });

/** Sarah's reply for this opportunity and verdict, as HTML. */
export function mentorReplyFor(oppId: string | null, verdict: MentorVerdict): string {
  const written = oppId ? WRITTEN[oppId]?.[verdict] : undefined;
  if (written) return written;
  const title = (oppId && getOpportunity(oppId)?.plainTitle) || "this one";
  const first = PERSONA.ownerFirstName;
  if (verdict === "pursue")
    return `<p><strong>Pursue it.</strong> ${title} fits your work and your size. Fix what Grant flagged before the due date, then let Ava build it. — Sarah</p>`;
  if (verdict === "discuss")
    return `<p><strong>Let's talk before you commit, ${first}.</strong> ${title} could work, but I want to walk through the price and the staffing with you. Book 20 minutes with me this week. — Sarah</p>`;
  return `<p><strong>I'd pass on ${title}.</strong> Your time is better spent on the bids Grant ranks higher. — Sarah</p>`;
}
