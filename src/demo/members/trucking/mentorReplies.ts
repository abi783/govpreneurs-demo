// THE TRUCKING COMPANY: Diana's replies for the presenter's "Diana answers"
// control, keyed by opportunity id (read through src/demo/story/mentorReplies.ts).
// From the pack (demo-storyboard/trucking-pack.md, section 7).

import type { MentorVerdict } from "../../story/mentorReplies";

export const MENTOR_REPLIES: Record<string, Partial<Record<MentorVerdict, string>>> = {
  // Hero: supply and linen runs for the Fayetteville VA.
  "36C24627Q0088": {
    pursue:
      "<p><strong>Pursue it.</strong> This is exactly the size and kind of trucking VA sets aside for firms like yours. This week:</p><ul><li>Email the contract specialist before Q&amp;A closes: \"Which license does the hazardous material license number line mean, and what bond amount do drivers need?\" Every bidder sees the answer, so ask it plainly.</li><li>Ask whether VA will add a fuel adjustment. If not, quote diesel at a stated base price and write it into your quote. Five fixed-price years with unpriced fuel is where small carriers lose money.</li></ul><p>— Diana</p>",
    discuss:
      "<p><strong>Let's talk first.</strong> The license line may be left over from a courier contract. Book 20 minutes with me and bring your fuel numbers. — Diana</p>",
    pass:
      "<p><strong>Pass.</strong> Five years of fixed-price diesel with no adjustment is a risk you don't need yet. Put the hours into SDDC's carrier program. — Diana</p>",
  },
  // The Fort Bragg trailer hauling, if Tim sends that one instead.
  "W91247-27-Q-0119": {
    pursue:
      "<p><strong>Pursue it.</strong> It's the job you just finished, for the same buyer. Ask for an interim rating on the last one and attach it to your quote. — Diana</p>",
  },
};
