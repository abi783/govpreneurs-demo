// THE CONSULTANT's opportunities: Coppervale Advisory Group's whole feed.
// Read through src/demo/story/opportunities.ts, which holds the rules and types
// and picks the active member.
//
// Source: demo-storyboard/consulting-pack.md (19 Oct 2026), section 10.
// The hero is modeled on the Fayetteville VA's leadership training buys
// (36C24621P0974, 36C24622P1063); the twin on a GSA schedule order for manpower
// support at Fort Bragg (W9124723F0139); the team-up on the Army's family
// readiness staff training (W15QKN21F0263). Buyers are real; notice ids are
// invented in the buyers' formats; companies are fictional. Four of the pack's
// ids clashed with other members and were changed: the twin (now
// W91247-27-Q-0171), the Army Reserve analysts (W91247-27-R-0034), the brigade
// 360s (W91247-27-Q-0158) and the Durham Green Belt classes (36C24627Q0106).

import type {
  GrantCall,
  HunterTier,
  NoticeType,
  SetAside,
  StoryOpportunity,
} from "../../story/opportunities";
import type { PlaceKey } from "../../story/places";

export const HERO_IDS = {
  /** Hunter → Grant "Bid" → Sarah → Ava builds it. Supervisor leadership program at the Fayetteville VA. */
  hero: "36C24627Q0094",
  /** Grant: Don't bid. Same set-aside, her code and her Army office, but only GSA schedule holders can quote. */
  twin: "W91247-27-Q-0171",
  /** Grant: bid as a subcontractor; Partners shows the veteran-owned prime. Army family readiness staff training. */
  teamUp: "W15QKN-27-R-0014",
} as const;

const VA_NCO6 = "Network Contracting Office 6 (NCO 6)";
const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const ACC_RI = "Army Contracting Command — Rock Island (Picatinny)";
const USPFO_NC = "USPFO for North Carolina (NC National Guard)";

export const OPPORTUNITIES: StoryOpportunity[] = [
  // ── HERO ──────────────────────────────────────────────────────────────
  {
    id: "36C24627Q0094",
    title: "Supervisory Leadership Development Program, Fayetteville VA Coastal Health Care System",
    plainTitle: "Leadership program for new supervisors at the Fayetteville VA",
    agency: "Department of Veterans Affairs",
    office: VA_NCO6,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SDVOSBC",
    naics: "611430",
    valueLow: 170_000,
    valueHigh: 230_000,
    valueBasis: "per_year",
    place: "fayetteville",
    postedDaysAgo: 5,
    closesInDays: 23,
    dueTime: "2:00 PM Eastern",
    targetAgency: true,
    summary:
      "Four cohorts a year of up to 30 new supervisors: six classroom days per cohort at the Fayetteville VA Medical Center and the Wilmington Health Care Center, a 360 and three coaching sessions each, and a quarterly report tied to the All Employee Survey. A base year and two options, set aside for service-disabled veteran-owned firms under Veterans First; coaches need an ICF PCC \"or equal\".",
    hunter: {
      tier: "priority",
      score: 95,
      forYouRank: 1,
      line:
        "Leadership program for new supervisors at the Fayetteville VA: your training code, a veteran-owned set-aside, about $200K a year, and 3 miles from your office.",
      fit: [
        { kind: "naics", code: "611430", says: "your training code" },
        { kind: "setAside", code: "SDVOSBC", says: "a veteran-owned set-aside" },
        { kind: "valueInRange", says: "about $200K a year" },
        { kind: "distance", says: "3 miles from your office" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine:
        "Bid it as prime. It's your work, your set-aside and your town. Fix two things first: the 50% rule and the coach line.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "drafting",
      note: "Grant says bid. Ava has read the quote papers and has 3 questions for you. No mentor has seen it yet.",
      next: { label: "Send to a mentor", to: "/opportunities/36C24627Q0094" },
      lastActivityDaysAgo: 0,
    },
    ava: {
      kind: "written-proposal",
      stage: "answer my questions",
      needsYou: true,
      paused: false,
      statusLine: "Ava has 3 questions for you about your program leads, who teaches the cohorts and the coach credential.",
    },
  },

  // ── THE TWIN ──────────────────────────────────────────────────────────
  {
    id: "W91247-27-Q-0171",
    title: "Manpower Support Services, Army Units at Fort Bragg — GSA MAS SIN 541611 Holders Only",
    plainTitle: "Manpower analysts for Army units at Fort Bragg",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SDVOSBC",
    naics: "541611",
    valueLow: 480_000,
    valueHigh: 580_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 4,
    closesInDays: 16,
    targetAgency: true,
    lockedTo: "GSA schedule holders",
    summary:
      "Manpower analysts to study staffing and write requirements for Army units at Fort Bragg, a base year and four options. Issued through GSA eBuy to holders of a GSA Multiple Award Schedule contract under SIN 541611, set aside for service-disabled veteran-owned firms under FAR 8.405-5.",
    hunter: {
      tier: "stretch",
      score: 68,
      forYouRank: 2,
      line:
        "Manpower analysts for Army units at Fort Bragg: your consulting code, a veteran-owned set-aside, about $530K a year, and the Army office you just delivered for, but only GSA schedule holders can quote.",
      fit: [
        { kind: "naics", code: "541611", says: "your consulting code" },
        { kind: "setAside", code: "SDVOSBC", says: "a veteran-owned set-aside" },
        { kind: "valueInRange", says: "about $530K a year" },
        { kind: "pastPerformance", id: "pp-acs-lean-review", says: "the Army office you just delivered for" },
        { kind: "lockedOut", says: "only GSA schedule holders can quote" },
      ],
    },
    grant: {
      verdict: "no_bid",
      prime: "no_go",
      sub: null,
      oneLine:
        "Don't bid. It's a GSA schedule order: only schedule holders can quote, and you aren't one. Spend the hours on the VA program.",
      authored: true,
    },
  },

  // ── THE TEAM-UP ───────────────────────────────────────────────────────
  {
    id: "W15QKN-27-R-0014",
    title: "Sources Sought — Soldier and Family Readiness Staff Training Support (Recompete), HR Solutions PLS",
    plainTitle: "Army training for family readiness staff (sources sought)",
    agency: "Department of the Army",
    office: ACC_RI,
    scope: "fed",
    noticeType: "Sources Sought",
    setAside: null,
    naics: "541612",
    valueLow: 1_000_000,
    valueHigh: 1_400_000,
    valueBasis: "per_year",
    place: "multiStateSe",
    postedDaysAgo: 6,
    closesInDays: 21,
    targetAgency: true,
    lockedTo: "holders of the Army's HR Solutions contract",
    summary:
      "The Army asks who could train its soldier and family readiness staff for five more years, in person and online. The order goes on the Army's HR Solutions Personnel Lifecycle Support (PLS) contract in about 150 days, so only its holders can bid.",
    hunter: {
      tier: "priority",
      score: 82,
      forYouRank: 3,
      line:
        "Army training for family readiness staff returns in 2027: your HR-consulting code and your Halyard Point classes fit, but only holders of the Army's HR Solutions contract can bid, and it's about $1.2M a year.",
      fit: [
        { kind: "naics", code: "541612", says: "your HR-consulting code" },
        { kind: "pastPerformance", id: "pp-halyard-family-readiness", says: "your Halyard Point classes" },
        { kind: "lockedOut", says: "only holders of the Army's HR Solutions contract can bid" },
        { kind: "valueAboveRange", says: "about $1.2M a year" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "no_go",
      sub: "go",
      oneLine:
        "Team up. Only holders of the Army's HR Solutions contract can bid, and you aren't one. As Halyard Point's sub you'd teach the Southeast classes again.",
      authored: true,
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Grant says team up. Halyard Point Human Capital wants a veteran-owned trainer near Fort Bragg.",
      next: { label: "See partners", to: "/partners" },
      lastActivityDaysAgo: 1,
    },
  },

  // ── The rest of "Opportunities for you" ──────────────────────────────
  {
    id: "W91247-27-Q-0146",
    title: "Process Review of In- and Out-Processing, Directorate of Human Resources, Fort Bragg",
    plainTitle: "Process review of in- and out-processing at Fort Bragg",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "541611",
    valueLow: 85_000,
    valueHigh: 120_000,
    place: "fortBragg",
    postedDaysAgo: 3,
    closesInDays: 17,
    targetAgency: true,
    summary:
      "A Lean review of how soldiers and families in- and out-process at the Directorate of Human Resources, with a written plan to cut steps and wait times. Six months.",
    hunter: {
      tier: "priority",
      score: 90,
      forYouRank: 4,
      line:
        "Process review of in- and out-processing at Fort Bragg: your consulting code, a small-business set-aside, your Fort Bragg ACS Lean job, and about $100K.",
      fit: [
        { kind: "naics", code: "541611", says: "your consulting code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "pastPerformance", id: "pp-acs-lean-review", says: "your Fort Bragg ACS Lean job" },
        { kind: "valueInRange", says: "about $100K" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Your G-1 years and your ACS Lean job are exactly this work.",
    },
    saved: true,
    pursuit: {
      stage: "saved",
      note: "Saved 2 days ago. Grant has a take ready.",
      next: { label: "Review with Grant", to: "/opportunities/W91247-27-Q-0146" },
      lastActivityDaysAgo: 2,
    },
  },
  {
    id: "W91247-27-Q-0139",
    title: "Exceptional Family Member Program Enrollment Process Review, Army Community Service, Fort Bragg",
    plainTitle: "Exceptional Family Member enrollment review at Fort Bragg ACS",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SDVOSBC",
    naics: "541611",
    valueLow: 55_000,
    valueHigh: 80_000,
    place: "fortBragg",
    postedDaysAgo: 2,
    closesInDays: 15,
    targetAgency: true,
    summary:
      "Review how families enroll in the Exceptional Family Member Program at Army Community Service, and train the staff on the new steps. Four months.",
    hunter: {
      tier: "priority",
      score: 88,
      forYouRank: 5,
      line:
        "Exceptional Family Member enrollment review at Fort Bragg ACS: a service-disabled veteran-owned set-aside, the ACS office you delivered for, and about $68K.",
      fit: [
        { kind: "setAside", code: "SDVOSBC", says: "a service-disabled veteran-owned set-aside" },
        { kind: "pastPerformance", id: "pp-acs-lean-review", says: "the ACS office you delivered for" },
        { kind: "valueInRange", says: "about $68K" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Same office as your ACS job. Ask for your interim rating first, so you can attach it.",
    },
  },
  {
    id: "W91242-27-Q-0037",
    title: "Strategic Plan Development, Family Programs Office, North Carolina National Guard",
    plainTitle: "Strategic plan for the NC Guard's family support office",
    agency: "Department of the Army",
    office: USPFO_NC,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SBA",
    naics: "541611",
    valueLow: 45_000,
    valueHigh: 70_000,
    place: "raleigh",
    postedDaysAgo: 6,
    closesInDays: 19,
    targetAgency: true,
    summary:
      "Facilitate planning sessions with the Guard's family programs staff and write a three-year strategic plan with measures.",
    hunter: {
      tier: "strong",
      score: 82,
      forYouRank: 6,
      line:
        "Strategic plan for the NC Guard's family support office: your consulting code, a small-business set-aside, about $58K, and 65 miles away in Raleigh.",
      fit: [
        { kind: "naics", code: "541611", says: "your consulting code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueInRange", says: "about $58K" },
        { kind: "distance", says: "65 miles away" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Your size and your kind of plan; Raleigh is 65 miles.",
    },
  },
  {
    id: "36C24627Q0106",
    title: "Lean Six Sigma Green Belt Training, Durham VA Health Care System",
    plainTitle: "Lean Six Sigma Green Belt classes at the Durham VA",
    agency: "Department of Veterans Affairs",
    office: VA_NCO6,
    scope: "fed",
    noticeType: "Request for Quote",
    setAside: "SDVOSBC",
    naics: "611430",
    valueLow: 40_000,
    valueHigh: 60_000,
    place: "durham",
    postedDaysAgo: 4,
    closesInDays: 12,
    targetAgency: true,
    summary: "Two Green Belt classes for 20 staff each, with coaching on one improvement project per student.",
    hunter: {
      tier: "strong",
      score: 81,
      forYouRank: 7,
      line:
        "Lean Six Sigma Green Belt classes at the Durham VA: your training code, a service-disabled veteran-owned set-aside, and about $50K.",
      fit: [
        { kind: "naics", code: "611430", says: "your training code" },
        { kind: "setAside", code: "SDVOSBC", says: "a service-disabled veteran-owned set-aside" },
        { kind: "valueInRange", says: "about $50K" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Small and quick, and you're a Black Belt.",
    },
  },
  {
    id: "W91247-27-R-0034",
    title: "Analyst Support Services, U.S. Army Reserve Command Headquarters, Fort Bragg",
    plainTitle: "Analysts for the Army Reserve's headquarters at Fort Bragg",
    agency: "Department of the Army",
    office: MICC,
    scope: "fed",
    noticeType: "Request for Proposal",
    setAside: "SBA",
    naics: "541611",
    valueLow: 850_000,
    valueHigh: 1_000_000,
    valueBasis: "per_year",
    place: "fortBragg",
    postedDaysAgo: 8,
    closesInDays: 34,
    targetAgency: true,
    summary:
      "Full-time analysts at the Army Reserve Command headquarters for five years: staffing studies, briefings and program reviews. The last contract ended in September.",
    hunter: {
      tier: "stretch",
      score: 70,
      forYouRank: 8,
      line:
        "Analysts for the Army Reserve's headquarters at Fort Bragg: your consulting code, a small-business set-aside, and about $925K a year.",
      fit: [
        { kind: "naics", code: "541611", says: "your consulting code" },
        { kind: "setAside", code: "SBA", says: "a small-business set-aside" },
        { kind: "valueAboveRange", says: "about $925K a year" },
      ],
    },
    grant: {
      verdict: "review",
      prime: "go",
      sub: null,
      oneLine: "Look closer. It's full-time staffing at about 60% of your revenue. Plan the hiring before you price it.",
    },
    saved: true,
    pursuit: {
      stage: "with_mentor",
      note: "Sarah read your question and wants to talk first.",
      next: { label: "Read Sarah's reply", to: "/mentors/rev-usar-prime" },
      lastActivityDaysAgo: 0,
    },
    mentorReviewId: "rev-usar-prime",
  },
  {
    id: "CUMCO-DSS-2027-02",
    title: "Lean Process Review of Intake, Department of Social Services — Cumberland County",
    plainTitle: "Lean review of social-services intake for Cumberland County",
    agency: "Cumberland County, NC",
    office: "Department of Social Services",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541611",
    valueLow: 70_000,
    valueHigh: 95_000,
    place: "fayetteville",
    postedDaysAgo: 7,
    closesInDays: 26,
    targetAgency: true,
    summary: "Map how residents apply for benefits at the county's intake desks, then cut the steps and train the staff.",
    hunter: {
      tier: "strong",
      score: 79,
      forYouRank: 9,
      line:
        "Lean review of social-services intake for Cumberland County: your consulting code, about $83K, and across town.",
      fit: [
        { kind: "naics", code: "541611", says: "your consulting code" },
        { kind: "valueInRange", says: "about $83K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Close, your size, and the same Lean work as your ACS job.",
    },
  },
  {
    id: "FAY-HR-2027-03",
    title: "Supervisory Academy for City Staff — City of Fayetteville",
    plainTitle: "Supervisor academy for City of Fayetteville staff",
    agency: "City of Fayetteville, NC",
    office: "Human Resource Development",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "611430",
    valueLow: 60_000,
    valueHigh: 90_000,
    place: "fayetteville",
    postedDaysAgo: 5,
    closesInDays: 22,
    targetAgency: true,
    summary: "A year-long academy for new city supervisors: monthly classes, a 360 for each and a capstone project.",
    hunter: {
      tier: "strong",
      score: 78,
      forYouRank: 10,
      line:
        "Supervisor academy for City of Fayetteville staff: your training code, your nurse-manager academy, about $75K, and across town.",
      fit: [
        { kind: "naics", code: "611430", says: "your training code" },
        { kind: "pastPerformance", id: "pp-tidewell-academy", says: "your nurse-manager academy" },
        { kind: "valueInRange", says: "about $75K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Your hospital academy is the reference they'll want.",
    },
  },
  {
    id: "PWC2627018",
    title: "Manager Training for the New Pay Plan — Fayetteville Public Works Commission",
    plainTitle: "Manager training for PWC's new pay plan",
    agency: "Fayetteville Public Works Commission, NC",
    office: "Human Resources",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541612",
    valueLow: 55_000,
    valueHigh: 80_000,
    place: "fayetteville",
    postedDaysAgo: 4,
    closesInDays: 18,
    summary: "Teach PWC's managers how the new pay and classification plan works and how to explain it to their staff.",
    hunter: {
      tier: "strong",
      score: 75,
      forYouRank: 11,
      line: "Manager training for PWC's new pay plan: your HR-consulting code, about $68K, and across town.",
      fit: [
        { kind: "naics", code: "541612", says: "your HR-consulting code" },
        { kind: "valueInRange", says: "about $68K" },
        { kind: "distance", says: "across town" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. A small HR job close to home.",
    },
  },
  {
    id: "DMVA-SP-2027-01",
    title: "Strategic Plan Facilitation — North Carolina Department of Military and Veterans Affairs",
    plainTitle: "Strategic plan for NC Military and Veterans Affairs",
    agency: "North Carolina Department of Military and Veterans Affairs",
    office: "Office of the Secretary",
    scope: "sled",
    noticeType: "Request for Proposal",
    setAside: null,
    naics: "541611",
    valueLow: 50_000,
    valueHigh: 80_000,
    place: "raleigh",
    postedDaysAgo: 9,
    closesInDays: 24,
    targetAgency: true,
    summary: "Run listening sessions with veterans' groups and staff, then write the department's next four-year strategic plan.",
    hunter: {
      tier: "strong",
      score: 74,
      forYouRank: 12,
      line:
        "Strategic plan for NC Military and Veterans Affairs: your consulting code, your Hope Mills strategic plan, and about $65K.",
      fit: [
        { kind: "naics", code: "541611", says: "your consulting code" },
        { kind: "pastPerformance", id: "pp-hope-mills-plan", says: "your Hope Mills strategic plan" },
        { kind: "valueInRange", says: "about $65K" },
      ],
    },
    grant: {
      verdict: "bid",
      prime: "go",
      sub: null,
      oneLine: "Bid it. Your Hope Mills plan and your veteran network are the case.",
    },
  },

  // ── All tab only ──────────────────────────────────────────────────────
  allOnly("W91247-27-Q-0158", "Leader 360 Assessments, Brigade Combat Team, 82nd Airborne Division", "Leader 360 assessments for an 82nd Airborne brigade", "Department of the Army", MICC, "fed", "Request for Quote", "SBA", "621330", 140_000, 180_000, "fortBragg", 5, 19, "stretch", 45, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. Every assessor must be a licensed psychologist." }),
  allOnly("36C24627Q0118", "Brand Name Licensed Communication Course, W.G. (Bill) Hefner VA Medical Center, Salisbury", "Licensed communication course at the Salisbury VA", "Department of Veterans Affairs", VA_NCO6, "fed", "Request for Quote", null, "611430", 30_000, 45_000, "salisbury", 3, 11, "low", 30, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. Only the publisher's licensed partners may teach it." }, { exclusiveProvider: "the course publisher's licensed partners" }),
  allOnly("36C24627Q0127", "Leader Coaching Services, Hampton VA Medical Center", "Leader coaching at the Hampton VA", "Department of Veterans Affairs", VA_NCO6, "fed", "Request for Quote", "SDVOSBC", "541611", 250_000, 330_000, "hampton", 6, 26, "stretch", 50, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's 210 miles away, outside your area." }),
  allOnly("36C24627Q0133", "HR Staffing Support Services, VISN 6 — GSA MAS Holders Only", "HR staffing support across VISN 6 (GSA order)", "Department of Veterans Affairs", VA_NCO6, "fed", "Request for Quote", "SDVOSBC", "541612", 2_400_000, 3_000_000, "durham", 7, 15, "low", 28, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's for schedule holders only, and twice your revenue a year." }, { valueBasis: "per_year", lockedTo: "GSA schedule holders" }),
  allOnly("36C24627Q0141", "Contract Specialist Support Services, VISN 6", "Contract-specialist support for VISN 6", "Department of Veterans Affairs", VA_NCO6, "fed", "Request for Quote", "SDVOSBC", "541611", 1_800_000, 2_200_000, "durham", 9, 20, "low", 25, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. It's contracting staff, not your work." }, { valueBasis: "per_year" }),
  allOnly("M67001-27-Q-0047", "Customer Service and Lean Training, Marine Corps Base Camp Lejeune", "Customer-service and Lean classes for Camp Lejeune staff", "Department of the Navy", "Marine Corps Installations East — MCB Camp Lejeune", "fed", "Request for Quote", "SBA", "611430", 60_000, 90_000, "jacksonville", 8, 21, "stretch", 58, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's your work, but 100 miles away." }),
  allOnly("FA4809-27-Q-0023", "Strategic Planning Offsite Facilitation, 4th Fighter Wing, Seymour Johnson AFB", "Strategic planning offsite for the 4th Fighter Wing", "Department of the Air Force", "4th Contracting Squadron, Seymour Johnson AFB", "fed", "Request for Quote", "SBA", "541611", 30_000, 45_000, "goldsboro", 4, 13, "stretch", 57, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. Small and 75 miles away, but a first Air Force job." }),
  allOnly("FSU-OD-2027-04", "Organizational Review of Student Services Offices — Fayetteville State University", "Review of student-services offices at Fayetteville State", "Fayetteville State University, NC", "Office of the Provost", "sled", "Request for Proposal", null, "541611", 70_000, 95_000, "fayetteville", 6, 20, "strong", 64, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. They want three campus projects, and you have none yet." }),
  allOnly("OSHR-TD-2027-02", "Statewide Supervisory Curriculum Redesign — NC Office of State Human Resources", "Statewide supervisor curriculum redesign", "North Carolina Office of State Human Resources", "Talent Development", "sled", "Request for Proposal", null, "611430", 250_000, 350_000, "raleigh", 10, 35, "stretch", 55, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's your work at twice your usual size." }),
  allOnly("NCDHHS-OD-2027-06", "Operational Review of a Statewide Call Center — NC Department of Health and Human Services", "Review of a statewide call center for NC DHHS", "North Carolina Department of Health and Human Services", "Office of Procurement, Contracts and Grants", "sled", "Request for Proposal", null, "541611", 180_000, 240_000, "raleigh", 8, 28, "stretch", 52, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It needs call-center data skills you'd have to hire." }),
  allOnly("DURPS-SP-2027-03", "Strategic Plan Facilitation — Durham Public Schools", "Strategic plan facilitation for Durham Public Schools", "Durham Public Schools, NC", "Purchasing Services", "sled", "Request for Proposal", null, "541611", 120_000, 160_000, "durham", 7, 27, "stretch", 50, { verdict: "review", prime: "go", sub: null, oneLine: "Look closer. It's 85 miles away, and you have no school reference." }),
  allOnly("SPRL-HR-2027-01", "Town Manager Recruitment Services — Town of Spring Lake", "Town manager search for Spring Lake", "Town of Spring Lake, NC", "Board of Aldermen", "sled", "Request for Proposal", null, "541612", 25_000, 40_000, "springLake", 3, 14, "low", 30, { verdict: "no_bid", prime: "no_go", sub: null, oneLine: "Don't bid. Executive search isn't your service." }),
  allOnly("LUMB-TR-2027-01", "Customer Service Training for City Staff — City of Lumberton", "Customer-service classes for City of Lumberton staff", "City of Lumberton, NC", "Human Resources", "sled", "Request for Quote", null, "611430", 20_000, 30_000, "lumberton", 4, 12, "strong", 66, { verdict: "bid", prime: "go", sub: null, oneLine: "Bid it. Small, 35 miles away and an easy reference." }),
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
  const due = noticeType === "Request for Quote" ? "Quotes" : "Proposals";
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
