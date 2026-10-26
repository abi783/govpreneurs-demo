// DEMO: search entries that come straight from the story, so the palette can
// find every opportunity, every bid Ava is building and every mentor review.

import { AVA_BIDS, OPPORTUNITIES } from "@/demo/story/opportunities";
import { MENTOR_REVIEWS } from "@/demo/story/workspace";
import { registerSearchEntries } from "./searchIndex";

registerSearchEntries([
  ...OPPORTUNITIES.map((o) => ({
    label: o.plainTitle,
    hint: "Opportunity",
    to: `/opportunities/${o.id}`,
    keywords: [o.id, o.title, o.agency, o.office],
  })),
  ...AVA_BIDS.map((o) => ({
    label: `Ava: ${o.plainTitle}`,
    hint: "Bid",
    to: `/ava/${o.id}`,
    keywords: [o.id, "ava", "bid"],
  })),
  ...MENTOR_REVIEWS.map((r) => ({
    label: r.title,
    hint: "Mentor review",
    to: `/mentors/${r.id}`,
    keywords: ["mentor", "diana", "review"],
  })),
]);
