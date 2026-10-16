// THE STORY, part 3: what Grant says on the opportunities Tim will open.
//
// This is content, not the data shape. The Grant agent encodes each brief
// into production's `GrantAnalysis` (src/lib/grant/types.ts), field by field.
// Fort Bragg dining, the Camp Mackall restricted site and the Fort Bragg
// sources sought start from Karthik's hand-written catering reviews
// (prototype src/lib/grant/fixtures.ts) and must agree with the facts here.
//
// Voice: Grant talks to Amira as "you". Plain words. No promise of a win.

export type ReadName =
  | "Can you win it?"
  | "Is it your kind of work?"
  | "Does the size fit?"
  | "Can you perform there?"
  | "Will you make money?"
  | "Can you survive winning?"
  | "Can you do the work?"
  | "Do you understand the buyer's intent?"
  | "Does this move you forward?";

export interface GrantBrief {
  oppId: string;
  /** 1–5 confidence dots. */
  confidence: number;
  gist: string;
  thesis: string;
  reads: Record<ReadName, { rating: "strong" | "good" | "watch" | "weak"; text: string }>;
  limits: string[];
  wouldChange: string[];
  nextMove: { label: string; to: string; rationale: string };
  secondaryMove?: { label: string; to: string };
  compliance: { requirement: string; status: "have" | "partial" | "missing"; note: string }[];
  redTeam: { challenge: string; answer: string }[];
  keyDates: { label: string; inDays: number }[];
  railBriefing: [string, string, string];
  chips: string[];
  /** Scripted answers for the rail chips and likely typed questions. */
  railAnswers: Record<string, string>;
}

export const GRANT_BRIEFS: GrantBrief[] = [
  // ── HERO 1: Camp Mackall field meals — Bid as prime ──────────────────
  {
    oppId: "SP4701-26-Q-0021",
    confidence: 4,
    gist: "Your work, your size, and only woman-owned firms can bid.",
    thesis:
      "This is the right first federal prime for you: close enough to deliver every day, sized for a five-person kitchen, and open only to woman-owned firms.",
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Field feeding is cook, pack and deliver. That is your food-service code and your mobile food code, and you delivered 1,100 meals a day for the county schools.",
      },
      "Does the size fit?": {
        rating: "strong",
        text: "About $220K a year over three years. That is about a third of your revenue: big enough to matter, small enough not to sink you.",
      },
      "Can you perform there?": {
        rating: "strong",
        text: "Camp Mackall is 45 miles from your kitchen. Your two refrigerated vans can cover both drop points in one run.",
      },
      "Can you do the work?": {
        rating: "watch",
        text: "Two things need you before the due date: 2 of your 5 cooks still need a food-handler certificate, and 5:30 AM breakfast drops mean a 3:30 AM start on rotation days.",
      },
      "Can you win it?": {
        rating: "good",
        text: "It is a new requirement with no incumbent, and only woman-owned firms can bid. Six woman-owned caterers within 100 miles are registered under your code.",
      },
      "Will you make money?": {
        rating: "good",
        text: "Field meals are priced per meal. At about $11.50 a meal, your usual 38% food cost leaves room after the wage-determination rates.",
      },
      "Can you survive winning?": {
        rating: "good",
        text: "The quote asks for no bond. The base year adds about a third to your revenue, which your kitchen can absorb with one part-time cook for peak weeks.",
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The Army wants hot meals in the field without running its own field kitchens. On-time delivery is scored first; menu variety is second.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A first federal prime at Fort Bragg is the record you need for the dining-hall recompete in two years.",
      },
    },
    limits: [
      "Food-handler certificates: the quote asks for proof for every cook, and 2 of your 5 do not have one yet.",
      "Early starts: 5:30 AM drops mean a 3:30 AM start on about 18 rotation weeks a year.",
      "Thin federal prime record: Womack is your only federal prime, and its performance rating is not written yet.",
    ],
    wouldChange: [
      "If the last two cooks can't be certified before the due date, I'd move this to Needs review.",
      "If an amendment adds a third drop point, I'd check that two vans still cover it.",
    ],
    nextMove: {
      label: "Build the quote with Ava",
      to: "/ava/SP4701-26-Q-0021",
      rationale: "26 days is enough. Ava needs your delivery plan, your menus and one price decision.",
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active until April 2027." },
      { requirement: "Woman-owned small business (WOSB) certification", status: "have", note: "Certified in SBA's MySBA Certifications." },
      { requirement: "Registered under NAICS 722310", status: "have", note: "Your primary code." },
      { requirement: "Food-handler certificate for every cook", status: "partial", note: "3 of 5 cooks certified." },
      { requirement: "HACCP food-safety plan", status: "have", note: "Used on the Carolina Dining Group subcontract." },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
      { requirement: "Commercial vehicle insurance", status: "have", note: "Both vans covered." },
      { requirement: "Two past-performance references", status: "have", note: "Cumberland County Schools and Carolina Dining Group." },
    ],
    redTeam: [
      {
        challenge: "Is a five-person team enough for 18 rotations a year?",
        answer: "Yes for most weeks. Twice a year two rotations overlap; plan one part-time cook for those weeks.",
      },
      {
        challenge: "Could a large caterer undercut you on price?",
        answer: "No. The set-aside limits bidders to woman-owned small businesses.",
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: 12 },
      { label: "Quotes due", inDays: 26 },
      { label: "Expected award", inDays: 47 },
    ],
    railBriefing: [
      "I read the quote request, the work statement and the wage determination.",
      "It is a strong fit. Two staffing items need you before the due date.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Can I fix this in time?", "Where am I weak?", "What should my response say?"],
    railAnswers: {
      "Can I fix this in time?":
        "Yes. A food-handler course takes one day and the exam is the same day, so two cooks can be certified this week. Book them now; then upload the certificates to My Business so Ava can attach them.",
      "Where am I weak?":
        "Your federal prime record. Womack is your only federal prime and has no rating yet. Lead with the Carolina Dining Group subcontract at Fort Bragg — same base, same kind of work — and ask Womack for an interim rating.",
      "What should my response say?":
        "Three things, in this order: on-time delivery (your two vans and a 3:30 AM start), food safety (HACCP plan and certified cooks), and Fort Bragg experience (the Carolina Dining Group work). Ava will draft it in that order.",
      "Can I win it?":
        "No one can promise that. What I can say: it is a new requirement with no incumbent, only woman-owned firms can bid, and your record matches what the Army scores first.",
      "Do I have enough time?":
        "Yes. 26 days, and Ava needs about 3 hours of your answers. The one item with a lead time is the two food-handler certificates.",
    },
  },

  // ── Fayetteville Public Works cafe — Bid ──────────────────────────────
  {
    oppId: "FAYNC-2026-R-08",
    confidence: 4,
    gist: "Local, your size, and scored on approach, where your event menus earn points.",
    thesis:
      "A hometown contract scored on approach and experience, sized for you, with a buyer who can drive past your kitchen. Bid it with your event work up front.",
    reads: {
      "Is it your kind of work?": { rating: "strong", text: "A staff cafe plus about 20 events a year. Events are your strongest work." },
      "Does the size fit?": { rating: "strong", text: "About $210K a year, a third of your revenue." },
      "Can you perform there?": { rating: "strong", text: "The Public Works campus is 3 miles from your kitchen." },
      "Can you do the work?": { rating: "good", text: "A daily cafe is new for you. Your county summer program is your proof of daily service." },
      "Can you win it?": { rating: "good", text: "It is scored 40% approach, 30% experience, 30% price, so the best plan can beat the lowest price." },
      "Will you make money?": { rating: "good", text: "Cafe sales carry the base; events carry the margin." },
      "Can you survive winning?": { rating: "strong", text: "No bond, monthly invoicing, and a city that pays in 30 days." },
      "Do you understand the buyer's intent?": { rating: "strong", text: "The city wants staff to eat on site and events handled by one vendor." },
      "Does this move you forward?": { rating: "strong", text: "A local anchor contract and a reference the next city bid will ask for." },
    },
    limits: [
      "A daily cafe is new for you: show the county summer program as proof of daily service.",
      "Addendum 1 moved the due date and added a question on staffing; your answer must cover it.",
    ],
    wouldChange: ["If the city adds a liquor-license requirement for events, I'd move this to Needs review."],
    nextMove: {
      label: "Open the proposal Ava built",
      to: "/ava/FAYNC-2026-R-08",
      rationale: "Ava finished it and Sarah reviewed it. Read her notes, then send.",
    },
    secondaryMove: { label: "Read Sarah's notes", to: "/mentors/rev-fayetteville-proposal" },
    compliance: [
      { requirement: "NC business registration", status: "have", note: "Active." },
      { requirement: "City vendor registration", status: "have", note: "Registered with the City of Fayetteville." },
      { requirement: "Food-service permit (Cumberland County)", status: "have", note: "Current." },
      { requirement: "Three references", status: "have", note: "County schools, Carolina Dining Group, Riverside Fellowship Church." },
    ],
    redTeam: [
      { challenge: "Will the city prefer the current cafe vendor?", answer: "The current vendor does not do events, which is why the city combined the two." },
    ],
    keyDates: [
      { label: "Questions due", inDays: 5 },
      { label: "Proposals due", inDays: 14 },
    ],
    railBriefing: [
      "I read the request for proposals and Addendum 1.",
      "It is a strong local fit, and Ava's draft is ready.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Where am I weak?", "What should my response say?", "Do I have enough time?"],
    railAnswers: {
      "Where am I weak?": "Daily cafe experience. Lead section 2 with the county summer program: 1,100 meals a day for 11 weeks is daily service.",
      "What should my response say?": "Approach first: a sample weekly cafe menu and how you staff 20 events. Then experience, then price.",
      "Do I have enough time?": "Yes. The proposal is written; Sarah's notes take about an hour to apply.",
    },
  },

  // ── Cumberland County detention meals — Bid ───────────────────────────
  {
    oppId: "CUMCO-2026-014",
    confidence: 3,
    gist: "A price-only sealed bid from a county that knows you.",
    thesis:
      "The county already trusts your food, and a sealed bid is decided on price. Bid it, once every cook has a food-handler certificate.",
    reads: {
      "Is it your kind of work?": { rating: "strong", text: "Hot meals cooked off-site and delivered, three times a day." },
      "Does the size fit?": { rating: "good", text: "About $350K a year, more than half your revenue." },
      "Can you perform there?": { rating: "strong", text: "The annex is in Fayetteville, minutes from your kitchen." },
      "Can you do the work?": { rating: "watch", text: "The county requires a food-handler certificate for every cook. You have 3 of 5." },
      "Can you win it?": { rating: "good", text: "Lowest price from a qualified bidder wins. Your costs are low because the kitchen is close." },
      "Will you make money?": { rating: "watch", text: "Price-only bids are thin. Hold food cost under 40% or walk away." },
      "Can you survive winning?": { rating: "good", text: "A 5% bid bond and a payment bond; both within your $200K bonding history." },
      "Do you understand the buyer's intent?": { rating: "strong", text: "Reliable, safe, low-cost meals with no surprises." },
      "Does this move you forward?": { rating: "good", text: "Steady year-round volume that smooths out your event seasons." },
    },
    limits: [
      "The county rejects any bid without a food-handler certificate for every cook. You have 3 of 5.",
      "Thin margin: price-only, so every cent of food cost matters.",
    ],
    wouldChange: ["If the certificates can't be in place by the due date, I'd move this to No-bid."],
    nextMove: {
      label: "Upload the certificates so Ava can continue",
      to: "/ava/CUMCO-2026-014",
      rationale: "Ava paused at the eligibility check. Two certificates unblock the whole bid.",
    },
    compliance: [
      { requirement: "Food-handler certificate for every cook", status: "partial", note: "3 of 5." },
      { requirement: "5% bid bond", status: "have", note: "Within your surety history." },
      { requirement: "County vendor registration", status: "have", note: "Active." },
    ],
    redTeam: [{ challenge: "Can a national vendor bid lower?", answer: "Possibly, but their delivery costs from out of county are higher than yours." }],
    keyDates: [
      { label: "Pre-bid conference", inDays: 4 },
      { label: "Bids due", inDays: 20 },
    ],
    railBriefing: [
      "I read the invitation for bid and the price form.",
      "It fits, but it is paused on two certificates.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Can I fix this in time?", "Where am I weak?", "Do I have enough time?"],
    railAnswers: {
      "Can I fix this in time?": "Yes. Two cooks, one day each. Upload the certificates and Ava picks the bid back up.",
      "Where am I weak?": "Margin. Price-only bids reward discipline: keep food cost under 40%.",
      "Do I have enough time?": "Yes: 20 days, and the price form is the only document.",
    },
  },
];

export function getGrantBrief(oppId: string): GrantBrief | undefined {
  return GRANT_BRIEFS.find((b) => b.oppId === oppId);
}
