// THE CONSULTANT: Sarah's replies for the presenter's "Sarah answers" control,
// keyed by opportunity id (read through src/demo/story/mentorReplies.ts).
// From the pack (demo-storyboard/consulting-pack.md, section 7).

import type { MentorVerdict } from "../../story/mentorReplies";

export const MENTOR_REPLIES: Record<string, Partial<Record<MentorVerdict, string>>> = {
  // Hero: the supervisor leadership program at the Fayetteville VA.
  "36C24627Q0094": {
    pursue:
      "<p><strong>Pursue it.</strong> VA buys this program every few years, and Veterans First is written for firms like yours. This week:</p><ul><li>Count the paid hours by person. If your W-2 staff don't carry at least half, move one facilitator to payroll now; VA can ask you to prove it.</li><li>Send the coach question before Q&amp;A closes, plainly: \"Does an ICF ACC with 100+ hours coaching federal supervisors meet PCC or equal?\"</li></ul><p>Lead with your Fort Bragg ACS job. Same government, same kind of people. — Sarah</p>",
    discuss:
      "<p><strong>Let's talk first.</strong> The coach line may be written around the last vendor's team. Book 20 minutes and bring your hours by person. — Sarah</p>",
    pass:
      "<p><strong>Pass.</strong> If half the work can't stay on your own payroll, VA can end the contract for it. Fix your staffing model first. — Sarah</p>",
  },
  // The Fort Bragg in- and out-processing review, if Tim sends that one instead.
  "W91247-27-Q-0146": {
    pursue:
      "<p><strong>Pursue it.</strong> It's your G-1 work and your Lean work in one, at the post you know. Lead with the ACS wait times: 38 minutes to 14. — Sarah</p>",
  },
};
