// THE CONTRACTOR's opportunities: Ninebark Builders' whole feed.
// Read through src/demo/story/opportunities.ts, which holds the rules and types
// and picks the active member.
//
// Source: demo-storyboard/construction-pack.md (19 Oct 2026), section 10.
// The hero is modeled on USACE Wilmington's HUBZone sealed bids at Fort Bragg
// (W912PM21B0009, W912PM20B0017) and its chiller work (W912PM24R0021); the twin
// on a Vertical Construction MATOC task order (W9124724F0488); the team-up on
// the Fayetteville VA's fan coil job (36C24623C0027). Buyers are real; notice
// ids are invented in the buyers' formats; companies are fictional.

import type {
  GrantCall,
  HunterTier,
  NoticeType,
  SetAside,
  StoryOpportunity,
} from "../../story/opportunities";
import type { PlaceKey } from "../../story/places";

export const HERO_IDS = {
  /** Hunter → Grant "Bid" → Sarah → Ava builds it. HVAC and electrical upgrade at a Fort Bragg training building. */
  hero: "W912PM27B0004",
  /** Grant: No-bid. Same base, same set-aside, but only holders of Fort Bragg's construction MATOC can offer. */
  twin: "W91247-27-R-0019",
  /** Grant: bid as a subcontractor; Partners shows the veteran-owned prime. Fayetteville VA fan coils. */
  teamUp: "36C24627B0012",
} as const;

const USACE_WILMINGTON = "U.S. Army Corps of Engineers, Wilmington District";
const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const POPE = "763rd Enterprise Sourcing Squadron (763 ESS), Pope Army Airfield";
const VA_NCO6 = "Network Contracting Office 6 (NCO 6)";

export const OPPORTUNITIES: StoryOpportunity[] = [
  // ── HERO ──────────────────────────────────────────────────────────────
  {
    id: "W912PM27B0004",
    title: "Replace HVAC and Upgrade Electrical Service, Building 2-4417, Fort Bragg, NC",
    plainTitle: "HVAC and electrical upgrade at a Fort Bragg training building",
    agency: "Department of the Army",
    office: USACE_WILMINGTON,
    scope: "fed",
    noticeType: "Solicitation",
    setAside: "HZC",
    naics: "238220",
    valueLow: 640_000,
    valueHigh: 820_000,
    place: "fortBragg",
    postedDaysAgo: 3,
    closesInDays: 30,
    dueTime: "2:00 PM Eastern",
    targetAgency: true,
    summary:
      "A sealed bid to upgrade a Special Operations training building: replace two air-handling units and a 60-ton air-cooled chiller, put new controls on the building's existing BACnet system, and replace the 400A service with an 800A switchboard and panels. The unit keeps using the building, so outages are booked 14 days ahead. 240 days, with a bid bond, then 100% performance and payment bonds, under Davis-Bacon wage decision NC20260122.",
    hunter: {
      tier: "priority",
      score: 95,
      forYouRank: 1,
      line:
        "HVAC and electrical upgrade at a Fort Bragg training building: your HVAC code, a HUBZone set-aside, about $730K, and 12 miles from your shop.",
      fit: [
        { kind: "naics", code: "238220", says: "your HVAC code" },
        { kind: "setAside", code: "HZC", says: "a HUBZone set-aside" },
        { kind: "valueInRange", says: "about $730K" },
        { kind: "distance", says: "12 miles from your shop" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine:
        "Bid it as prime. It's both your trades, your size and your set-aside. Fix two things first: your bond room and the pipefitter rate.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "drafting",
      note: "Grant says bid. Ava has read the bid papers and has 3 questions for you. No mentor has seen it yet.",
      next: { label: "Send to a mentor", to: "/opportunities/W912PM27B0004" },
      lastActivityDaysAgo: 0,
    },
    ava: {
      kind: "bid-package",
      stage: "answer my questions",
      needsYou: true,
      paused: false,
      statusLine: "Ava has 3 questions for you about your quality and safety staff, the controls and keeping the building cool.",
    },
  },

  // ── Pope: the buyer he already delivered for ──────────────────────────
  {
    id: "FA445227Q0007",
    title: "Replace Split-System HVAC Units and Electrical Panel, Building 302, Pope Army Airfield",
    plainTitle: "Split systems and a panel for a Pope office building",
    agency: "Department of the Air Force",
    office: POPE,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "238220",
    valueLow: 85_000,
    valueHigh: 120_000,
    place: "popeAaf",
    postedDaysAgo: 5,
    closesInDays: 12,
    targetAgency: true,
    summary:
      "Replace four split-system heat pumps and an old 200A panel in an occupied office building, and tie the new units into the building's controls. 90 days after notice to proceed.",
    hunter: {
      tier: "priority",
      score: 92,
      forYouRank: 2,
      line:
        "Split systems and a panel for a Pope office building: your HVAC code, the Pope office job you finished last year, a small-business set-aside, and about $100K.",
      fit: [
        { kind: "naics", code: "238220", says: "your HVAC code" },
        { kind: "pastPerformance", id: "pp-pope-office-hvac", says: "the Pope office job you finished last year" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $100K" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Same buyer and the same kind of work as your Pope job, which they rated Very Good.",
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Saved 2 days ago. Grant has a take ready.",
      next: { label: "Review with Grant", to: "/opportunities/FA445227Q0007" },
      lastActivityDaysAgo: 2,
    },
  },

  // ── THE TWIN ──────────────────────────────────────────────────────────
  {
    id: "W91247-27-R-0019",
    title: "Repair Barracks HVAC, Building C-4613, Fort Bragg — Vertical Construction MATOC Holders Only",
    plainTitle: "Barracks HVAC repair at Fort Bragg, MATOC holders only",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Proposal",
    setAside: "HZC",
    naics: "236220",
    valueLow: 2_000_000,
    valueHigh: 2_600_000,
    place: "fortBragg",
    postedDaysAgo: 3,
    closesInDays: 21,
    targetAgency: true,
    lockedTo: "holders of Fort Bragg's HUBZone Vertical Construction MATOC",
    summary:
      "A task order to replace the air handlers, piping and controls in a Fort Bragg barracks. Offers will be accepted only from holders of the Fort Bragg DPW Vertical Construction MA IDIQ (W91247-20-R-0009), which orders through August 2028.",
    hunter: {
      tier: "stretch",
      score: 66,
      forYouRank: 3,
      line:
        "Barracks HVAC repair at Fort Bragg: your building code, a HUBZone set-aside and about $2.3M, but only firms on Fort Bragg's construction MATOC can offer.",
      fit: [
        { kind: "naics", code: "236220", says: "your building code" },
        { kind: "setAside", code: "HZC", says: "a HUBZone set-aside" },
        { kind: "valueAboveRange", says: "about $2.3M" },
        { kind: "lockedOut", says: "only firms on Fort Bragg's construction MATOC can offer" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: "go",
      oneLine:
        "Don't bid. Only the firms on Fort Bragg's HUBZone construction MATOC can offer, and the bond is bigger than your single limit. If you want the work, price the HVAC for one of the holders.",
      authored: true,
    },
  },

  // ── The way onto the MATOC ────────────────────────────────────────────
  {
    id: "W91247-27-R-0007",
    title: "Sources Sought — Fort Bragg DPW Minor Construction MATOC (HUBZone) Follow-on",
    plainTitle: "Sources sought for Fort Bragg's next Minor Construction MATOC",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: "HZC",
    naics: "236220",
    valueLow: null,
    valueHigh: null,
    place: "fortBragg",
    postedDaysAgo: 6,
    closesInDays: 30,
    targetAgency: true,
    summary:
      "The Army asks which HUBZone firms could hold the next five-year Minor Construction MATOC for Fort Bragg's electrical, HVAC and small repair work, about $7M a holder. It wants three similar jobs from the last six years, a surety letter and past ratings.",
    hunter: {
      tier: "priority",
      score: 86,
      forYouRank: 4,
      line:
        "Sources sought for Fort Bragg's next Minor Construction MATOC: your building code, a HUBZone set-aside, 12 miles from your shop, and not a bid yet.",
      fit: [
        { kind: "naics", code: "236220", says: "your building code" },
        { kind: "setAside", code: "HZC", says: "a HUBZone set-aside" },
        { kind: "distance", says: "12 miles from your shop" },
        { kind: "noticeType", says: "not a bid yet" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine:
        "Look closer, then answer it. It isn't a bid; it's the way onto the MATOC where most of Fort Bragg's HUBZone repair work goes.",
    },
    saved: true,
    pursuit: {
      stage: "reviewing",
      note: "Grant says answer it. Sarah's checklist from your MATOC question covers what to send.",
      next: { label: "Read Sarah's checklist", to: "/mentors/rev-matoc-howto" },
      lastActivityDaysAgo: 1,
    },
  },

  // ── THE TEAM-UP ───────────────────────────────────────────────────────
  {
    id: "36C24627B0012",
    title: "Sources Sought — Replace Fan Coil Units, Building 1, Floors 2 and 4, Fayetteville VA Medical Center",
    plainTitle: "Fan coil replacement at the Fayetteville VA (sources sought)",
    agency: "Department of Veterans Affairs",
    office: VA_NCO6,
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: "SDVOSBC",
    naics: "236220",
    valueLow: 3_200_000,
    valueHigh: 4_400_000,
    place: "fayetteville",
    postedDaysAgo: 4,
    closesInDays: 14,
    dueTime: "3:00 PM Eastern",
    targetAgency: true,
    summary:
      "The VA asks which firms could replace the fan coil units, piping and power on two floors of the medical center's main building, as the 3rd floor was done in 2023–2025. A sealed bid is expected in about 150 days, set aside for service-disabled veteran-owned firms.",
    hunter: {
      tier: "priority",
      score: 81,
      forYouRank: 5,
      line:
        "Fayetteville VA's fan coil replacement returns in 2027: your building and HVAC codes and your Pope job fit, but it is for service-disabled veteran-owned firms and about $3.8M.",
      fit: [
        { kind: "naics", code: "236220", says: "your building and HVAC codes" },
        { kind: "pastPerformance", id: "pp-pope-office-hvac", says: "your Pope job" },
        { kind: "setAsideGap", says: "for service-disabled veteran-owned firms" },
        { kind: "valueAboveRange", says: "about $3.8M" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "no_go",
      sub: "go",
      oneLine:
        "Team up. It's set aside for service-disabled veteran-owned firms, and it's more than twice your single bond. As Blackjack Oak's subcontractor you'd self-perform the fan coils, piping and power, about half the job.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Grant says team up. Blackjack Oak Federal Builders wants a HUBZone firm for the mechanical and electrical work.",
      next: { label: "See partners", to: "/partners" },
      lastActivityDaysAgo: 1,
    },
  },

  // ── The rest of "Opportunities for you" ──────────────────────────────
  {
    id: "W91247-27-Q-0031",
    title: "Install Dedicated Circuits, Division Headquarters Building, Fort Bragg",
    plainTitle: "Dedicated circuits for a Fort Bragg division building",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "238210",
    valueLow: 60_000,
    valueHigh: 90_000,
    place: "fortBragg",
    postedDaysAgo: 4,
    closesInDays: 9,
    targetAgency: true,
    summary: "New dedicated circuits, panels and receptacles for server and training rooms in an occupied headquarters building. 60 days.",
    hunter: {
      tier: "strong",
      score: 83,
      forYouRank: 6,
      line:
        "Dedicated circuits for a Fort Bragg division building: your electrical code, a small-business set-aside, about $75K, and 12 miles from your shop.",
      fit: [
        { kind: "naics", code: "238210", says: "your electrical code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $75K" },
        { kind: "distance", says: "12 miles from your shop" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Small and fast, and work for your electricians while the HVAC crews are busy.",
    },
  },
  {
    id: "W912PM27B0006",
    title: "Replace Boiler and Domestic Hot Water Tank, Building 8-1650, Fort Bragg, NC",
    plainTitle: "Boiler and hot-water tank replacement at Fort Bragg",
    agency: "Department of the Army",
    office: USACE_WILMINGTON,
    scope: "fed",
    noticeType: "Invitation for Bid",
    setAside: "HZC",
    naics: "238220",
    valueLow: 380_000,
    valueHigh: 520_000,
    place: "fortBragg",
    postedDaysAgo: 2,
    closesInDays: 41,
    targetAgency: true,
    summary: "Replace a gas boiler, its pumps and a domestic hot-water tank, with new controls, in a Fort Bragg operations building. 180 days, bonded.",
    hunter: {
      tier: "strong",
      score: 80,
      forYouRank: 7,
      line:
        "Boiler and hot-water tank replacement at Fort Bragg: your HVAC code, a HUBZone set-aside, a sealed bid, and about $450K.",
      fit: [
        { kind: "naics", code: "238220", says: "your HVAC code" },
        { kind: "setAside", code: "HZC", says: "a HUBZone set-aside" },
        { kind: "noticeType", says: "a sealed bid" },
        { kind: "valueInRange", says: "about $450K" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine:
        "Look closer. With the training building job it fills your bond aggregate. Bid one, or ask your surety for more room first.",
    },
  },
  {
    id: "6973GH-27-R-00031",
    title: "HVAC Replacement, FAA Facility, Fayetteville Regional Airport",
    plainTitle: "HVAC replacement at the FAA facility at Fayetteville's airport",
    agency: "Department of Transportation",
    office: "Federal Aviation Administration, Eastern Service Area",
    scope: "fed",
    noticeType: "Request for Proposal",
    setAside: "SBA",
    naics: "238220",
    valueLow: 180_000,
    valueHigh: 260_000,
    place: "fayetteville",
    postedDaysAgo: 7,
    closesInDays: 26,
    targetAgency: true,
    summary: "Replace the HVAC equipment serving an FAA equipment building at the airport, keeping the equipment rooms cool during the switch.",
    hunter: {
      tier: "strong",
      score: 79,
      forYouRank: 8,
      line:
        "HVAC replacement at the FAA facility at Fayetteville's airport: your HVAC code, a small-business set-aside, about $220K, and across town.",
      fit: [
        { kind: "naics", code: "238220", says: "your HVAC code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $220K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Your size and close by, but the last one drew 16 bids, so price it tight.",
    },
  },
  {
    id: "27-0118",
    title: "Switchgear and Electrical Service Replacement, Residence Hall — Fayetteville State University",
    plainTitle: "Switchgear replacement at a Fayetteville State residence hall",
    agency: "Fayetteville State University, NC",
    office: "Facilities Management",
    scope: "sled",
    noticeType: "Invitation for Bid",
    setAside: null,
    naics: "238210",
    valueLow: 450_000,
    valueHigh: 600_000,
    place: "fayetteville",
    postedDaysAgo: 9,
    closesInDays: 28,
    dueTime: "2:00 PM Eastern",
    targetAgency: true,
    summary: "Replace the switchgear and service for a residence hall over the summer break, with a temporary generator while it's down. Bonded.",
    hunter: {
      tier: "strong",
      score: 78,
      forYouRank: 9,
      line:
        "Switchgear replacement at a Fayetteville State residence hall: your electrical code, about $525K, across town, and a buyer on your list.",
      fit: [
        { kind: "naics", code: "238210", says: "your electrical code" },
        { kind: "valueInRange", says: "about $525K" },
        { kind: "distance", says: "across town" },
        { kind: "targetAgency", says: "a buyer on your list" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. It's work for your electrical crews, and the bond fits.",
    },
  },
  {
    id: "173-27004",
    title: "HVAC Replacement, Classroom Wing — Cumberland County Schools (Summer 2027)",
    plainTitle: "Summer HVAC replacement in an elementary school wing",
    agency: "Cumberland County Schools, NC",
    office: "Facilities Department",
    scope: "sled",
    noticeType: "Invitation for Bid",
    setAside: null,
    naics: "238220",
    valueLow: 900_000,
    valueHigh: 1_200_000,
    place: "fayetteville",
    postedDaysAgo: 8,
    closesInDays: 40,
    dueTime: "2:00 PM Eastern",
    targetAgency: true,
    summary:
      "Replace the chiller, air handlers and controls for a classroom wing between the last school day and the first teacher workday. Performance and payment bonds.",
    hunter: {
      tier: "strong",
      score: 77,
      forYouRank: 10,
      line:
        "Summer HVAC replacement in an elementary school wing: your HVAC code, the school HVAC job you did for them in 2024, about $1.05M, and across town.",
      fit: [
        { kind: "naics", code: "238220", says: "your HVAC code" },
        { kind: "pastPerformance", id: "pp-ccs-school-hvac", says: "the school HVAC job you did for them in 2024" },
        { kind: "valueInRange", says: "about $1.05M" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine:
        "Look closer. The work has to fit the summer break, and the chiller lead time decides if it can.",
    },
    saved: true,
    pursuit: {
      stage: "with_mentor",
      note: "Sarah read your bid plan and wants to talk first.",
      next: { label: "Read Sarah's reply", to: "/mentors/rev-school-summer" },
      lastActivityDaysAgo: 0,
    },
    mentorReviewId: "rev-school-summer",
  },
  {
    id: "FTCC-IFB-27-03",
    title: "Air Handler and Controls Replacement — Fayetteville Technical Community College",
    plainTitle: "Air handler and controls replacement at Fayetteville Tech",
    agency: "Fayetteville Technical Community College, NC",
    office: "Purchasing Department",
    scope: "sled",
    noticeType: "Invitation for Bid",
    setAside: null,
    naics: "238220",
    valueLow: 300_000,
    valueHigh: 420_000,
    place: "fayetteville",
    postedDaysAgo: 6,
    closesInDays: 19,
    summary: "Replace three air handlers and their controls in a classroom building, working nights and weekends during the term.",
    hunter: {
      tier: "strong",
      score: 74,
      forYouRank: 11,
      line: "Air handler and controls replacement at Fayetteville Tech: your HVAC code, about $360K, and across town.",
      fit: [
        { kind: "naics", code: "238220", says: "your HVAC code" },
        { kind: "valueInRange", says: "about $360K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine:
        "Look closer. It lands in the same month as the Fort Bragg training building job, and you have one superintendent for both.",
    },
  },
  {
    id: "B27-014",
    title: "LED Lighting and Electrical Upgrade, Recreation Center — City of Fayetteville",
    plainTitle: "LED lighting and electrical upgrade at a Fayetteville recreation center",
    agency: "City of Fayetteville, NC",
    office: "Parks, Recreation and Maintenance",
    scope: "sled",
    noticeType: "Invitation for Bid",
    setAside: null,
    naics: "238210",
    valueLow: 150_000,
    valueHigh: 220_000,
    place: "fayetteville",
    postedDaysAgo: 5,
    closesInDays: 17,
    summary: "Replace the gym and hall lighting with LED fixtures, add lighting controls and replace two panels.",
    hunter: {
      tier: "strong",
      score: 72,
      forYouRank: 12,
      line:
        "LED lighting and electrical upgrade at a Fayetteville recreation center: your electrical code, about $185K, and across town.",
      fit: [
        { kind: "naics", code: "238210", says: "your electrical code" },
        { kind: "valueInRange", says: "about $185K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Small, close and no strain on your bond line.",
    },
  },

  // ── All tab only ──────────────────────────────────────────────────────
  allOnly("W912HN27R4012", "Barracks Repair, Fort Bragg, NC", "Barracks repair at Fort Bragg", "Department of the Army", "U.S. Army Corps of Engineers, Savannah District", "fed", "Request for Proposal", "SBA", "236220", 25_000_000, 35_000_000, "fortBragg", 10, 45, "low", 30, { verdict: "no_bid", prime: "no_go", sub: "go", oneLine: "Don't bid as prime. It's more than 16 times your single bond. Ask the bidders for the electrical and HVAC package instead." }),
  allOnly("36C24627B0009", "Replace Air Handling Units, Fayetteville VA Medical Center", "Air handler replacement at the Fayetteville VA", "Department of Veterans Affairs", VA_NCO6, "fed", "Invitation for Bid", "SDVOSBC", "238220", 600_000, 900_000, "fayetteville", 8, 23, "stretch", 48, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's set aside for service-disabled veteran-owned firms." }),
  allOnly("W91247-27-Q-0044", "Notice of Intent to Award: Repair Barracks HVAC — 8(a) Sole Source", "Barracks HVAC repair going to an 8(a) firm", "Department of the Army", MICC, "fed", "Solicitation", "8A", "238220", 400_000, 600_000, "fortBragg", 3, 8, "low", 25, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. It says the work is going to an 8(a) firm without competition." }, { summary: "Barracks HVAC repair going to an 8(a) firm. The Army plans to award it without competition; responses are due in 8 days." }),
  allOnly("FA480927Q0014", "Dormitory HVAC Replacement, Seymour Johnson AFB", "Dormitory HVAC replacement at Seymour Johnson", "Department of the Air Force", "4th Contracting Squadron, Seymour Johnson AFB", "fed", "Request for Quote", "SBA", "238220", 700_000, 900_000, "goldsboro", 9, 33, "stretch", 58, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Your trade and size, but 75 miles away, and your bond room is tight if you get the training building job." }),
  allOnly("N4008527R0031", "Electrical Distribution Upgrade, Camp Lejeune", "Electrical distribution upgrade at Camp Lejeune", "Department of the Navy", "NAVFAC Mid-Atlantic", "fed", "Request for Proposal", "SBA", "238210", 2_000_000, 4_000_000, "jacksonville", 12, 35, "low", 32, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's over your single bond and 100 miles away." }),
  allOnly("W91247-27-R-0026", "Bay and Hangar Door Maintenance, Fort Bragg", "Bay and hangar door maintenance at Fort Bragg", "Department of the Army", MICC, "fed", "Request for Proposal", "SBA", "238290", 1_800_000, 2_400_000, "fortBragg", 11, 27, "low", 22, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. Door maintenance isn't your trade." }),
  allOnly("36C77627R0015", "Health Record Infrastructure Upgrades, Durham VA Medical Center", "Health-record wiring upgrades at the Durham VA", "Department of Veterans Affairs", "Program Contracting Activity Central (PCAC)", "fed", "Request for Proposal", "SDVOSBC", "236220", 15_000_000, 25_000_000, "durham", 14, 44, "low", 20, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's for veteran-owned firms and far too big." }),
  allOnly("W912PM27R0004", "Design-Build SOF Operations Facility, Fort Bragg, NC", "Design-build operations facility at Fort Bragg", "Department of the Army", USACE_WILMINGTON, "fed", "Request for Proposal", "SBA", "236220", 10_000_000, 25_000_000, "fortBragg", 13, 38, "low", 28, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. Design-build at this size needs a design team and a bond line many times yours." }),
  allOnly("B27-021", "Fire Station HVAC Replacement — City of Fayetteville", "Fire station HVAC replacement for the City of Fayetteville", "City of Fayetteville, NC", "Fire Department", "sled", "Invitation for Bid", null, "238220", 90_000, 130_000, "fayetteville", 4, 15, "strong", 74, { verdict: "bid", prime: "go", sub: null, oneLine: "Bid it. Small and local." }),
  allOnly("DAC-27-0412", "Electrical Upgrade, Correctional Institution near Lumberton", "Electrical upgrade at a prison near Lumberton", "North Carolina Department of Adult Correction", "Engineering Section", "sled", "Invitation for Bid", null, "238210", 600_000, 800_000, "lumberton", 10, 36, "stretch", 55, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Secure-site rules slow every day on site, and it's 35 miles away." }),
  allOnly("CC-27-06", "Courthouse Air Handler Replacement — Cumberland County", "Courthouse air handler replacement for Cumberland County", "Cumberland County, NC", "Facilities Management", "sled", "Invitation for Bid", null, "238220", 500_000, 700_000, "fayetteville", 7, 34, "strong", 66, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. A good fit, but if you get the training building job, check your bond room first." }),
  allOnly("CC-27-09", "Elevator Modernization, County Building — Cumberland County", "Elevator modernization in a county building", "Cumberland County, NC", "Facilities Management", "sled", "Invitation for Bid", null, "238290", 400_000, 550_000, "fayetteville", 6, 29, "low", 18, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. Elevators aren't your trade." }),
  allOnly("PWC-2627-14", "Substation Upgrade — Fayetteville Public Works Commission", "Substation upgrade for Fayetteville PWC", "Fayetteville Public Works Commission, NC", "Electric Utility", "sled", "Request for Proposal", null, "237130", 3_000_000, 5_000_000, "fayetteville", 12, 30, "low", 15, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. It's utility line work, not building work." }),
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
    noticeType === "Request for Quote" ? "Quotes" : noticeType === "Invitation for Bid" || noticeType === "Solicitation" ? "Bids" : "Proposals";
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
