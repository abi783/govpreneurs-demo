// Search matcher for Find partners and Awards.
//
// This file copies the PROPOSED backend behaviour (search PRD):
// 1. The backend turns everyday words into NAICS and PSC codes with a word list
//    (vocabulary.ts) and searches the existing NAICS and PSC indexes. A member types
//    "catering" and finds "Food Service Contractors" (722310), which never says "catering".
// 2. The backend also searches the words of the official NAICS and PSC names.
// 3. Description text search is the later "full-text" phase. Here it runs on the mock data
//    so the reasons show how it will look.
//
// Each function returns a short plain reason, or null if the record does not match. All words
// of the search must match somewhere. A phrase from the word list counts as one word. Stop
// words do not count. The reason comes from the strongest place that one word matched.
//
// Rules that keep the results honest:
// - A name matches only on the whole search ("cape fear", "carolina dining"). One shared word
//   ("dining") never makes a name match. A word from the word list never matches a name.
// - A state ("SC", "south carolina") matches the place of the work only. "south" does not
//   match "Southeast", and "north carolina" does not match North Charleston, SC.
// - A word of 2 letters never matches the start of another word, so "VA" does not find Valor.
// - A typed word of 5 or more letters can have a typo: "cateirng" finds catering.
//
// Strongest reason first:
//   Awards:   Contract number, Solicitation number, Winner UEI (the whole search) > Winner >
//             Work: "<description>" > Type of work > Service > Small firm on this job >
//             State > Place > Buyer > Set aside for > How it was bought > Title
//   Partners: see PARTNER_RANK below.
// A typed NAICS code ("722310", or its first 4 or more digits) or PSC code ("S203") finds the
// awards and companies with that code.
// The code has no framework imports, so the backend can port it as it is.

import type { AwardRecord } from "../awardsApi";
import type { PrimeCandidate } from "../partnersApi";
import { US_STATE_NAMES, stateName } from "../vocab/usStates";
import { plainNaics, plainPricing, plainPsc } from "../vocab/plainCodes";
import { CERT_CHOICES, certIds, setAsideChoice } from "../filters/smallBusinessPrograms";
import {
  MAX_PHRASE_WORDS,
  editDistance,
  lookupPhrase,
  nearestListWord,
  phraseKey,
  stem,
  tokenize,
  typoAllowance,
  type VocabTarget,
} from "./vocabulary";

// ── the search text ───────────────────────────────────────────────────────

const STOP_WORDS = new Set(
  (
    "a an the and or of for in on at to with by from near me my i we our us it its is are be " +
    "any all some who what that this need want looking find show get " +
    "job jobs work contract contracts contractor contractors company companies firm firms " +
    "business service services svc svcs government federal gov"
  ).split(" "),
);

/** State names in lower case, to their 2-letter codes: "south carolina" gives "SC". */
const STATE_BY_NAME = new Map(
  Object.entries(US_STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code]),
);
const STATE_CODES = new Set(Object.keys(US_STATE_NAMES).map((c) => c.toLowerCase()));

/** Other names for the buyers, to the agency name that the records use. */
const AGENCY_ALIASES: Record<string, string> = {
  va: "VA",
  "veterans affairs": "VA",
  "department of veterans affairs": "VA",
  "veterans administration": "VA",
  "department of the navy": "Navy",
  "us navy": "Navy",
  "department of the army": "Army",
  "us army": "Army",
  "department of the air force": "Air Force",
  "us air force": "Air Force",
  usaf: "Air Force",
  "general services administration": "GSA",
};
const MAX_ALIAS_WORDS = 5;

interface Term {
  /** The words as the member typed them. */
  raw: string[];
  stems: string[];
  /** The code groups if the term is in the word list, else empty. */
  targets: VocabTarget[];
  /** A state, when the term is a state name or a 2-letter state code. */
  state?: string;
  /** An agency name, when the term is a name for a buyer ("veterans affairs" gives "VA"). */
  agency?: string;
  /** The list word that a typo stands for ("cateirng" gives "catering"). */
  corrected?: string;
}

/** Splits the search into terms. A phrase from the word list, a state name and a buyer
 *  name each count as one term. */
function parse(q: string): Term[] {
  const tokens = tokenize(q);
  const terms: Term[] = [];
  let i = 0;
  outer: while (i < tokens.length) {
    // A state name or a buyer name, longest first.
    for (let n = Math.min(MAX_ALIAS_WORDS, tokens.length - i); n >= 1; n--) {
      const raw = tokens.slice(i, i + n);
      const joined = raw.join(" ");
      const state = n > 1 || joined.length > 2 ? STATE_BY_NAME.get(joined) : undefined;
      const agency = AGENCY_ALIASES[joined];
      if (state || (agency && n > 1) || (agency && joined.length > 2)) {
        terms.push({ raw, stems: raw.map(stem), targets: [], state, agency });
        i += n;
        continue outer;
      }
    }
    for (let n = Math.min(MAX_PHRASE_WORDS, tokens.length - i); n >= 1; n--) {
      const raw = tokens.slice(i, i + n);
      const stems = raw.map(stem);
      const targets = lookupPhrase(stems.join(" "));
      if (targets.length) {
        terms.push({ raw, stems, targets });
        i += n;
        continue outer;
      }
    }
    const tok = tokens[i++];
    if (STOP_WORDS.has(tok) || (tok.length < 2 && !/\d/.test(tok))) continue;
    // A 2-letter state code ("sc", "va") is a state. "va" is also the buyer VA.
    if (tok.length === 2 && STATE_CODES.has(tok)) {
      terms.push({
        raw: [tok],
        stems: [tok],
        targets: [],
        state: tok.toUpperCase(),
        agency: AGENCY_ALIASES[tok],
      });
      continue;
    }
    // A word that is not in the list may be a typo of a list word.
    const near = nearestListWord(tok);
    const targets = near ? lookupPhrase(phraseKey(near)) : [];
    if (targets.length) {
      terms.push({ raw: [tok], stems: [stem(near!)], targets, corrected: near! });
      continue;
    }
    terms.push({ raw: [tok], stems: [stem(tok)], targets: [] });
  }
  return terms;
}

/** True when the term is a plain word: not a list phrase, a state or a buyer name. */
const isPlainWord = (t: Term) => t.targets.length === 0 && !t.state && !t.agency;

// ── text that a term can match ────────────────────────────────────────────

interface Text {
  raw: string[];
  stems: Set<string>;
}

const textOf = (s: string | null | undefined): Text => {
  const raw = tokenize(s ?? "");
  return { raw, stems: new Set(raw.map(stem)) };
};

/**
 * True if every word of the term is in the text. A typed word of 4 or more letters also
 * matches the start of a word, so a half-typed word ("janit") finds "janitorial". A typed
 * word of 6 or more letters may have a typo. A state or a buyer name never matches text:
 * it matches only the place or the buyer.
 */
function contains(text: Text, term: Term): boolean {
  if (term.state || term.agency) return false;
  return term.stems.every((s, i) => {
    if (text.stems.has(s)) return true;
    if (term.targets.length > 0) return false;
    const typed = term.raw[i];
    if (typed.length >= 4 && text.raw.some((w) => w.startsWith(typed))) return true;
    const allowed = typed.length >= 6 ? typoAllowance(typed) : 0;
    return (
      allowed > 0 &&
      text.raw.some(
        (w) => Math.abs(w.length - typed.length) <= allowed && editDistance(w, typed) <= allowed,
      )
    );
  });
}

/** "Savannah, GA". Each part is trimmed, so a city stored as "Savannah " never gives
 *  "Savannah , GA". */
const placeName = (city: string | null | undefined, state: string | null | undefined) =>
  [city?.trim(), state?.trim()].filter(Boolean).join(", ");

/** The search as one lower-case string. */
const flat = (q: string) => q.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * True when the whole search names this company: every word of the search is a word of the
 * name, and the last word may be half-typed ("cape fe"). At least one word must be a plain
 * word, so "dining" alone does not name "Tetra Dining Services". A 2-letter search never
 * names a company, so "VA" does not find Valor.
 */
function namesIt(name: string | null | undefined, q: string): boolean {
  if (!name) return false;
  const words = tokenize(q).filter((w) => !STOP_WORDS.has(w));
  if (words.length === 0 || words.join("").length < 3) return false;
  if (!words.some((w) => !lookupPhrase(stem(w)).length && !STATE_CODES.has(w))) return false;
  const nameWords = tokenize(name);
  const nameStems = new Set(nameWords.map(stem));
  return words.every((w, i) =>
    i === words.length - 1
      ? nameStems.has(stem(w)) || nameWords.some((n) => n.startsWith(w))
      : nameStems.has(stem(w)),
  );
}

/** The first letter in lower case, unless the word is an acronym ("HVAC repair" stays). */
const lc = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/** The search with only letters and digits, for IDs: "W91247-25-D" -> "w9124725d". */
const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** True when the search looks like an ID: a digit and 4 or more letters and digits. */
const isIdLike = (whole: string) => compact(whole).length >= 4 && /\d/.test(whole);

/**
 * True if the search is this ID, or its start. An ID search must hold a digit and 4 or more
 * characters, so a word ("navy") never matches an ID. Hyphens and spaces do not count.
 */
function idMatches(id: string | null | undefined, whole: string): boolean {
  if (!id || !isIdLike(whole)) return false;
  return compact(id).startsWith(compact(whole));
}

/** A typed NAICS code (4 to 6 digits) that starts the code. */
const naicsCodeHit = (t: Term, code: string | null | undefined) =>
  !!code && t.raw.length === 1 && /^\d{4,6}$/.test(t.raw[0]) && code.startsWith(t.raw[0]);

/** A typed PSC code ("S203", or "8905"). Three or more characters, so "s2" finds nothing. */
const pscCodeHit = (t: Term, code: string | null | undefined) =>
  !!code &&
  t.raw.length === 1 &&
  /^([a-z]\d{2,3}|\d{4})$/.test(t.raw[0]) &&
  code.toLowerCase().startsWith(t.raw[0]);

/** Plain words for how an award was bought. "Not Competed" is also "sole source". */
const boughtText = (s: string) =>
  textOf(/not competed/i.test(s) ? `${s} sole source noncompetitive` : s);

/** True when the agency is the one that the term names. "Army" also finds "Army MICC". */
const isAgency = (name: string, abbrev: string | null | undefined, agency: string) => {
  const a = agency.toLowerCase();
  const n = name.toLowerCase();
  return n === a || n.startsWith(`${a} `) || (abbrev ?? "").toLowerCase() === a;
};

// ── the description snippet ───────────────────────────────────────────────

const SNIPPET_MAX = 40;
const ACRONYMS = new Set(
  "DFAC DFACS HVAC PM IDIQ AFB AAF MCAS MCLB VA IPM CBOC SE NC SC GA US GSA DPW JOC".split(" "),
);
const SMALL_WORDS = new Set("and of for the in at to a on with or".split(" "));

function titleCase(words: string[]): string {
  return words
    .map((w, i) => {
      if (ACRONYMS.has(w.toUpperCase()) || /\d/.test(w)) return w.toUpperCase();
      const lower = w.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.replace(
        /(^|[-/])([a-z])/g,
        (_, sep: string, c: string) => sep + c.toUpperCase(),
      );
    })
    .join(" ");
}

/**
 * The part of the text around the first matched word, title-cased, 40 characters or less.
 * The snippet does not cut a name: it starts up to 2 words early when those words are part
 * of a name ("Fort Bragg dining", "Pope AAF dining").
 */
function snippet(text: string, term: Term): string {
  const words = text.trim().split(/\s+/);
  const hit = (w: string) =>
    tokenize(w).some((t) => stem(t) === term.stems[0] || t.startsWith(term.raw[0]));
  const allCaps = text === text.toUpperCase();
  const partOfName = (w: string) =>
    allCaps ? ACRONYMS.has(w.replace(/[^A-Za-z]/g, "").toUpperCase()) : /^[A-Z]/.test(w);
  let start = text.length <= SNIPPET_MAX ? 0 : Math.max(0, words.findIndex(hit));
  for (let back = 0; back < 2 && start > 0 && partOfName(words[start - 1]); back++) start--;
  let end = start;
  let len = 0;
  while (end < words.length && len + words[end].length + (end > start ? 1 : 0) <= SNIPPET_MAX) {
    len += words[end].length + (end > start ? 1 : 0);
    end++;
  }
  while (start > 0 && len + words[start - 1].length + 1 <= SNIPPET_MAX) {
    start--;
    len += words[start].length + 1;
  }
  // Do not start inside a name: drop a first word that continues the word before it
  // ("AAF" after "Pope"). Keep the matched word.
  const hitAt = words.findIndex(hit);
  while (start > 0 && start < hitAt && partOfName(words[start - 1]) && partOfName(words[start]))
    start++;
  if (end === start) return titleCase([words[start].slice(0, SNIPPET_MAX)]);
  return titleCase(words.slice(start, end));
}

// ── shared logic ──────────────────────────────────────────────────────────

interface Hit {
  /** Lower is stronger. */
  rank: number;
  reason: string;
}

/**
 * Every term must have a hit. The reason is the strongest hit of any term. If two hits have
 * the same rank, the earlier term wins.
 */
function best(terms: Term[], hitFor: (t: Term) => Hit | null): string | null {
  if (terms.length === 0) return null;
  let top: Hit | null = null;
  for (const t of terms) {
    const h = hitFor(t);
    if (!h) return null;
    if (!top || h.rank < top.rank) top = h;
  }
  return top?.reason ?? null;
}

/** The first code group of the term that includes the code, or undefined. */
const targetWith = (t: Term, kind: "naics" | "psc", code: string | null | undefined) =>
  code ? t.targets.find((g) => g[kind].includes(code)) : undefined;

// ── partners ──────────────────────────────────────────────────────────────

/** The reasons of matchPartner, strongest first. Each row is a prefix and its rank. */
const PARTNER_RANK: [prefix: string, rank: number][] = [
  ["Name", 0],
  ["UEI", 0],
  ["CAGE code", 0],
  ["Contract number:", 0],
  ["Solicitation number:", 0],
  ["Contact:", 1],
  ["Part of:", 1],
  ["Wins ", 2],
  ["Did ", 3],
  ["Service:", 3],
  ["Hires ", 4],
  ["Hired ", 4],
  ["Works in ", 5],
  ["Works for ", 6],
  ["Certified:", 7],
  ["Main office:", 8],
  ["Holds:", 8],
  ["Job:", 9],
];

/** How strong a matchPartner reason is. Lower is stronger. "Name" is 0. */
export function partnerReasonRank(reason: string | null | undefined): number {
  if (!reason) return PARTNER_RANK.length;
  return PARTNER_RANK.find(([prefix]) => reason.startsWith(prefix))?.[1] ?? 10;
}

/** Why a company matches the search text, in a few plain words, or null when it does not. */
export function matchPartner(p: PrimeCandidate, q: string): string | null {
  const whole = flat(q);
  if (!whole) return null;
  if (namesIt(p.name, whole)) return "Name";
  // An ID must match in full. A UEI is 12 characters and a CAGE code is 5.
  if (p.uei && compact(whole) === p.uei.toLowerCase()) return "UEI";
  if (p.cageCode && compact(whole) === p.cageCode.toLowerCase()) return "CAGE code";

  const jobs = (p.recentJobs ?? []).map((j) => ({
    ...j,
    descText: textOf(j.description),
    workText: textOf(j.workType),
    titleText: textOf(j.title),
  }));
  const byNumber = jobs.find((j) => idMatches(j.contractNumber, whole));
  if (byNumber) return `Contract number: ${byNumber.contractNumber}`;
  const bySolicitation = jobs.find((j) => idMatches(j.solicitationId, whole));
  if (bySolicitation) return `Solicitation number: ${bySolicitation.solicitationId}`;
  if (p.samContact && namesIt(p.samContact.name, whole)) return `Contact: ${p.samContact.name}`;
  if (p.parent && namesIt(p.parent.name, whole)) return `Part of: ${p.parent.name}`;

  const name = textOf(p.name);
  const workTypes = (p.workTypes ?? []).map((w) => ({ ...w, text: textOf(w.name) }));
  const trades = (p.tradesHired ?? []).map((w) => ({ ...w, text: textOf(w.name) }));
  const tradeCode = new Map(trades.map((t) => [t.name.toLowerCase(), t.naics]));
  const subs = (p.subsHired ?? []).map((h) => ({
    ...h,
    nameText: textOf(h.name),
    tradeText: textOf(h.trade),
  }));
  const buyers = [
    ...(p.buyers ?? []).map((b) => ({ name: b.name, label: b.name, text: textOf(b.name) })),
    ...jobs
      .filter((j) => j.office)
      .map((j) => ({
        name: j.buyer,
        label: `${j.buyer} (${j.office})`,
        text: textOf(`${j.buyer} ${j.office}`),
      })),
  ];
  // Each place they work in. A word can match the city, or the state name ("carolina" finds
  // North Carolina). The reason names what matched.
  const cities = jobs
    .filter((j) => j.city || j.state)
    .map((j) => ({
      label: placeName(j.city, j.state),
      cityText: textOf(j.city),
      state: j.state ? stateName(j.state) : "",
      stateText: textOf(j.state ? stateName(j.state) : ""),
    }));
  // Only the certifications count, each with its plain label and official term.
  const certs = certIds(p.certifications).map((id) => {
    const c = CERT_CHOICES.find((x) => x.id === id)!;
    return {
      label: c.term ? `${c.label} (${c.term})` : c.label,
      text: textOf(`${c.label} ${c.term ?? ""} ${c.types.join(" ")}`),
    };
  });
  const hq = p.headquarters;
  const hqLabel = hq ? placeName(hq.city, hq.state) : "";
  const hqText = textOf(hq?.city);
  const vehicles = (p.vehicles ?? []).map((v) => ({ name: v.name, text: textOf(v.name) }));

  const byTerms = best(parse(q), (t) => {
    // A state matches where they work, then their main office.
    if (t.state) {
      if (p.geography.statesPerformed.includes(t.state))
        return { rank: 5, reason: `Works in ${stateName(t.state)}` };
      if (t.agency) {
        const by = buyers.find((b) => isAgency(b.name, null, t.agency!));
        if (by) return { rank: 6, reason: `Works for ${by.label}` };
      }
      if (hq?.state === t.state) return { rank: 8, reason: `Main office: ${hqLabel}` };
      return null;
    }
    if (t.agency) {
      const by = buyers.find((b) => isAgency(b.name, null, t.agency!));
      return by ? { rank: 6, reason: `Works for ${by.label}` } : null;
    }
    // A plain word can be part of the name ("sodexo maryland"). It is the weakest hit, so
    // one shared word ("facility") never makes the name the reason when another word matched.
    if (isPlainWord(t) && contains(name, t)) return { rank: 10, reason: "Name" };

    for (const g of t.targets) {
      const w = workTypes.find((x) => g.naics.includes(x.naics));
      if (w) return { rank: 2, reason: `Wins ${lc(plainNaics(w.naics, w.name))} work` };
    }
    const wt = workTypes.find((w) => contains(w.text, t) || naicsCodeHit(t, w.naics));
    if (wt) {
      const code = naicsCodeHit(t, wt.naics) ? ` (${wt.naics})` : "";
      return { rank: 2, reason: `Wins ${lc(plainNaics(wt.naics, wt.name))} work${code}` };
    }
    const jw = jobs.find(
      (j) => (j.workType && contains(j.workText, t)) || naicsCodeHit(t, j.naicsCode),
    );
    if (jw?.workType) {
      const code = naicsCodeHit(t, jw.naicsCode) ? ` (${jw.naicsCode})` : "";
      return { rank: 2, reason: `Wins ${lc(plainNaics(jw.naicsCode, jw.workType))} work${code}` };
    }

    const jd = jobs.find((j) => j.description && contains(j.descText, t));
    if (jd?.description) return { rank: 3, reason: `Did "${snippet(jd.description, t)}" work` };
    const jp = jobs.find((j) => pscCodeHit(t, j.pscCode));
    if (jp?.pscCode)
      return { rank: 3, reason: `Service: ${lc(plainPsc(jp.pscCode))} (${jp.pscCode})` };

    for (const g of t.targets) {
      const hits = trades.filter((h) => g.naics.includes(h.naics));
      const firms = hits.reduce((n, h) => n + h.firms, 0);
      if (firms > 0)
        return {
          rank: 4,
          reason: `Hires ${lc(plainNaics(hits[0].naics, hits[0].name))} firms (at least ${firms})`,
        };
    }
    const tr = trades.find((h) => contains(h.text, t) || naicsCodeHit(t, h.naics));
    if (tr) {
      const code = naicsCodeHit(t, tr.naics) ? ` (${tr.naics})` : "";
      return {
        rank: 4,
        reason: `Hires ${lc(plainNaics(tr.naics, tr.name))} firms (at least ${tr.firms})${code}`,
      };
    }
    const sn = isPlainWord(t) ? subs.find((h) => contains(h.nameText, t)) : undefined;
    if (sn) return { rank: 4, reason: `Hired ${sn.name}` };
    const st = subs.find((h) => h.trade && contains(h.tradeText, t));
    if (st?.trade)
      return {
        rank: 4,
        reason: `Hires ${lc(plainNaics(tradeCode.get(st.trade.toLowerCase()), st.trade))} firms`,
      };

    const ci = cities.find((x) => contains(x.cityText, t));
    if (ci) return { rank: 5, reason: `Works in ${ci.label}` };
    const sn2 = cities.find((x) => x.state && contains(x.stateText, t));
    if (sn2) return { rank: 5, reason: `Works in ${sn2.state}` };
    const by = buyers.find((b) => contains(b.text, t));
    if (by) return { rank: 6, reason: `Works for ${by.label}` };
    const ce = certs.find((c) => contains(c.text, t));
    if (ce) return { rank: 7, reason: `Certified: ${ce.label}` };
    if (hqLabel && contains(hqText, t)) return { rank: 8, reason: `Main office: ${hqLabel}` };
    const ve = vehicles.find((v) => contains(v.text, t));
    if (ve) return { rank: 8, reason: `Holds: ${ve.name}` };

    // Production has a title on only 3.9% of awards, so a title is the last place to look.
    const jt = jobs.find((j) => contains(j.titleText, t));
    if (jt) return { rank: 9, reason: `Job: "${snippet(jt.title, t)}"` };
    return null;
  });
  if (byTerms) return byTerms;

  // If the member typed part of a name ("cape fe"), a firm they hired still matches.
  const partial = subs.find((h) => namesIt(h.name, whole));
  return partial ? `Hired ${partial.name}` : null;
}

// ── awards ────────────────────────────────────────────────────────────────

/** Why an award matches the search text, in a few plain words, or null when it does not. */
export function matchAward(a: AwardRecord, q: string): string | null {
  const whole = flat(q);
  if (!whole) return null;
  // An ID search is the whole search. Hyphens and spaces do not count.
  if (idMatches(a.contractNumber, whole)) return `Contract number: ${a.contractNumber}`;
  if (idMatches(a.solicitationId, whole)) return `Solicitation number: ${a.solicitationId}`;
  if (a.winner.uei && compact(whole) === a.winner.uei.toLowerCase()) return "Winner UEI";
  if (namesIt(a.winner.name, whole)) return `Winner: ${a.winner.name}`;

  const description = textOf(a.description);
  const title = textOf(a.title);
  const naicsName = textOf(a.workType);
  const pscName = textOf(a.pscName);
  const winner = textOf(a.winner.name);
  const agency = textOf(`${a.agency.name} ${a.agency.abbrev ?? ""}`);
  const office = textOf(a.office);
  const subs = (a.bench?.sampleSubs ?? []).map((x) => ({
    name: x.name,
    nameText: textOf(x.name),
    tradeText: textOf(x.trade),
  }));
  const setAsideTo = a.setAside ? setAsideChoice(a.setAside) : null;
  // The plain choice words first. The record's own words ("8(A) With Hub Zone Preference")
  // are a second place to look, and then the reason shows those words.
  const setAsideChoiceText = textOf(
    setAsideTo ? `${setAsideTo.label} ${setAsideTo.term ?? ""} ${setAsideTo.only}` : null,
  );
  const setAsideRaw = textOf(a.setAside);
  const setAsideWords = (a.setAside ?? "")
    .replace(/\s*\([A-Za-z0-9]+\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  const competed = boughtText(a.extentCompeted ?? "");
  const pricing = textOf(a.pricing);
  const state = a.location.state;
  const city = textOf(a.location.city);
  const stateText = textOf(state ? stateName(state) : "");
  const placeLabel = placeName(a.location.city, state);
  const typeOfWork = () => lc(plainNaics(a.naicsCode, a.workType));
  const service = () => lc(plainPsc(a.pscCode, a.pscName));

  const byTerms = best(parse(q), (t) => {
    // A state matches the place of the work only. "VA" can also be the buyer VA.
    if (t.state) {
      if (state === t.state) return { rank: 6, reason: `State: ${stateName(t.state)}` };
      if (t.agency && isAgency(a.agency.name, a.agency.abbrev, t.agency))
        return { rank: 7, reason: `Buyer: ${a.agency.name}` };
      return null;
    }
    if (t.agency)
      return isAgency(a.agency.name, a.agency.abbrev, t.agency)
        ? { rank: 7, reason: `Buyer: ${a.agency.name}` }
        : null;

    // One shared word with the winner's name is the weakest hit (see matchPartner).
    if (isPlainWord(t) && contains(winner, t))
      return { rank: 12, reason: `Winner: ${a.winner.name}` };
    if (a.description && contains(description, t))
      return { rank: 1, reason: `Work: "${snippet(a.description, t)}"` };
    if (a.workType && naicsCodeHit(t, a.naicsCode))
      return { rank: 2, reason: `Type of work: ${typeOfWork()} (${a.naicsCode})` };
    const byNaics = targetWith(t, "naics", a.naicsCode);
    if (byNaics) return { rank: 2, reason: `Type of work: ${typeOfWork()}` };
    if (a.workType && contains(naicsName, t))
      return { rank: 2, reason: `Type of work: ${typeOfWork()}` };

    if (a.pscName && pscCodeHit(t, a.pscCode))
      return { rank: 3, reason: `Service: ${service()} (${a.pscCode})` };
    if (targetWith(t, "psc", a.pscCode)) return { rank: 3, reason: `Service: ${service()}` };
    if (a.pscName && contains(pscName, t)) return { rank: 3, reason: `Service: ${service()}` };

    const sub = subs.find(
      (x) => (isPlainWord(t) && contains(x.nameText, t)) || contains(x.tradeText, t),
    );
    if (sub) return { rank: 5, reason: `Small firm on this job: ${sub.name}` };
    // A place word is about the place, so it comes before the buyer's office ("Fort Bragg").
    if (placeLabel && contains(city, t)) return { rank: 6, reason: `Place: ${placeLabel}` };
    if (state && contains(stateText, t)) return { rank: 6, reason: `Place: ${stateName(state)}` };
    if (contains(agency, t)) return { rank: 7, reason: `Buyer: ${a.agency.name}` };
    if (a.office && contains(office, t))
      return { rank: 7, reason: `Buyer: ${a.agency.name} (${a.office})` };
    if (setAsideTo && contains(setAsideChoiceText, t))
      return {
        rank: 8,
        reason: `Set aside for: ${setAsideTo.label}${setAsideTo.term ? ` (${setAsideTo.term})` : ""}`,
      };
    if (setAsideTo && contains(setAsideRaw, t))
      return {
        rank: 8,
        reason: `Set aside for: ${lc(
          setAsideWords
            .toLowerCase()
            .replace(/\b8\(a\)/, "8(a)")
            .replace(/hub zone/, "HUBZone"),
        )}`,
      };
    if (a.extentCompeted && contains(competed, t))
      return {
        rank: 10,
        reason: /not competed/i.test(a.extentCompeted)
          ? "How it was bought: not competed (sole source)"
          : `How it was bought: ${a.extentCompeted.toLowerCase()}`,
      };
    if (a.pricing && contains(pricing, t))
      return { rank: 10, reason: `How it was bought: ${lc(plainPricing(a.pricing))}` };
    // Production has a title on only 3.9% of awards, so a title is the last place to look.
    if (a.title && contains(title, t))
      return { rank: 11, reason: `Title: "${snippet(a.title, t)}"` };
    return null;
  });
  if (byTerms) return byTerms;

  // If the member typed part of a name ("cape fe"), the buyer or a small firm still matches.
  if (namesIt(a.agency.name, whole)) return `Buyer: ${a.agency.name}`;
  const partial = subs.find((x) => namesIt(x.name, whole));
  return partial ? `Small firm on this job: ${partial.name}` : null;
}

/** The reasons of matchAward, strongest first. The mock API sorts search results by it. */
export const AWARD_REASON_ORDER = [
  "Contract number:",
  "Solicitation number:",
  "Winner UEI",
  "Winner:",
  "Work:",
  "Type of work:",
  "Service:",
  "Small firm on this job:",
  "State:",
  "Place:",
  "Buyer:",
  "Set aside for:",
  "How it was bought:",
  "Title:",
];

// ── what to highlight ─────────────────────────────────────────────────────

/**
 * What a result should highlight for this search, and which plain names the word
 * list added. "catering" gives words ["catering", "cater"] and phrases ["food service"],
 * so a result filed as food service shows that phrase highlighted.
 * `ids` are typed IDs; the highlighter lets hyphens and spaces sit between their characters,
 * so "w9124725d" marks "W91247-25-D".
 */
export function searchTerms(q: string): {
  words: string[];
  phrases: string[];
  including: string[];
  ids: string[];
} {
  const words = new Set<string>();
  const phrases = new Set<string>();
  const including = new Set<string>();
  const ids = new Set<string>();
  const typed = flat(q);
  if (isIdLike(typed) && /[a-z]/.test(typed)) ids.add(compact(typed));
  for (const term of parse(q)) {
    // "8a" is written "8(a)" in the records.
    if (term.raw.includes("8a")) phrases.add("8(a)");
    if (term.raw.includes("not") || term.raw.includes("sole")) phrases.add("sole source");
    if (term.state) {
      phrases.add(stateName(term.state).toLowerCase());
      words.add(term.state.toLowerCase());
    }
    if (term.agency) phrases.add(term.agency.toLowerCase());
    if (term.state || term.agency) {
      if (term.raw.length > 1) phrases.add(term.raw.join(" "));
      continue;
    }
    if (term.targets.length) {
      phrases.add(term.raw.join(" "));
      if (term.corrected) phrases.add(term.corrected);
      // The stem marks other forms of the typed word: "caterer" also marks "Catering".
      for (const w of [...term.raw, term.corrected ?? ""]) if (w.length >= 4) words.add(stem(w));
      for (const t of term.targets) {
        const label = t.label.toLowerCase();
        phrases.add(label);
        if (label !== term.raw.join(" ")) including.add(t.label);
        // A hyphenated label word counts whole: "air-conditioning", not just "conditioning".
        for (const c of label.match(/[a-z]+(?:-[a-z]+)+/g) ?? []) phrases.add(c);
        // A label word also counts alone, unless it is a filler word ("service", "and").
        for (const w of tokenize(label))
          if (w.length >= 4 && !STOP_WORDS.has(w)) words.add(stem(w));
        // The plain names that the reasons show for these codes.
        for (const code of t.naics) {
          const plain = plainNaics(code).toLowerCase();
          if (plain !== code.toLowerCase()) phrases.add(plain);
        }
        for (const code of t.psc) {
          const plain = plainPsc(code).toLowerCase();
          if (plain !== code.toLowerCase()) phrases.add(plain);
        }
      }
    } else {
      for (const w of term.raw) words.add(w.length >= 4 ? w : stem(w));
    }
  }
  phrases.delete("");
  return { words: [...words], phrases: [...phrases], including: [...including], ids: [...ids] };
}
