// DEMO: Sarah's replies for the presenter's "Sarah answers" control (C1).
//
// In the product a mentor replies in about one business day. On a call, Tim
// sends a review live and then plays the day forward: the demo shows a
// "One business day later" card, then the reply below lands in the thread.
// Written replies are keyed by opportunity id. Any other review gets a short
// reply built from the opportunity, so the control never does nothing.

import { getOpportunity } from "./opportunities";
import { PERSONA } from "./persona";

export type MentorVerdict = "pursue" | "discuss" | "pass";

const WRITTEN: Record<string, Partial<Record<MentorVerdict, string>>> = {
  // Hero: Camp Mackall field meals.
  "SP4701-26-Q-0021": {
    pursue:
      "<p><strong>Pursue it.</strong> It is woman-owned only, it has no incumbent, and it is sized for your kitchen. Two things this week:</p><ul><li>Get your last two cooks food-handler certified. The quote asks for proof for every cook.</li><li>Plan the 3:30 AM starts now, before you price it. Early starts cost overtime.</li></ul><p>Lead with your Carolina Dining Group work at Fort Bragg. Same base, same kind of work. — Sarah</p>",
    discuss:
      "<p><strong>Let's talk before you commit.</strong> You can win this, but 18 weeks of 3:30 AM starts is a staffing question before it is a pricing one. Book 20 minutes with me this week and bring your crew schedule. — Sarah</p>",
    pass:
      "<p><strong>I'd pass on this one for now.</strong> Two of your five cooks have no food-handler certificate, and the quote asks for every one. Get them certified this month; the Army buys field meals at Mackall every year. — Sarah</p>",
  },
  // The review Tim sends live from the VA patient-meals opportunity.
  "VA247-26-R-0112": {
    pursue:
      "<p><strong>Pursue it.</strong> Womack is your proof: therapeutic diets, inpatient trays, the same kind of buyer. Two things this week:</p><ul><li>Ask the Womack contracting officer for an interim performance rating. Use the template I sent you.</li><li>Get your last two cooks food-handler certified. The VA will ask.</li></ul><p>Fayetteville is your hometown. Say so on page one. — Sarah</p>",
    discuss:
      "<p><strong>Let's talk before you commit.</strong> The VA will compare you with caterers who already hold a hospital rating. Book 20 minutes with me this week and bring your Womack menus. — Sarah</p>",
    pass:
      "<p><strong>I'd pass on this one for now.</strong> Without a written rating from Womack, you are up against caterers who have one. Ask for that rating this month, and this buyer is a good target next time. — Sarah</p>",
  },
};

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
