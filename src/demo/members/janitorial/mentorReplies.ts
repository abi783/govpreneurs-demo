// THE JANITORIAL FIRM: Sarah's replies for the presenter's "Sarah answers"
// control, keyed by opportunity id (read through src/demo/story/mentorReplies.ts).
// From the pack (demo-storyboard/janitorial-pack.md, section 7).

import type { MentorVerdict } from "../../story/mentorReplies";

export const MENTOR_REPLIES: Record<string, Partial<Record<MentorVerdict, string>>> = {
  // Hero: pressure washing and sandblasting at Fort Bragg.
  "W9124727QA014": {
    pursue:
      "<p><strong>Pursue it.</strong> DPW has set this work aside for HUBZone firms twice, and you've done the same work for the Air Force. This week:</p><ul><li>Before questions close, ask: \"How many square feet were sandblasted last year, and are lead-painted surfaces excluded?\" Every bidder sees the answer, so ask it plainly.</li><li>Build the price up from the county wage floor, and ask which wage class they expect. You lost Jordan Lake by 11% on a lowest-price buy; know your floor before you cut.</li></ul><p>Lead with the Seymour Johnson dorms. — Sarah</p>",
    discuss:
      "<p><strong>Let's talk first.</strong> The sandblasting line could eat your margin. Book 20 minutes and bring the historical workload sheet. — Sarah</p>",
    pass:
      "<p><strong>Pass.</strong> One square-foot price for five years with open-ended sandblasting is a risk you don't need yet. Take your next BPA call at Seymour Johnson and get that reference letter. — Sarah</p>",
  },
  // The Pope floor care, if Tim sends that one instead.
  "FA445227Q0031": {
    pursue:
      "<p><strong>Pursue it.</strong> It's your floor crew's work on a base you already badge onto. Price four visits a year exactly as the work statement asks, and name your floor-tech lead. — Sarah</p>",
  },
};
