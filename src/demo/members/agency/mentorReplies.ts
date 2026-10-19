// THE AGENCY: Sarah's replies for the presenter's "Sarah answers" control,
// keyed by opportunity id (read through src/demo/story/mentorReplies.ts).
// From the approved pack (demo-storyboard/marketing-agency-pack.md, section 7).

import type { MentorVerdict } from "../../story/mentorReplies";

export const MENTOR_REPLIES: Record<string, Partial<Record<MentorVerdict, string>>> = {
  // Hero: the Family Advocacy print and digital campaign at Fort Bragg.
  "W91247-27-Q-0108": {
    pursue:
      "<p><strong>Pursue it.</strong> This is exactly the size and kind of buy Army family programs make, and the set-aside is yours. Two things this week:</p><ul><li>Email the contract specialist before Q&amp;A closes: \"Does a local news partner's app meet the app requirement?\" Every bidder sees the answer, so ask it plainly.</li><li>Get signed rate quotes from all four papers, locked for 12 months, with a stated increase per option year. Five fixed-price years with unlocked rates is where small agencies lose money.</li></ul><p>Lead with your NC Guard campaign. Same Army, same families. — Sarah</p>",
    discuss:
      "<p><strong>Let's talk first.</strong> The app line may be written for the firm that held this before. Book 20 minutes with me this week and bring your print quotes. — Sarah</p>",
    pass:
      "<p><strong>Pass on this one.</strong> Five years of fixed-price print with no locked rates is a risk you don't need yet. Put those hours into getting on a GSA schedule. — Sarah</p>",
  },
  // The Fort Bragg MWR design support, if Tim sends that one instead.
  "MWR-FB-27-0006": {
    pursue:
      "<p><strong>Pursue it.</strong> Small, woman-owned and steady work for your design team. Show three MWR-style posters you've made, and quote a price per item so they can order as needed. — Sarah</p>",
  },
};
