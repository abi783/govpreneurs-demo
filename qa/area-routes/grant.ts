// Deep routes owned by the grant agent. Append here, never in qa/routes.ts.
//
// `?met=1` passes Grant's introduction without remembering it. The crawl clears
// storage before every load, so without it the crawl would only ever see the
// introduction card and never Grant's take.
export const ROUTES: string[] = [
  // The three hero opportunities.
  "/opportunities/SP4701-26-Q-0021?met=1", // Camp Mackall field meals: Bid as prime, Ava is building it
  "/opportunities/W912EE-26-R-0066?met=1", // Fort Bragg dining: Bid as a subcontractor
  "/opportunities/SP4701-26-R-0078?met=1", // Camp Mackall restricted site: No-bid, with the roadmap
  // Grant's introduction, before the analysis.
  "/opportunities/SP4701-26-Q-0021",
  // The other Ava bids.
  "/opportunities/FAYNC-2026-R-08?met=1",
  "/opportunities/CUMCO-2026-014?met=1",
  "/opportunities/W912EE-27-S-0004?met=1",
  // Five others: a generated Bid, a Bid with a mentor send, two reviews, a No-bid.
  "/opportunities/W912PM-26-Q-0017?met=1",
  "/opportunities/VA247-26-R-0112?met=1",
  "/opportunities/FA4800-26-Q-0044?met=1",
  "/opportunities/W912PM-26-R-0058?met=1",
  "/opportunities/N40085-26-Q-0089?met=1",
  // An id that is not in the story, and the retired awarded-contract page.
  "/opportunities/NOT-AN-ID",
  "/opportunities/awarded/C-1001",
];
