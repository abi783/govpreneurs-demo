// Public-record descriptors — the FOURTH GEOMETRY of source references.
//
// THE PROBLEM THIS SOLVES: Grant makes claims that rest on government data —
// who holds the incumbent contract, how crowded the field has been, what work
// like this has paid. None of those live in a document (geometry 1), in the
// member's own file (geometry 2), or in something somebody said (geometry 3).
// They live in a REGISTER, and a register citation has to answer three
// questions a document citation never asks:
//
//     WHICH record, from WHICH government system, as of WHEN.
//
// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTION RULE (the load-bearing product decision — PRD §3 D1)
//
// We aggregate this data through a commercial partner. The member never sees
// that partner's name — but "our data" is NOT an acceptable substitute, because
// the reason a member believes "the same firm has held it since 2019" is that
// it is a FEDERAL AWARD RECORD, not that a vendor said so. So every public
// source is attributed to its UPSTREAM GOVERNMENT SYSTEM OF RECORD. The
// aggregator is the pipe, not the source.
//
// Every descriptor here is COUNTED, never inferred, which is what earns it a
// government label. That is a deliberate boundary: a "firms likely to bid this"
// estimate was built and then removed, because bid information is not
// releasable before award (Procurement Integrity Act, 41 U.S.C. § 2102; FAR
// 3.1) and the figure had no ground truth to be right or wrong against. If a
// genuinely INFERRED figure is ever added here it may not borrow a government
// label — it needs its own chrome and an attributed note (rule R8 applied to
// registers).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE FIELD-SET RULE (PRD §3 D3/D4)
//
// Per object type the field list is FIXED; per claim only the HIGHLIGHT moves.
// A reader who opened one award record already knows where to look in the next;
// a field set that changed per claim would let us quietly drop the inconvenient
// row (R3); and it is one descriptor per object type rather than one per claim.
//
// Fields are chosen by one test — WOULD A SKEPTIC CHECK THIS? Six, not the
// three hundred the API exposes.
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW THIS DIFFERS FROM THE PROTOTYPE
//
// In the design prototype `resolvePublic(ref)` looks the record up in a
// client-side dataset. We have no such dataset: awards live in Mongo behind the
// API, so the register row travels WITH THE PIN (`provenance.award` /
// `provenance.tally`) and this file turns that payload into a descriptor. The
// grammar, the shapes and the rules are unchanged — only the lookup is.
//
// ADDING A REGISTER is a descriptor here plus a case in `resolvePublic`. No new
// component, no new ProvenanceType, no map to update anywhere else.

import type {
  AwardCitation,
  AwardTally,
  BuyerCitation,
  EntityCitation,
  SubawardCitation,
  ForecastCitation,
  VehicleCitation,
  Provenance,
} from "../grant/types";
import { mentionsVendor } from "../sourceLink";

/** One row of a public register, rendered as a field list. */
export interface PublicEntry {
  shape: "entry";
  /** What kind of register this is, in the member's words. Never the vendor. */
  origin: string;
  /** The record's own identity — a contract number, a company, an office. */
  title: string;
  /** Where the record sits, for the locator line. */
  locator: string;
  fields: { key: string; label: string; value: string | null }[];
  /** Field keys the claim rests on — these get the --hl-* highlight. */
  pinned: string[];
  /** FRESHNESS — when our copy of this register was last synced, NOT the period
   *  the data covers. Conflating those is how a 2019 award ends up looking like
   *  a 2019 refresh. */
  asOf: string;
  /** Named when the lag is material enough to change how a claim should be
   *  read. Stale-but-flagged is acceptable; stale-and-silent is a failure. */
  lagNote?: string;
}

/** A figure counted over many rows. Not one record — a population. */
export interface PublicTally {
  shape: "tally";
  origin: string;
  /** The figure itself, already formatted. Rendered large, in tabular mono. */
  figure: string;
  /** What the figure measures, e.g. "offers per award, on average". */
  figureLabel: string;
  locator: string;
  /** The honest basis: what was counted, over what. Without this the figure is
   *  an assertion; with it, it is a finding. */
  basis: { label: string; value: string }[];
  /** A few of the actual rows counted — enough to spot-check, never all. */
  sample: { key: string; label: string; value: string }[];
  /** How many rows exist in total, so the sample never implies it is the set. */
  sampleOf: number;
  /** What a row IS — "awards", "firms". Defaults to "records". */
  unit?: string;
  asOf: string;
  lagNote?: string;
}

export type PublicDescriptor = PublicEntry | PublicTally;

/* ── the sanitising layer ────────────────────────────────────────────────
   EVERY value that reaches a descriptor passes through here. The register rows
   are vendor data reshaped by our pipeline and the figures are computed, so the
   TYPES describe the contract, not the wire: a value can arrive non-finite,
   negative, unbounded, the wrong type, or carrying the one string we may never
   show. Guarding at the point of construction means a new descriptor cannot
   forget — there is no path to a field that skips this. */

/** The longest a single register value may be. A register field is a fact, not
 *  a document; anything longer is a layout weapon, and an award description is
 *  comfortably inside this. */
const MAX_VALUE = 300;
/** A claim rests on a handful of fields. A highlight list longer than this is
 *  not a claim, it is a payload. */
const MAX_PINNED = 64;

/**
 * A register value we may render, or null.
 *
 * Null means ABSENT, and absent is a real answer a register gives — the field
 * renders "Not in the record" rather than disappearing, so a reader can tell we
 * looked. Three ways to earn it: not a string, names our data vendor (dropped
 * whole, never partly redacted — see `mentionsVendor`), or empty once trimmed.
 */
function text(v: unknown, max = MAX_VALUE): string | null {
  if (typeof v !== "string") return null;
  // Collapse runs of whitespace and embedded newlines onto one line. This is a
  // RENDERING normalisation and cannot change meaning — award descriptions
  // genuinely arrive with hard newlines mid-sentence, which break a field row
  // into two. It is deliberately the ONLY transform applied to register prose;
  // see WHY WE DO NOT RE-CASE below.
  const t = v.replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (mentionsVendor(t)) return null;
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** A number we may do arithmetic on and print. NaN, ±Infinity and non-positive
 *  values are all ABSENT rather than rendered: "$NaN" and "$InfinityM" are not
 *  degraded output, they are a surface saying something untrue with confidence. */
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/** A count: a non-negative integer, or null. */
function count(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null;
}

/* ── formatting ──────────────────────────────────────────────────────────── */

/** Money. Only ever called with a `num()`-validated value, so it never has to
 *  defend against non-finite input itself. */
const usd = (n: number): string =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`
    : n >= 1_000
      ? `$${Math.round(n / 1_000)}K`
      : `$${Math.round(n).toLocaleString("en-US")}`;

/** Money, or absent. The one place `usd` is reachable from a wire value. */
const money = (v: unknown): string | null => {
  const n = num(v);
  return n === null ? null : usd(n);
};

/** A fiscal year, or absent. Guards against FY-NaN and FYInfinity. */
const fy = (v: unknown): string | null => {
  const n = count(v);
  return n === null || n < 1900 || n > 2200 ? null : `FY${n}`;
};

/** A date we can stand behind, or null — never "Invalid Date" under a claim. */
function day(iso: string | null | undefined): string | null {
  if (typeof iso !== "string" || !iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/** Freshness in the member's words. `asOf` is a sync timestamp, and "checked
 *  2 weeks ago" answers the question a raw ISO string doesn't. */
function freshness(iso: string | null | undefined): string {
  const d = day(iso);
  if (!d) return "refresh date not recorded";
  const ms = Date.now() - new Date(iso as string).getTime();
  const days = Math.floor(ms / 86_400_000);
  // A stamp from the future is not a fresh copy, it is a broken clock. Claiming
  // "checked today" for it would be the most confident thing on the sheet and
  // the least true.
  if (days < -1) return "refresh date not recorded";
  if (days <= 0) return "checked today";
  if (days === 1) return "checked yesterday";
  if (days < 14) return `checked ${days} days ago`;
  if (days < 60) return `checked ${Math.floor(days / 7)} weeks ago`;
  return `last checked ${d}`;
}

/** Defense award records run materially behind everything else, and a claim
 *  about a defense incumbent should be read in that light (PRD §3 D5). */
const DOD_LAG =
  "Defense award records run about 90 days behind, so a very recent change may not show yet.";

const isDefense = (agency: unknown): boolean =>
  typeof agency === "string" && /defen|army|navy|air force|marine|dla|dod/i.test(agency);

/* ── WHY WE DO NOT RE-CASE A REGISTER VALUE ──────────────────────────────
   The "Work" row renders `award_description_original` verbatim, and it SHOUTS:
   measured over a 2,958-row random sample of live awards, 2,955 (99.9%) are
   ≥90% uppercase. So this is not an occasional ugly record — it is every
   record, and sentence-casing it was the obvious-looking fix.

   It is the wrong fix. The same sample shows what that prose actually contains:
   part numbers (UP404845SS104), schedule and contract ids (GS35F3082D),
   military specs (MILC52074B), and trade abbreviations (IAW, DTD, CHL, BPA,
   IDIQ, NAVFAC). Any casing heuristic mangles those at scale — "IAW MIL SPEC
   MILC52074B" becomes "Iaw mil spec milc52074b" — and a mangled identifier in a
   government record is not a cosmetic loss: it is the surface misquoting the
   thing it exists to let a member verify.

   Median length is 24 characters, so most rows are a short shouted noun phrase
   ("APPLES, CHL,") that reads fine. The verdict: leave the record's own words
   alone. Whitespace is normalised because that cannot change meaning; casing is
   not, because it can. If this is ever revisited, the bar is a transform that
   provably leaves every identifier in that sample intact. */

/* ── award: one federal prime contract ───────────────────────────────────── */
// Backs: who the incumbent is, how long they have held it, whether the
// government kept renewing them, what comparable work paid.

function awardEntry(award: AwardCitation, pinned: string[]): PublicEntry | null {
  if (!award || typeof award !== "object") return null;
  // The id becomes the title and the locator, so it is sanitised like any other
  // free-text value — a vendor URL sitting in an id would otherwise be printed
  // as the record's own name.
  const id = text(award.awardId, 80);

  return {
    shape: "entry",
    // D1 — the government system of record, never the aggregator.
    origin: "Federal award record",
    title: id ? `Contract ${id}` : "Federal award record",
    locator: id ? `Federal award records · ${id}` : "Federal award records",
    // SIX fields (D4), fixed for every award. "Options exercised" is in the set
    // even though our register does not carry it: the honest empty row tells a
    // reader we looked, where dropping it would imply we never asked.
    fields: [
      { key: "winner", label: "Awarded to", value: text(award.awardeeName) },
      { key: "agency", label: "Awarded by", value: text(award.agencyName) },
      { key: "value", label: "Award value", value: money(award.value) },
      { key: "awardedAt", label: "Awarded", value: day(award.actionDate) ?? fy(award.fiscalYear) },
      { key: "options", label: "Options exercised", value: null },
      { key: "workType", label: "Work", value: text(award.title) ?? text(award.description) },
    ],
    pinned: pinned.slice(0, MAX_PINNED),
    asOf: freshness(award.asOf),
    lagNote: isDefense(award.agencyName) ? DOD_LAG : undefined,
  };
}

/* ── tallies: figures counted over many award records ────────────────────── */

/** The basis rows shared by every award tally. `matchedOn` and `yearsCovered`
 *  come from the server and describe the query we ACTUALLY ran — we apply no
 *  date filter, so the year span is the observed coverage of the rows counted,
 *  never a window we claim to have filtered on. */
function awardBasis(t: AwardTally, countedLabel: string): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const counted = count(t.countedOver);
  if (counted !== null) rows.push({ label: countedLabel, value: `${counted}` });
  const matched = text(t.matchedOn);
  if (matched) rows.push({ label: "Matched on", value: matched });
  const years = text(t.yearsCovered, 40);
  if (years) rows.push({ label: "Award years covered", value: years });
  // A range needs BOTH ends and needs them in order — one end alone, or a
  // reversed pair, is not a range and printing it would invent precision.
  const lo = money(t.low);
  const hi = money(t.high);
  if (lo && hi && (num(t.low) as number) <= (num(t.high) as number)) {
    rows.push({ label: "Range", value: `${lo} – ${hi}` });
  }
  return rows;
}

/** The population a sample is drawn from. A sample can never be larger than the
 *  set it samples: "Showing 3 of 0 awards" is worse than no basis at all,
 *  because it discredits the one part of the body whose job is credibility. */
function sampleOf(t: AwardTally, shown: number): number {
  return Math.max(count(t.countedOver) ?? 0, shown);
}

/** True when any sampled row is a defense buyer, so the lag note is earned.
 *  Written against an unknown `sample`: `t.sample?.some?.()` throws outright
 *  when `sample` is an object carrying a non-function `some`. */
function sampleIsDefense(sample: unknown): boolean {
  return Array.isArray(sample) && sample.some((a) => isDefense((a as AwardCitation)?.agencyName));
}

/** A sample row: enough to recognise the award and spot-check the figure. */
function awardSample(sample: AwardCitation[]): { key: string; label: string; value: string }[] {
  if (!Array.isArray(sample)) return [];
  return sample
    .filter((a): a is AwardCitation => !!a && typeof a === "object")
    .slice(0, 4)
    .map((a, i) => ({
      // The key is React's, not the member's — a stable index fallback beats a
      // key we had to sanitise away.
      key: text(a.awardId, 80) ?? `row-${i}`,
      label: text(a.title) ?? text(a.description) ?? text(a.awardId, 80) ?? "Award record",
      value:
        [money(a.value), text(a.awardeeName), fy(a.fiscalYear)].filter(Boolean).join(" · ") ||
        "Details not in the record",
    }));
}

/** What comparable work has paid — the price-to-win anchor. HISTORICAL, and
 *  never a read of what a competitor will bid (that intent is Tier ∅). */
function comparableAwardsTally(t: AwardTally, figure: string): PublicTally {
  const sample = awardSample(t.sample);
  return {
    shape: "tally",
    origin: "Federal award records",
    figure,
    figureLabel: "median award for comparable work",
    locator: "Federal award records · comparable awards",
    basis: awardBasis(t, "Awards counted"),
    sample,
    sampleOf: sampleOf(t, sample.length),
    unit: "awards",
    asOf: freshness(t.asOf),
    lagNote: sampleIsDefense(t.sample) ? DOD_LAG : undefined,
  };
}

/** How crowded the field has HISTORICALLY been. This is a retrospective count
 *  of offers already received, never a forecast of who will bid this one —
 *  that number does not exist before award and may never be originated. */
function fieldSizeTally(t: AwardTally, figure: string): PublicTally {
  const rows = awardSample(t.sample);
  const src = Array.isArray(t.sample) ? t.sample : [];
  return {
    shape: "tally",
    origin: "Federal award records",
    figure,
    figureLabel: "offers received per award, typically, on work like this",
    locator: "Federal award records · offers received",
    basis: awardBasis(t, "Awards with a bid count"),
    sample: rows.map((r, i) => {
      const offers = count(src[i]?.offers);
      return {
        ...r,
        value: [offers !== null ? `${offers} ${offers === 1 ? "offer" : "offers"}` : null, r.value]
          .filter(Boolean)
          .join(" · "),
      };
    }),
    sampleOf: sampleOf(t, rows.length),
    unit: "awards",
    asOf: freshness(t.asOf),
    lagNote: sampleIsDefense(t.sample) ? DOD_LAG : undefined,
  };
}

/* ── entity: one registered contractor ───────────────────────────────────── */
// Backs: who a competitor or a teaming partner actually is. Naming a firm is
// the claim a member is most likely to want to check, and before this register
// existed it was the least checkable thing on the surface — those pins resolved
// to the MEMBER'S OWN SAM record.

function entityEntry(e: EntityCitation, pinned: string[]): PublicEntry | null {
  if (!e || typeof e !== "object") return null;
  const name = text(e.name, 120) ?? text(e.legalName, 120);

  return {
    shape: "entry",
    // Upstream is SAM: uei, cage code, registration dates and the business-type
    // list are entity-registration fields, not award data.
    origin: "SAM.gov registration",
    title: name ?? "Registered contractor",
    locator: name ? `SAM.gov registration · ${name}` : "SAM.gov registration",
    fields: [
      { key: "name", label: "Registered name", value: text(e.legalName, 120) ?? name },
      { key: "basedIn", label: "Based in", value: text(e.basedIn, 80) },
      {
        key: "work",
        label: "Work they do",
        value: e.primaryNaics
          ? [text(e.primaryNaics, 10), text(e.primaryNaicsDescription, 120)]
              .filter(Boolean)
              .join(" · ")
          : null,
      },
      {
        key: "awards",
        label: "Federal awards on record",
        value: count(e.awardsOnRecord) === null ? null : `${count(e.awardsOnRecord)}`,
      },
      { key: "totalAwarded", label: "Total awarded", value: money(e.totalAwarded) },
      { key: "busTypes", label: "Business types", value: busTypeLine(e.busTypes) },
    ],
    pinned: pinned.slice(0, MAX_PINNED),
    asOf: freshness(e.asOf),
  };
}

/**
 * Business types, with SELF-CERTIFIED marked.
 *
 * SAM distinguishes a firm ASSERTING a socio-economic status from a body having
 * verified it, and that difference decides whether a set-aside bid is
 * responsive. Printing "Small Disadvantaged Business" for both would hand a
 * member a self-attestation dressed as a certification — on the one field where
 * that mistake costs them an award.
 */
function busTypeLine(raw: unknown): string | null {
  if (!Array.isArray(raw)) return null;
  const parts = raw
    .map((b) => {
      const label = text((b as { label?: unknown })?.label, 80);
      if (!label) return null;
      return (b as { certified?: unknown })?.certified === true
        ? label
        : `${label} (self-certified)`;
    })
    .filter((x): x is string => !!x);
  return parts.length ? parts.join(" · ") : null;
}

/* ── buyer: one contracting office ───────────────────────────────────────── */
// Backs: does this office actually buy from firms like mine, and who are they.

function buyerEntry(b: BuyerCitation, pinned: string[]): PublicEntry | null {
  if (!b || typeof b !== "object") return null;
  const name = text(b.name, 120);
  const abbr = text(b.abbreviation, 20);
  const examined = count(b.awardsExamined);
  const setAside = count(b.setAsideAwards);

  return {
    shape: "entry",
    // The office's own record of what it bought — not a registration. What
    // makes "they buy from firms like mine" believable is the buying.
    origin: "Contracting office award history",
    title: name ?? "Contracting office",
    locator: name ? `Contracting office · ${name}` : "Contracting office",
    fields: [
      {
        key: "office",
        label: "Office",
        value: [name, abbr ? `(${abbr})` : null].filter(Boolean).join(" ") || null,
      },
      { key: "partOf", label: "Part of", value: parentLine(b.parents) },
      { key: "buys", label: "What they buy", value: buysLine(b.buys) },
      {
        key: "setAside",
        // NOT "small business share": we counted awards carrying a set-aside,
        // which is a different quantity from small-business dollars. Naming it
        // for what it is keeps it from being read as the stronger claim.
        label: "Set-aside awards",
        value:
          // The office's awards are read in no set order, so the count never says
          // "the last": that would claim a recency no query applied.
          examined !== null && setAside !== null && examined > 0
            ? `${setAside} of ${examined} examined`
            : null,
      },
      {
        key: "officers",
        label: "Contracting officers on record",
        value: count(b.officers) === null ? null : `${count(b.officers)}`,
      },
      { key: "type", label: "Agency type", value: text(b.agencyType, 40) },
    ],
    pinned: pinned.slice(0, MAX_PINNED),
    asOf: freshness(b.asOf),
    lagNote: b.isDefense === true ? DOD_LAG : undefined,
  };
}

/** "Department of Defense › Defense Finance and Accounting Service". */
function parentLine(parents: unknown): string | null {
  if (!Array.isArray(parents)) return null;
  const chain = parents.map((p) => text(p, 80)).filter((x): x is string => !!x);
  return chain.length ? chain.join(" › ") : null;
}

/** "238160 Roofing (14) · 236220 Construction (9)". */
function buysLine(buys: unknown): string | null {
  if (!Array.isArray(buys)) return null;
  const parts = buys
    .map((b) => {
      const row = b as { code?: unknown; description?: unknown; awards?: unknown };
      const code = text(row?.code, 10);
      if (!code) return null;
      const desc = text(row?.description, 60);
      const n = count(row?.awards);
      return `${[code, desc].filter(Boolean).join(" ")}${n !== null ? ` (${n})` : ""}`;
    })
    .filter((x): x is string => !!x);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * WHO HAS WON THIS WORK — a retrospective count of firms holding a comparable
 * award (PR30 object 7).
 *
 * This is the honest replacement for the "firms likely to bid" estimate the PRD
 * describes building and then deleting. Who WILL bid is not releasable before
 * award and has no ground truth to be scored against; who HAS WON is public
 * record. Because teaming here is company-first, the same list is the member's
 * partner shortlist rather than only a threat list — the honest framing is also
 * the more useful one.
 */
function marketWinnersTally(t: AwardTally, figure: string): PublicTally {
  const firms = Array.isArray(t.firms) ? t.firms : [];
  const rows = firms
    .map((f, i) => {
      const name = text((f as { name?: unknown })?.name, 120);
      if (!name) return null;
      const n = count((f as { awards?: unknown })?.awards);
      const total = money((f as { totalValue?: unknown })?.totalValue);
      return {
        key: `${name}-${i}`,
        label: name,
        value:
          [n !== null ? `${n} ${n === 1 ? "award" : "awards"}` : null, total]
            .filter(Boolean)
            .join(" · ") || "On record",
      };
    })
    .filter((x): x is { key: string; label: string; value: string } => !!x);

  return {
    shape: "tally",
    origin: "Federal award records",
    figure,
    figureLabel: "firms have won work like this",
    locator: "Federal award records · firms winning comparable work",
    basis: awardBasis(t, "Firms counted"),
    sample: rows.slice(0, 4),
    sampleOf: Math.max(count(t.countedOver) ?? 0, rows.length),
    unit: "firms",
    asOf: freshness(t.asOf),
    lagNote: sampleIsDefense(t.sample) ? DOD_LAG : undefined,
  };
}

/* ── subaward: what a prime reported paying its subcontractors ───────────── */
// Backs the whole teaming case. "Go in as a sub under them" is only actionable
// if they actually subcontract work out, and that was the one fact behind the
// recommendation that a member could not check.

function subawardEntry(sa: SubawardCitation, pinned: string[]): PublicEntry | null {
  if (!sa || typeof sa !== "object") return null;
  const prime = text(sa.primeName, 120);
  const subCount = count(sa.subCount);

  return {
    shape: "entry",
    // Upstream is federal subcontract reporting, not SAM — a different system
    // from the entity register even though both describe the same firm.
    origin: "Federal subcontract reports",
    title: prime ? `Subcontracting — ${prime}` : "Subcontracting record",
    locator: prime ? `Federal subcontract reports · ${prime}` : "Federal subcontract reports",
    fields: [
      {
        key: "subCount",
        label: "Subcontractors on record",
        value: subCount === null ? null : `${subCount}`,
      },
      {
        key: "awardCount",
        label: "Subaward actions",
        value: count(sa.awardCount) === null ? null : `${count(sa.awardCount)}`,
      },
      { key: "total", label: "Total subcontracted", value: money(sa.totalSubcontracted) },
      { key: "mostRecent", label: "Most recent", value: day(sa.mostRecent) },
      { key: "subs", label: "Firms they have used", value: subsLine(sa.subs) },
      {
        key: "scope",
        // These rows carry no NAICS, so the count is across ALL their work.
        // Saying "in your market" would name a filter we never applied.
        label: "Scope",
        value: "All reported subcontracting — not filtered to your market",
      },
    ],
    pinned: pinned.slice(0, MAX_PINNED),
    asOf: freshness(sa.asOf),
  };
}

/** "Idmworks (3) · Thomson Reuters (1)". */
function subsLine(subs: unknown): string | null {
  if (!Array.isArray(subs)) return null;
  const parts = subs
    .map((x) => {
      const row = x as { name?: unknown; awards?: unknown };
      const name = text(row?.name, 80);
      if (!name) return null;
      const n = count(row?.awards);
      return n !== null ? `${name} (${n})` : name;
    })
    .filter((v): v is string => !!v);
  return parts.length ? parts.join(" · ") : null;
}

/* ── vehicle: one contract vehicle ───────────────────────────────────────── */
// Backs: can you even bid this, and what IS this opportunity. "IDIQ, One
// Agency" and "GWAC, Multiple Agencies" are different propositions, and S4's
// IDIQ translation otherwise fires on solicitation text alone — this replaces
// an inference with a record wherever the record exists (~1.6% of active
// opportunities, so a bonus when present, never something a read depends on).

function vehicleEntry(v: VehicleCitation, pinned: string[]): PublicEntry | null {
  if (!v || typeof v !== "object") return null;
  const name = text(v.name, 120);

  return {
    shape: "entry",
    origin: "Contract vehicle record",
    title: name ?? "Contract vehicle",
    locator: name ? `Contract vehicles · ${name}` : "Contract vehicles",
    fields: [
      { key: "name", label: "Vehicle", value: name },
      { key: "type", label: "Type", value: text(v.vehicleType, 40) },
      // The field that decides whether the member can use it at all.
      { key: "whoCanUse", label: "Who can use it", value: text(v.whoCanUse, 40) },
      {
        key: "ceiling",
        // A vehicle ceiling is the pot, not the member's revenue — the same
        // confusion S4's IDIQ warning exists to prevent, so it is named here.
        label: "Shared ceiling",
        value: money(v.sharedCeiling),
      },
      { key: "expires", label: "Last date to order", value: day(v.lastDateToOrder) },
      { key: "sponsor", label: "Sponsored by", value: text(v.sponsorAgency, 100) },
    ],
    pinned: pinned.slice(0, MAX_PINNED),
    asOf: freshness(v.asOf),
  };
}

/**
 * HOW MUCH SUBCONTRACTING HAPPENS ON WORK LIKE THIS — the market half of the
 * teaming case (PR30 object 6, sub-use).
 *
 * The per-prime subaward entry answers "does this firm sub work out?"; this
 * answers "is subbing a real route in my trade at all?", which is the question
 * that decides whether S6's sub-first recommendation is a strategy or a
 * dead end.
 */
function subUseTally(t: AwardTally, figure: string): PublicTally {
  const subs = Array.isArray(t.subs) ? t.subs : [];
  const rows = subs
    .map((f, i) => {
      const name = text((f as { name?: unknown })?.name, 120);
      if (!name) return null;
      const n = count((f as { awards?: unknown })?.awards);
      const total = money((f as { total?: unknown })?.total);
      return {
        key: `${name}-${i}`,
        label: name,
        value:
          [
            n !== null ? `${n} ${n === 1 ? "subaward" : "subawards"}` : null,
            total,
          ]
            .filter(Boolean)
            .join(" · ") || "On record",
      };
    })
    .filter((x): x is { key: string; label: string; value: string } => !!x);

  return {
    shape: "tally",
    origin: "Federal subcontract reports",
    figure,
    figureLabel: "firms have been subcontracted on work like this",
    locator: "Federal subcontract reports · your market",
    basis: awardBasis(t, "Firms counted"),
    sample: rows.slice(0, 4),
    sampleOf: Math.max(count(t.countedOver) ?? 0, rows.length),
    unit: "firms",
    asOf: freshness(t.asOf),
  };
}

/* ── forecast: work a buyer has said is coming ───────────────────────────── */
// The only FORWARD-looking register, and still a record rather than a
// prediction — the agency published this forecast; we did not infer it. That is
// what lets it carry a government label at all (PRD D2: every public figure is
// counted or published, never predicted).

function forecastEntry(f: ForecastCitation, pinned: string[]): PublicEntry | null {
  if (!f || typeof f !== "object") return null;
  const title = text(f.title, 140);
  const also = count(f.alsoUpcoming);

  return {
    shape: "entry",
    origin: "Agency forecast",
    title: title ?? "Forecasted requirement",
    locator: f.agencyName
      ? `Agency forecast · ${text(f.agencyName, 100)}`
      : "Agency forecast",
    fields: [
      { key: "forecast", label: "Forecast", value: title },
      { key: "agency", label: "Agency", value: text(f.agencyName, 100) },
      // New · Recompete · Expiring Contract — a recompete is a different
      // proposition from a new buy, so the kind is its own row.
      { key: "kind", label: "Kind", value: text(f.forecastType, 40) },
      { key: "expected", label: "Expected", value: day(f.expectedDate) },
      { key: "value", label: "Estimated value", value: valueRange(f) },
      {
        key: "officer",
        // Populated on ~6% of forecasts, so this row is usually "Not in the
        // record". That is the honest state of the source — a forecast naming
        // its CO is a gift, not the norm, and hiding the row would imply we
        // never looked for the one contact that makes a forecast actionable.
        label: "Contracting officer",
        value: text(f.contractingOfficer, 80),
      },
      {
        key: "others",
        // A count of the office's other active forecasts in this forecast's NAICS
        // code. It is a field of the record, not a freshness lag, and "this trade"
        // is the forecast's own, never a claim about the member.
        label: "Other forecasts from this office in this trade",
        value: also !== null && also > 0 ? `${also}` : null,
      },
    ],
    pinned: pinned.slice(0, MAX_PINNED),
    asOf: freshness(f.asOf),
  };
}

/** "$5M – $10M", or a single figure, or absent. */
function valueRange(f: ForecastCitation): string | null {
  const lo = money(f.estValueLow);
  const hi = money(f.estValueHigh);
  if (lo && hi) return lo === hi ? lo : `${lo} – ${hi}`;
  return lo ?? hi ?? null;
}

/* ── the registry ────────────────────────────────────────────────────────── */
//   award:W912PM-19-C-0043           one federal prime contract
//   award:W912PM-19-C-0043#winner    …with a specific field highlighted
//   entity:10109438                  one registered contractor
//   entity:10109438#name             …with a specific field highlighted
//   buyer:1464                       one contracting office
//   subaward:10000137                what a prime reported paying its subs
//   tally:comparable-awards          median value, counted over award records
//   tally:field-size                 median offers, counted over award records
//   vehicle:950                      one contract vehicle
//   forecast:<oppKey>                work a buyer has said is coming
//   tally:market-winners             firms that have WON comparable work
//   tally:sub-use                    firms subcontracted on work like this

export function resolvePublic(
  ref: string,
  provenance?: Pick<Provenance, "award" | "tally" | "entity" | "buyer" | "subaward" | "vehicle" | "forecast">,
): PublicDescriptor | null {
  if (typeof ref !== "string") return null;
  // Everything after `#` is the highlight — the only part that varies per claim.
  const [head, hl] = ref.split("#");
  const pinned = hl ? hl.split(",").filter(Boolean) : [];
  const [kind] = head.split(":");

  if (kind === "award") {
    return provenance?.award ? awardEntry(provenance.award, pinned) : null;
  }
  if (kind === "entity") {
    return provenance?.entity ? entityEntry(provenance.entity, pinned) : null;
  }
  if (kind === "buyer") {
    return provenance?.buyer ? buyerEntry(provenance.buyer, pinned) : null;
  }
  if (kind === "subaward") {
    return provenance?.subaward ? subawardEntry(provenance.subaward, pinned) : null;
  }
  if (kind === "vehicle") {
    return provenance?.vehicle ? vehicleEntry(provenance.vehicle, pinned) : null;
  }
  if (kind === "forecast") {
    return provenance?.forecast ? forecastEntry(provenance.forecast, pinned) : null;
  }
  if (kind === "tally") {
    const t = provenance?.tally;
    if (!t || typeof t !== "object") return null;
    // A tally with no usable figure is not a degraded tally — the figure IS the
    // claim, so there is nothing to show and the caller falls through to the
    // explained gap. NaN passes `typeof === "number"`, which is exactly how
    // "$NaN" reached the sheet.
    const n = num(t.figure);
    if (n === null) return null;
    if (t.kind === "field-size") return fieldSizeTally(t, `${count(t.figure) ?? n}`);
    if (t.kind === "market-winners") return marketWinnersTally(t, `${count(t.figure) ?? n}`);
    if (t.kind === "sub-use") return subUseTally(t, `${count(t.figure) ?? n}`);
    return comparableAwardsTally(t, usd(n));
  }
  // A bare contract number, which is how `fpds` pins were written before this
  // geometry existed. Treat it as an award ref rather than breaking.
  return provenance?.award ? awardEntry(provenance.award, pinned) : null;
}
