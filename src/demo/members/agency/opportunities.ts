// THE AGENCY's opportunities: Lantern Row Creative's whole feed.
// Read through src/demo/story/opportunities.ts, which holds the rules and types
// and picks the active member.
//
// Source: demo-storyboard/marketing-agency-pack.md (approved 19 Oct 2026).
// The hero and its twin are modeled on two real MICC Fort Bragg requirements for
// the Army Community Service Family Advocacy Program (PANMCC-21-P-000-009052 and
// PANMCC24P0000016825); the team-up on the VA's VHA Recruitment Marketing &
// Advertising contract (36C77623C0104, ends 24 Sep 2027). Buyers are real;
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
  /** Hunter → Grant "Bid" → Diana → Ava builds it. Family Advocacy print and digital ads. */
  hero: "W91247-27-Q-0108",
  /** Grant: No-bid. Same office and program, but written around one provider's app and crew. */
  twin: "W91247-27-Q-0112",
  /** Grant: bid as a subcontractor; Partners shows the veteran-owned prime. VA hiring campaign. */
  teamUp: "36C77627Q0031",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";

export const OPPORTUNITIES: StoryOpportunity[] = [
  // ── HERO ──────────────────────────────────────────────────────────────
  {
    id: "W91247-27-Q-0108",
    title: "Print and Digital Advertising — ACS Family Advocacy Program, Fort Bragg",
    plainTitle: "Family Advocacy ad campaign at Fort Bragg",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "WOSB",
    naics: "541810",
    valueLow: 190_000,
    valueHigh: 240_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 4,
    closesInDays: 24,
    dueTime: "11:00 AM Eastern",
    targetAgency: true,
    summary:
      "Reach military families within 30 miles of Fort Bragg with the Family Advocacy Program's prevention messages: 24 short videos, social, display and search ads, weekly ads in four local papers, and ads on the contractor's own mobile app. A base year and four option years, with a named project manager and alternate.",
    hunter: {
      tier: "priority",
      score: 94,
      forYouRank: 1,
      line:
        "Family Advocacy ad campaign at Fort Bragg: your advertising code, a woman-owned set-aside, about $215K a year, and 12 miles from your office.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "setAside", code: "WOSB", says: "a woman-owned set-aside" },
        { kind: "valueInRange", says: "about $215K a year" },
        { kind: "distance", says: "12 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine:
        "Bid it as prime. It is your work, your size and your set-aside. Fix two things first: the app line and five years of print rates.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "drafting",
      note: "Grant says bid. Ava has read the papers and has 3 questions for you. No mentor has seen it yet.",
      next: { label: "Send to a mentor", to: "/opportunities/W91247-27-Q-0108" },
      lastActivityDaysAgo: 0,
    },
    ava: {
      kind: "short-response",
      stage: "answer my questions",
      needsYou: true,
      paused: false,
      statusLine: "Ava has 3 questions for you about your team, the videos and the app line.",
    },
  },

  // ── NC Guard: the buyer she already delivered for ─────────────────────
  {
    id: "W91242-27-Q-0014",
    title: "Recruiting and Retention Digital Advertising, FY27 — NC Army National Guard",
    plainTitle: "NC Guard recruiting ads for next year",
    agency: "Department of the Army",
    office: "USPFO for North Carolina (NC Army National Guard), Raleigh",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "541810",
    valueLow: 95_000,
    valueHigh: 140_000,
    place: "statewideNc",
    postedDaysAgo: 6,
    closesInDays: 21,
    targetAgency: true,
    summary:
      "Geofenced and social recruiting ads around high schools, colleges and state events, short videos, and a lead form routed to recruiters, for 12 months across North Carolina.",
    hunter: {
      tier: "priority",
      score: 91,
      forYouRank: 2,
      line:
        "NC Guard recruiting ads for next year: your advertising code, the campaign you ran for them last year, a small-business set-aside, and about $118K.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "pastPerformance", id: "pp-ncng-recruiting", says: "the campaign you ran for them last year" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $118K" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. You ran this campaign for them; ask for your interim rating before you send the quote.",
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Saved 2 days ago. Grant has a take ready.",
      next: { label: "Review with Grant", to: "/opportunities/W91242-27-Q-0014" },
      lastActivityDaysAgo: 2,
    },
  },

  // ── THE TWIN ──────────────────────────────────────────────────────────
  {
    id: "W91247-27-Q-0112",
    title: "Video Commercial Advertising (Cable and Streaming) — ACS Family Advocacy Program, Fort Bragg",
    plainTitle: "Family Advocacy TV and streaming ads at Fort Bragg",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "541810",
    valueLow: 340_000,
    valueHigh: 440_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 4,
    closesInDays: 20,
    targetAgency: true,
    exclusiveProvider:
      "Streaming via the local subscriber-based provider's own app, ads produced by that provider's production team, and the provider's viewer data.",
    summary:
      "Television and streaming commercials for the Family Advocacy Program to households around Fort Bragg. The work statement requires streaming through one local provider's own subscriber app, ads made by that provider's production team, and that provider's viewer reports. A base year and one option year.",
    hunter: {
      tier: "stretch",
      score: 64,
      forYouRank: 3,
      line:
        "Family Advocacy TV and streaming ads at Fort Bragg: your advertising code, a small-business set-aside and about $390K a year, but the work names one provider's own app and crew.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $390K a year" },
        { kind: "providerLock", says: "names one provider's own app and crew" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: "no_go",
      oneLine:
        "Don't bid. It requires one provider's own streaming app, production crew and viewer data. Unless you are that provider, you can't meet it.",
      authored: true,
    },
  },

  // ── City and county work close to home ───────────────────────────────
  {
    id: "FAY-TR-2027-04",
    title: "Transit Ridership Marketing Campaign — Fayetteville Area System of Transit (FAST)",
    plainTitle: "Bus ridership campaign for the City of Fayetteville",
    agency: "City of Fayetteville, NC",
    office: "Transit Department (FAST)",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541810",
    valueLow: 120_000,
    valueHigh: 160_000,
    place: "fayetteville",
    postedDaysAgo: 12,
    closesInDays: 14,
    dueTime: "2:00 PM Eastern",
    summary:
      "A year-long campaign to grow bus ridership: bus wraps and shelter ads, short videos, paid social in English and Spanish, and a rider survey. One year with two option years.",
    hunter: {
      tier: "priority",
      score: 88,
      forYouRank: 4,
      line:
        "Bus ridership campaign for the City of Fayetteville: your advertising code, the stormwater campaign you made for the city, about $140K, and across town.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "pastPerformance", id: "pp-fayetteville-stormwater", says: "the stormwater campaign you made for the city" },
        { kind: "valueInRange", says: "about $140K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Same city, same kind of public campaign you delivered in 2023, and your size.",
    },
    saved: true,
    pursuit: {
      stage: "with_mentor",
      note: "Diana read your draft and replied with three changes.",
      next: { label: "Read Diana's notes", to: "/mentors/rev-fast-proposal" },
      lastActivityDaysAgo: 0,
    },
    mentorReviewId: "rev-fast-proposal",
  },
  {
    id: "CUMCO-PH-2027-03",
    title: "Public Health Awareness Campaign — Overdose Prevention and Vaccination",
    plainTitle: "Public-health awareness campaign for Cumberland County",
    agency: "Cumberland County, NC",
    office: "Department of Public Health",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541810",
    valueLow: 60_000,
    valueHigh: 85_000,
    place: "fayetteville",
    postedDaysAgo: 9,
    closesInDays: 25,
    summary:
      "Two public-health campaigns for county residents, overdose prevention and seasonal vaccination: short videos, social and search ads, and printed pieces for clinics. Twelve months.",
    hunter: {
      tier: "priority",
      score: 85,
      forYouRank: 5,
      line:
        "Public-health awareness campaign for Cumberland County: your advertising code, about $72K, and across town. Half the work is short video.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "valueInRange", says: "about $72K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Close to home, your size, and video is half the scope.",
    },
  },

  // ── THE TEAM-UP ───────────────────────────────────────────────────────
  {
    id: "36C77627Q0031",
    title: "Sources Sought — VHA Recruitment Marketing and Advertising Campaign (Follow-on)",
    plainTitle: "VA's national health-care hiring campaign (sources sought)",
    agency: "Department of Veterans Affairs",
    office: "Program Contracting Activity Central (PCAC)",
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: "SDVOSBC",
    naics: "541613",
    valueLow: 7_000_000,
    valueHigh: 9_000_000,
    valueBasis: "per_year",
    place: "multiStateSe",
    postedDaysAgo: 5,
    closesInDays: 21,
    dueTime: "3:00 PM Eastern",
    targetAgency: true,
    summary:
      "The VA asks which firms could run its national campaign to recruit doctors, nurses and staff when the current contract ends in September 2027: strategy, paid media, video shoots at VA medical centers and a hiring website. Expected to be set aside for service-disabled veteran-owned firms.",
    hunter: {
      tier: "priority",
      score: 80,
      forYouRank: 6,
      line:
        "VA's national health-care hiring campaign returns in 2027: your marketing-consulting code and your home-health hiring campaign fit, but it is for veteran-owned firms and about $8M a year.",
      fit: [
        { kind: "naics", code: "541613", says: "your marketing-consulting code" },
        { kind: "pastPerformance", id: "pp-longleaf-hiring", says: "your home-health hiring campaign" },
        { kind: "setAsideGap", says: "for veteran-owned firms" },
        { kind: "valueAboveRange", says: "about $8M a year" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "no_go",
      sub: "go",
      oneLine:
        "Team up. It is set aside for service-disabled veteran-owned firms, and a year of it is about six times your revenue. As Bluestone's subcontractor you would run the Southeast video shoots.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Grant says team up. Bluestone Veteran Media Group wants a woman-owned video crew.",
      next: { label: "See partners", to: "/partners" },
      lastActivityDaysAgo: 1,
    },
  },

  // ── The rest of "Opportunities for you" ──────────────────────────────
  {
    id: "MWR-FB-27-0006",
    title: "Marketing and Graphic Design Support — Fort Bragg Family and MWR",
    plainTitle: "Design and marketing support for Fort Bragg MWR",
    agency: "Department of the Army",
    office: "Fort Bragg Family and MWR (NAF Contracting)",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "WOSB",
    naics: "541430",
    valueLow: 45_000,
    valueHigh: 70_000,
    place: "fortBragg",
    postedDaysAgo: 3,
    closesInDays: 17,
    targetAgency: true,
    summary:
      "Posters, social graphics, event flyers and short promo videos for MWR programs, ordered as needed over 12 months.",
    hunter: {
      tier: "strong",
      score: 82,
      forYouRank: 7,
      line:
        "Design and marketing support for Fort Bragg MWR: your graphic-design code, a woman-owned set-aside, about $58K, and 12 miles from your office.",
      fit: [
        { kind: "naics", code: "541430", says: "your graphic-design code" },
        { kind: "setAside", code: "WOSB", says: "a woman-owned set-aside" },
        { kind: "valueInRange", says: "about $58K" },
        { kind: "distance", says: "12 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Small, woman-owned, on your doorstep, and steady work for your design team.",
    },
  },
  {
    id: "FTCC-MKT-2027-02",
    title: "Enrollment Marketing Campaign — Fayetteville Technical Community College",
    plainTitle: "Enrollment campaign for Fayetteville Tech",
    agency: "Fayetteville Technical Community College, NC",
    office: "Purchasing Department",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541810",
    valueLow: 150_000,
    valueHigh: 210_000,
    place: "fayetteville",
    postedDaysAgo: 8,
    closesInDays: 27,
    summary:
      "Paid social, search and streaming-audio ads, student-story videos and landing pages for spring and fall enrollment, with lead forms sent to admissions.",
    hunter: {
      tier: "strong",
      score: 81,
      forYouRank: 8,
      line: "Enrollment campaign for Fayetteville Tech: your advertising code, about $180K, and across town.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "valueInRange", says: "about $180K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Lead forms that reach admissions fast are your strongest point.",
    },
  },
  {
    id: "NCDHHS-FC-2027-11",
    title: "Statewide Foster Parent Recruitment Campaign — NC Division of Social Services",
    plainTitle: "Statewide foster-parent recruitment campaign",
    agency: "North Carolina Department of Health and Human Services",
    office: "Division of Social Services",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541810",
    valueLow: 280_000,
    valueHigh: 380_000,
    place: "raleigh",
    postedDaysAgo: 11,
    closesInDays: 30,
    targetAgency: true,
    summary:
      "A statewide campaign to recruit foster parents: video stories, paid social and search, radio, and an inquiry form routed to county caseworkers. Two years.",
    hunter: {
      tier: "strong",
      score: 79,
      forYouRank: 9,
      line:
        "Statewide foster-parent recruitment campaign: your advertising code, like the hiring campaign you ran for Longleaf Home Health, about $330K, and a state agency on your list.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "pastPerformance", id: "pp-longleaf-hiring", says: "the hiring campaign you ran for Longleaf Home Health" },
        { kind: "valueInRange", says: "about $330K" },
        { kind: "targetAgency", says: "a state agency on your list" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. The right kind of campaign at your top size; price the statewide media buy carefully.",
    },
  },
  {
    id: "CCS-HR-2027-05",
    title: "Teacher Recruitment Digital Campaign — Cumberland County Schools",
    plainTitle: "Teacher recruitment ads for Cumberland County Schools",
    agency: "Cumberland County Schools, NC",
    office: "Human Resources",
    scope: "sled",
    noticeType: "Request for Quote",
    setAside: null,
    naics: "541810",
    valueLow: 40_000,
    valueHigh: 60_000,
    place: "fayetteville",
    postedDaysAgo: 2,
    closesInDays: 16,
    summary: "Paid social and search ads with a short video to recruit teachers and bus drivers for next school year.",
    hunter: {
      tier: "strong",
      score: 77,
      forYouRank: 10,
      line:
        "Teacher recruitment ads for Cumberland County Schools: your advertising code, the hiring campaign you ran for Longleaf Home Health, about $50K, and across town.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "pastPerformance", id: "pp-longleaf-hiring", says: "the hiring campaign you ran for Longleaf Home Health" },
        { kind: "valueInRange", says: "about $50K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. A small hiring campaign close to home, the kind you have done.",
    },
  },
  {
    id: "FA4809-27-Q-0016",
    title: "Airman and Family Readiness Outreach Video Series — Seymour Johnson AFB",
    plainTitle: "Outreach videos for Seymour Johnson's family-readiness center",
    agency: "Department of the Air Force",
    office: "4th Contracting Squadron, Seymour Johnson AFB",
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "WOSB",
    naics: "512110",
    valueLow: 30_000,
    valueHigh: 45_000,
    place: "goldsboro",
    postedDaysAgo: 7,
    closesInDays: 19,
    summary: "Six short, captioned videos explaining family-readiness services to new arrivals, with social cut-downs.",
    hunter: {
      tier: "strong",
      score: 72,
      forYouRank: 11,
      line:
        "Outreach videos for Seymour Johnson's family-readiness center: your video-production code, a woman-owned set-aside, about $38K, and 75 miles from your office.",
      fit: [
        { kind: "naics", code: "512110", says: "your video-production code" },
        { kind: "setAside", code: "WOSB", says: "a woman-owned set-aside" },
        { kind: "valueInRange", says: "about $38K" },
        { kind: "distance", says: "75 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Small, woman-owned and all video; plan two shoot days in Goldsboro.",
    },
  },
  {
    id: "NCDOT-GHSP-2027-08",
    title: "Highway Safety Paid Media Campaign — Governor's Highway Safety Program",
    plainTitle: "Highway safety ad campaign for NCDOT",
    agency: "North Carolina Department of Transportation",
    office: "Governor's Highway Safety Program",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541810",
    valueLow: 350_000,
    valueHigh: 450_000,
    place: "statewideNc",
    postedDaysAgo: 14,
    closesInDays: 33,
    targetAgency: true,
    summary:
      "Statewide paid media for seat-belt and impaired-driving enforcement waves: TV, radio, streaming, social and search, with reports after each wave.",
    hunter: {
      tier: "strong",
      score: 70,
      forYouRank: 12,
      line: "Highway safety ad campaign for NCDOT: your advertising code, about $400K, and a state agency on your list.",
      fit: [
        { kind: "naics", code: "541810", says: "your advertising code" },
        { kind: "valueInRange", says: "about $400K" },
        { kind: "targetAgency", says: "a state agency on your list" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. Your top size, and most of the price is the media buy, so the margin is thin.",
    },
  },

  // ── All tab only ──────────────────────────────────────────────────────
  allOnly("36C10X27Q0007", "ChooseVA Employer Brand Campaign — GSA MAS Task Order (eBuy)", "VA's employer-brand campaign, for GSA schedule holders", "Department of Veterans Affairs", "Strategic Acquisition Center", "fed", "Request for Quote", null, "541810", 2_500_000, 3_500_000, "multiStateSe", 6, 18, "low", 34, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. It is posted on GSA eBuy for schedule holders only, and you are not on a schedule yet." }),
  allOnly("W91247-27-R-0031", "Army Community Service Multi-Program Media Support — Fort Bragg", "Media support for every Army Community Service program at Fort Bragg", "Department of the Army", MICC, "fed", "Request for Proposal", "SBA", "541810", 1_200_000, 1_600_000, "fortBragg", 10, 41, "stretch", 58, { verdict: "review", prime: "no_go", sub: "go", oneLine: "Look closer. About your whole year's revenue; better as a subcontractor this time." }),
  allOnly("VNC-2027-ADV-01", "National Tourism Advertising Campaign — Visit NC", "Visit NC's national tourism campaign", "North Carolina Department of Commerce", "Visit NC (Economic Development Partnership of NC)", "sled", "Request for Proposal", null, "541810", 8_000_000, 12_000_000, "statewideNc", 18, 45, "low", 30, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. A national media buy for large agencies with tourism records." }),
  allOnly("RAL-WC-2027-12", "Water Conservation Public Awareness Campaign — City of Raleigh", "Water-saving campaign for the City of Raleigh", "City of Raleigh, NC", "Raleigh Water", "sled", "Request for Proposal", null, "541810", 90_000, 130_000, "raleigh", 9, 26, "strong", 73, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Like your stormwater work, but Raleigh is 65 miles away; plan the shoots." }),
  allOnly("WCPSS-TR-2027-03", "Bus Driver Recruitment Campaign — Wake County Public Schools", "Bus-driver recruitment ads for Wake County schools", "Wake County Public Schools, NC", "Transportation Services", "sled", "Request for Quote", null, "541810", 60_000, 90_000, "raleigh", 5, 18, "strong", 71, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Your kind of hiring campaign, 65 miles away." }),
  allOnly("CFPUA-COM-2027-06", "Rate Change Customer Communications — Cape Fear Public Utility Authority", "Customer messages about Wilmington water rates", "Cape Fear Public Utility Authority, NC", "Communications", "sled", "Request for Quote", null, "541820", 70_000, 95_000, "wilmington", 8, 22, "strong", 66, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Your public-relations code, but 90 miles from your office." }),
  allOnly("FA4418-27-Q-0021", "Air Show Marketing and Promotion — Joint Base Charleston", "Air show promotion at Joint Base Charleston", "Department of the Air Force", "628th Contracting Squadron", "fed", "Request for Quote", "SBA", "541810", 55_000, 80_000, "charleston", 7, 20, "stretch", 52, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. Charleston is outside your 200-mile service area." }),
  allOnly("M67001-27-Q-0033", "Marketing and Creative Services BPA — MCCS Camp Lejeune", "Creative services on call for Marine Corps Community Services, Camp Lejeune", "Department of the Navy", "Marine Corps Community Services (MCCS) Lejeune–New River", "fed", "Request for Quote", "SBA", "541810", 400_000, 650_000, "jacksonville", 12, 38, "stretch", 60, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Good fit for your team, but 100 miles away and above your range." }),
  allOnly("N00189-27-Q-0040", "Fleet and Family Support Outreach Campaign — Naval Station Norfolk", "Outreach campaign for Navy families in Norfolk", "Department of the Navy", "NAVSUP Fleet Logistics Center Norfolk", "fed", "Request for Quote", "SBA", "541810", 120_000, 170_000, "norfolk", 9, 24, "stretch", 50, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. 220 miles is outside your service area." }),
  allOnly("DURCO-CE-2027-02", "Civic Engagement and Voter Information Campaign — Durham County", "Voter-information campaign for Durham County", "Durham County, NC", "Board of Elections", "sled", "Request for Proposal", null, "541820", 80_000, 110_000, "durham", 13, 29, "strong", 65, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Your size, 85 miles away, and a short window before the election." }),
  allOnly("CATS-2027-MKT-05", "Light Rail Ridership Marketing — Charlotte Area Transit System", "Light-rail ridership campaign in Charlotte", "City of Charlotte, NC", "Charlotte Area Transit System", "sled", "Request for Proposal", null, "541810", 600_000, 900_000, "charlotte", 16, 44, "low", 40, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Skip it. Twice your top size and 140 miles away." }),
  allOnly("47PD0227Q0019", "Wayfinding and Signage Graphic Design — Greensboro Federal Building", "Signage design for the Greensboro federal building", "General Services Administration", "GSA Public Buildings Service, Region 4", "fed", "Request for Quote", "SBA", "541430", 35_000, 55_000, "greensboro", 11, 23, "strong", 63, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Your design code and size, but 115 miles away for site visits." }),
  allOnly("W91242-27-Q-0029", "Retention Event Video Production — NC Army National Guard", "Video at NC Guard retention events", "Department of the Army", "USPFO for North Carolina (NC Army National Guard), Raleigh", "fed", "Request for Quote", "SBA", "512110", 25_000, 40_000, "statewideNc", 4, 15, "strong", 75, { verdict: "bid", prime: "go", sub: null, oneLine: "Bid it. Small video work for a buyer who knows you." }),
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
    summary: `${plainTitle}. ${noticeType === "Request for Quote" ? "Quotes" : "Proposals"} are due in ${closesInDays} days.`,
    hunter: { tier, score },
    grant,
    ...extra,
  };
}
