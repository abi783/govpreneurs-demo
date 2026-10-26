// THE JANITORIAL FIRM's opportunities: Gray Owl Facility Services' whole feed.
// Read through src/demo/story/opportunities.ts, which holds the rules and types
// and picks the active member.
//
// Source: demo-storyboard/janitorial-pack.md (19 Oct 2026), section 10.
// The hero is modeled on MICC Fort Bragg's HUBZone pressure-washing RFQ
// (W9124721Q0002, award W9124721P0010) and its 2026 sources sought; the twin on
// the post-wide AbilityOne custodial contract (W9124726DA001) and a
// mandatory-source notice (FA466426Q0004); the team-up on the 81st Readiness
// Division's 8(a) janitorial and grounds (W912HP21C1001). Buyers are real;
// notice ids are invented in the buyers' formats; companies are fictional.

import type {
  GrantCall,
  HunterTier,
  NoticeType,
  SetAside,
  StoryOpportunity,
} from "../../story/opportunities";
import type { PlaceKey } from "../../story/places";

export const HERO_IDS = {
  /** Hunter → Grant "Bid" → Diana → Ava builds it. Pressure washing and sandblasting at Fort Bragg. */
  hero: "W9124727QA014",
  /** Grant: No-bid. Same office, same post, his primary code, but the work is headed to AbilityOne. */
  twin: "W9124727QA021",
  /** Grant: bid as a subcontractor; Partners shows the 8(a) prime. Army Reserve centers in NC and SC. */
  teamUp: "W912HP27S1002",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const POPE = "763rd Enterprise Sourcing Squadron (763 ESS), Pope Army Airfield";
const USACE_WILMINGTON = "U.S. Army Corps of Engineers, Wilmington District";
const VA_NCO6 = "Network Contracting Office 6 (NCO 6)";
const ABILITYONE = "AbilityOne nonprofit agencies (the work is on the AbilityOne Procurement List)";

export const OPPORTUNITIES: StoryOpportunity[] = [
  // ── HERO ──────────────────────────────────────────────────────────────
  {
    id: "W9124727QA014",
    title: "Pressure Washing and Sandblasting, External Facilities and Structures — Fort Bragg, NC",
    plainTitle: "Pressure washing for Fort Bragg's buildings, barracks and bridges",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "HZC",
    naics: "561790",
    valueLow: 150_000,
    valueHigh: 190_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 3,
    closesInDays: 21,
    dueTime: "10:00 AM Eastern",
    targetAgency: true,
    summary:
      "A HUBZone quote for the Directorate of Public Works: hot and cold washing of headquarters buildings, child development centers, offices, barracks, bridges and tanks across Fort Bragg, Pope, Simmons, Linden Oaks and the outlying training areas, about 377,000 square feet a year, with sandblasting in some extreme cases. One price per square foot for a base year, four option years and a six-month extension; the lowest price technically acceptable gets it, starting 1 January 2027.",
    hunter: {
      tier: "priority",
      score: 95,
      forYouRank: 1,
      line:
        "Pressure washing for Fort Bragg's buildings, barracks and bridges: your building-cleaning code, a HUBZone set-aside, about $170K a year, and 12 miles from your office.",
      fit: [
        { kind: "naics", code: "561790", says: "your building-cleaning code" },
        { kind: "setAside", code: "HZC", says: "a HUBZone set-aside" },
        { kind: "valueInRange", says: "about $170K" },
        { kind: "distance", says: "12 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine:
        "Bid it as prime. It's your work, your set-aside, and you've done it for the Air Force. Fix two things first: the sandblasting line and your price at the wage floor.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "drafting",
      note: "Grant says bid. Ava has read the quote papers and has 3 questions for you. No mentor has seen it yet.",
      next: { label: "Send to a mentor", to: "/opportunities/W9124727QA014" },
      lastActivityDaysAgo: 0,
    },
    ava: {
      kind: "bid-package",
      stage: "answer my questions",
      needsYou: true,
      paused: false,
      statusLine: "Ava has 3 questions for you about your project and QC managers, sandblasting and a backup rig.",
    },
  },

  // ── Pope: steady floor work on a base he already badges onto ──────────
  {
    id: "FA445227Q0031",
    title: "Quarterly Floor Care Services, Air Force Facilities — Pope Army Airfield, NC",
    plainTitle: "Quarterly floor care for Air Force buildings at Pope",
    agency: "Department of the Air Force",
    office: POPE,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "561720",
    valueLow: 30_000,
    valueHigh: 45_000,
    valueBasis: "per_year",
    place: "popeAaf",
    postedDaysAgo: 5,
    closesInDays: 16,
    targetAgency: true,
    summary:
      "Strip, wax and burnish hard floors and extract carpets in Air Force buildings at Pope, four times a year, after hours. A base year and four option years.",
    hunter: {
      tier: "priority",
      score: 91,
      forYouRank: 2,
      line:
        "Quarterly floor care for Air Force buildings at Pope: your janitorial code, a small-business set-aside, about $38K a year, and 15 miles from your office.",
      fit: [
        { kind: "naics", code: "561720", says: "your janitorial code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $38K" },
        { kind: "distance", says: "15 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. It's your floor crew's work, on a post you already badge onto, four times a year for five years.",
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Saved 2 days ago. Grant has a take ready.",
      next: { label: "Review with Grant", to: "/opportunities/FA445227Q0031" },
      lastActivityDaysAgo: 2,
    },
  },

  // ── THE TWIN ──────────────────────────────────────────────────────────
  {
    id: "W9124727QA021",
    title: "Custodial Services, Soldier Support Center and Nine Administrative Buildings — Fort Bragg, NC (AbilityOne)",
    plainTitle: "Custodial for ten buildings at Fort Bragg",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Special Notice",
    setAside: null,
    naics: "561720",
    valueLow: 280_000,
    valueHigh: 340_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 4,
    closesInDays: 14,
    targetAgency: true,
    lockedTo: ABILITYONE,
    summary:
      "Daily custodial work for the Soldier Support Center and nine administrative buildings, with a work statement and responses due in 14 days. The notice says the work is being considered for the AbilityOne Program under FAR Subpart 8.7, and the buildings would join the post-wide AbilityOne custodial contract.",
    hunter: {
      tier: "stretch",
      score: 68,
      forYouRank: 3,
      line:
        "Custodial for ten buildings at Fort Bragg: your janitorial code, about $310K a year and 12 miles from your office, but the notice says it is headed to AbilityOne.",
      fit: [
        { kind: "naics", code: "561720", says: "your janitorial code" },
        { kind: "valueInRange", says: "about $310K" },
        { kind: "distance", says: "12 miles from your office" },
        { kind: "lockedOut", says: "the notice says it is headed to AbilityOne" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: null,
      oneLine:
        "Don't bid. Fort Bragg's custodial work is on the AbilityOne list, and these buildings are being added to that contract. A quote from you can't win at any price. Spend the time on the pressure-washing bid.",
      authored: true,
    },
  },

  // ── THE TEAM-UP ───────────────────────────────────────────────────────
  {
    id: "W912HP27S1002",
    title: "Sources Sought — 81st Readiness Division Janitorial and Grounds Maintenance, Army Reserve Facilities in NC and SC (Follow-on)",
    plainTitle: "Cleaning and mowing for Army Reserve centers in NC and SC (sources sought)",
    agency: "Department of the Army",
    office: "U.S. Army Corps of Engineers, Charleston District",
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: "8A",
    naics: "561720",
    valueLow: 2_000_000,
    valueHigh: 2_600_000,
    place: "statewideNc",
    postedDaysAgo: 6,
    closesInDays: 12,
    targetAgency: true,
    summary:
      "The Corps asks which firms could clean and mow the 81st Readiness Division's Army Reserve centers in North and South Carolina for five years, with one prime for every site. A request for proposals is expected in about 75 days, set aside for 8(a) firms.",
    hunter: {
      tier: "priority",
      score: 82,
      forYouRank: 4,
      line:
        "Army Reserve centers' cleaning and mowing in NC and SC comes back in 2027: your janitorial code and your town work fit, but it is for 8(a) firms only and about $2.3M.",
      fit: [
        { kind: "naics", code: "561720", says: "your janitorial code" },
        { kind: "pastPerformance", id: "pp-hope-mills-custodial", says: "your town work" },
        { kind: "setAsideGap", says: "for 8(a) firms only" },
        { kind: "valueAboveRange", says: "about $2.3M" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "no_go",
      sub: "go",
      oneLine:
        "Team up. It's for 8(a) firms only, and the sites run across two states. As Ashepoo's subcontractor you'd clean and mow the North Carolina centers near you; the subcontracting limit caps your share at half the work.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Grant says team up. Ashepoo Facility Solutions wants a local subcontractor for the North Carolina centers.",
      next: { label: "See partners", to: "/partners" },
      lastActivityDaysAgo: 1,
    },
  },

  // ── The rest of "Opportunities for you" ──────────────────────────────
  {
    id: "H9242127QE014",
    title: "One-Time Floor Strip, Wax and Restroom Deep Cleaning, SOF Building — Fort Bragg, NC",
    plainTitle: "A one-time floor and restroom deep clean in a SOF building",
    agency: "Department of Defense",
    office: "U.S. Special Operations Command (USSOCOM), Fort Bragg",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "561720",
    valueLow: 8_000,
    valueHigh: 12_000,
    place: "fortBragg",
    postedDaysAgo: 2,
    closesInDays: 7,
    summary: "Strip and wax the hard floors and deep clean the restrooms of one Special Operations building, once, over a weekend.",
    hunter: {
      tier: "strong",
      score: 84,
      forYouRank: 5,
      line:
        "A one-time floor and restroom deep clean in a SOF building: your janitorial code, a small-business set-aside, about $10K, and 12 miles from your office.",
      fit: [
        { kind: "naics", code: "561720", says: "your janitorial code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $10K" },
        { kind: "distance", says: "12 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. A quick weekend job for your floor crew, and a new buyer on post.",
    },
  },
  {
    id: "W9124227Q0046",
    title: "Industrial Cleaning Services, National Guard Warehouse — Spring Lake, NC",
    plainTitle: "Industrial cleaning for a National Guard warehouse in Spring Lake",
    agency: "Department of the Army",
    office: "U.S. Property and Fiscal Office (USPFO) for North Carolina, National Guard",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "561720",
    valueLow: 12_000,
    valueHigh: 18_000,
    place: "springLake",
    postedDaysAgo: 4,
    closesInDays: 11,
    summary: "Clean a National Guard warehouse once, top to bottom: high dusting, floor scrubbing, offices and restrooms.",
    hunter: {
      tier: "strong",
      score: 81,
      forYouRank: 6,
      line:
        "Industrial cleaning for a National Guard warehouse in Spring Lake: your janitorial code, a small-business set-aside, about $15K, and 12 miles from your office.",
      fit: [
        { kind: "naics", code: "561720", says: "your janitorial code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $15K" },
        { kind: "distance", says: "12 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. One-time work close to home, and a second federal buyer for your record.",
    },
  },
  {
    id: "RCHA-110626",
    title: "Office Cleaning Services: Lumberton, Red Springs, St. Pauls and Rowland Offices — Robeson County Housing Authority",
    plainTitle: "Office cleaning for Robeson County's housing authority in four towns",
    agency: "Robeson County Housing Authority, NC",
    office: "Procurement",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "561720",
    valueLow: 24_000,
    valueHigh: 36_000,
    valueBasis: "per_year",
    place: "lumberton",
    postedDaysAgo: 6,
    closesInDays: 19,
    summary:
      "Clean four small housing authority offices on a set schedule. HUD's Section 3 rules apply, so hiring local low-income residents can add points.",
    hunter: {
      tier: "strong",
      score: 78,
      forYouRank: 7,
      line:
        "Office cleaning for Robeson County's housing authority in four towns: your janitorial code, about $30K a year, and 35 miles from your office.",
      fit: [
        { kind: "naics", code: "561720", says: "your janitorial code" },
        { kind: "valueInRange", says: "about $30K" },
        { kind: "distance", says: "35 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Small and near your Robeson night crew, and Section 3 hiring can score.",
    },
  },
  {
    id: "W912PM27QA004",
    title: "Mowing and Vegetation Control, Cape Fear River Locks and Dams 1, 2 and 3",
    plainTitle: "Mowing and brush control at the Cape Fear locks",
    agency: "Department of the Army",
    office: USACE_WILMINGTON,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "561730",
    valueLow: 12_000,
    valueHigh: 18_000,
    valueBasis: "per_year",
    place: "elizabethtown",
    postedDaysAgo: 5,
    closesInDays: 15,
    targetAgency: true,
    summary: "Mow and trim the grounds and control brush at three Cape Fear River locks, on a set schedule through the growing season.",
    hunter: {
      tier: "strong",
      score: 76,
      forYouRank: 8,
      line:
        "Mowing and brush control at the Cape Fear locks: your grounds code, a small-business set-aside, about $15K a year, and 40 miles from your office.",
      fit: [
        { kind: "naics", code: "561730", says: "your grounds code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $15K" },
        { kind: "distance", says: "40 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Light grounds work for the Corps. The lowest price gets it, so price it lean.",
    },
  },
  {
    id: "45-RQ300517R",
    title: "Janitorial Services, Fayetteville Service Center — North Carolina Department of Revenue",
    plainTitle: "Janitorial for Revenue's Fayetteville service center",
    agency: "North Carolina Department of Revenue",
    office: "Purchasing",
    scope: "sled",
    noticeType: "Request for Quote",
    setAside: null,
    naics: "561720",
    valueLow: 28_000,
    valueHigh: 40_000,
    valueBasis: "per_year",
    place: "fayetteville",
    postedDaysAgo: 12,
    closesInDays: 14,
    summary: "Nightly cleaning of the department's Fayetteville service center. A site visit on 14 October was mandatory for every bidder.",
    hunter: {
      tier: "strong",
      score: 72,
      forYouRank: 9,
      line: "Janitorial for Revenue's Fayetteville service center: your janitorial code, about $34K a year, and across town.",
      fit: [
        { kind: "naics", code: "561720", says: "your janitorial code" },
        { kind: "valueInRange", says: "about $34K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: null,
      oneLine: "Don't bid. The 14 October site visit was mandatory, and you weren't there, so a quote from you won't be accepted.",
    },
  },
  {
    id: "54-SH-06-PR34172",
    title: "Rest Area Custodial Operations, I-95 Northbound and Southbound, Cumberland County (MM 48)",
    plainTitle: "Custodial for the I-95 rest areas in Cumberland County",
    agency: "North Carolina Department of Transportation",
    office: "Division 6, Roadside Environmental",
    scope: "sled",
    noticeType: "Invitation for Bid",
    setAside: null,
    naics: "561720",
    valueLow: 350_000,
    valueHigh: 450_000,
    valueBasis: "per_year",
    place: "fayetteville",
    postedDaysAgo: 9,
    closesInDays: 41,
    dueTime: "2:00 PM Eastern",
    targetAgency: true,
    summary:
      "Staff and clean both I-95 rest areas in Cumberland County 16 hours a day, every day of the year, holidays included, with a supervisor within 50 miles. NCDOT sets its own wage floor, starting at $14.48 an hour.",
    hunter: {
      tier: "strong",
      score: 70,
      forYouRank: 10,
      line:
        "Custodial for the I-95 rest areas in Cumberland County: your janitorial code, about $400K a year, and a buyer on your list.",
      fit: [
        { kind: "naics", code: "561720", says: "your janitorial code" },
        { kind: "valueInRange", says: "about $400K" },
        { kind: "targetAgency", says: "a buyer on your list" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine:
        "Look closer. It's staffed 16 hours a day, every day, which is a staffing business more than a cleaning job. Talk to Diana first.",
    },
    saved: true,
    pursuit: {
      stage: "with_mentor",
      note: "Diana read your question and wants to talk first.",
      next: { label: "Read Diana's reply", to: "/mentors/rev-rest-area-discuss" },
      lastActivityDaysAgo: 0,
    },
    mentorReviewId: "rev-rest-area-discuss",
  },
  {
    id: "W9124727QA026",
    title: "Sources Sought — Exhaust Hood, Duct and Fan Cleaning, Troop Mess Halls (DFACs), Fort Bragg, NC",
    plainTitle: "Sources sought for cleaning Fort Bragg's mess-hall exhaust hoods",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: null,
    naics: "561790",
    valueLow: 70_000,
    valueHigh: 90_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 3,
    closesInDays: 25,
    targetAgency: true,
    summary:
      "The Army asks who could clean the exhaust hoods, ducts and fans in Fort Bragg's mess halls to the NFPA 96 standard. Last time the work went to an 8(a) firm without competition.",
    hunter: {
      tier: "stretch",
      score: 66,
      forYouRank: 11,
      line:
        "Sources sought for cleaning Fort Bragg's mess-hall exhaust hoods: your building-cleaning code, about $80K a year, 12 miles from your office, and not a bid yet.",
      fit: [
        { kind: "naics", code: "561790", says: "your building-cleaning code" },
        { kind: "valueInRange", says: "about $80K" },
        { kind: "distance", says: "12 miles from your office" },
        { kind: "noticeType", says: "not a bid yet" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine:
        "Look closer, then answer it. A strong small-business response can open it up, but you'd need NFPA 96 hood-cleaning certification first.",
    },
  },
  {
    id: "W9124727RA005",
    title: "Door Maintenance and Repair Services — Fort Bragg, NC",
    plainTitle: "Door maintenance and repair across Fort Bragg",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "561790",
    valueLow: 650_000,
    valueHigh: 750_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 7,
    closesInDays: 18,
    summary: "Inspect, maintain and repair the doors, closers and hardware in buildings across Fort Bragg, with on-call repairs.",
    hunter: {
      tier: "stretch",
      score: 48,
      forYouRank: 12,
      line:
        "Door maintenance and repair across Fort Bragg: your building-cleaning code and 12 miles from your office, but the work is door repair and about $700K a year.",
      fit: [
        { kind: "naics", code: "561790", says: "your building-cleaning code" },
        { kind: "distance", says: "12 miles from your office" },
        { kind: "valueAboveRange", says: "about $700K" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: null,
      oneLine: "Don't bid. It's filed under your code, but it's door repair, not cleaning, and bigger than anything you run.",
    },
  },

  // ── All tab only ──────────────────────────────────────────────────────
  allOnly("36C24627Q0083", "Janitorial Services, Durham VA Medical Center", "Janitorial at the Durham VA", "Department of Veterans Affairs", VA_NCO6, "fed", "Request for Quote", "SDVOSBC", "561720", 2_400_000, 2_800_000, "durham", 8, 20, "stretch", 45, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's for service-disabled veteran-owned firms, and 44 quoted last time." }),
  allOnly("W9124727RA002", "Notice: Garrison Grounds Maintenance, Fort Bragg (AbilityOne)", "Grounds maintenance across Fort Bragg", "Department of the Army", MICC, "fed", "Special Notice", null, "561730", 2_000_000, 2_300_000, "fortBragg", 5, 10, "low", 30, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. Fort Bragg's grounds work goes to AbilityOne nonprofits, so no quote from you can be accepted." }, { valueBasis: "per_year", lockedTo: ABILITYONE }),
  allOnly("W9124727RA008", "Notice: Custodial Services, FORSCOM and USARC Headquarters, Fort Bragg (AbilityOne)", "Custodial for the FORSCOM and Army Reserve headquarters", "Department of the Army", MICC, "fed", "Special Notice", null, "561720", 1_400_000, 1_700_000, "fortBragg", 6, 9, "low", 28, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's AbilityOne work, and nearly your whole revenue besides." }, { valueBasis: "per_year", lockedTo: ABILITYONE }),
  allOnly("HQC00827R0012", "Shelf Stocking and Custodial Services, Fort Bragg South Commissary", "Shelf stocking and custodial at a Fort Bragg commissary", "Department of Defense", "Defense Commissary Agency (DeCA)", "fed", "Request for Proposal", "SDVOSBC", "561990", 1_300_000, 1_600_000, "fortBragg", 10, 28, "low", 22, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's for service-disabled veteran-owned firms, and it's mostly shelf stocking." }, { valueBasis: "per_year" }),
  allOnly("47PE0627Q0011", "Janitorial Services, TSA Space at Fayetteville Regional Airport", "Janitorial for TSA's space at Fayetteville's airport", "General Services Administration", "Public Buildings Service, Region 4", "fed", "Request for Quote", "8A", "561720", 25_000, 40_000, "fayetteville", 7, 20, "stretch", 50, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's set aside for 8(a) firms." }, { valueBasis: "per_year" }),
  allOnly("W912PM27QA009", "Custodial Services, Falls Lake Recreation Areas", "Custodial at the Falls Lake recreation areas", "Department of the Army", USACE_WILMINGTON, "fed", "Request for Quote", "SDVOSBC", "561720", 55_000, 75_000, "wakeForest", 9, 22, "stretch", 44, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's for service-disabled veteran-owned firms." }, { valueBasis: "per_year" }),
  allOnly("68HERC27R0031", "Custodial Support Services, EPA Research Triangle Park Campus", "Custodial for the EPA campus in Research Triangle Park", "Environmental Protection Agency", "Office of Acquisition Solutions, RTP", "fed", "Request for Proposal", "SBA", "561720", 1_500_000, 1_800_000, "durham", 11, 33, "low", 34, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's nearly your whole revenue, 85 miles away, and 21 firms bid last time." }, { valueBasis: "per_year", mentorReviewId: "rev-epa-pass" }),
  allOnly("W912PM27QA013", "Janitorial Services, Regulatory Field Office, Wake Forest, NC", "Janitorial for the Corps' Wake Forest field office", "Department of the Army", USACE_WILMINGTON, "fed", "Request for Quote", "SBA", "561720", 5_000, 8_000, "wakeForest", 6, 13, "stretch", 52, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's tiny and 85 miles away, and 23 firms quoted last time." }, { valueBasis: "per_year" }),
  allOnly("12639527Q0062", "Janitorial Services, Plant Inspection Station, Wilmington, NC", "Janitorial for USDA's plant-inspection office in Wilmington", "Department of Agriculture", "Animal and Plant Health Inspection Service (APHIS)", "fed", "Request for Quote", "SBA", "561720", 10_000, 15_000, "wilmington", 8, 17, "stretch", 50, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. One small office is a long way to send a crew: 90 miles." }, { valueBasis: "per_year" }),
  allOnly("RCC-27-004", "Custodial Services, Main Campus — Robeson Community College", "Custodial for Robeson Community College's main campus", "Robeson Community College, NC", "Business Office", "sled", "Request for Proposal", null, "561720", 250_000, 350_000, "lumberton", 7, 23, "strong", 64, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. The college bid this twice in 2025 and 2026. Ask what changed before you price it." }, { valueBasis: "per_year" }),
  allOnly("173-27031", "Floor Stripper and Floor Finish, Approximately 1,800 Units — Cumberland County Schools", "Floor stripper and finish for Cumberland County Schools", "Cumberland County Schools, NC", "Purchasing Department", "sled", "Invitation for Bid", null, "325612", 40_000, 60_000, "fayetteville", 5, 9, "low", 26, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. They're buying floor products, not a cleaning service." }),
  allOnly("PWC-2627-22", "Custodial and Floor Care Services, Two Water Treatment Plants — Fayetteville Public Works Commission", "Custodial and floor care at two Fayetteville water plants", "Fayetteville Public Works Commission, NC", "Purchasing", "sled", "Request for Proposal", null, "561720", 60_000, 90_000, "fayetteville", 6, 26, "strong", 70, { verdict: "bid", prime: "go", sub: null, oneLine: "Bid it. Local work for your floor crew. Get the plant safety training done first." }, { valueBasis: "per_year" }),
  allOnly("FTCC-RFP-27-05", "Custodial Services, Spring Lake Campus — Fayetteville Technical Community College", "Custodial for Fayetteville Tech's Spring Lake campus", "Fayetteville Technical Community College, NC", "Purchasing Department", "sled", "Request for Proposal", null, "561720", 90_000, 130_000, "springLake", 8, 30, "strong", 62, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. NC colleges mostly clean in house. Ask if this is a pilot before you staff for it." }, { valueBasis: "per_year" }),
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
    noticeType === "Request for Quote"
      ? "Quotes"
      : noticeType === "Invitation for Bid" || noticeType === "Solicitation"
        ? "Bids"
        : noticeType === "Special Notice" || noticeType === "Sources Sought"
          ? "Responses"
          : "Proposals";
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
