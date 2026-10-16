// Plain-English glosses for every facet and every option that appears
// in the Opportunities filter UI. First-timers should be able to grok
// each filter without GovCon knowledge.

import { setAsideDisplayLabel } from "./oppDisplay";

export type Gloss = { label: string; gloss: string };

export const FACET_GLOSS: Record<string, Gloss> = {
  states: {
    label: "Place of Performance",
    gloss: "Where the work actually gets done. Pick all the places you'd actually go.",
  },
  cities: {
    label: "City",
    gloss: "Narrow to specific cities within your selected states — type a city and press Enter.",
  },
  radius: {
    label: "Within radius",
    gloss: "How far you're willing to mobilize from your HQ.",
  },
  setAsides: {
    label: "Set-aside",
    gloss:
      "Contracts only certain businesses can bid — your SDVOSB status qualifies you for several.",
  },
  valueRange: {
    label: "Estimated Contract Value",
    gloss: "Roughly what the contract is worth — an estimate, not a final number.",
  },
  dueWindow: {
    label: "Response Due Date",
    gloss: "How much runway you have until your response is due.",
  },
  naics: {
    label: "NAICS code",
    gloss: "The government's industry codes — we've prefilled yours (238160 Roofing Contractors).",
  },
  psc: {
    label: "PSC / FSC code",
    gloss: "What the government is buying, by product/service code.",
  },
  noticeTypes: {
    label: "Notice type",
    gloss: "What stage the opportunity is in.",
  },
  agencies: {
    label: "Agency",
    gloss: "Which buyer office posted the notice. Prefilled with your target installations.",
  },
  pop: {
    label: "Place of performance",
    gloss: "Where the actual work happens (state, county, ZIP).",
  },
  postedWithin: {
    label: "Posted",
    gloss: "Only show notices posted in the last N days.",
  },
  vehicles: {
    label: "Contract vehicle",
    gloss:
      "Pre-negotiated contracts like IDIQ, BPA, MATOC — bigger ceilings, recurring task orders.",
  },
  status: {
    label: "Status",
    gloss: "Active only hides expired and awarded notices.",
  },
  toggles: {
    label: "Smart toggles",
    gloss: "Personal shortcuts to clean up your feed.",
  },
};

// Per-option glosses
export const OPTION_GLOSS: Record<string, string> = {
  // Set-asides
  "setAsides:VOSB": "Veteran-Owned Small Business (includes SDVOSB).",
  "setAsides:SB": "Total Small Business — broad pool, you also qualify.",
  "setAsides:8A": "SBA 8(a) program — disadvantaged business.",
  "setAsides:WOSB": "Women-Owned Small Business (and EDWOSB).",
  "setAsides:HUBZone": "Historically Underutilized Business Zone.",
  "setAsides:MWDBE": "State & local minority/women/disadvantaged business set-asides.",
  "setAsides:FULL_OPEN": "Open to all businesses — you're competing with the big companies too.",

  // Due windows
  "dueWindow:this_week": "Closes in 7 days.",
  "dueWindow:2_weeks": "Closes in 14 days.",
  "dueWindow:30_days": "Closes in 30 days.",
  "dueWindow:60_plus": "60+ days runway — time to team up.",
  "dueWindow:any": "Any deadline.",

  // Status
  "status:active": "Only opportunities still accepting bids.",
  "status:include_expiring": "Active plus closing in 48 hrs.",
  "status:all": "Active, expiring, and recently closed.",

  // Notice types (PRD §4)
  "noticeTypes:solicitation": "A live request for bids — you can bid on this now.",
  "noticeTypes:rfp": "A formal request for a full proposal — usually for bigger or complex work.",
  "noticeTypes:rfq":
    "A request for a price quote — usually quicker and simpler than a full proposal.",
  "noticeTypes:combined": "The announcement and the bid request rolled into one — you can bid now.",
  "noticeTypes:sources_sought":
    "Early notice — the agency is seeing who's out there. Not a bid yet, but a chance to get on their radar.",
  "noticeTypes:rfi":
    "The agency is gathering info before they decide what to buy. Not a bid — a chance to influence it early.",
  "noticeTypes:presol": "A heads-up that a real bid is coming soon — get ready and watch for it.",
  "noticeTypes:special":
    "A general announcement — could be an industry day, an update, or other news.",

  // Vehicles
  "vehicles:idiq": "Indefinite Delivery / Indefinite Quantity.",
  "vehicles:bpa": "Blanket Purchase Agreement.",
  "vehicles:matoc": "Multiple Award Task Order Contract.",
  "vehicles:future": "Recompetes and upcoming awards.",

  // Toggles
  "toggles:excludeNoBid": 'Hide notices you marked "No bid".',
  "toggles:favoritesOnly": "Only show favorites you saved.",
  "toggles:civilianOnly": "Hide DoD agencies.",
  "toggles:dodOnly": "Only DoD agencies.",
};

// Plain-English glosses for opportunity-surface TERMS (labels on the card,
// detail page, and field headers). Single source of truth — see PRD master table.
export const TERM_GLOSS: Record<string, string> = {
  placeOfPerformance: "Where the work actually gets done.",
  estimatedContractValue: "Roughly what the contract is worth — an estimate, not a final number.",
  responseDueDate: "The date your response is due.",
  proposalDueDate: "The date your proposal is due.",
  fullAndOpen: "Open to all businesses — you're competing with the big companies too.",
  noticeType: "What kind of notice this is and what you can do about it.",
  // Opportunity categories (PRD Doc 93)
  grant: "Money the government gives to fund a project — you apply for it, you don't bid a price.",
  forecast: "A heads-up that an opportunity is expected — not open yet, but time to get ready.",
  productBuy:
    "A quick-turnaround product order from DLA's bid board (DIBBS). Quote a price for parts or supplies — small orders are often awarded automatically.",
  fastAward:
    "Meets the criteria and the system can award it automatically — often within days, no human review.",
};

export function termGloss(key: string): string | undefined {
  return TERM_GLOSS[key];
}

export function gloss(facet: string, value?: string): string | undefined {
  if (value) return OPTION_GLOSS[`${facet}:${value}`];
  return FACET_GLOSS[facet]?.gloss;
}

/** Plain-English glosses keyed by the label as it is DISPLAYED on screen. */
export const LABEL_GLOSS: Record<string, string> = {
  Agency: "The government office that wants to buy this.",
  // The three verdict words. The feed's intro sentence (`FeedIntro`) is the ONLY
  // place they are taught, so these three entries carry that job alone — a
  // `GlossTerm` with no gloss renders a bare span and explains nothing. The
  // buckets come from the backend match tier — see `lib/verdict.ts` — so each
  // sentence describes a fit, never a decision.
  Bid: "A strong fit. The work, your certifications and the place all line up.",
  Review: "A partial fit. Something needs a look before you commit.",
  "No Bid": "A weak fit. Hunter found no strong reason for you to bid.",
  "Estimated Contract Value": TERM_GLOSS.estimatedContractValue,
  "Expected posting": TERM_GLOSS.forecast,
  "Fast award": TERM_GLOSS.fastAward,
  "Full and Open Competition": TERM_GLOSS.fullAndOpen,
  "Notice type": TERM_GLOSS.noticeType,
  "Place of Performance": TERM_GLOSS.placeOfPerformance,
  "Proposal Due Date": TERM_GLOSS.proposalDueDate,
  "Response Due Date": TERM_GLOSS.responseDueDate,
  Scope: "The kind of work this is, in the industry terms the government uses.",
  "Set-aside": "A contract that only one kind of business can bid on.",
};

// Sentences that two set-aside keys share. The taxonomy code and the live-feed
// filter token mean the same thing, so they point at one string.
const TOTAL_SMALL_BUSINESS =
  "Only small businesses can bid. This is the widest set-aside there is.";
const HUBZONE_SET_ASIDE =
  "Only businesses based in a HUBZone can bid. A HUBZone is an area the government wants to bring jobs to.";
const VETERAN_SET_ASIDE = "Only small businesses owned by veterans can bid.";

/** Plain-English glosses keyed by the backend set-aside CODE. */
export const SET_ASIDE_GLOSS: Record<string, string> = {
  // Small business
  SBA: TOTAL_SMALL_BUSINESS,
  SB: TOTAL_SMALL_BUSINESS,
  ESB: "Only the smallest businesses can bid. The size limit is lower than the normal small-business limit.",
  LAS: "Only businesses in a declared disaster area can bid. The agency buys local to help the area recover.",
  SBP: "Part of the work is kept for small businesses. Larger businesses can bid for the rest.",

  // 8(a) business development
  "8A": "Only businesses in the government's 8(a) development program can bid. The program helps owners who face a social or economic disadvantage.",
  "8AN":
    "The agency gives this work to one business in the 8(a) development program. There is no competition.",

  // HUBZone
  HZC: HUBZONE_SET_ASIDE,
  HUBZone: HUBZONE_SET_ASIDE,
  HZS: "The agency gives this work to one business based in a HUBZone. There is no competition.",

  // Women-owned
  WOSB: "Only small businesses owned by women can bid.",
  WOSBSS:
    "The agency gives this work to one small business owned by women. There is no competition.",
  EDWOSB: "Only small businesses owned by women with limited personal wealth can bid.",
  EDWOSBSS:
    "The agency gives this work to one small business owned by women with limited personal wealth. There is no competition.",

  // Veteran-owned
  SDVOSBC: "Only small businesses owned by veterans who were disabled in service can bid.",
  SDVOSBS:
    "The agency gives this work to one small business owned by a veteran who was disabled in service. There is no competition.",
  VSA: VETERAN_SET_ASIDE,
  VOSB: VETERAN_SET_ASIDE,
  VSS: "The agency gives this work to one small business owned by a veteran. There is no competition.",

  // Native American and Tribal
  IEE: "Only businesses owned by Native Americans or by a tribe can bid.",
  ISBEE: "Only small businesses owned by Native Americans or by a tribe can bid.",
  BI: "Only businesses owned by Native Americans or by a tribe can bid. The Buy Indian Act lets the agency reserve the work this way.",
  BICiv:
    "Only businesses owned by Native Americans or by a tribe can bid. This is the civilian-agency form of the Buy Indian Act.",
  NATIVE_TRIBAL: "Work kept for businesses owned by Native Americans or by a tribe.",

  // State and local
  MWDBE:
    "A state or local contract kept for businesses owned by minorities, women, or other disadvantaged owners.",

  // No set-aside
  FULL_OPEN: TERM_GLOSS.fullAndOpen,
};

/** Resolves a displayed term or a set-aside code to its gloss. */
export function glossFor(term: string): string | undefined {
  const key = term.trim();
  return SET_ASIDE_GLOSS[key] ?? LABEL_GLOSS[key] ?? LABEL_GLOSS[setAsideDisplayLabel(key)];
}
