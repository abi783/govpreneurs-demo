// THE TRUCKING COMPANY's opportunities: Rockfish Run Freight's whole feed.
// Read through src/demo/story/opportunities.ts, which holds the rules and types
// and picks the active member.
//
// Source: demo-storyboard/trucking-pack.md (19 Oct 2026), section 10. The hero
// is modeled on VA NCO 6's SDVOSB cook-chill routes (36C24621Q0455) and the
// Fayetteville courier's site list (36C24623Q0325); the twin on DLA
// Distribution's protective-service freight (SP3300-09-R-0053); the team-up on
// Fort Bragg's EAGLE task order (W52P1J13G0027, re-solicited as W519TC23R0019).
// Buyers are real; notice ids are invented in the buyers' formats; companies
// are fictional. Distances count from the yard in Fayetteville (places.ts), not
// the pack's Hope Mills.

import type {
  GrantCall,
  HunterTier,
  NoticeType,
  SetAside,
  StoryOpportunity,
} from "../../story/opportunities";
import type { PlaceKey } from "../../story/places";

export const HERO_IDS = {
  /** Hunter → Grant "Bid" → Sarah → Ava builds it. Supply and linen runs for the Fayetteville VA. */
  hero: "36C24627Q0088",
  /** Grant: No-bid. Her truckload code and a set-aside she holds, but only SDDC-approved secure carriers get the papers. */
  twin: "SP3300-27-R-5007",
  /** Grant: bid as a subcontractor; Partners shows the EAGLE prime. Fort Bragg's base logistics contract. */
  teamUp: "W519TC27R0011",
} as const;

const VA = "Department of Veterans Affairs";
const VA_NCO6 = "Network Contracting Office 6 (NCO 6)";
const ARMY = "Department of the Army";
const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const USPFO = "U.S. Property and Fiscal Office for North Carolina (NC National Guard)";

export const OPPORTUNITIES: StoryOpportunity[] = [
  // ── HERO ──────────────────────────────────────────────────────────────
  {
    id: "36C24627Q0088",
    title: "Supply and Linen Transportation Services: Fayetteville VA Coastal Health Care System",
    plainTitle: "Supply and linen runs for the Fayetteville VA",
    agency: VA,
    office: VA_NCO6,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SDVOSBC",
    naics: "484110",
    valueLow: 210_000,
    valueHigh: 260_000,
    valueBasis: "per_year",
    place: "fayetteville",
    postedDaysAgo: 5,
    closesInDays: 24,
    dueTime: "10:00 AM Eastern",
    targetAgency: true,
    summary:
      "Two daily routes, Monday to Friday, about 400 miles a day: clean linen and supplies from the Fayetteville VA Medical Center warehouse to the Fayetteville clinic and the Sanford, Goldsboro, Jacksonville, Wilmington and Brunswick sites, with soiled linen and returns back. Lift gates, GPS, bonded drivers who pass VA background checks, and a named PM and Alternate; a base year and 4 options. The price schedule asks for a \"hazardous material license number\".",
    hunter: {
      tier: "priority",
      score: 95,
      forYouRank: 1,
      line:
        "Supply and linen runs for the Fayetteville VA: your local-freight code, a set-aside for service-disabled veteran-owned firms, about $235K a year, and across town from your yard.",
      fit: [
        { kind: "naics", code: "484110", says: "your local-freight code" },
        { kind: "setAside", code: "SDVOSBC", says: "a set-aside for service-disabled veteran-owned firms" },
        { kind: "valueInRange", says: "about $235K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine:
        "Bid it as prime. It's your trucks, your size and your set-aside. Fix two things first: the license line and the fuel price.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "drafting",
      note: "Grant says bid. Ava has read the quote papers and has 3 questions for you. No mentor has seen it yet.",
      next: { label: "Send to a mentor", to: "/opportunities/36C24627Q0088" },
      lastActivityDaysAgo: 0,
    },
    ava: {
      kind: "short-response",
      stage: "answer my questions",
      needsYou: true,
      paused: false,
      statusLine: "Ava has 3 questions for you about your PM and Alternate, the trucks and the license line.",
    },
  },

  // ── Fort Bragg: the job she just finished, posted again ──────────────
  {
    id: "W91247-27-Q-0119",
    title: "On-Call Trailer and Container Transportation, 18th Airborne Corps, Fort Bragg, NC",
    plainTitle: "On-call trailer and container hauling at Fort Bragg",
    agency: ARMY,
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "484220",
    valueLow: 40_000,
    valueHigh: 55_000,
    place: "fortBragg",
    postedDaysAgo: 4,
    closesInDays: 11,
    targetAgency: true,
    summary:
      "On-call moves of modular office trailers, containers and generators between unit areas and off-post yards for 12 months. The same work as the order that ended on 30 September.",
    hunter: {
      tier: "priority",
      score: 92,
      forYouRank: 2,
      line:
        "On-call trailer and container hauling at Fort Bragg: your specialized-freight code, the 18th Airborne Corps job you just finished, a small-business set-aside, and about $48K.",
      fit: [
        { kind: "naics", code: "484220", says: "your specialized-freight code" },
        { kind: "pastPerformance", id: "pp-bragg-trailer-hauling", says: "the 18th Airborne Corps job you just finished" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $48K" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. It's the job you just finished, posted again, and you know every gate it uses.",
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Saved 2 days ago. Grant has a take ready.",
      next: { label: "Review with Grant", to: "/opportunities/W91247-27-Q-0119" },
      lastActivityDaysAgo: 2,
    },
  },

  // ── THE TWIN ──────────────────────────────────────────────────────────
  {
    id: "SP3300-27-R-5007",
    title: "Protective Security Service Freight Transportation, DLA Distribution Cherry Point, NC",
    plainTitle: "Secure freight runs from DLA Distribution Cherry Point",
    agency: "Defense Logistics Agency",
    office: "DLA Distribution",
    scope: "fed",
    noticeType: "Request for Proposal",
    setAside: "SBA",
    naics: "484121",
    valueLow: 600_000,
    valueHigh: 800_000,
    valueBasis: "per_year",
    place: "cherryPoint",
    postedDaysAgo: 4,
    closesInDays: 18,
    lockedTo: "carriers SDDC has approved for secure cargo",
    summary:
      "Truckload runs of SECRET and CONFIDENTIAL cargo, and hazmat, from DLA Distribution Cherry Point across the lower 48, for a base year and 2 options. Only Surface Deployment and Distribution Command (SDDC) Protective Security Service approved freight carriers are eligible to receive the solicitation.",
    hunter: {
      tier: "stretch",
      score: 66,
      forYouRank: 3,
      line:
        "Secure freight runs from DLA Distribution Cherry Point: your truckload code, a small-business set-aside and about $700K a year, but only carriers SDDC has approved for secure cargo get the papers.",
      fit: [
        { kind: "naics", code: "484121", says: "your truckload code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $700K" },
        { kind: "lockedOut", says: "only carriers SDDC has approved for secure cargo get the papers" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: null,
      oneLine:
        "Don't bid. Only carriers SDDC has approved for secure cargo get the papers, and that approval needs a security clearance for your company and cleared drivers you don't have. Spend the time on the VA routes.",
      authored: true,
    },
  },

  // ── THE TEAM-UP ───────────────────────────────────────────────────────
  {
    id: "W519TC27R0011",
    title: "Draft RFP for Comment — Fort Bragg Logistics Readiness Center Maintenance, Supply and Transportation Services (EAGLE Task Order)",
    plainTitle: "Fort Bragg's base logistics contract, draft for comment",
    agency: ARMY,
    office: "Army Contracting Command — Rock Island (ACC-RI)",
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: null,
    naics: "561210",
    valueLow: 50_000_000,
    valueHigh: 60_000_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 6,
    closesInDays: 28,
    targetAgency: true,
    lockedTo: "holders of the Army's EAGLE ordering agreement",
    summary:
      "The Army asks for comments on its draft of Fort Bragg's next maintenance, supply and transportation contract, about $250M–$300M over 5 years. The RFP is expected in about 100 days, open only to holders of the Army's EAGLE ordering agreement; the current contract ends in 254 days.",
    hunter: {
      tier: "priority",
      score: 81,
      forYouRank: 4,
      line:
        "Fort Bragg's base logistics contract comes up in 2027: trucking is part of it and you've hauled on post, but only holders of the Army's EAGLE agreement can bid, and it's about $55M a year.",
      fit: [
        { kind: "targetAgency", says: "Fort Bragg's base logistics contract" },
        { kind: "pastPerformance", id: "pp-bragg-trailer-hauling", says: "you've hauled on post" },
        { kind: "lockedOut", says: "only holders of the Army's EAGLE agreement can bid" },
        { kind: "valueAboveRange", says: "about $55M" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "no_go",
      sub: "go",
      oneLine:
        "Team up. Only EAGLE agreement holders can bid, and each year is about 20 times your revenue. As Brightwater Sustainment's subcontractor you'd run the local freight and trailer moves, work you did for the 18th Airborne Corps.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Grant says team up. Brightwater Sustainment Group wants a local service-disabled veteran-owned carrier for the transportation work.",
      next: { label: "See partners", to: "/partners" },
      lastActivityDaysAgo: 1,
    },
  },

  // ── The rest of "Opportunities for you" ──────────────────────────────
  {
    id: "W91247-27-Q-0131",
    title: "Barracks Furniture Removal and Delivery, Fort Bragg, NC",
    plainTitle: "Barracks furniture moves at Fort Bragg",
    agency: ARMY,
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "484210",
    valueLow: 60_000,
    valueHigh: 90_000,
    place: "fortBragg",
    postedDaysAgo: 3,
    closesInDays: 14,
    targetAgency: true,
    summary:
      "Move old furniture out of a block of barracks and deliver the new sets, room by room, over six weeks. Past orders for this work went to movers from out of state.",
    hunter: {
      tier: "priority",
      score: 88,
      forYouRank: 5,
      line:
        "Barracks furniture moves at Fort Bragg: your moving code, a small-business set-aside, about $75K, and 12 miles from your yard.",
      fit: [
        { kind: "naics", code: "484210", says: "your moving code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $75K" },
        { kind: "distance", says: "12 miles from your yard" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. It's box-truck work 12 miles away, and past winners came from out of state.",
    },
  },
  {
    id: "M6700127Q0058",
    title: "On-Call Trailer Transport Services, Marine Corps Base Camp Lejeune, NC",
    plainTitle: "On-call trailer moves at Camp Lejeune",
    agency: "Department of the Navy",
    office: "Marine Corps Base Camp Lejeune Contracting Office",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "484220",
    valueLow: 35_000,
    valueHigh: 50_000,
    valueBasis: "per_year",
    place: "jacksonville",
    postedDaysAgo: 6,
    closesInDays: 16,
    targetAgency: true,
    summary:
      "On-call moves of office and storage trailers across Camp Lejeune for a base year and options. Each call is priced per move.",
    hunter: {
      tier: "strong",
      score: 76,
      forYouRank: 6,
      line:
        "On-call trailer moves at Camp Lejeune: your specialized-freight code, like your Fort Bragg trailer job, a small-business set-aside, and about $42K a year.",
      fit: [
        { kind: "naics", code: "484220", says: "your specialized-freight code" },
        { kind: "pastPerformance", id: "pp-bragg-trailer-hauling", says: "like your Fort Bragg trailer job" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $42K" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. It's your trailer work, but 100 miles away. Price the empty miles back to your yard.",
    },
  },
  {
    id: "W81K0427QA014",
    title: "Laboratory Specimen Courier Services, Army Medical Center, Fort Bragg, NC",
    plainTitle: "Lab specimen courier for Fort Bragg's Army hospital",
    agency: ARMY,
    office: "Medical Readiness Contracting Office — East (MRCO East)",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "492110",
    valueLow: 110_000,
    valueHigh: 140_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 8,
    closesInDays: 21,
    targetAgency: true,
    summary:
      "Twice-daily specimen runs from the hospital's clinics to the hospital lab, plus rush calls answered within 2 hours, day or night. A base year and options.",
    hunter: {
      tier: "strong",
      score: 74,
      forYouRank: 7,
      line:
        "Lab specimen courier for Fort Bragg's Army hospital: your courier code, a small-business set-aside, about $125K a year, and 12 miles from your yard.",
      fit: [
        { kind: "naics", code: "492110", says: "your courier code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $125K" },
        { kind: "distance", says: "12 miles from your yard" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. It's on post, but 2-hour calls around the clock need a third driver.",
    },
    saved: true,
    pursuit: {
      stage: "with_mentor",
      note: "Sarah read your quote and wants to talk first.",
      next: { label: "Read Sarah's reply", to: "/mentors/rev-lab-courier" },
      lastActivityDaysAgo: 0,
    },
    mentorReviewId: "rev-lab-courier",
  },
  {
    id: "36C24627Q0095",
    title: "Furniture and Equipment Relocation Services, Fayetteville VA Medical Center",
    plainTitle: "Furniture and equipment moves at the Fayetteville VA",
    agency: VA,
    office: VA_NCO6,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SDVOSBC",
    naics: "484210",
    valueLow: 40_000,
    valueHigh: 70_000,
    place: "fayetteville",
    postedDaysAgo: 5,
    closesInDays: 17,
    targetAgency: true,
    summary:
      "Move furniture and equipment between floors and buildings at the medical center while two wards are renovated, with a 4-person crew and a box truck on call.",
    hunter: {
      tier: "priority",
      score: 86,
      forYouRank: 8,
      line:
        "Furniture and equipment moves at the Fayetteville VA: your moving code, a set-aside for service-disabled veteran-owned firms, about $55K, and across town.",
      fit: [
        { kind: "naics", code: "484210", says: "your moving code" },
        { kind: "setAside", code: "SDVOSBC", says: "a set-aside for service-disabled veteran-owned firms" },
        { kind: "valueInRange", says: "about $55K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Box trucks and a 4-person crew, across town, and set aside for firms like yours.",
    },
  },
  {
    id: "D6D2.POC.036",
    title: "On-Call Hauling Services, Cumberland County, Calendar Year 2027",
    plainTitle: "On-call storm hauling in Cumberland County, 2027",
    agency: "NC Department of Transportation",
    office: "Division 6",
    scope: "sled",
    noticeType: "Invitation for Bid",
    setAside: null,
    naics: "484220",
    valueLow: 60_000,
    valueHigh: 150_000,
    place: "fayetteville",
    postedDaysAgo: 7,
    closesInDays: 22,
    dueTime: "2:00 PM Eastern",
    targetAgency: true,
    summary:
      "Trucks and drivers on call after storms in 2027, hauling debris and road materials at hourly rates. The lowest responsible bid gets it.",
    hunter: {
      tier: "strong",
      score: 80,
      forYouRank: 9,
      line:
        "On-call storm hauling in Cumberland County: your specialized-freight code, the storm hauling you did for Division 6 in 2025, and about $105K.",
      fit: [
        { kind: "naics", code: "484220", says: "your specialized-freight code" },
        { kind: "pastPerformance", id: "pp-ncdot-storm-hauling", says: "the storm hauling you did for Division 6 in 2025" },
        { kind: "valueInRange", says: "about $105K" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Division 6 is your 2025 buyer, and the lowest responsible bid gets it.",
    },
  },
  {
    id: "RFP27-11-EM",
    title: "Emergency Trucking and Drivers for Hurricane Supply Distribution Sites — Cumberland County",
    plainTitle: "Trucks and drivers for hurricane supply sites",
    agency: "Cumberland County, NC",
    office: "Emergency Services",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "484110",
    valueLow: 40_000,
    valueHigh: 90_000,
    place: "fayetteville",
    postedDaysAgo: 9,
    closesInDays: 30,
    summary:
      "Trucks and drivers on call to stock the county's supply sites before and after a hurricane, paid for standby hours and for each run.",
    hunter: {
      tier: "strong",
      score: 78,
      forYouRank: 10,
      line: "Trucks and drivers for hurricane supply sites: your local-freight code, about $65K, on call, and across town.",
      fit: [
        { kind: "naics", code: "484110", says: "your local-freight code" },
        { kind: "valueInRange", says: "about $65K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. On call and close by. Price the standby hours, not just the runs.",
    },
  },
  {
    id: "HCR-28370",
    title: "Highway Contract Route 28370: Fayetteville Processing and Distribution Center",
    plainTitle: "Mail route out of the Fayetteville mail plant",
    agency: "U.S. Postal Service",
    office: "Surface Transportation",
    scope: "fed",
    noticeType: "Solicitation",
    setAside: null,
    naics: "484121",
    valueLow: 280_000,
    valueHigh: 360_000,
    valueBasis: "per_year",
    place: "fayetteville",
    postedDaysAgo: 6,
    closesInDays: 25,
    summary:
      "Daily tractor-trailer trips carrying mail between the Fayetteville mail plant and post offices in the region, paid at a fixed rate per trip. USPS posts and awards it in its own system, not SAM.gov, under its own rules, so there are no set-asides.",
    hunter: {
      tier: "stretch",
      score: 62,
      forYouRank: 11,
      line:
        "Mail route out of the Fayetteville mail plant: your truckload code, about $320K a year, and across town. USPS posts it in its own system, not SAM.gov.",
      fit: [
        { kind: "naics", code: "484121", says: "your truckload code" },
        { kind: "valueInRange", says: "about $320K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. USPS buys in its own system, not SAM.gov, with no set-asides, and pays per trip.",
    },
  },
  {
    id: "140FS327Q0021",
    title: "Gravel Delivery, Mattamuskeet National Wildlife Refuge, Swan Quarter, NC",
    plainTitle: "Gravel delivery to Mattamuskeet refuge",
    agency: "Department of the Interior",
    office: "U.S. Fish & Wildlife Service",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "484220",
    valueLow: 20_000,
    valueHigh: 40_000,
    place: "mattamuskeet",
    postedDaysAgo: 5,
    closesInDays: 15,
    summary: "Deliver gravel for refuge roads and dikes, priced per ton delivered, over a two-month window.",
    hunter: {
      tier: "stretch",
      score: 58,
      forYouRank: 12,
      line: "Gravel delivery to Mattamuskeet refuge: your specialized-freight code, a small-business set-aside, and about $30K.",
      fit: [
        { kind: "naics", code: "484220", says: "your specialized-freight code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $30K" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. It's 195 miles away and priced per ton delivered, with a rented dump trailer.",
    },
  },

  // ── All tab only ──────────────────────────────────────────────────────
  allOnly("HTC711-27-R-R004", "Transportation Protective Services (TPS) Program", "National secure-freight program (TPS)", "Department of Defense", "U.S. Transportation Command (USTRANSCOM)", "fed", "Request for Proposal", null, "484121", 150_000_000, 250_000_000, "multiStateSe", 12, 35, "low", 22, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's for carriers SDDC has already approved for secure cargo." }, { valueBasis: "per_year", lockedTo: "carriers SDDC has already approved for secure cargo" }),
  allOnly("36C24627Q0102", "Linen Transportation Services, Durham VA Health Care System and Raleigh Clinics", "Linen runs for the Durham and Raleigh VA", VA, VA_NCO6, "fed", "Request for Quote", "SDVOSBC", "484110", 300_000, 400_000, "durham", 8, 31, "stretch", 60, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's your kind of work, but 85 miles away; it needs a second yard." }, { valueBasis: "per_year" }),
  allOnly("36C24627Q0074", "Wheelchair Van Transportation for Veterans, Fayetteville VA Medical Center", "Wheelchair van rides for Fayetteville VA patients", VA, VA_NCO6, "fed", "Request for Quote", "SDVOSBC", "485991", 1_800_000, 2_300_000, "fayetteville", 7, 30, "low", 20, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's patient transport, not freight." }, { valueBasis: "per_year" }),
  allOnly("W91242-27-Q-0041", "Lowboy Transport of Guard Vehicles to Training Sites", "Lowboy moves of Guard vehicles to training sites", ARMY, USPFO, "fed", "Request for Quote", "SBA", "484220", 90_000, 140_000, "statewideNc", 6, 18, "stretch", 45, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It needs lowboys and oversize permits you don't have." }),
  allOnly("W91242-27-Q-0047", "53-Foot Trailers with Drivers, Annual Training, Camp Butner", "53-foot trailers with drivers for Guard training", ARMY, USPFO, "fed", "Request for Quote", "SBA", "484121", 25_000, 45_000, "campButner", 5, 14, "strong", 64, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Two weeks of work at Camp Butner, 95 miles away." }),
  allOnly("COF2741182RFP", "Solid Waste Collection Services, Fort Bragg Housing Areas", "Garbage collection on Fort Bragg for the city", "City of Fayetteville, NC", "Solid Waste Services", "sled", "Request for Proposal", null, "562111", 2_000_000, 3_000_000, "fortBragg", 11, 36, "low", 12, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It needs garbage trucks and landfill permits; it isn't freight." }, { valueBasis: "per_year" }),
  allOnly("CCS-27-014", "Furniture and Equipment Moving Services Between Schools", "Furniture moves between Cumberland County schools", "Cumberland County Schools, NC", "Purchasing Department", "sled", "Request for Quote", null, "484210", 30_000, 60_000, "fayetteville", 6, 21, "strong", 66, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Your box trucks, but school-day hours and two-person crews." }),
  allOnly("D08POCD1.PR31042", "On-Call Hauling Contract, Hoke, Moore and Lee Counties", "On-call storm hauling in Hoke, Moore and Lee counties", "NC Department of Transportation", "Division 8", "sled", "Invitation for Bid", null, "484220", 50_000, 120_000, "carthage", 10, 36, "strong", 63, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Division 6's work again, run from Carthage, 45 miles away." }, { targetAgency: true }),
  allOnly("36C24627Q0113", "Pharmacy Courier Services, Durham VA Medical Center", "Pharmacy courier for the Durham VA", VA, VA_NCO6, "fed", "Request for Quote", "SDVOSBC", "492110", 250_000, 300_000, "durham", 9, 24, "stretch", 50, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Daily rush runs need a driver based in Durham." }, { valueBasis: "per_year" }),
  allOnly("W912PM27Q0014", "Truck Transport of Dredge Parts, Wilmington District", "Trucking parts for the Wilmington District's dredge", ARMY, "U.S. Army Corps of Engineers, Wilmington District", "fed", "Request for Quote", "SBA", "484121", 10_000, 20_000, "wilmington", 4, 11, "stretch", 44, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's one heavy, oversize load; check the permits first." }),
  allOnly("36C24627Q0121", "Regulated Medical Waste Pickup and Disposal, Fayetteville VA Medical Center", "Medical waste pickup at the Fayetteville VA", VA, VA_NCO6, "fed", "Request for Quote", "SDVOSBC", "562112", 60_000, 90_000, "fayetteville", 6, 17, "low", 18, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It needs a state medical-waste permit and a treatment site." }, { valueBasis: "per_year" }),
  allOnly("HQC005-27-Q-E031", "Holiday Refrigerated Trailer Rental, Fort Bragg Commissaries", "Holiday reefer trailers for Fort Bragg's commissaries", "Department of Defense", "Defense Commissary Agency (DeCA)", "fed", "Request for Quote", "SBA", "532120", 8_000, 15_000, "fortBragg", 3, 9, "low", 30, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Six weeks of trailer rental, and your one reefer is booked." }),
  allOnly("PANMCC27P0000011836", "Sources Sought — Local Drayage of Household Goods, Fort Bragg", "Local moves of soldiers' household goods (sources sought)", ARMY, MICC, "fed", "Sources Sought", "SBA", "488991", 400_000, 600_000, "fortBragg", 5, 15, "low", 20, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. Packing household goods is a mover's trade, with its own claims rules." }, { valueBasis: "per_year" }),
];

/** Compact constructor for All-tab opportunities. */
function allOnly(
  id: string,
  title: string,
  plainTitle: string,
  agency: string,
  office: string,
  scope: "fed" | "sled",
  noticeType: NoticeType,
  setAside: SetAside,
  naics: string,
  valueLow: number,
  valueHigh: number,
  place: PlaceKey,
  postedDaysAgo: number,
  closesInDays: number,
  tier: HunterTier,
  score: number,
  grant: GrantCall,
  extra: Partial<StoryOpportunity> = {},
): StoryOpportunity {
  const due =
    noticeType === "Request for Quote" ? "Quotes" : noticeType === "Invitation for Bid" || noticeType === "Solicitation" ? "Bids" : noticeType === "Sources Sought" ? "Responses" : "Proposals";
  return {
    id,
    title,
    plainTitle,
    agency,
    office,
    scope,
    noticeType,
    setAside,
    naics,
    valueLow,
    valueHigh,
    place,
    postedDaysAgo,
    closesInDays,
    summary: `${plainTitle}. ${due} are due in ${closesInDays} days.`,
    hunter: { tier, score },
    grant,
    ...extra,
  };
}
