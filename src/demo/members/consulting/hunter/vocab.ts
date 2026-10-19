// THE CONSULTANT's words on Hunter's surfaces (feed lines, chat, search, examples).
// Read through src/demo/hunter/vocab.ts, which picks the active member. Every
// claim here is true of persona.ts and opportunities.ts in this folder's parent:
// Hunter explains fit; Grant makes the call.

import type { HunterVocab, WorkType } from "../../../hunter/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";
import { KEY_PARTNER, PERSONA } from "../persona";

/** A past job that matches the notice, by what the notice is about. None when nothing fits. */
function pastJobId(row: Parameters<HunterVocab["pastJobId"]>[0]) {
  const text = `${row.o.plainTitle} ${row.o.agency} ${row.o.office}`.toLowerCase();
  if (/family readiness|family member|family support/.test(text)) return "pp-halyard-family-readiness";
  if (/lean|process|intake|review/.test(text)) return "pp-acs-lean-review";
  if (/strategic plan|planning/.test(text)) return "pp-hope-mills-plan";
  if (/supervisor|leader|academy|coaching/.test(text)) return "pp-tidewell-academy";
  if (/army|fort bragg/.test(text)) return "pp-acs-lean-review";
  return undefined;
}

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** The member's own codes, by the name the taxonomy gives them. */
const CODE_NAMES: WorkType[] = [
  { code: PERSONA.primaryNaics, label: PERSONA.primaryNaicsLabel },
  ...PERSONA.secondaryNaics,
].map((n) => ({
  rx: new RegExp(String.raw`\b${n.label.toLowerCase()}\b`),
  naics: [n.code],
  noun: `${n.label} work (NAICS ${n.code})`,
}));

const TEAM_UP = "the Army family readiness training notice";

export const VOCAB: HunterVocab = {
  base: "office",
  hometown: "across town",
  place: "The work",
  longWay: "a long drive for each class or session day",
  codePhrases: {
    "541611": "your consulting code",
    "541612": "your HR-consulting code",
    "611430": "your training code",
    "541618": "your other consulting code",
  },
  // U008 Training/Curriculum Development; R408 Program Management/Support.
  pscFor: (naics) => (naics === "611430" ? "U008" : "R408"),
  mainPsc: "R408",
  pastJobId,
  aboveRangeTeam: ` ${KEY_PARTNER.name} looks for a veteran-owned trainer near Fort Bragg.`,
  profile: {
    teamLabel: "Team and training room",
    intro: `${PERSONA.employeesW2} employees, 7 contract facilitators and a 30-seat training room on Green St`,
    chip: "We also run 360 assessments and coaching",
  },
  avaLine: `Ava is already working on the ${hero.plainTitle} quote. ${hero.ava!.statusLine} Open Ava under Your Workspace, on the left.`,
  certLine: "You already hold Small Business and Service-Disabled Veteran-Owned (SDVOSB) status.",
  competitionExample: "",
  searchHint: "a kind of consulting or training",
  canon: [
    "What's out there for me right now?",
    "What's new this week?",
    "Which of these am I actually ready for?",
    "Compare my top 3 — which should I chase?",
    "How do you pick my matches?",
    "What do you know about my business?",
    "Show only veteran-owned set-asides",
    "Show only federal",
    "Show only state and local",
    "Show jobs under $100K",
    "Show work near Fayetteville",
    "What closes first?",
    "Show my saved ones",
    "What is a Sources Sought notice?",
    "What is an SDVOSB set-aside?",
    "What is a NAICS code?",
    "Do I qualify for these set-asides?",
    "What is a GSA schedule?",
    "Show me VA jobs",
    "Show leadership training",
    "Show Lean and process reviews",
    "Start over",
  ],
  workTypes: [
    ...CODE_NAMES,
    { rx: /\bleadership\b|\bsupervisors?\b|\bcoach\w*\b|\b360s?\b/, search: "leader", noun: "leadership programs" },
    { rx: /\blean\b|\bsix sigma\b|\bprocess\b|\bwait times?\b/, search: "lean", noun: "Lean and process reviews" },
    { rx: /\bstrategic plan\w*\b|\bstrategy\b|\bplanning\b/, search: "strategic plan", noun: "strategic planning work" },
    { rx: /\btraining\b|\bclass\w*\b|\bcourses?\b/, naics: ["611430"], noun: "training work (NAICS 611430)" },
    { rx: /\bhr\b|\bhuman resources?\b|\bpay\b|\bclassification\b/, naics: ["541612"], noun: "HR consulting work (NAICS 541612)" },
    { rx: /\bconsult\w*\b|\banalysts?\b/, naics: ["541611"], noun: "management consulting work (NAICS 541611)" },
  ],
  forecastCodes: `consulting, HR and training work (NAICS ${PERSONA.primaryNaics}, ${PERSONA.secondaryNaics.map((n) => n.code).join(", ")})`,
  glossary: {
    sourcesSought: "the Army asks which firms could train its soldier and family readiness staff for the next five years.",
    psc: "Consulting work often uses R408, Program Management/Support, and training work U008, Training/Curriculum Development.",
    rfqExample: ` The ${hero.plainTitle} is one.`,
    incumbent: {
      line: "On your list, the Army's family readiness staff training is one. The last order ran from 2021 to 2026, and the Army is asking who could do the next five years.",
      chips: [`Why does ${TEAM_UP} match me?`, "What is a prime and a sub?"],
    },
    primeSub: {
      line: `On a job that is too big to hold alone, or open only to holders of a contract you don't hold, a small firm can team up as a sub. ${KEY_PARTNER.name}, a veteran-owned firm, wants ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
      chips: [`Why does ${TEAM_UP} match me?`, "What is a recompete?"],
    },
    bond: {
      line: "You have never needed one. None of the work on your list asks for a bond.",
      chips: ["What is a prime and a sub?", "What's out there for me right now?"],
    },
    clearance: {
      line: "Your firm holds no facility clearance. None of the work on your list needs one, and I would mark any that did.",
      chips: ["Which of these am I actually ready for?", "What's out there for me right now?"],
    },
  },
  api: {
    trade: "management_consulting_and_training",
    alliedNaics: ["541613", "541690", "611710"],
  },
  ui: {
    quickPicks: [
      "Leadership and Lean work in NC $25K–$650K",
      "Veteran-owned set-asides closing in 30 days",
      "VA and Fort Bragg training",
      "Strategic plans under $100K",
      "Partner opportunities — contract holders",
    ],
    workTypes: [
      "Leadership programs",
      "Staff training",
      "Lean and process reviews",
      "Strategic planning",
      "HR consulting",
      "Other",
    ],
    searchPlaceholders: [
      "Leadership programs under $650K near Fayetteville…",
      "VA supervisor training…",
      "Veteran-owned set-asides closing this month…",
      "Strategic plans for NC towns and counties…",
    ],
    saveSearchPlaceholder: "Name it — e.g. VA leadership training",
    naicsGloss: `The government's industry codes — we've prefilled yours (${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}).`,
    smartList: {
      workTypes: [
        "Leadership programs",
        "Coaching and 360s",
        "Staff training",
        "Lean and process reviews",
        "Strategic planning",
        "HR consulting",
        "Pay and classification",
        "Facilitation",
      ],
      seedName: "SDVOSB leadership and Lean work $25K–$650K, NC",
      seedSetAsides: ["SDVOSB", "Total Small Business"],
      seedValue: [25_000, 650_000],
    },
  },
};
