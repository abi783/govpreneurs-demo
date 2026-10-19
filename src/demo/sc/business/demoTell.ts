// DEMO: the stand-in for the model that reads "Tell Hunter everything".
//
// The real route sends her words to a language model and checks the reply with
// `readTellReply`. The demo has no model, so this file plays its part with plain
// rules: it reads each sentence, and writes a reply in the same JSON shape the model
// would. `readTellReply` then checks that reply exactly as it does in production
// (the quote must be her own words, the value must pass the record's own gate).
//
// A sentence that no rule claims comes back as "what I did not understand", which is
// also what production does with a sentence it cannot place.

import { extract, amountIn, daysIn, saidNumbers, sentences, type Extraction } from "@sc/lib/businessProfile/tellExtract";
import { readTellReply } from "@sc/lib/businessProfile/tellModel";
import { byMember, own } from "../../member";

const { TELL_SAMPLE: PACK_SAMPLE } = own(
  import.meta.glob<typeof import("../../members/agency/sc/business")>("/src/demo/members/*/sc/business.ts", { eager: true }),
);

/**
 * The sentence "Say it out loud" types into the box (D56: no microphone). Each
 * sentence lands on a different row, so the reply shows what it understood.
 */
export const TELL_SAMPLE = byMember({
  caterer:
    "We cook and deliver up to 1,100 meals a day from our kitchen in Fayetteville. We have two refrigerated vans for same-day delivery. We can wait 30 days to be paid. We want to win our first prime contract in the next 90 days.",
  pack: PACK_SAMPLE,
});

interface Fact {
  field: string;
  value: unknown;
  quote: string;
}

interface Upload {
  field: string;
  quote: string;
}

const STATES: [RegExp, string][] = [
  [/\bNorth Carolina\b|\bNC\b/, "NC"],
  [/\bSouth Carolina\b|\bSC\b/, "SC"],
  [/\bVirginia\b|\bVA\b/, "VA"],
  [/\bGeorgia\b|\bGA\b/, "GA"],
  [/\bFlorida\b|\bFL\b/, "FL"],
  [/\bTennessee\b|\bTN\b/, "TN"],
];

const LEAD_IN =
  /^(?:i have got|i have|i've got|i've|i own|i run|i use|we have|we own|we run|we use|there is|there are|most of my work is|most of my work|my work is|we mostly do|i mostly do|we specialise in|we specialize in|i specialise in|i specialize in|we do|i do)\s+/i;

function clause(sentence: string): string {
  const body = sentence.trim().replace(/[.!?]+$/, "").trim();
  const stripped = body.replace(LEAD_IN, "").trim();
  return stripped === "" ? body : stripped;
}

function phrases(sentence: string): string[] {
  return clause(sentence)
    .split(/\s*,\s*|\s+and\s+/i)
    .map((p) => p.trim())
    .filter((p) => p !== "");
}

type FactRule = { field: string; read: (s: string) => unknown | undefined };

/** Things one member names when she says how many jobs she can run at once. */
const JOB_WORDS = byMember({
  caterer: /\b(jobs|contracts|events|orders)\b/i,
  pack: /\b(jobs|contracts|campaigns|clients|shoots)\b/i,
});

/** The ad agency's services, as a buyer would search for them. */
const AGENCY_SERVICES =
  /\b(?:short |recruiting |captioned |explainer )?videos?\b|\bpaid (?:social|search)\b|\b(?:search|display|social|print|streaming) ads\b|\blanding pages?\b|\bprint buying\b|\blead forms?\b|\bpublic relations\b|\bgraphic design\b|\bgeofenced ads\b/gi;

/** "We make short videos and run paid social" → ["short videos", "paid social"]. */
function agencyServices(sentence: string): string[] | undefined {
  if (!/\b(we|i) (make|run|do|produce|create|design|buy|build|shoot)\b/i.test(sentence)) return undefined;
  const found = [...new Set([...sentence.matchAll(AGENCY_SERVICES)].map((m) => m[0].toLowerCase()))];
  return found.length > 0 ? found : undefined;
}

/** Rules every member's words go through, in this order. */
const SHARED_FIRST: FactRule[] = [
  {
    field: "payment_terms_tolerance",
    read: (s) => (/\b(paid|payment|invoice)/i.test(s) ? (daysIn(s) ?? undefined) : undefined),
  },
  {
    field: "working_capital",
    read: (s) =>
      /(working capital|savings|saved|put in|invest|own money|cash on hand)/i.test(s) ? (amountIn(s) ?? undefined) : undefined,
  },
  {
    field: "concurrent_contract_capacity",
    read: (s) => {
      if (!JOB_WORDS.test(s) || !/(at once|at the same time|at a time|concurrent)/i.test(s)) {
        return undefined;
      }
      return saidNumbers(s)[0];
    },
  },
  {
    field: "total_employees",
    read: (s) => (/\b(employees|staff|team members|workers)\b/i.test(s) ? saidNumbers(s)[0] : undefined),
  },
  {
    field: "website",
    read: (s) => {
      if (!/(website|web site|\bsite\b)/i.test(s)) return undefined;
      const match = /(https?:\/\/\S+|\b[a-z0-9][a-z0-9-]*\.(?:com|net|org|us|biz|co)\b(?:\/\S*)?)/i.exec(s);
      return match ? match[1]!.replace(/[.,;]+$/, "") : undefined;
    },
  },
  {
    field: "ninety_day_goal",
    read: (s) =>
      /\b(90|ninety)\s+days\b|\bthree months\b/i.test(s) && /(want|goal|plan|hope|win|land)/i.test(s)
        ? s.trim()
        : undefined,
  },
];

/** The caterer's own rules: vans and ovens, the kitchen, diets, "most of my work". */
const CATERER_RULES: FactRule[] = [
  {
    field: "equipment",
    read: (s) =>
      /\b(vans?|trucks?|trailers?|ovens?|freezers?|refrigerat\w+|warming|coolers?)\b/i.test(s) ? [clause(s)] : undefined,
  },
  {
    field: "facilities",
    read: (s) => (/\b(kitchen|commissary|warehouse)\b/i.test(s) ? [clause(s)] : undefined),
  },
  {
    field: "differentiators",
    read: (s) => (/\b(halal|allergen|therapeutic|same-day|gluten|diet(?:s|ary)?)\b/i.test(s) ? [clause(s)] : undefined),
  },
  {
    field: "search_keywords",
    read: (s) => {
      if (!/\b(most of my work|my work is|we mostly do|i mostly do|we specialize|we specialise|i specialize|i specialise)\b/i.test(s)) {
        return undefined;
      }
      const found = phrases(s);
      return found.length > 0 ? found : undefined;
    },
  },
];

/** The agency's own rules: the crew, the cameras, what it makes and runs, who it reaches. */
const AGENCY_RULES: FactRule[] = [
  {
    field: "key_personnel",
    read: (s) =>
      /\b(crew|project manager|account director|producer|editors?|designers?|copywriters?|media buyers?)\b/i.test(s)
        ? [clause(s)]
        : undefined,
  },
  {
    field: "equipment",
    read: (s) =>
      /\b(cameras?|drones?|lighting|lights|lenses|edit suite|microphones?|gimbals?|teleprompters?)\b/i.test(s) ? [clause(s)] : undefined,
  },
  { field: "search_keywords", read: agencyServices },
  {
    field: "differentiators",
    read: (s) =>
      /\b(military families|army spouse|bilingual|spanish|captioned|within (?:5|five) minutes)\b/i.test(s) ? [clause(s)] : undefined,
  },
];

const SHARED_LAST: FactRule[] = [
  {
    field: "geographic_coverage",
    read: (s) => {
      if (!/\b(serve|deliver|work in|travel|cover|service area)\b/i.test(s)) return undefined;
      const states = STATES.filter(([re]) => re.test(s)).map(([, code]) => code);
      return states.length > 0 ? { states } : undefined;
    },
  },
];

/** Rules that turn one sentence into one fact. The first rule that fits wins. */
const FACT_RULES: FactRule[] = [
  ...SHARED_FIRST,
  ...byMember({ caterer: CATERER_RULES, pack: AGENCY_RULES }),
  ...SHARED_LAST,
];

/** Rules that spot a row that only a document, or a pick from a list, can answer. */
const SHARED_UPLOADS: { field: string; test: RegExp }[] = [
  { field: "insurance_coverage", test: /\binsurance\b/i },
  { field: "doc_w9", test: /\bw-?9\b/i },
  { field: "doc_tax_returns", test: /\btax returns?\b/i },
  { field: "doc_capability_statement", test: /\bcapability statement\b/i },
  { field: "psc_codes", test: /\bPSC\b/ },
  { field: "commodity_codes", test: /\bNIGP\b/ },
];

const UPLOAD_RULES: { field: string; test: RegExp }[] = byMember({
  caterer: [
    SHARED_UPLOADS[0]!,
    { field: "health_permits", test: /\b(health (permit|department)|food (service )?permit)\b/i },
    { field: "food_handler_cards", test: /\b(food[- ]handler|servsafe)\b/i },
    SHARED_UPLOADS[1]!,
    SHARED_UPLOADS[2]!,
    { field: "doc_haccp_plan", test: /\bhaccp\b/i },
    ...SHARED_UPLOADS.slice(3),
    { field: "max_daily_output", test: /\d[\d,]*\s*(meals|plates|trays|lunches|breakfasts)\b.*\b(a day|per day|daily|each day)\b/i },
  ],
  pack: [
    ...SHARED_UPLOADS,
    { field: "doc_past_performance", test: /\b(CPARS|performance rating)\b/i },
    { field: "state_diversity_certifications", test: /\b(small business enterprise|NCSBE|state certification)\b/i },
    { field: "doc_marketing", test: /\b(reel|portfolio|work samples)\b/i },
  ],
});

/** The scripted "model reply" for her words, in the JSON shape the real model returns. */
export function scriptedReply(text: string): string {
  const facts: Fact[] = [];
  const uploads: Upload[] = [];
  const used = new Set<string>();

  for (const sentence of sentences(text)) {
    let claimed = false;
    for (const rule of FACT_RULES) {
      if (used.has(rule.field)) continue;
      const value = rule.read(sentence);
      if (value === undefined) continue;
      facts.push({ field: rule.field, value, quote: sentence });
      used.add(rule.field);
      claimed = true;
      break;
    }
    if (claimed) continue;
    for (const rule of UPLOAD_RULES) {
      if (used.has(rule.field) || !rule.test.test(sentence)) continue;
      uploads.push({ field: rule.field, quote: sentence });
      used.add(rule.field);
      break;
    }
  }
  return JSON.stringify({ facts, uploads });
}

/** What she said, read as the real route reads it: the reply is checked, then used. */
export function demoExtract(text: string): Extraction {
  return readTellReply(text, scriptedReply(text)) ?? extract(text);
}
