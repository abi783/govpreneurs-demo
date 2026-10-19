// THE CONTRACTOR: Sarah's replies for the presenter's "Sarah answers" control,
// keyed by opportunity id (read through src/demo/story/mentorReplies.ts).
// From the pack (demo-storyboard/construction-pack.md, section 7).

import type { MentorVerdict } from "../../story/mentorReplies";

export const MENTOR_REPLIES: Record<string, Partial<Record<MentorVerdict, string>>> = {
  // Hero: the HVAC and electrical upgrade at a Fort Bragg training building.
  "W912PM27B0004": {
    pursue:
      "<p><strong>Pursue it.</strong> This is the size of HUBZone job Wilmington District sets aside, and you self-perform both trades. This week:</p><ul><li>Call your surety today for the bid bond, and get the final-bond OK in writing.</li><li>Email the contract specialist before questions close: \"Which Davis-Bacon class applies to refrigerant piping and setting HVAC equipment?\" Every bidder sees the answer, so ask it plainly. Until then, price piping at the pipefitter rate.</li></ul><p>Lead with your Pope job: same base, same trades, a Very Good rating. — Sarah</p>",
    discuss:
      "<p><strong>Let's talk first.</strong> Book 20 minutes with me and bring the surety letter and the switchboard lead time. — Sarah</p>",
    pass:
      "<p><strong>Pass.</strong> If your surety won't confirm the room in writing this week, don't bid. A bid you can't bond is a bid you lose. — Sarah</p>",
  },
  // The Pope split systems, if Tim sends that one instead.
  "FA445227Q0007": {
    pursue:
      "<p><strong>Pursue it.</strong> Same buyer, same trades, and they rated your last job Very Good. Name the same crew lead and quote a firm 90-day schedule. — Sarah</p>",
  },
};
