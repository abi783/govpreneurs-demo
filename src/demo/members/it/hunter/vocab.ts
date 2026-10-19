// THE IT SERVICES FIRM's words on Hunter's surfaces (feed lines, chat, search,
// examples). Read through src/demo/hunter/vocab.ts, which picks the active member.
// Every claim here is true of persona.ts and opportunities.ts in this folder's
// parent: Hunter explains fit; Grant makes the call.

import type { HunterVocab, WorkType } from "../../../hunter/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";
import { KEY_PARTNER, PERSONA } from "../persona";

/** A past job that matches the notice, by what the notice is about. None when nothing fits. */
function pastJobId(row: Parameters<HunterVocab["pastJobId"]>[0]) {
  const text = `${row.o.plainTitle} ${row.o.agency} ${row.o.office}`.toLowerCase();
  if (/seymour johnson|air force|pope|desktop|hospital|medical center/.test(text)) return "pp-sjafb-desktop-support";
  if (/chromebook|re-?imag|school/.test(text)) return "pp-ccs-chromebook-reimage";
  if (/help desk|army|fort bragg/.test(text)) return "pp-bragg-helpdesk-seats";
  if (/town|city|county|managed|microsoft 365|sharepoint|college/.test(text)) return "pp-sandhills-managed-it";
  return undefined;
}

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** The member's own codes, by the name the taxonomy gives them: "other computer related services work". */
const CODE_NAMES: WorkType[] = [
  { code: PERSONA.primaryNaics, label: PERSONA.primaryNaicsLabel },
  ...PERSONA.secondaryNaics,
].map((n) => ({
  rx: new RegExp(String.raw`\b${n.label.toLowerCase()}\b`),
  naics: [n.code],
  noun: `${n.label} work (NAICS ${n.code})`,
}));

const HOSPITAL_NOTICE = "the Fort Bragg hospital IT notice";

export const VOCAB: HunterVocab = {
  base: "office",
  hometown: "across town",
  place: "The site",
  longWay: "a long daily drive for your techs",
  codePhrases: {
    "541519": "your computer-services code",
    "541512": "your computer-systems code",
    "541513": "your facilities-management code",
    "518210": "your hosting code",
  },
  // DE01 end-user help desk, DG01 network support, DA01 application support.
  pscFor: (naics) => (naics === "541512" ? "DG01" : naics === "541511" ? "DA01" : "DE01"),
  mainPsc: "DE01",
  pastJobId,
  aboveRangeTeam: ` ${KEY_PARTNER.name} looks for a local firm for desk-side techs at Fort Bragg.`,
  profile: {
    teamLabel: "Techs and office",
    intro: `${PERSONA.employeesW2} employees, an office and repair bench on Raeford Road, and 11 techs, 9 of them with Security+`,
    chip: "We also run Intune and SharePoint",
  },
  avaLine: `Ava is already working on the ${hero.plainTitle} quote. ${hero.ava!.statusLine} Open Ava under Your Workspace, on the left.`,
  certLine: "You already hold Small Business, 8(a) and Small Disadvantaged Business status.",
  competitionExample: "",
  searchHint: "a kind of IT work",
  canon: [
    "What's out there for me right now?",
    "What's new this week?",
    "Which of these am I actually ready for?",
    "Compare my top 3 — which should I chase?",
    "How do you pick my matches?",
    "What do you know about my business?",
    "Show only 8(a) set-asides",
    "Show only federal",
    "Show only state and local",
    "Show jobs under $100K",
    "Show work near Fayetteville",
    "What closes first?",
    "Show my saved ones",
    "What is a Sources Sought notice?",
    "What is an 8(a) set-aside?",
    "What is a NAICS code?",
    "Do I qualify for these set-asides?",
    "Show me Fort Bragg IT jobs",
    "Show help desk jobs",
    "Show network jobs",
    "Start over",
  ],
  workTypes: [
    ...CODE_NAMES,
    { rx: /\bhelp ?desk\b|\bservice desk\b|\bdesk-?side\b|\bend[- ]user\b|\btier [12]\b/, search: "help desk", noun: "help desk and end-user support" },
    { rx: /\bnetworks?\b|\bswitch(es)?\b|\bwi-?fi\b|\bwireless\b|\bcabling\b/, naics: ["541512"], noun: "network work (NAICS 541512)" },
    { rx: /\bsharepoint\b|\bknowledge management\b|\bmicrosoft 365\b|\bm365\b/, search: "SharePoint", noun: "SharePoint and Microsoft 365 work" },
    { rx: /\bmanaged it\b|\bmanaged services?\b/, search: "managed IT", noun: "managed IT services" },
    { rx: /\bcyber\w*\b|\bpenetration\b/, search: "cyber", noun: "cybersecurity work" },
    { rx: /\bvideo conferenc\w*\b|\bvtc\b|\bconference rooms?\b/, search: "video", noun: "video-conference room work" },
    { rx: /\bdata cent(er|re)s?\b|\bhosting\b/, naics: ["518210"], noun: "data center and hosting work (NAICS 518210)" },
    { rx: /\bschools?\b|\bcollege\b|\buniversity\b/, search: "school", noun: "school and campus IT jobs" },
    { rx: /\bcomputers?\b|\btech support\b|\bit support\b/, naics: ["541519"], noun: "IT services work (NAICS 541519)" },
  ],
  forecastCodes: `IT services work (NAICS ${PERSONA.primaryNaics}, ${PERSONA.secondaryNaics.map((n) => n.code).join(", ")})`,
  glossary: {
    sourcesSought: "the Air Force asks who could run Pope's 43 CS IT support, and the Defense Health Agency asks who could provide IT services for Fort Bragg's Army medical center.",
    psc: "Help desk work often uses DE01, IT and Telecom: End User Help Desk and Workspace Support.",
    rfqExample: ` The ${hero.plainTitle} is one.`,
    incumbent: {
      line: "On your list, the Seymour Johnson desktop support follow-on is one: you are the incumbent. Fort Bragg's Army medical center IT is another; its current order ends in February 2027.",
      chips: [`Why does ${HOSPITAL_NOTICE} match me?`, "What is a prime and a sub?"],
    },
    primeSub: {
      line: `On a job that is too big to hold alone, or ordered through a contract you are not on, a small firm can team up as a sub. ${KEY_PARTNER.name}, a STARS III holder, wants ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}.`,
      chips: [`Why does ${HOSPITAL_NOTICE} match me?`, "What is a recompete?"],
    },
    bond: {
      line: "You have never needed one. IT support work rarely asks for a bond, and none of the work on your list does.",
      chips: ["What is a prime and a sub?", "What's out there for me right now?"],
    },
    clearance: {
      line: "Your firm holds no facility clearance. Your techs work with base access and Common Access Cards, and none of the work on your list needs a clearance. I would mark any that did.",
      chips: ["Which of these am I actually ready for?", "What's out there for me right now?"],
    },
  },
  api: {
    trade: "computer_systems_design_and_related_services",
    alliedNaics: ["541511", "541990", "517810", "811210"],
  },
  ui: {
    quickPicks: [
      "Help desk and IT support in NC $50K–$1.2M",
      "8(a) set-asides closing in 30 days",
      "Fort Bragg IT support",
      "Small IT jobs under $100K",
      "Partner opportunities — STARS III primes",
    ],
    workTypes: [
      "Help desk and end-user support",
      "Network support",
      "Microsoft 365 and SharePoint",
      "Managed IT",
      "Video conferencing",
      "Other",
    ],
    searchPlaceholders: [
      "Help desk jobs under $1.2M near Fayetteville…",
      "Fort Bragg IT support…",
      "8(a) set-asides closing this month…",
      "Town and college IT support in NC…",
    ],
    saveSearchPlaceholder: "Name it — e.g. Fort Bragg help desk jobs",
    naicsGloss: `The government's industry codes — we've prefilled yours (${PERSONA.primaryNaics} ${PERSONA.primaryNaicsLabel}).`,
    smartList: {
      workTypes: [
        "Help desk and end-user support",
        "Imaging and device setup",
        "Network support",
        "Microsoft 365 and SharePoint",
        "Managed IT",
        "Video conferencing",
        "IT asset tracking",
        "Cyber support",
      ],
      seedName: "8(a) IT support $50K–$1.2M, NC",
      seedSetAsides: ["8(a)", "Total Small Business"],
      seedValue: [50_000, 1_200_000],
    },
  },
};
