// THE CATERER: Diana's replies for the presenter's "Diana answers" control,
// keyed by opportunity id (read through src/demo/story/mentorReplies.ts).

import type { MentorVerdict } from "../../story/mentorReplies";

export const MENTOR_REPLIES: Record<string, Partial<Record<MentorVerdict, string>>> = {
  // Hero: Camp Mackall field meals.
  "SP4701-26-Q-0021": {
    pursue:
      "<p><strong>Pursue it.</strong> It is woman-owned only, it has no incumbent, and it is sized for your kitchen. Two things this week:</p><ul><li>Get your last two cooks food-handler certified. The quote asks for proof for every cook.</li><li>Plan the 3:30 AM starts now, before you price it. Early starts cost overtime.</li></ul><p>Lead with your Carolina Dining Group work at Fort Bragg. Same base, same kind of work. — Diana</p>",
    discuss:
      "<p><strong>Let's talk before you commit.</strong> You can win this, but 18 weeks of 3:30 AM starts is a staffing question before it is a pricing one. Book 20 minutes with me this week and bring your crew schedule. — Diana</p>",
    pass:
      "<p><strong>I'd pass on this one for now.</strong> Two of your five cooks have no food-handler certificate, and the quote asks for every one. Get them certified this month; the Army buys field meals at Mackall every year. — Diana</p>",
  },
  // The review Tim sends live from the VA patient-meals opportunity.
  "VA247-26-R-0112": {
    pursue:
      "<p><strong>Pursue it.</strong> Womack is your proof: therapeutic diets, inpatient trays, the same kind of buyer. Two things this week:</p><ul><li>Ask the Womack contracting officer for an interim performance rating. Use the template I sent you.</li><li>Get your last two cooks food-handler certified. The VA will ask.</li></ul><p>Fayetteville is your hometown. Say so on page one. — Diana</p>",
    discuss:
      "<p><strong>Let's talk before you commit.</strong> The VA will compare you with caterers who already hold a hospital rating. Book 20 minutes with me this week and bring your Womack menus. — Diana</p>",
    pass:
      "<p><strong>I'd pass on this one for now.</strong> Without a written rating from Womack, you are up against caterers who have one. Ask for that rating this month, and this buyer is a good target next time. — Diana</p>",
  },
};

