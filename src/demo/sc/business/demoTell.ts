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

/** Rules that turn one sentence into one fact. The first rule that fits wins. */
const FACT_RULES: { field: string; read: (s: string) => unknown | undefined }[] = [
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
      if (!/\b(jobs|contracts|events|orders)\b/i.test(s) || !/(at once|at the same time|at a time|concurrent)/i.test(s)) {
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
  {
    field: "geographic_coverage",
    read: (s) => {
      if (!/\b(serve|deliver|work in|travel|cover|service area)\b/i.test(s)) return undefined;
      const states = STATES.filter(([re]) => re.test(s)).map(([, code]) => code);
      return states.length > 0 ? { states } : undefined;
    },
  },
];

/** Rules that spot a row that only a document, or a pick from a list, can answer. */
const UPLOAD_RULES: { field: string; test: RegExp }[] = [
  { field: "insurance_coverage", test: /\binsurance\b/i },
  { field: "health_permits", test: /\b(health (permit|department)|food (service )?permit)\b/i },
  { field: "food_handler_cards", test: /\b(food[- ]handler|servsafe)\b/i },
  { field: "doc_w9", test: /\bw-?9\b/i },
  { field: "doc_tax_returns", test: /\btax returns?\b/i },
  { field: "doc_haccp_plan", test: /\bhaccp\b/i },
  { field: "doc_capability_statement", test: /\bcapability statement\b/i },
  { field: "psc_codes", test: /\bPSC\b/ },
  { field: "commodity_codes", test: /\bNIGP\b/ },
  { field: "max_daily_output", test: /\d[\d,]*\s*(meals|plates|trays|lunches|breakfasts)\b.*\b(a day|per day|daily|each day)\b/i },
];

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
