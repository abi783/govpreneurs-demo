// THE IT SERVICES FIRM's opportunities: Gallberry Technology Group's whole feed.
// Read through src/demo/story/opportunities.ts, which holds the rules and types
// and picks the active member.
//
// Source: demo-storyboard/it-services-pack.md (19 Oct 2026), section 10.
// The hero is modeled on USARC G-6's competed 8(a) buys at MICC Fort Bragg
// (W91247-18-R-4P0N, W91247-18-T-R019); the twin on USARC knowledge management
// ordered through ITES-3S (W9124722F0019, W9124723F2461); the team-up on the
// Fort Bragg Army medical center's IT services on 8(a) STARS III (HT001524F0117).
// The hospital is never named: "Womack" is one of the caterer's own words.
// Buyers are real; notice ids are invented in the buyers' formats; companies
// are fictional.

import type {
  GrantCall,
  HunterTier,
  NoticeType,
  SetAside,
  StoryOpportunity,
} from "../../story/opportunities";
import type { PlaceKey } from "../../story/places";

export const HERO_IDS = {
  /** Hunter → Grant "Bid" → Diana → Ava builds it. Help desk for the Army Reserve's headquarters. */
  hero: "W91247-27-Q-0131",
  /** Grant: No-bid. Same office and customer, but only ITES-3S holders can quote. */
  twin: "W91247-27-Q-0137",
  /** Grant: bid as a subcontractor; Partners shows the STARS III prime. Army hospital IT follow-on. */
  teamUp: "HT001527RE015",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const POPE = "763rd Enterprise Sourcing Squadron (763 ESS), Pope Army Airfield";
const SEYMOUR = "4th Contracting Squadron, Seymour Johnson AFB";
const ITES = "holders of the Army's ITES-3S contract";

export const OPPORTUNITIES: StoryOpportunity[] = [
  // ── HERO ──────────────────────────────────────────────────────────────
  {
    id: "W91247-27-Q-0131",
    title: "Help Desk and End-User IT Support Services — U.S. Army Reserve Command (USARC) G-6, Fort Bragg",
    plainTitle: "Help desk for the Army Reserve's headquarters at Fort Bragg",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "8A",
    naics: "541519",
    valueLow: 650_000,
    valueHigh: 780_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 5,
    closesInDays: 26,
    dueTime: "2:00 PM Eastern",
    targetAgency: true,
    summary:
      "IT support for about 1,900 users in Marshall Hall: walk-up and phone Tier 1, Tier 2 at the desk, imaging and asset tracking, and video conferencing in 14 rooms. Six techs on site 7:00 to 5:00 on weekdays, a named site lead and alternate, a 30-day phase-in, and Security+ for every tech with admin rights from day one. A base year and four option years; the Service Contract Act applies.",
    hunter: {
      tier: "priority",
      score: 95,
      forYouRank: 1,
      line:
        "Help desk for the Army Reserve's headquarters at Fort Bragg: your computer-services code, an 8(a) set-aside, about $710K a year, and 12 miles from your office.",
      fit: [
        { kind: "naics", code: "541519", says: "your computer-services code" },
        { kind: "setAside", code: "8A", says: "an 8(a) set-aside" },
        { kind: "valueInRange", says: "about $710K a year" },
        { kind: "distance", says: "12 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine:
        "Bid it as prime. It's your work, your size and your 8(a) set-aside. Fix two things first: Security+ on day one and the wage floor.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "drafting",
      note: "Grant says bid. Ava has read the quote papers and has 3 questions for you. No mentor has seen it yet.",
      next: { label: "Send to a mentor", to: "/opportunities/W91247-27-Q-0131" },
      lastActivityDaysAgo: 0,
    },
    ava: {
      kind: "short-response",
      stage: "answer my questions",
      needsYou: true,
      paused: false,
      statusLine: "Ava has 3 questions for you about your site lead, staffing six seats and pricing the techs.",
    },
  },

  // ── Seymour Johnson: the buyer he works for now ───────────────────────
  {
    id: "FA480927Q0006",
    title: "Desktop Support Services, 4th Communications Squadron, Seymour Johnson AFB (Follow-on)",
    plainTitle: "Seymour Johnson desktop support, the follow-on",
    agency: "Department of the Air Force",
    office: SEYMOUR,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "541513",
    valueLow: 210_000,
    valueHigh: 260_000,
    valueBasis: "per_year",
    place: "goldsboro",
    postedDaysAgo: 6,
    closesInDays: 22,
    targetAgency: true,
    summary:
      "Two on-site techs for the squadron's desktop support and imaging, from March 2027, when the current contract ends. A base year and two option years.",
    hunter: {
      tier: "priority",
      score: 93,
      forYouRank: 2,
      line:
        "Seymour Johnson desktop support, the follow-on: your facilities-management code, the desktop support you run for them now, a small-business set-aside, and about $235K a year.",
      fit: [
        { kind: "naics", code: "541513", says: "your facilities-management code" },
        { kind: "pastPerformance", id: "pp-sjafb-desktop-support", says: "the desktop support you run for them now" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $235K a year" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. You're the incumbent, and they rated you Very Good. Send your CPARS with the quote.",
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Saved 2 days ago. Grant has a take ready.",
      next: { label: "Review with Grant", to: "/opportunities/FA480927Q0006" },
      lastActivityDaysAgo: 2,
    },
  },

  // ── THE TWIN ──────────────────────────────────────────────────────────
  {
    id: "W91247-27-Q-0137",
    title: "Knowledge Management and SharePoint Support Services — USARC G-6, Fort Bragg (ITES-3S Task Order)",
    plainTitle: "Army Reserve SharePoint support at Fort Bragg, ITES-3S holders only",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "541519",
    valueLow: 650_000,
    valueHigh: 800_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 4,
    closesInDays: 19,
    targetAgency: true,
    lockedTo: ITES,
    summary:
      "Knowledge management and SharePoint support for the Army Reserve's headquarters, a base year and two option years. The notice says it will be competed as a task order under the Army's ITES-3S contract, and only small-business ITES-3S holders may submit.",
    hunter: {
      tier: "stretch",
      score: 66,
      forYouRank: 3,
      line:
        "SharePoint support for the Army Reserve at Fort Bragg: your computer-services code, a small-business set-aside and about $725K a year, but only holders of the Army's ITES-3S contract can bid.",
      fit: [
        { kind: "naics", code: "541519", says: "your computer-services code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $725K a year" },
        { kind: "lockedOut", says: "only holders of the Army's ITES-3S contract can bid" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: null,
      oneLine:
        "Don't bid. It's an ITES-3S task order, so only that contract's holders can send a quote. You're not one, and ITES-3S is closed. Spend the time on the help desk quote.",
      authored: true,
    },
  },

  // ── THE TEAM-UP ───────────────────────────────────────────────────────
  {
    id: "HT001527RE015",
    title: "Request for Information — Medical Center IT Services Follow-on, Fort Bragg, NC (8(a) STARS III)",
    plainTitle: "Fort Bragg's Army hospital IT support, the follow-on (request for information)",
    agency: "Defense Health Agency",
    office: "Enterprise Medical Services Contracting Division (DHA)",
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: "8A",
    naics: "541512",
    valueLow: 3_800_000,
    valueHigh: 4_400_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 4,
    closesInDays: 14,
    targetAgency: true,
    lockedTo: "holders of GSA's 8(a) STARS III contract",
    summary:
      "The hospital's IT services come back in 2027: deskside support, the service desk and clinic network support. The DHA expects to order it through 8(a) STARS III, with quotes in about 90 days and an award by 28 February 2027.",
    hunter: {
      tier: "priority",
      score: 82,
      forYouRank: 4,
      line:
        "Fort Bragg's Army hospital IT support comes back in 2027: your computer-systems code and your Seymour Johnson desktop work fit, but it is ordered only through 8(a) STARS III and runs about $4M a year.",
      fit: [
        { kind: "naics", code: "541512", says: "your computer-systems code" },
        { kind: "pastPerformance", id: "pp-sjafb-desktop-support", says: "your Seymour Johnson desktop work" },
        { kind: "lockedOut", says: "ordered only through 8(a) STARS III" },
        { kind: "valueAboveRange", says: "about $4M a year" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "no_go",
      sub: "go",
      oneLine:
        "Team up. Only STARS III holders can quote it, and each year is about one and a half times your revenue. As Brackwater's sub you'd run the deskside techs at the hospital, the work you already do at Seymour Johnson.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Grant says team up. Brackwater Federal Solutions wants a local firm for 9 deskside techs.",
      next: { label: "See partners", to: "/partners" },
      lastActivityDaysAgo: 1,
    },
  },

  // ── The rest of "Opportunities for you" ──────────────────────────────
  {
    id: "FA445227R0004",
    title: "Sources Sought — IT Support Services, 43rd Communications Squadron, Pope Army Airfield",
    plainTitle: "Sources sought for Pope's 43 CS IT support",
    agency: "Department of the Air Force",
    office: POPE,
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: null,
    naics: "541513",
    valueLow: 850_000,
    valueHigh: 950_000,
    valueBasis: "per_year",
    place: "popeAaf",
    postedDaysAgo: 5,
    closesInDays: 16,
    targetAgency: true,
    summary:
      "The Air Force asks which firms could run the 43rd Communications Squadron's IT support at Pope. The last two contracts went to one firm without competition; answers decide how the next one is bought.",
    hunter: {
      tier: "priority",
      score: 84,
      forYouRank: 5,
      line:
        "Sources sought for Pope's 43 CS IT support: your facilities-management code, about $900K a year, 15 miles from your office, and not a bid yet.",
      fit: [
        { kind: "naics", code: "541513", says: "your facilities-management code" },
        { kind: "valueInRange", says: "about $900K a year" },
        { kind: "distance", says: "15 miles from your office" },
        { kind: "noticeType", says: "not a bid yet" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine:
        "Look closer, then answer it. The last two went without competition; two or more capable 8(a) answers can turn the next one into a competition.",
    },
    saved: true,
    pursuit: {
      stage: "with_mentor",
      note: "Diana read your question and wants to talk first.",
      next: { label: "Read Diana's reply", to: "/mentors/rev-pope-sources-sought" },
      lastActivityDaysAgo: 0,
    },
    mentorReviewId: "rev-pope-sources-sought",
  },
  {
    id: "HM-IT-2027-01",
    title: "Managed IT Services — Town Hall and Police Department, Town of Hope Mills",
    plainTitle: "Hope Mills town hall and police IT",
    agency: "Town of Hope Mills, NC",
    office: "Town Manager's Office",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541519",
    valueLow: 70_000,
    valueHigh: 95_000,
    valueBasis: "per_year",
    place: "hopeMills",
    postedDaysAgo: 7,
    closesInDays: 24,
    targetAgency: true,
    summary:
      "Help desk, Microsoft 365, backups and network support for the town hall and police department, with a named tech who can be on site the same day. Three years.",
    hunter: {
      tier: "strong",
      score: 80,
      forYouRank: 6,
      line:
        "Hope Mills town hall and police IT: your computer-services code, the managed IT you run for four clinics, about $82K a year, and 10 miles from your office.",
      fit: [
        { kind: "naics", code: "541519", says: "your computer-services code" },
        { kind: "pastPerformance", id: "pp-sandhills-managed-it", says: "the managed IT you run for four clinics" },
        { kind: "valueInRange", says: "about $82K a year" },
        { kind: "distance", says: "10 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Local and small, and it's the managed IT you already run for the clinics.",
    },
  },
  {
    id: "FAY-IT-2027-03",
    title: "IT Help Desk Overflow and After-Hours Support — City of Fayetteville",
    plainTitle: "City of Fayetteville help desk overflow and after-hours",
    agency: "City of Fayetteville, NC",
    office: "Information Technology Department",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541519",
    valueLow: 180_000,
    valueHigh: 240_000,
    valueBasis: "per_year",
    place: "fayetteville",
    postedDaysAgo: 8,
    closesInDays: 30,
    targetAgency: true,
    summary:
      "Take the city's help desk calls when its own staff are busy, and cover nights, weekends and holidays, 24 hours a day. Two years and two option years.",
    hunter: {
      tier: "strong",
      score: 76,
      forYouRank: 7,
      line:
        "City of Fayetteville help desk overflow and after-hours: your computer-services code, about $210K a year, across town, and a buyer on your list.",
      fit: [
        { kind: "naics", code: "541519", says: "your computer-services code" },
        { kind: "valueInRange", says: "about $210K a year" },
        { kind: "distance", says: "across town" },
        { kind: "targetAgency", says: "a buyer on your list" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. It wants cover 24 hours a day, every day, and you staff weekdays.",
    },
  },
  {
    id: "FTCC-IT-2027-04",
    title: "Evening and Weekend Student Help Desk — Fayetteville Technical Community College",
    plainTitle: "Evening and weekend student help desk at Fayetteville Tech",
    agency: "Fayetteville Technical Community College, NC",
    office: "Purchasing Department",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541519",
    valueLow: 120_000,
    valueHigh: 160_000,
    valueBasis: "per_year",
    place: "fayetteville",
    postedDaysAgo: 6,
    closesInDays: 21,
    summary:
      "Phone, chat and walk-up help for students on weekday evenings and weekends: passwords, the learning system and laptops. The college pays in 30 days.",
    hunter: {
      tier: "strong",
      score: 75,
      forYouRank: 8,
      line:
        "Evening and weekend student help desk at Fayetteville Tech: your computer-services code, about $140K a year, and across town.",
      fit: [
        { kind: "naics", code: "541519", says: "your computer-services code" },
        { kind: "valueInRange", says: "about $140K a year" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Local, your work, and the college pays in 30 days.",
    },
  },
  {
    id: "40-RQ27003152",
    title: "Statewide Category Two Internal Connections Contract (E-Rate) — NC Department of Public Instruction",
    plainTitle: "Statewide school Wi-Fi contract (E-Rate)",
    agency: "NC Department of Public Instruction",
    office: "Office of Digital Teaching and Learning",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541512",
    valueLow: null,
    valueHigh: null,
    place: "statewideNc",
    postedDaysAgo: 9,
    closesInDays: 18,
    targetAgency: true,
    summary:
      "A statewide contract that school districts order Wi-Fi and network work from, paid in part by the federal E-Rate program. Districts run mini-bids for each job.",
    hunter: {
      tier: "strong",
      score: 72,
      forYouRank: 9,
      line: "Statewide school Wi-Fi contract (E-Rate): your computer-systems code, and a buyer on your list.",
      fit: [
        { kind: "naics", code: "541512", says: "your computer-systems code" },
        { kind: "targetAgency", says: "a buyer on your list" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. It needs an E-Rate provider number and partner status with a network maker.",
    },
  },
  {
    id: "W912HQ27Q0007",
    title: "Conference Room VTC Upgrade, 249th Engineer Battalion, Fort Bragg",
    plainTitle: "Conference-room video upgrade for the 249th Engineer Battalion",
    agency: "Department of the Army",
    office: "U.S. Army Corps of Engineers, Humphreys Engineer Center Support Activity",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "541519",
    valueLow: 60_000,
    valueHigh: 80_000,
    place: "fortBragg",
    postedDaysAgo: 3,
    closesInDays: 12,
    targetAgency: true,
    summary:
      "Replace the displays, cameras, microphones and video-conferencing unit in two conference rooms, and train the staff. 45 days.",
    hunter: {
      tier: "strong",
      score: 71,
      forYouRank: 10,
      line:
        "Conference-room video upgrade for the 249th Engineer Battalion: your computer-services code, a small-business set-aside, about $70K, and 12 miles from your office.",
      fit: [
        { kind: "naics", code: "541519", says: "your computer-services code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $70K" },
        { kind: "distance", says: "12 miles from your office" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. It's mostly equipment, so get a firm quote from an audio-visual supplier first.",
    },
  },
  {
    id: "36C24627Q0187",
    title: "Structured Cabling and Network Switches, Clinic Relocation — Fayetteville VA Medical Center",
    plainTitle: "Cabling and switches for a clinic move at the Fayetteville VA",
    agency: "Department of Veterans Affairs",
    office: "Network Contracting Office 6 (NCO 6)",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SDVOSBC",
    naics: "541519",
    valueLow: 90_000,
    valueHigh: 130_000,
    place: "fayetteville",
    postedDaysAgo: 5,
    closesInDays: 15,
    summary: "New cabling, network switches and wireless access points for a clinic moving to a new floor of the medical center.",
    hunter: {
      tier: "stretch",
      score: 58,
      forYouRank: 11,
      line:
        "Cabling and switches for a clinic move at the Fayetteville VA: your computer-services code and about $110K, but it is for service-disabled veteran-owned firms.",
      fit: [
        { kind: "naics", code: "541519", says: "your computer-services code" },
        { kind: "valueInRange", says: "about $110K" },
        { kind: "setAsideGap", says: "for service-disabled veteran-owned firms" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: null,
      oneLine: "Don't bid. It's set aside for service-disabled veteran-owned firms.",
    },
  },
  {
    id: "H9225727Q0012",
    title: "Office IT Rewire and Network Switch Installation, MARSOC, Camp Lejeune",
    plainTitle: "Office IT rewire and switch install at Camp Lejeune",
    agency: "Department of the Navy",
    office: "Marine Forces Special Operations Command (MARSOC), Camp Lejeune",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "541519",
    valueLow: 40_000,
    valueHigh: 60_000,
    place: "jacksonville",
    postedDaysAgo: 4,
    closesInDays: 15,
    summary: "Move an office's network drops, install and set up new switches, and label and test every port. About two weeks of work.",
    hunter: {
      tier: "stretch",
      score: 56,
      forYouRank: 12,
      line:
        "Office IT rewire and switch install at Camp Lejeune: your computer-services code, a small-business set-aside, about $50K, and 100 miles from your office.",
      fit: [
        { kind: "naics", code: "541519", says: "your computer-services code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $50K" },
        { kind: "distance", says: "100 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Small and quick: one tech for two weeks.",
    },
  },

  // ── All tab only ──────────────────────────────────────────────────────
  allOnly("W91247-27-R-0009", "Logistics Systems Field Support Services, Fort Bragg (Follow-on) — ITES-3S Task Order", "Logistics systems field support at Fort Bragg, ITES-3S holders only", "Department of the Army", MICC, "fed", "Request for Proposal", "SBA", "541519", 3_800_000, 4_400_000, "fortBragg", 9, 33, "low", 30, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. Only ITES-3S holders can bid, and each year is more than your revenue." }, { valueBasis: "per_year", lockedTo: ITES }),
  allOnly("M6785427R4902", "Notice of Intent to Sole Source: Base Network Operations and Maintenance, Camp Lejeune — 8(a)", "Camp Lejeune base network going to one 8(a) firm", "Department of the Navy", "Marine Corps Systems Command", "fed", "Solicitation", "8A", "541512", 13_000_000, 15_000_000, "jacksonville", 6, 15, "low", 20, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. It says the work is going to one 8(a) firm without competition." }, { valueBasis: "per_year", summary: "Camp Lejeune base network going to one 8(a) firm. The Marine Corps plans to award it without competition; responses are due in 15 days." }),
  allOnly("W56JSR27R0004", "Request for Information — Army Enterprise Shared Services Help Desk", "Army-wide shared services help desk (request for information)", "Department of the Army", "Army Contracting Command — Aberdeen Proving Ground (CECOM)", "fed", "Sources Sought", null, "541519", 40_000_000, 45_000_000, "multiStateSe", 10, 30, "low", 15, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's national and about 15 times your size. Watch who answers it." }, { valueBasis: "per_year" }),
  allOnly("W91242-27-Q-0021", "Internet and Phone Services, NC National Guard Recruiting Offices", "Internet and phones for NC Guard recruiting offices", "Department of the Army", "USPFO for North Carolina (NC Army National Guard), Raleigh", "fed", "Request for Quote", "SBA", "541519", 60_000, 80_000, "statewideNc", 7, 20, "stretch", 50, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's mostly reselling phone and internet lines, and the last two went through ITES-3S." }, { valueBasis: "per_year" }),
  allOnly("FA445227Q0009", "Brand Name Cisco Licenses and Support Renewal, 43rd Communications Squadron", "Cisco licenses and support renewal for Pope's 43 CS", "Department of the Air Force", POPE, "fed", "Request for Quote", "SBA", "541519", 90_000, 110_000, "popeAaf", 4, 11, "low", 28, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. It's brand-name license resale, not your work." }),
  allOnly("75N98027Q00104", "Data Center Relocation and Decommissioning Services, NIEHS", "Data center move and shutdown at NIEHS", "Department of Health and Human Services", "National Institute of Environmental Health Sciences (NIEHS), Research Triangle Park", "fed", "Request for Quote", "SBA", "541519", 400_000, 600_000, "durham", 8, 25, "stretch", 52, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's a one-time job, and you have no data center moves to show." }),
  allOnly("CUMCO-IT-2027-02", "Network Switch Refresh, Courthouse and Department of Social Services — Cumberland County", "Courthouse and social services switch refresh for Cumberland County", "Cumberland County, NC", "Information Services", "sled", "Request for Proposal", null, "541512", 150_000, 220_000, "fayetteville", 9, 28, "stretch", 55, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's mostly hardware, so get a quote through a network maker's partner first." }),
  allOnly("HCS-2027-TECH-02", "Purchase of 2,400 Student Chromebooks with Setup — Hoke County Schools", "2,400 Chromebooks with setup for Hoke County Schools", "Hoke County Schools, NC", "Technology Department", "sled", "Invitation for Bid", null, "423430", 700_000, 800_000, "raeford", 6, 17, "low", 18, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. It's a device purchase, and resellers take it on device price." }),
  allOnly("PWC-2027-IT-07", "Cybersecurity Assessment and Penetration Testing — Fayetteville Public Works Commission", "Cyber assessment and penetration test for Fayetteville PWC", "Fayetteville Public Works Commission, NC", "Information Technology", "sled", "Request for Proposal", null, "541519", 60_000, 90_000, "fayetteville", 5, 23, "stretch", 45, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It covers the utility's control systems, and no one on your team holds a penetration-testing certification." }),
  allOnly("SL-IT-2027-01", "IT Support and Microsoft 365 Migration — Town of Spring Lake", "Spring Lake town IT support and Microsoft 365 move", "Town of Spring Lake, NC", "Town Manager's Office", "sled", "Request for Proposal", null, "541519", 45_000, 65_000, "springLake", 5, 27, "strong", 70, { verdict: "bid", prime: "go", sub: null, oneLine: "Bid it. Small but local, and it pairs with Hope Mills." }, { valueBasis: "per_year" }),
  allOnly("ITS-402276-001", "IT Specialty Services Statewide Term Contract — NC Department of Information Technology", "State IT specialty services term contract", "NC Department of Information Technology", "Statewide IT Procurement", "sled", "Request for Proposal", null, "541512", null, null, "raleigh", 12, 35, "stretch", 50, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It opens orders from state agencies, but the paperwork is heavy." }, { summary: "State IT specialty services term contract. State agencies order from it as they need; proposals are due in 35 days." }),
  allOnly("W91247-27-Q-0152", "SharePoint Online Migration, Directorate of Plans, Training, Mobilization and Security — Fort Bragg", "SharePoint Online migration for Fort Bragg's DPTMS", "Department of the Army", MICC, "fed", "Request for Quote", "SDVOSBC", "541519", 150_000, 200_000, "fortBragg", 6, 18, "stretch", 46, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's set aside for service-disabled veteran-owned firms." }),
  allOnly("FSU-IT-2027-05", "Wireless Survey and Installation, Two Residence Halls — Fayetteville State University", "Wi-Fi survey and install in two Fayetteville State residence halls", "Fayetteville State University, NC", "Information Technology Services", "sled", "Invitation for Bid", null, "541512", 90_000, 130_000, "fayetteville", 7, 20, "stretch", 50, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It needs a Wi-Fi maker's installer certification." }),
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
  valueLow: number | null,
  valueHigh: number | null,
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
        : noticeType === "Sources Sought"
          ? "Answers"
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
