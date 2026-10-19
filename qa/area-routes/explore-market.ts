// Deep routes of Partners, Awards, Government Buyers, Vehicles and Labor Pricing.
// /partners and /awards are menu routes (qa/routes.ts), so they are not repeated here.
export const ROUTES: string[] = [
  // Partners: the three tabs, a company panel, a company that is not in the ranked feed
  // (4101), the winner link from Amira's own award (4000), and the old URLs.
  "/partners?view=find",
  "/partners?view=market",
  "/partners?view=mine",
  "/partners?view=find&company=4001",
  "/partners?view=find&company=4002",
  "/partners?view=find&company=4101",
  "/partners?view=find&company=4000",
  "/partner-finder",
  "/whos-winning",
  // Awards: filters, sorts, search, the saved tab and award pages.
  "/awards?view=saved",
  "/awards?filters=justAwarded&sort=recent",
  "/awards?filters=comingUpAgain&sort=largest",
  "/awards?filters=size&sort=largest&page=2",
  "/awards?filters=&q=haddad",
  "/awards/W91247-19-C-0021",
  "/awards/W81K04-24-P-0187",
  "/awards/FA4800-26-P-0007",
  "/awards/N40085-26-P-0212",
  "/awards/36C24723C0152",
  "/awards/W912HN-25-C-0071",
  // Government buyers
  "/government-buyers",
  "/government-buyers?near=all&buys=all",
  "/government-buyers?buyer=bragg-micc&focus=people",
  "/government-buyers?buyer=pope-aaf&focus=approach",
  "/government-buyers?buyer=cumberland-schools",
  "/government-buyers?buyer=va-nco6",
  "/government-buyers?q=navy",
  "/agencies",
  // Vehicles and labor pricing
  "/vehicles",
  "/labor-pricing",
];
