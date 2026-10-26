// THE IT SERVICES FIRM: Diana's replies for the presenter's "Diana answers"
// control, keyed by opportunity id (read through src/demo/story/mentorReplies.ts).
// From the pack (demo-storyboard/it-services-pack.md, section 7).

import type { MentorVerdict } from "../../story/mentorReplies";

export const MENTOR_REPLIES: Record<string, Partial<Record<MentorVerdict, string>>> = {
  // Hero: the Army Reserve headquarters help desk at Fort Bragg.
  "W91247-27-Q-0131": {
    pursue:
      "<p><strong>Pursue it.</strong> The Army Reserve buys this way, and 8(a) competitions here draw about six offers, so you have a real shot. This week:</p><ul><li>Book Security+ for your two techs, and say in the quote that all six will hold it before the start date. Name them.</li><li>Price every tech at or above the wage floor and show it line by line. Reviewers check that first, and a quote under the floor is the fastest way out.</li></ul><p>— Diana</p>",
    discuss:
      "<p><strong>Let's talk first.</strong> Bring your pay scale and the two exam dates. Twenty minutes. — Diana</p>",
    pass:
      "<p><strong>Pass.</strong> Lifting six techs to the wage floor on a fixed price leaves you almost no margin. Put the hours into the Seymour Johnson follow-on, where you're the incumbent. — Diana</p>",
  },
  // The Seymour Johnson follow-on, if Tim sends that one instead.
  "FA480927Q0006": {
    pursue:
      "<p><strong>Pursue it.</strong> You're the incumbent and they rated you Very Good. Attach the CPARS, keep the same two techs, and quote the same start-day coverage. — Diana</p>",
  },
};
