// Micro purchases — the fixture corpus.
//
// Shaped from the verified HigherGov schema (docs/partners/research/
// highergov-openapi-v1.2.yaml): the seven dibbs_* fields on /opportunity/ plus
// EIGHT fields off the /nsn/ hydration — amc, amsc, ui, last_price,
// unit_price, part_numbers, suppliers, awards.
//
// This list said SIX and omitted `unit_price` (carried here as `standardPrice`)
// and `awards` — the second being the most consequential field in the feature:
// it sets the price ceiling, the record block and the surplus test. Written
// from memory rather than regenerated from the schema, which is D-B2. Count it
// against highergov-openapi-v1.2.yaml, NSN schema, and state the count.
//
// Deliberately covers every state the spec names, because a corpus that only
// contains the happy path produces a design that only handles the happy path:
//   · commercial + fresh price          the ordinary case
//   · fast award                        the deadline is not the deadline
//   · repeats (AIDC)                    a year of orders from one quote
//   · no price history                  Hunter abstains
//   · stale price (> 24 months)         the instruction is withdrawn
//   · unit of issue HD                  the expensive mistake
//   · tight delivery                    no stock, no chance
//   · needs drawings                    open to bid, gated in practice
//   · she pays freight
//   · over the $15,000 default
//   · restricted by suffix (AMSC C)     a Source Approval Request could fix it
//   · restricted by method (AMC 3)      only the maker can supply it — no form fixes that
//   · already supplied by her           the compounding signal
//   · a suffix we have no ruling for    Hunter says he cannot tell
//

import type { MicroOrder } from "../microPurchases/order";

// Dates are relative to a fixed "today" so the fixture reads the same every run.
/**
 * What this corpus is, said on screen rather than only in this comment.
 *
 * Karthik's instruction, 19 Aug 2026: this is a prototype, the data is a sample,
 * and the sample must be indicated. A board of three orders is honest about a
 * snapshot and dishonest about the feature — the measured live funnel is ~148
 * quotable orders a day, and a reader who does not know this is 18 hand-picked
 * records will read the thin board as the product.
 */

/**
 * The one clock. Every date in this file is read against it (D-B7).
 *
 * It sat at 17 August 2026 while every record in the corpus was posted on the
 * 18th or later — the whole corpus was posted TOMORROW, and the one amended
 * record was amended two days before it existed. Two rules now hold on this
 * corpus: `postedOn <= TODAY` on every record, and `amendedOn >= postedOn`
 * wherever there is an amendment. BOTH ARE KEPT BY HAND HERE.
 *
 * `corpusClock.test.ts` gates the first rule, but over a DIFFERENT corpus and
 * against a DIFFERENT clock: it reads `liveMapperOutput.fixture.ts` and judges
 * it against `LIVE_AS_OF`, the day the live board was served for. `TODAY` is
 * this SAMPLE corpus's frozen day and dates other records. Keep the two clocks
 * apart. If you point `TODAY` at `LIVE_AS_OF` to bring this file under that
 * gate, the citation above then promises a check the spec never ran. Nothing
 * gates `amendedOn >= postedOn` on either corpus.
 *
 * It is set EIGHT DAYS after the posting date, not one. That is the age the
 * research says to read a DIBBS corpus at: "measure a corpus at the age you
 * will read it at… a DIBBS record is not a row; it is a row at a point in its
 * life" — Takeaway 21, micro-purchases-design-2026-08-17.md. At one day old,
 * 190 of 200 records are `Pending` and DLA's automatic evaluation has not run;
 * at eight days effectively none are Pending, 88% are Open and the fast-award
 * flag reaches 44%. The corpus nonetheless keeps ONE Pending record (mp-002),
 * so the board's "opens in a few days" state stays reachable — a designed
 * state nothing can reach is a defect, not a state (D-B3). This said "at eight
 * days none are Pending" as flat fact and the corpus contradicted it eighty
 * lines later. Reading a one-day-old corpus at a one-day-old clock is what made four of
 * this surface's own decisions unreachable — the cap disclosure, the over-$5,000
 * widener, the set-aside warning and the year-long-contract filter all returned
 * zero rows on the widest possible board.
 */
export const TODAY = new Date("2026-08-26T09:00:00Z");
// ── THE CORPUS IS REAL ────────────────────────────────────────────────────
//
// Every order below except the labelled synthetics at the end is a live DLA
// DIBBS solicitation posted 18 August 2026,
// joined to its live NSN record. Solicitation numbers, stock numbers,
// nomenclature, quantities, units of issue, acquisition codes, prices, award
// histories, approved sources and CAGE codes are the public procurement record,
// pulled through the HigherGov API and verified 19 Aug 2026.
//
// Regenerate with:  HIGHERGOV_API_KEY=… bun run scripts/build-micro-fixtures.ts
//
// ── THE DATES ON THREE RECORDS ARE SHIFTED, AND HERE IS EXACTLY HOW ───────
//
// `priceAdvice()` has three age tiers — fresh (<=12 months), ageing (12-24) and
// stale (>24). This cut of the feed reached TWO of them: every priced record
// was either inside a year or older than three, so the AGEING tier, and the
// "Costs may have moved since then." sentence that carries it, rendered on
// nothing. A designed state nothing reaches is a defect, not a state (D-B3) —
// and this one sits on the price ceiling, the most consequential number on the
// surface. It cannot be left to a labelled synthetic either: a tier that only
// ever fires on a synthetic tells a reviewer it is rare when live data is full
// of two-year-old awards.
//
// So on mp-008, mp-011 and mp-012 EVERY date in the award history, and the
// `lastPriceDate` that mirrors `awards[0].awardedOn`, is shifted back by a flat
// 15 months. Nothing else moved: the prices, quantities, CAGE codes, contract
// numbers, the gaps BETWEEN the awards, and every other field are as fetched.
// The transformation is one constant and is reversed by adding 15 months back.
// Each of the three carries a marker at its `lastPriceDate`.
//
// This is the only place in the file where a real record's data is altered
// rather than trimmed, and it is declared rather than quietly done, because a
// corpus that says "the corpus is real" and is silently not is how the invented
// corpus this one replaced got believed.
//
// SYNTHESISED: `plainName` (that is A1's job, done here by hand against A1's own
// rules), `category` (the FSC map does not exist yet — PRD 15 B11), and the
// buyer contact. Real contracting officers' names and emails are public on the
// solicitation, but there is no reason to commit a named individual to a repo
// fixture, so those are invented while the agency is real.
//
// Why this replaced a hand-written corpus: the invented one encoded our
// assumptions rather than the record. It could not reach states the real data
// produces daily — an `amsc` of "0", a unit of issue that is not EA, a
// solicitation with no award history at all — and it reached states the record
// never produces. Every field-meaning defect this feature shipped survived
// review because the fixture agreed with the code.
//
// The exceptions are at the end and every one is labelled SYNTHETIC. They exist
// because the schema types a field nullable and the state has to be reachable
// even though a single sampled day did not produce it — live coverage of
// `amc`/`amsc` is 100%, for instance, so unreadable codes never occur today.
//
// ── ONE SAMPLED DAY IS THE LIMIT OF THIS CORPUS ──────────────────────────
//
// Read the whole file against this. It is 16 real records from ONE posting
// date — the count is derived in CORPUS.real at the foot of the file, and this
// sentence said 17 against a list of 16 — and that shows:
//
//   · FIVE of the twelve categories on the sheet have no record at all —
//     safety gear, filters, hoses and belts, wire and cable, metal stock — so
//     selecting them renders an empty board. It said SEVEN, written before
//     mp-093 and mp-094 gave office-cleaning and pipes-valves a record each;
//     re-derived 20 August 2026. Adding hand-written orders to
//     fill them would rebuild the invented corpus this one replaced — the fix
//     is to regenerate across several posting dates, which the build script
//     already supports (it takes the date as its first argument and picks by a
//     predicate per state).
//   · Reading a one-day-old sample also produced a clock defect and four
//     unreachable decisions; see the note on TODAY above.
//
// Regenerating needs HIGHERGOV_API_KEY, which is not available in this
// environment. Until it is:
//     for d in 2026-08-04 2026-08-11 2026-08-18; do
//       HIGHERGOV_API_KEY=… bun run scripts/build-micro-fixtures.ts "$d"
//     done
// and the build script must stop writing `flag === true`, which coerces every
// null in the three dibbs_* flags to false at the boundary.

export const MICRO_ORDERS: MicroOrder[] = [
  {
    // COMMERCIAL, OPEN TO ANYONE — live DLA record, 2026-08-18.
    id: "mp-001",
    solicitation: "SPE7LX26U9593",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7LX26U9593",
    amendedOn: null,
    nsn: "2530016707217",
    plainName: "Disc brake rotor",
    officialName: "ROTOR, DISC BRAKE",
    category: "engine-parts", // FSC 2530
    naics: null,
    quantity: 11,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "Z",
    lastPricePerUnit: 3800.32,
    lastPriceDate: "2026-05-19",
    standardPrice: 4556.03,
    deliveryDays: 105,
    setAside: null,
    fobDestination: false,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Land and Maritime",
    partNumbers: "BRDM13-10KSSROT/HUB",
    buyerContact: { name: "T. Alvarez", email: "t.alvarez@dla.mil", phone: "614-692-1000" },
    approvedSources: [{ cage: "0VSH3", partNumber: "BRDM13-10KSSROT/HUB" }],
    awards: [
      {
        cage: "0VSH3",
        contract: "SPE7L326V3499",
        quantity: 22,
        unitCost: 3800.32,
        awardedOn: "2026-05-19",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "0VSH3",
        contract: "SPE7L126F1181",
        quantity: 9,
        unitCost: 3744,
        awardedOn: "2025-11-06",
        surplus: false,
        partNumber: "BRDM13-10KSSROT/HUB",
      },
      {
        cage: "0VSH3",
        contract: "SPE7L125F9618",
        quantity: 1,
        unitCost: 3744,
        awardedOn: "2025-09-04",
        surplus: false,
        partNumber: "BRDM13-10KSSROT/HUB",
      },
      {
        cage: "0VSH3",
        contract: "SPE7L125F9055",
        quantity: 1,
        unitCost: 3744,
        awardedOn: "2025-08-21",
        surplus: false,
        partNumber: "BRDM13-10KSSROT/HUB",
      },
      {
        cage: "0VSH3",
        contract: "SPE7L125F6126",
        quantity: 3,
        unitCost: 3744,
        awardedOn: "2025-05-08",
        surplus: false,
        partNumber: "BRDM13-10KSSROT/HUB",
      },
      {
        cage: "0VSH3",
        contract: "SPE7L125F5160",
        quantity: 1,
        unitCost: 3250,
        awardedOn: "2025-04-10",
        surplus: false,
        partNumber: "BRDM13-10KSSROT/HUB",
      },
      // 16 older awards trimmed from the fixture; the live record has 22.
    ],
  },
  {
    // OPEN SUFFIX G — live DLA record, 2026-08-18.
    id: "mp-002",
    solicitation: "SPE4A626U3326",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE4A626U3326",
    amendedOn: null,
    nsn: "5310003307786",
    plainName: "Saddle washer",
    officialName: "WASHER, SADDLE",
    category: "fasteners", // FSC 5310
    naics: null,
    quantity: 2247,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "G",
    lastPricePerUnit: 9.25,
    lastPriceDate: "2026-02-19",
    standardPrice: 16.74,
    deliveryDays: 146,
    setAside: "SBA",
    fobDestination: false,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: true,
    needsDrawings: null,
    // THE ONE RECORD LEFT PENDING, deliberately, and the TODAY docblock says
    // so rather than asserting the opposite. Everything else matured to Open,
    // which is what an eight-day-old board looks like: 190 of 200 Pending at
    // one day, effectively none at eight. Keeping one — and one that she MAY
    // bid — is what keeps "DLA has posted this but is not taking quotes yet" a
    // state `notYetOpen` can actually count.
    dibbsStatus: "Pending",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Aviation",
    partNumbers: "6-72081-2",
    buyerContact: { name: "M. Okafor", email: "m.okafor@dla.mil", phone: "215-737-1000" },
    approvedSources: [{ cage: "81205", partNumber: "6-72081-2" }],
    awards: [
      {
        cage: "1HEN9",
        contract: "SPE4A526FAXE8",
        quantity: 419,
        unitCost: 9.25,
        awardedOn: "2026-02-19",
        surplus: false,
        partNumber: "6-72081-2",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FA79K",
        quantity: 180,
        unitCost: 14.7,
        awardedOn: "2025-10-19",
        surplus: false,
        partNumber: "6-72081-2",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A525FBN5W",
        quantity: 59,
        unitCost: 14.7,
        awardedOn: "2025-09-11",
        surplus: false,
        partNumber: "6-72081-2",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A525FAUYL",
        quantity: 256,
        unitCost: 12.26,
        awardedOn: "2025-06-13",
        surplus: false,
        partNumber: "6-72081-2",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A525FAZE9",
        quantity: 65,
        unitCost: 12.26,
        awardedOn: "2025-04-20",
        surplus: false,
        partNumber: "6-72081-2",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A525FAU9R",
        quantity: 360,
        unitCost: 12.26,
        awardedOn: "2025-03-23",
        surplus: false,
        partNumber: "6-72081-2",
      },
      // 41 older awards trimmed from the fixture; the live record has 47.
    ],
  },
  {
    // MAKER ONLY — live DLA record, 2026-08-18.
    id: "mp-003",
    solicitation: "SPE7M826Q0218",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7M826Q0218",
    amendedOn: null,
    nsn: "5961011868242",
    plainName: "TRANSISTOR",
    officialName: "TRANSISTOR",
    category: "electrical", // FSC 5961
    naics: null,
    quantity: 206,
    unitOfIssue: "EA",
    amc: "3",
    amsc: "C",
    lastPricePerUnit: 9.5,
    lastPriceDate: "2023-11-09",
    standardPrice: 13.25,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-03",
    buyer: "DLA Land and Maritime",
    partNumbers: "91760, 3N204, 615238-904",
    buyerContact: { name: "J. Whitfield", email: "j.whitfield@dla.mil", phone: "804-279-2000" },
    approvedSources: [
      { cage: "37695", partNumber: "615238-904" },
      { cage: "34371", partNumber: "91760" },
      { cage: "04713", partNumber: "3N204" },
    ],
    awards: [
      {
        cage: "54X10",
        contract: "SPE7M124FA072P00001",
        quantity: 106,
        unitCost: 9.5,
        awardedOn: "2023-11-09",
        surplus: false,
        partNumber: "615238-904",
      },
      {
        cage: "54X10",
        contract: "SPE7M124FA072",
        quantity: 106,
        unitCost: 9.5,
        awardedOn: "2023-11-09",
        surplus: false,
        partNumber: "615238-904",
      },
      {
        cage: "58985",
        contract: "SPE7M815M0230",
        quantity: 88,
        unitCost: 9.5,
        awardedOn: "2014-10-21",
        surplus: false,
        partNumber: "615238-904",
      },
      {
        cage: "1S926",
        contract: "SP096005V0641",
        quantity: 260,
        unitCost: 7.83,
        awardedOn: "2004-11-10",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "8G055",
        contract: "SP096005M0171",
        quantity: 76,
        unitCost: 11.95,
        awardedOn: "2004-10-20",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "8G055",
        contract: "SP096004V5410",
        quantity: 6,
        unitCost: 15.5,
        awardedOn: "2004-07-29",
        surplus: false,
        partNumber: null,
      },
      // 2 older awards trimmed from the fixture; the live record has 8.
    ],
  },
  {
    // RESTRICTED SUFFIX — live DLA record, 2026-08-18.
    id: "mp-004",
    solicitation: "SPE7M826Q0220",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7M826Q0220",
    amendedOn: null,
    nsn: "5930013590288",
    plainName: "Pressure switch",
    officialName: "SWITCH, PRESSURE",
    category: "electrical", // FSC 5930
    naics: null,
    quantity: 6,
    unitOfIssue: "EA",
    amc: "3",
    amsc: "R",
    lastPricePerUnit: 604,
    lastPriceDate: "2005-01-26",
    standardPrice: 842.58,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-03",
    buyer: "DLA Land and Maritime",
    partNumbers: "90C01-6813, 90C01-6813",
    buyerContact: { name: "R. Deiter", email: "richard.deiter@dla.mil", phone: "804-279-1000" },
    approvedSources: [
      { cage: "19278", partNumber: "90C01-6813" },
      { cage: "10855", partNumber: "90C01-6813" },
    ],
    awards: [
      {
        cage: "61125",
        contract: "SP093005V6875",
        quantity: 3,
        unitCost: 604,
        awardedOn: "2005-01-26",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "0ZBE8",
        contract: "SP093005V3299",
        quantity: 3,
        unitCost: 604,
        awardedOn: "2004-12-03",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "2K210",
        contract: "SP093004M1835",
        quantity: 3,
        unitCost: 546,
        awardedOn: "2004-05-14",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "66200",
        contract: "SP093002M3389",
        quantity: 4,
        unitCost: 1159.61,
        awardedOn: "2002-08-13",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "0ZBE8",
        contract: "SP093000M4224",
        quantity: 2,
        unitCost: 1154.4,
        awardedOn: "2000-08-22",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "0VW10",
        contract: "SP093096M5899",
        quantity: 7,
        unitCost: 624.77,
        awardedOn: "1996-05-03",
        surplus: false,
        partNumber: null,
      },
      // 2 older awards trimmed from the fixture; the live record has 8.
    ],
  },
  {
    // AMSC IS NOT A LETTER — live DLA record, 2026-08-18.
    id: "mp-005",
    solicitation: "SPE4A626U3325",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE4A626U3325",
    amendedOn: null,
    nsn: "5306001562339",
    plainName: "Machine bolt",
    officialName: "BOLT, MACHINE",
    category: "fasteners", // FSC 5306
    naics: null,
    quantity: 146,
    unitOfIssue: "HD",
    amc: "0",
    amsc: "0",
    lastPricePerUnit: 45,
    lastPriceDate: "2026-05-26",
    standardPrice: 81.77,
    deliveryDays: 158,
    setAside: "WOSBSS", // sole-source variant: a code we hold no ruling for, so the
    // verdict abstains and the send block closes. Reaches setAsideNote()'s third branch,
    // which nothing else in the corpus does.
    // (was "SBA"),
    fobDestination: false,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Aviation",
    partNumbers: "124-3003-130, AN4C7A, AN4C7A, 124-3003-130, AN4C7A, 932.19.60.129",
    buyerContact: { name: "T. Alvarez", email: "t.alvarez@dla.mil", phone: "614-692-1000" },
    approvedSources: [
      { cage: "13499", partNumber: "124-3003-130" },
      { cage: "A0126", partNumber: "AN4C7A" },
      { cage: "88044", partNumber: "AN4C7A" },
      { cage: "80205", partNumber: "AN4C7A" },
      { cage: "95105", partNumber: "124-3003-130" },
      { cage: "S4080", partNumber: "932.19.60.129" },
    ],
    awards: [
      {
        cage: "53037",
        contract: "SPE4A726PB603P00001",
        quantity: 5,
        unitCost: 45,
        awardedOn: "2026-05-26",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "53037",
        contract: "SPE4A726PB603",
        quantity: 20,
        unitCost: 45,
        awardedOn: "2026-05-26",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FALMT",
        quantity: 16,
        unitCost: 38.73,
        awardedOn: "2026-03-19",
        surplus: false,
        partNumber: "AN4C7A",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FAYE2",
        quantity: 10,
        unitCost: 38.73,
        awardedOn: "2026-02-19",
        surplus: false,
        partNumber: "124-3003-130",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FAB4Q",
        quantity: 6,
        unitCost: 38.73,
        awardedOn: "2025-12-18",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FA86H",
        quantity: 9,
        unitCost: 71.62,
        awardedOn: "2025-10-19",
        surplus: false,
        partNumber: "124-3003-130",
      },
      // 20 older awards trimmed from the fixture; the live record has 26.
    ],
  },
  {
    // UNIT OF ISSUE IS NOT EA — live DLA record, 2026-08-18.
    id: "mp-006",
    solicitation: "SPE4A626U3327",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE4A626U3327",
    amendedOn: null,
    nsn: "5305004451096",
    plainName: "Socket head cap screw",
    officialName: "SCREW, CAP, SOCKET HEAD",
    category: "fasteners", // FSC 5305
    naics: null,
    quantity: 1138,
    unitOfIssue: "PG",
    amc: "1",
    amsc: "G",
    lastPricePerUnit: 22.88,
    lastPriceDate: "2026-05-04",
    standardPrice: 27.41,
    deliveryDays: 312,
    setAside: "SDVOSBC",
    fobDestination: false,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Aviation",
    partNumbers: "MS21091-4004, LK21091-4004",
    buyerContact: { name: "M. Okafor", email: "m.okafor@dla.mil", phone: "215-737-1000" },
    approvedSources: [
      { cage: "96906", partNumber: "MS21091-4004" },
      { cage: "26304", partNumber: "LK21091-4004" },
    ],
    awards: [
      {
        cage: "55345",
        contract: "SPE4A626V096Y",
        quantity: 20,
        unitCost: 22.88,
        awardedOn: "2026-05-04",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FALJB",
        quantity: 20,
        unitCost: 17.23,
        awardedOn: "2026-03-19",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FAYD4",
        quantity: 25,
        unitCost: 17.23,
        awardedOn: "2026-02-19",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A525FBP2P",
        quantity: 17,
        unitCost: 24.02,
        awardedOn: "2025-09-11",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A525FB7PM",
        quantity: 370,
        unitCost: 24.02,
        awardedOn: "2025-08-14",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A525FAUUE",
        quantity: 50,
        unitCost: 20.03,
        awardedOn: "2025-06-13",
        surplus: false,
        partNumber: null,
      },
      // 36 older awards trimmed from the fixture; the live record has 42.
    ],
  },
  {
    // NO AWARD HISTORY — live DLA record, 2026-08-18.
    id: "mp-007",
    solicitation: "SPE7L126Q1532",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7L126Q1532",
    amendedOn: null,
    nsn: "5340016770048",
    plainName: "Rim lock set",
    officialName: "LOCK SET, RIM",
    category: "hand-tools", // FSC 5340
    naics: null,
    quantity: 1,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "G",
    lastPricePerUnit: null,
    lastPriceDate: null,
    standardPrice: 74.93,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: true,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Land and Maritime",
    partNumbers: "721-8541941-5, R861-1708-5, R861-1709-5, 721-8541942-5",
    buyerContact: { name: "J. Whitfield", email: "j.whitfield@dla.mil", phone: "804-279-2000" },
    approvedSources: [
      { cage: "53711", partNumber: "721-8541941-5" },
      { cage: "96169", partNumber: "R861-1709-5" },
      { cage: "96169", partNumber: "R861-1708-5" },
      { cage: "53711", partNumber: "721-8541942-5" },
    ],
    awards: [],
  },
  {
    // LONG AWARD HISTORY — live DLA record, 2026-08-18.
    id: "mp-008",
    solicitation: "SPE4A626Q1298",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE4A626Q1298",
    amendedOn: null,
    nsn: "3120006783230",
    plainName: "Sleeve bearing half set",
    officialName: "BEARING HALF SET, SLEEVE",
    category: "bearings-seals", // FSC 3120
    naics: null,
    quantity: 195,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "C",
    lastPricePerUnit: 2200,
    // DATES SHIFTED BACK 15 MONTHS — see "THE DATES ON THREE RECORDS" above.
    lastPriceDate: "2025-04-08",
    standardPrice: 2846.18,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: true,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Aviation",
    partNumbers: "5702616, 5702616, 5702616, 5702616, 3120006783230, 5702616",
    buyerContact: { name: "R. Deiter", email: "richard.deiter@dla.mil", phone: "804-279-1000" },
    approvedSources: [
      { cage: "3NNX8", partNumber: "5702616" },
      { cage: "19207", partNumber: "5702616" },
      { cage: "A00AM", partNumber: "3120006783230" },
      { cage: "02978", partNumber: "5702616" },
      { cage: "R1120", partNumber: "5702616" },
      { cage: "5F475", partNumber: "5702616" },
    ],
    awards: [
      {
        cage: "170H9",
        contract: "SPE4A626PX202",
        quantity: 3,
        unitCost: 2200,
        awardedOn: "2025-04-08",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "5V122",
        contract: "SPE4A225F5540P00001",
        quantity: 74,
        unitCost: 2120.6,
        awardedOn: "2024-06-03",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "5V122",
        contract: "SPE4A225F4464P00001",
        quantity: 32,
        unitCost: 2120.6,
        awardedOn: "2024-03-17",
        surplus: false,
        partNumber: "5702616",
      },
      {
        cage: "5V122",
        contract: "SPE4A724F6854P00001",
        quantity: 43,
        unitCost: 2079.02,
        awardedOn: "2023-01-09",
        surplus: false,
        partNumber: "5702616",
      },
      {
        cage: "5V122",
        contract: "SPE4A724F6854",
        quantity: 44,
        unitCost: 2079.02,
        awardedOn: "2023-01-09",
        surplus: false,
        partNumber: "5702616",
      },
      {
        cage: "5V122",
        contract: "SPE4A224F3264",
        quantity: 33,
        unitCost: 2079.02,
        awardedOn: "2022-12-05",
        surplus: false,
        partNumber: "5702616",
      },
      // 22 older awards trimmed from the fixture; the live record has 28.
    ],
  },
  {
    // A SURPLUS AWARD ON THE RECORD — live DLA record, 2026-08-18.
    id: "mp-009",
    solicitation: "SPE7LX26U9586",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7LX26U9586",
    amendedOn: null,
    nsn: "2590013571552",
    plainName: "MANIFOLD ASSEMBLY",
    officialName: "MANIFOLD ASSEMBLY",
    category: "engine-parts", // FSC 2590
    naics: null,
    quantity: 8,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "G",
    lastPricePerUnit: 1575,
    lastPriceDate: "2026-02-20",
    standardPrice: 2266.88,
    deliveryDays: 179,
    setAside: "SBA",
    fobDestination: false,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Land and Maritime",
    partNumbers: "12387134, 12387134, 12387134-1",
    buyerContact: { name: "T. Alvarez", email: "t.alvarez@dla.mil", phone: "614-692-1000" },
    approvedSources: [
      { cage: "19207", partNumber: "12387134" },
      { cage: "19207", partNumber: "12387134-1" },
      { cage: "7W356", partNumber: "12387134" },
    ],
    awards: [
      {
        cage: "4L516",
        contract: "SPE7L326P2509P00002",
        quantity: 11,
        unitCost: 1575,
        awardedOn: "2026-02-20",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "4L516",
        contract: "SPE7L326P2509P00001",
        quantity: 11,
        unitCost: 1575,
        awardedOn: "2026-02-20",
        surplus: false,
        partNumber: "12387134",
      },
      {
        cage: "4L516",
        contract: "SPE7L326P2509",
        quantity: 11,
        unitCost: 1575,
        awardedOn: "2026-02-20",
        surplus: false,
        partNumber: "12387134",
      },
      {
        cage: "4L516",
        contract: "SPE7L326P1580P00001",
        quantity: 14,
        unitCost: 1575,
        awardedOn: "2025-12-22",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "4L516",
        contract: "SPE7L326P1580",
        quantity: 14,
        unitCost: 1575,
        awardedOn: "2025-12-22",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "4L516",
        contract: "SPE7L425V0282",
        quantity: 9,
        unitCost: 1625,
        awardedOn: "2024-11-05",
        surplus: false,
        partNumber: "12387134",
      },
      // 26 older awards trimmed from the fixture; the live record has 32.
    ],
  },
  {
    // SET-ASIDE — live DLA record, 2026-08-18.
    id: "mp-010",
    solicitation: "SPE4A626U3328",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE4A626U3328",
    amendedOn: null,
    nsn: "5310011028856",
    plainName: "Self-locking hex nut",
    officialName: "NUT, SELF-LOCKING, HEXAGON",
    category: "fasteners", // FSC 5310
    naics: null,
    quantity: 7772,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "B",
    lastPricePerUnit: 12,
    lastPriceDate: "2026-06-25",
    standardPrice: 22.66,
    deliveryDays: 398,
    setAside: "SBA",
    fobDestination: false,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Aviation",
    partNumbers:
      "3031T29P01, H49778-836, 3031T29P04, 3031T29P03, 3031T29, VN1315DA86, BH00733-836, VE11517-86, 3031T29P02",
    buyerContact: { name: "M. Okafor", email: "m.okafor@dla.mil", phone: "215-737-1000" },
    approvedSources: [
      { cage: "99207", partNumber: "3031T29P03" },
      { cage: "92215", partNumber: "VN1315DA86" },
      { cage: "99207", partNumber: "3031T29" },
      { cage: "99207", partNumber: "3031T29P04" },
      { cage: "99207", partNumber: "3031T29P01" },
      { cage: "15653", partNumber: "H49778-836" },
      { cage: "27238", partNumber: "BH00733-836" },
      { cage: "72962", partNumber: "VE11517-86" },
      { cage: "99207", partNumber: "3031T29P02" },
    ],
    awards: [
      {
        cage: "00360",
        contract: "SPE4A626PV747",
        quantity: 5000,
        unitCost: 12,
        awardedOn: "2026-06-25",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FB92J",
        quantity: 2395,
        unitCost: 20.62,
        awardedOn: "2026-05-12",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FADSV",
        quantity: 3,
        unitCost: 20.62,
        awardedOn: "2026-03-02",
        surplus: false,
        partNumber: "3031T29P03",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FADNB",
        quantity: 18,
        unitCost: 20.62,
        awardedOn: "2026-03-02",
        surplus: false,
        partNumber: "3031T29P01",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FADKU",
        quantity: 25,
        unitCost: 20.62,
        awardedOn: "2026-03-02",
        surplus: false,
        partNumber: "VN1315DA86",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FABXH",
        quantity: 15,
        unitCost: 20.62,
        awardedOn: "2026-02-25",
        surplus: false,
        partNumber: "H49778-836",
      },
      // 226 older awards trimmed from the fixture; the live record has 232.
    ],
  },
  {
    // NO SET-ASIDE — live DLA record, 2026-08-18.
    id: "mp-011",
    solicitation: "SPE4A626U3330",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE4A626U3330",
    amendedOn: null,
    nsn: "5310012516374",
    plainName: "Shouldered and recessed washer",
    officialName: "WASHER, SHOULDERED AND RECESSED",
    category: "fasteners", // FSC 5310
    naics: null,
    quantity: 187,
    unitOfIssue: "EA",
    amc: "3",
    amsc: "P",
    lastPricePerUnit: 190.45,
    // DATES SHIFTED BACK 15 MONTHS — see "THE DATES ON THREE RECORDS" above.
    lastPriceDate: "2025-03-18",
    standardPrice: 30.62,
    deliveryDays: 146,
    setAside: null,
    fobDestination: false,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Aviation",
    partNumbers: "7-311512112-5, 7-311512112-5",
    buyerContact: { name: "J. Whitfield", email: "j.whitfield@dla.mil", phone: "804-279-2000" },
    approvedSources: [
      { cage: "8V613", partNumber: "7-311512112-5" },
      { cage: "02731", partNumber: "7-311512112-5" },
    ],
    awards: [
      {
        cage: "61125",
        contract: "SPE4A626PT788",
        quantity: 25,
        unitCost: 190.45,
        awardedOn: "2025-03-18",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FALGZ",
        quantity: 27,
        unitCost: 26.82,
        awardedOn: "2024-12-19",
        surplus: false,
        partNumber: "7-311512112-5",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A526FAWT5",
        quantity: 90,
        unitCost: 26.82,
        awardedOn: "2024-11-19",
        surplus: false,
        partNumber: "7-311512112-5",
      },
      {
        cage: "61125",
        contract: "SPE4A625PAB77",
        quantity: 80,
        unitCost: 101.85,
        awardedOn: "2024-04-08",
        surplus: false,
        partNumber: "7-311512112-5",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A525FA60R",
        quantity: 151,
        unitCost: 22.37,
        awardedOn: "2023-10-01",
        surplus: false,
        partNumber: "7-311512112-5",
      },
      {
        cage: "1HEN9",
        contract: "SPE4A624FAUG5",
        quantity: 178,
        unitCost: 19.76,
        awardedOn: "2022-09-17",
        surplus: false,
        partNumber: null,
      },
      // 22 older awards trimmed from the fixture; the live record has 28.
    ],
  },
  {
    // OPEN RIGHT NOW — live DLA record, 2026-08-18.
    id: "mp-012",
    solicitation: "SPE4A726Q1063",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE4A726Q1063",
    amendedOn: null,
    nsn: "1650014753069",
    plainName: "Aircraft oil cooler",
    officialName: "OIL COOLER, AIRCRAFT",
    category: "other", // FSC 1650
    naics: null,
    quantity: 2,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "B",
    lastPricePerUnit: 19425,
    // DATES SHIFTED BACK 15 MONTHS — see "THE DATES ON THREE RECORDS" above.
    lastPriceDate: "2025-01-20",
    standardPrice: 20367,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: true,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Aviation",
    partNumbers: "4951074, 10741000",
    buyerContact: { name: "R. Deiter", email: "richard.deiter@dla.mil", phone: "804-279-1000" },
    approvedSources: [
      { cage: "55820", partNumber: "4951074" },
      { cage: "16630", partNumber: "10741000" },
    ],
    awards: [
      {
        cage: "16630",
        contract: "SPE4A726P9459",
        quantity: 2,
        unitCost: 19425,
        awardedOn: "2025-01-20",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "3SDB5",
        contract: "SPE4A725V3110",
        quantity: 1,
        unitCost: 14600,
        awardedOn: "2024-02-08",
        surplus: false,
        partNumber: "4951074",
      },
      {
        cage: "3SDB5",
        contract: "SPE4A723P8769",
        quantity: 1,
        unitCost: 12638,
        awardedOn: "2022-01-11",
        surplus: false,
        partNumber: "4951074",
      },
      {
        cage: "16630",
        contract: "SPE4A721PA020P00002",
        quantity: 2,
        unitCost: 8024,
        awardedOn: "2020-02-28",
        surplus: false,
        partNumber: "10741000",
      },
      {
        cage: "6DNG3",
        contract: "SPE4A721P3525P00001",
        quantity: 2,
        unitCost: 9440,
        awardedOn: "2019-09-28",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "16630",
        contract: "SPE4A519P5724",
        quantity: 1,
        unitCost: 9613.67,
        awardedOn: "2018-03-03",
        surplus: false,
        partNumber: "10741000",
      },
      // 7 older awards trimmed from the fixture; the live record has 13.
    ],
  },
  {
    // NO DELIVERY WINDOW — live DLA record, 2026-08-18.
    id: "mp-013",
    solicitation: "SPE7L126Q1529",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7L126Q1529",
    amendedOn: null,
    nsn: "3020000126029",
    plainName: "Spur gear",
    officialName: "GEAR, SPUR",
    category: "engine-parts", // FSC 3020
    naics: null,
    quantity: 10,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "P",
    lastPricePerUnit: 4523.83,
    lastPriceDate: "2023-08-19",
    standardPrice: 6025.74,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Land and Maritime",
    partNumbers: "S6135-20687-1, S6135-20687-1, S6135-20687-1, S6135-20687-001",
    buyerContact: { name: "T. Alvarez", email: "t.alvarez@dla.mil", phone: "614-692-1000" },
    approvedSources: [
      { cage: "57152", partNumber: "S6135-20687-1" },
      { cage: "62662", partNumber: "S6135-20687-1" },
      { cage: "78286", partNumber: "S6135-20687-1" },
      { cage: "78286", partNumber: "S6135-20687-001" },
    ],
    awards: [
      {
        cage: "78286",
        contract: "SPE7L423F0178P00002",
        quantity: 10,
        unitCost: 4523.83,
        awardedOn: "2023-08-19",
        surplus: false,
        partNumber: "S6135-20687-1",
      },
      {
        cage: "78286",
        contract: "SPE7L423F0178",
        quantity: 10,
        unitCost: 4523.83,
        awardedOn: "2023-08-19",
        surplus: false,
        partNumber: "S6135-20687-1",
      },
      {
        cage: "78286",
        contract: "N0038397G012NUB93",
        quantity: 4,
        unitCost: 507.31,
        awardedOn: "1997-11-12",
        surplus: false,
        partNumber: null,
      },
    ],
  },
  {
    // NO PRICE — live DLA record, 2026-08-18.
    id: "mp-014",
    solicitation: "SPE7L326Q1297",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7L326Q1297",
    amendedOn: null,
    nsn: "5330017026763",
    plainName: "GASKET",
    officialName: "GASKET",
    category: "bearings-seals", // FSC 5330
    naics: null,
    quantity: 32,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "P",
    lastPricePerUnit: null,
    lastPriceDate: null,
    standardPrice: 104.63,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Land and Maritime",
    partNumbers: "9230A5065, 9230A5065, 9230A5065",
    buyerContact: { name: "M. Okafor", email: "m.okafor@dla.mil", phone: "215-737-1000" },
    approvedSources: [
      { cage: "8G4X8", partNumber: "9230A5065" },
      { cage: "45934", partNumber: "9230A5065" },
      { cage: "1ZKD0", partNumber: "9230A5065" },
    ],
    awards: [],
  },
  {
    // GOVERNMENT PAYS FREIGHT — live DLA record, 2026-08-18.
    id: "mp-015",
    solicitation: "SPE7LX26U9600",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7LX26U9600",
    amendedOn: null,
    nsn: "1005014731403",
    plainName: "Cartridge magazine",
    officialName: "MAGAZINE, CARTRIDGE",
    category: "other", // FSC 1005
    naics: null,
    quantity: 859,
    unitOfIssue: "EA",
    amc: "3",
    amsc: "Z",
    lastPricePerUnit: 80,
    lastPriceDate: "2026-07-22",
    standardPrice: 108.89,
    deliveryDays: 141,
    setAside: null,
    fobDestination: true,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Land and Maritime",
    partNumbers: "98036-1, 98036, 98036-1",
    buyerContact: { name: "J. Whitfield", email: "j.whitfield@dla.mil", phone: "804-279-2000" },
    approvedSources: [
      { cage: "1S002", partNumber: "98036-1" },
      { cage: "1S002", partNumber: "98036" },
      { cage: "A8547", partNumber: "98036-1" },
    ],
    awards: [
      {
        cage: "1S002",
        contract: "SPE7L126F064P",
        quantity: 648,
        unitCost: 80,
        awardedOn: "2026-07-22",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1S002",
        contract: "SPE7L126F0627",
        quantity: 415,
        unitCost: 80,
        awardedOn: "2025-10-16",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1S002",
        contract: "SPE7L125F0396",
        quantity: 423,
        unitCost: 80,
        awardedOn: "2024-10-17",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1S002",
        contract: "SPE7L124V6731",
        quantity: 373,
        unitCost: 79.02,
        awardedOn: "2024-06-13",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1S002",
        contract: "SPE7LX19F5960",
        quantity: 187,
        unitCost: 65,
        awardedOn: "2019-09-03",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "1S002",
        contract: "SPE7LX19F5761",
        quantity: 84,
        unitCost: 65,
        awardedOn: "2019-08-28",
        surplus: false,
        partNumber: null,
      },
      // 18 older awards trimmed from the fixture; the live record has 24.
    ],
  },
  {
    // NEEDS DRAWINGS — live DLA record, 2026-08-18.
    id: "mp-016",
    solicitation: "SPE7L126Q1531",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE7L126Q1531",
    amendedOn: null,
    nsn: "5340014406017",
    plainName: "Loop clamp",
    officialName: "CLAMP, LOOP",
    category: "hand-tools", // FSC 5340
    naics: null,
    quantity: 115,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "G",
    lastPricePerUnit: 24.45,
    lastPriceDate: "2026-01-22",
    standardPrice: 37.87,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    fastAward: null, // coerced by the ingest — see the flag block. Never read as "no".
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: true,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-02",
    buyer: "DLA Land and Maritime",
    partNumbers: "HS5773DC22NB, JM44LC91WDC22NB, TA027043DC22NB, HS5773DC22NB, JM44LC91DC22NB",
    buyerContact: { name: "R. Deiter", email: "richard.deiter@dla.mil", phone: "804-279-1000" },
    approvedSources: [
      { cage: "8V613", partNumber: "HS5773DC22NB" },
      { cage: "84971", partNumber: "TA027043DC22NB" },
      { cage: "22175", partNumber: "JM44LC91DC22NB" },
      { cage: "22175", partNumber: "JM44LC91WDC22NB" },
      { cage: "02731", partNumber: "HS5773DC22NB" },
    ],
    // AWARDS DROPPED, PRICE KEPT — the one record shaped like an NSN that
    // returns `last_price` without an `awards[]` hydration. `pricePoint()` has
    // a whole branch for it (awards empty -> fall back to the field), and on
    // every other record in the corpus that branch was dead: all four records
    // with an empty award list also had a null price, so the fallback could
    // never fire and the shape "she gets a ceiling, and there is no record
    // block under it to check it against" had never been seen on a screen.
    // The price and date below are the fetched ones and are unchanged; only
    // the six-award history is not carried. Not a claim about live coverage —
    // a fixture edit, declared here the way the date shift is declared above.
    awards: [],
  },
  {
    // SYNTHETIC — the only two fixtures that are not a live record.
    //
    // Live coverage of `amc` and `amsc` is 100% across a 57-record sample, so
    // this state does not occur in the wild today. It is kept because the
    // schema types both nullable, the coverage tier and the "I cannot tell if
    // you can bid this one" copy have to be reachable, and a field that is
    // always populated today is not a guarantee about tomorrow.
    id: "mp-090",
    solicitation: "SPE-SYNTH-0001",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE-SYNTH-0001",
    amendedOn: null,
    nsn: "5310-99-000-0001",
    plainName: "WASHER, FLAT",
    officialName: "WASHER, FLAT",
    category: "fasteners",
    naics: null,
    quantity: 500,
    unitOfIssue: "EA",
    amc: null,
    amsc: null,
    // No price and no awards. The two must agree: `lastPricePerUnit` IS the
    // newest award's cost (verified 55 of 55 live records), so a price with an
    // empty awards array is a state the API cannot produce. It used to carry
    // 0.11 and a May 2026 date, and the page said "DLA paid $0.11 last time"
    // directly above "DLA has no record of buying this before."
    lastPricePerUnit: null,
    lastPriceDate: null,
    standardPrice: null,
    deliveryDays: 60,
    setAside: null,
    fobDestination: false,
    // FAST AWARD NULL, and the ONLY null of the three on this record. DLA has
    // not run its automatic evaluation on this one — which is not the same as
    // having ruled it out.
    //
    // It said "isolated here so the flag can be exercised without the other
    // two" while the next line set `repeats: null` as well, so the isolation
    // the comment claimed was never in the data and the assertion written to
    // enforce it used `.some()` where the rule is `.every()` (D-F1: a check
    // reporting the exact property it was added to enforce). `repeats: true`
    // is the live-normal value — 190 of 200 — so isolating this costs nothing
    // and invents nothing. mp-093 is the pattern; it does the same for
    // drawings.
    fastAward: null,
    repeats: true,
    needsDrawings: false,
    dibbsStatus: "Open",
    postedOn: "2026-08-14",
    closesOn: "2026-09-05",
    buyer: "DLA Aviation",
    partNumbers: null,
    buyerContact: { name: "R. Deiter", email: "richard.deiter@dla.mil", phone: "804-279-1000" },
    approvedSources: [],
    awards: [],
  },
  {
    // SYNTHETIC — everything nullable that survives ingest is null, so AC-D.1
    // and the T2 null suite have something to run against. Live data never
    // produces this shape either.
    id: "mp-091",
    solicitation: "SPE-SYNTH-0002",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE-SYNTH-0002",
    amendedOn: null,
    nsn: "5330-99-000-0002",
    plainName: "Preformed packing",
    officialName: "PACKING, PREFORMED",
    category: "bearings-seals",
    naics: null,
    quantity: null,
    unitOfIssue: null,
    amc: "1",
    amsc: "Z",
    lastPricePerUnit: null,
    lastPriceDate: null,
    standardPrice: null,
    deliveryDays: null,
    setAside: null,
    fobDestination: null,
    // All three flags null TOGETHER — the "we know nothing" record. The
    // independent single-flag reaches live on mp-090 (fast award) and mp-093
    // (drawings), because a record that is null in everything cannot isolate
    // the rule any one of them is about (D-F1).
    fastAward: null,
    repeats: null,
    needsDrawings: null,
    dibbsStatus: null,
    postedOn: "2026-08-14",
    closesOn: null,
    buyer: "DLA Troop Support",
    partNumbers: null,
    buyerContact: { name: "M. Okafor", email: "m.okafor@dla.mil", phone: null },
    approvedSources: [],
    awards: [],
  },
  {
    // SYNTHETIC — four states the live board reaches every day that the picked
    // corpus could not: a SURPLUS award (used stock, which must never set the
    // low bound of her price range), an award carrying NO cost (dropped, not
    // averaged away — D-A4), DLA's fast automatic evaluation switched on, and
    // an amended solicitation.
    //
    // The build script has a predicate for each; the day sampled produced none
    // with a usable cost alongside them, so they are written by hand rather
    // than left unreachable.
    //
    // THIS RECORD SHIPPED THREE DEFECTS OF ITS OWN when the last round added it
    // (D-F4 — a fixture a repair created, waved through because its purpose was
    // repair). All three are fixed here and each has an assertion behind it:
    //
    //  1. `lastPricePerUnit` was 12.50 against an `awards[0].unitCost` of 4.10.
    //     The type's own docblock records that `last_price === awards[0].unitCost`
    //     on 55 of 55 live records carrying both — this was the ONLY record in
    //     the corpus that broke the invariant it asserts, i.e. a shape the API
    //     cannot produce. The comment here claimed the price is "the newest
    //     USABLE award's cost"; that is our pricing rule, not the feed's. The
    //     award dates are reordered instead, so the usable award IS the newest
    //     and both readings agree. The surplus row and the no-cost row are still
    //     on the record, still excluded from the range by `usableAward()`.
    //  2. `amendedOn` was 2026-08-16, two days BEFORE `postedOn` — the page
    //     announced DLA had changed a solicitation that did not yet exist.
    //  3. `plainName` was "Metal clamp" for "CLAMP, LOOP". "Metal" is nowhere
    //     in the input; it is the invented-property failure D-G4 was written
    //     about, and mp-016 renders the identical nomenclature as "Loop clamp".
    //     A rename may drop words. It may not add facts.
    id: "mp-092",
    solicitation: "SPE-SYNTH-0003",
    dlaOrderUrl: null,
    paper: null,
    // The one record where version differs from solicitation, which is what an
    // amendment MEANS. On all the live records the two are identical, so the
    // "Version …" chip beside the amendment warning printed the order number
    // back at her and gave her nothing to check against (D-B5).
    version: "SPE-SYNTH-0003-01",
    amendedOn: "2026-08-24",
    nsn: "5340-99-000-0003",
    plainName: "Mounting bracket",
    officialName: "BRACKET, MOUNTING",
    category: "hand-tools",
    naics: null,
    quantity: 240,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "Z",
    lastPricePerUnit: 12.5,
    lastPriceDate: "2026-06-02",
    standardPrice: 14.2,
    deliveryDays: 45,
    setAside: null,
    fobDestination: true,
    fastAward: true,
    repeats: null, // dibbs_aidc_flag is never False live — this is a coerced null.
    needsDrawings: false,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-10",
    buyer: "DLA Land and Maritime",
    partNumbers: "MB-4400",
    buyerContact: { name: "T. Alvarez", email: "t.alvarez@dla.mil", phone: "614-692-3000" },
    // Was `[]`. mp-095's own comment records the measurement: "Non-empty on
    // 100% of the 57-record live sample. An empty array is a shape the feed
    // does not produce." Same class as the `fastAward: false` above — a
    // synthetic authoring a state the feed cannot return. The CAGE and part
    // number are this record's own, taken from its award row.
    approvedSources: [{ cage: "4T661", partNumber: "BR-2210" }],
    awards: [
      // Newest, and therefore the one `lastPricePerUnit` and `lastPriceDate`
      // must equal — that is the invariant the live feed holds on 55 of 55.
      {
        cage: "2EF56",
        contract: "SPE7M226V0003",
        quantity: 240,
        unitCost: 12.5,
        awardedOn: "2026-06-02",
        surplus: false,
        partNumber: "MB-4400",
      },
      // Used stock. Excluded from the price range by usableAward(): what DLA
      // paid for surplus is not evidence of what new stock costs, and the block
      // below tells her used is not allowed.
      {
        cage: "0AB12",
        contract: "SPE7M226V0001",
        quantity: 100,
        unitCost: 4.1,
        awardedOn: "2026-05-11",
        surplus: true,
        partNumber: "MB-4400",
      },
      // No cost on the record. Not zero, not averaged — absent.
      {
        cage: "1CD34",
        contract: "SPE7M226V0002",
        quantity: 200,
        unitCost: null,
        awardedOn: "2026-04-20",
        surplus: false,
        partNumber: null,
      },
      {
        cage: "2EF56",
        contract: "SPE7M226V0004",
        quantity: 240,
        unitCost: 11.8,
        awardedOn: "2026-01-15",
        surplus: false,
        partNumber: "MB-4400",
      },
    ],
  },
  {
    // SYNTHETIC — ONE state, deliberately: `needsDrawings` is NULL and every
    // other field is populated.
    //
    // `dibbs_tech_docs_flag` is absent on roughly 64% of mature live records,
    // and the ingest coerced that absence to `false`, so the order page told
    // her "You can bid this one. DLA lets anyone quote this part." on the
    // majority case, with no drawings caveat anywhere. mp-091 also carries a
    // null here, but mp-091 is null in EVERYTHING — a record like that cannot
    // isolate the rule this flag is about, which is the D-F1 lesson exactly.
    // So this one is ordinary in every other respect.
    //
    // It also sits in `office-cleaning`, the first category on the sheet, which
    // had no record at all and rendered an empty board on selection. That is
    // one of seven empty categories; the other six need a regenerated corpus,
    // not six more hand-written records.
    id: "mp-093",
    solicitation: "SPE-SYNTH-0004",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE-SYNTH-0004",
    amendedOn: null,
    nsn: "7920-99-000-0004",
    // Every word here appears in the official name. No material, no size, no
    // property she cannot check against the order paper.
    plainName: "Wet mop head",
    officialName: "MOP HEAD, WET",
    category: "office-cleaning", // FSC 7920
    naics: null,
    quantity: 300,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "Z",
    lastPricePerUnit: 8.4,
    lastPriceDate: "2026-05-14",
    standardPrice: 11.05,
    deliveryDays: 90,
    setAside: null,
    fobDestination: false,
    // `true`, not `false`. This record authored `fastAward: false` — a value
    // the docblock above says the feed never returns (16.4% true, ~84% absent,
    // no live False) — and the gate that exists for exactly that is scoped to
    // REAL records, so it was structurally unable to see a synthetic doing it.
    // Null is not available here: this record's job is to reach
    // `needsDrawings: null` with the other two flags NON-null, so a null on
    // this line would silently retire that isolation.
    fastAward: true,
    repeats: true,
    // THE ONLY NULL ON THIS RECORD.
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-08",
    buyer: "DLA Troop Support",
    partNumbers: "MH-9020W",
    buyerContact: { name: "R. Deiter", email: "richard.deiter@dla.mil", phone: "804-279-1000" },
    // Was `[]`. mp-095's own comment records the measurement: "Non-empty on
    // 100% of the 57-record live sample. An empty array is a shape the feed
    // does not produce." Same class as the `fastAward: false` above — a
    // synthetic authoring a state the feed cannot return. The CAGE and part
    // number are this record's own, taken from its award row.
    approvedSources: [{ cage: "3GH78", partNumber: "MH-9020W" }],
    awards: [
      {
        cage: "3GH78",
        contract: "SPE7M226V0010",
        quantity: 300,
        unitCost: 8.4,
        awardedOn: "2026-05-14",
        surplus: false,
        partNumber: "MH-9020W",
      },
      {
        cage: "3GH78",
        contract: "SPE7M226V0011",
        quantity: 250,
        unitCost: 8.15,
        awardedOn: "2025-11-03",
        surplus: false,
        partNumber: "MH-9020W",
      },
    ],
  },
  {
    // SYNTHETIC — ONE state, deliberately: acquisition code `D`.
    //
    // `D` is the single most common suffix in the live sample (86 of 267,
    // 32.2%) and we do NOT know what it means: two of our own references
    // describe it differently and neither is a primary DLA source. Karthik has
    // taken the decision to buy that source; until it lands the surface says so
    // and routes her to a mentor rather than promising a Source Approval
    // Request that may not exist for this code.
    //
    // The copy for that branch was written and shipped with no record carrying
    // the code, so it rendered nowhere — a designed state nothing reaches
    // (`D-B3`). This record exists so the sentence can be read on a screen
    // before anyone relies on it, and so the restricted page's third group has
    // a member.
    //
    // Everything else here is ordinary on purpose. One record, one new state.
    id: "mp-094",
    solicitation: "SPE-SYNTH-0005",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE-SYNTH-0005",
    amendedOn: null,
    nsn: "4820-99-000-0005",
    plainName: "Ball valve",
    officialName: "VALVE, BALL",
    category: "pipes-valves", // FSC 4820
    naics: null,
    quantity: 60,
    unitOfIssue: "EA",
    amc: "1",
    amsc: "D",
    lastPricePerUnit: 74.2,
    lastPriceDate: "2026-06-18",
    standardPrice: 92.5,
    deliveryDays: 60,
    setAside: null,
    fobDestination: true,
    // Was `false`, on the line directly above a comment that corrected its
    // NEIGHBOUR for the identical reason and left this one standing. Same rule:
    // `dibbs_fast_award_flag` is 16.4% true and ~84% absent live, never False.
    // Not null, because this record's job is to reach `repeats: null` with the
    // other two flags non-null.
    fastAward: true,
    // Was `false`. `dibbs_aidc_flag` is never False live (190 true / 10 null /
    // 0 false), so a hand-written record carrying one authored a state the
    // feed cannot produce — the invented-corpus mistake this file replaced.
    // Null and false render identically for this flag, so the correction is
    // free.
    repeats: null,
    needsDrawings: false,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-12",
    buyer: "DLA Land and Maritime",
    partNumbers: "BV-1180",
    buyerContact: { name: "K. Osei", email: "k.osei@dla.mil", phone: "614-692-3000" },
    // Was `[]`. mp-095's own comment records the measurement: "Non-empty on
    // 100% of the 57-record live sample. An empty array is a shape the feed
    // does not produce." Same class as the `fastAward: false` above — a
    // synthetic authoring a state the feed cannot return. The CAGE and part
    // number are this record's own, taken from its award row.
    approvedSources: [{ cage: "5KL90", partNumber: "BV-1180" }],
    awards: [
      {
        cage: "5KL90",
        contract: "SPE7M226V0012",
        quantity: 60,
        unitCost: 74.2,
        awardedOn: "2026-06-18",
        surplus: false,
        partNumber: "BV-1180",
      },
    ],
  },
  {
    // SYNTHETIC — ONE state, deliberately: an acquisition suffix we have NO
    // RULING FOR. `amc` is "1", the open method, so nothing else on the record
    // is in the way; the suffix alone decides.
    //
    // `suffixUnderstood()` in relevance.ts names ten such letters — A, H, K, L,
    // M, N, O, Q, T, U — all "limited competition" in our references, which
    // means they may or may not be open on facts the record does not carry.
    // Guessing either way is the harm, so they route to the honest-unknown
    // state: "I cannot tell if you can bid this one." **15.7% of a 267-record
    // sample lands there**, and until this record the corpus reached that state
    // ONLY through mp-090, which has no codes at all. Those are two different
    // gaps: mp-090 is our ingest dropping a field (live coverage of amc/amsc is
    // 100%, so in production that is essentially never the cause), and this one
    // is DLA writing a letter we have not settled. The copy on that branch is
    // written for the second and could not be read against a record carrying
    // it — a designed state nothing reaches (`D-B3`).
    //
    // H is the letter the coordinator named. L would do the same job and is the
    // one actually seen in the 57-record cut (3 of 57); it is out of
    // OPEN_SUFFIXES on purpose and lands in the same tier. Either way this
    // record stands for the whole 15.7% bucket, not for one letter.
    //
    // Category `hand-tools` on purpose: it already holds real records, so this
    // adds no order to one of the five empty categories — filling those by hand
    // is what the header forbids.
    id: "mp-095",
    solicitation: "SPE-SYNTH-0006",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE-SYNTH-0006",
    amendedOn: null,
    nsn: "5120-99-000-0006",
    // Every word appears in the official name. No material, no size, no
    // property she cannot check against the order paper (`D-G4`).
    plainName: "Slip joint pliers",
    officialName: "PLIERS, SLIP JOINT",
    category: "hand-tools", // FSC 5120
    naics: null,
    quantity: 120,
    unitOfIssue: "EA",
    // THE ONE STATE. Open method, and a suffix we have no ruling for.
    amc: "1",
    amsc: "H",
    // Equal to awards[0].unitCost, and dated from that award — the invariant
    // the live feed holds on 55 of 55 records carrying both.
    lastPricePerUnit: 18.6,
    lastPriceDate: "2026-06-30",
    standardPrice: 22.4,
    deliveryDays: 75,
    setAside: null,
    fobDestination: false,
    // Ordinary in every other respect: fast award absent (DLA's automatic
    // evaluation has not run), a year-long contract (190 of 200 live), and the
    // drawings flag absent, which after the 20 August sweep is the ordinary
    // value on this corpus rather than a special one.
    fastAward: null,
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-11",
    buyer: "DLA Troop Support",
    partNumbers: "SJP-6120",
    buyerContact: { name: "M. Okafor", email: "m.okafor@dla.mil", phone: "215-737-2000" },
    // Non-empty on 100% of the 57-record live sample. An empty array is a shape
    // the feed does not produce.
    approvedSources: [{ cage: "7PQ44", partNumber: "SJP-6120" }],
    awards: [
      {
        cage: "7PQ44",
        contract: "SPE7M226V0020",
        quantity: 120,
        unitCost: 18.6,
        awardedOn: "2026-06-30",
        surplus: false,
        partNumber: "SJP-6120",
      },
      {
        cage: "7PQ44",
        contract: "SPE7M226V0018",
        quantity: 90,
        unitCost: 17.9,
        awardedOn: "2025-12-04",
        surplus: false,
        partNumber: "SJP-6120",
      },
    ],
  },
  {
    // SYNTHETIC — ONE state, deliberately: a QUANTITY WITH NO UNIT.
    //
    // `D-F1` names this exact pairing: the registry entry exists because "the
    // corpus's only null-unit fixture also had a null quantity, so the pair
    // never occurred", and mp-091 is still null in both. So two designed money
    // states had no carrier — `quantityLine()`'s "N — I do not know how these
    // are counted." and `priceAdvice()`'s unnameable-unit
    // withdrawal, which states the figure and takes the instruction away.
    // A record that is null in everything cannot exercise either: one needs a
    // quantity beside the null unit, the other needs a price beside it.
    //
    // The shape is the ingest's, not ours: `unitOfIssue` is `n.ui`, typed
    // nullable and read straight off the NSN object, while `quantity` comes
    // from the OPPORTUNITY (`dibbs_quantity`). Two objects, two nullabilities,
    // no reason they agree.
    //
    // Category `bearings-seals` on purpose — it already holds real records, so
    // this adds no order to one of the empty categories, which the header
    // forbids filling by hand.
    id: "mp-096",
    solicitation: "SPE-SYNTH-0007",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE-SYNTH-0007",
    amendedOn: null,
    nsn: "5330-99-000-0007",
    plainName: "Plain encased seal",
    officialName: "SEAL, PLAIN ENCASED",
    category: "bearings-seals", // FSC 5330
    naics: null,
    // THE ONE STATE: a quantity we hold, and no unit to read it in.
    quantity: 240,
    unitOfIssue: null,
    amc: "1",
    amsc: "Z",
    // Equal to awards[0].unitCost and dated from that award — the invariant the
    // live feed holds on 55 of 55 records carrying both.
    lastPricePerUnit: 7.85,
    lastPriceDate: "2026-05-12",
    standardPrice: null,
    deliveryDays: 60,
    setAside: null,
    fobDestination: false,
    // Ordinary, and ordinary means ABSENT on two of the three. The feed never
    // returns False for fastAward or needsDrawings — it returns the flag or
    // nothing — so a synthetic writing `false` authors a state the live feed
    // never produces. mp-095 is the pattern. The isolated single-null states
    // keep their own carriers (mp-090, mp-093); this record claims none of them.
    fastAward: null,
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-09",
    buyer: "DLA Land and Maritime",
    partNumbers: "PES-4410",
    // An EXISTING invented identity, reused rather than a new one minted. The
    // agency and its published switchboard are real; the person is not, and
    // that gap is the subject of an open escalation on this corpus.
    buyerContact: { name: "T. Alvarez", email: "t.alvarez@dla.mil", phone: "614-692-1000" },
    approvedSources: [{ cage: "4R118", partNumber: "PES-4410" }],
    awards: [
      {
        cage: "4R118",
        contract: "SPE7LX26U9610",
        quantity: 200,
        unitCost: 7.85,
        awardedOn: "2026-05-12",
        surplus: false,
        partNumber: "PES-4410",
      },
      {
        cage: "4R118",
        contract: "SPE7LX25U8802",
        quantity: 150,
        unitCost: 7.4,
        awardedOn: "2025-09-30",
        surplus: false,
        partNumber: "PES-4410",
      },
    ],
  },
  {
    // SYNTHETIC — TWO states that travel together on live data:
    //
    //   1. A UNIT OF ISSUE CODE WE DO NOT RECOGNISE. `RL` is reel. It is a real
    //      DLA code and it is not in our sixteen-noun table, which is the point:
    //      the table is what we have settled, not what DLA writes. Two designed
    //      strings had no carrier — `quantityLine()`'s "N — the unit is RL, a
    //      code I do not know." and `unitWarning()`'s row 3, "The unit is RL, a
    //      code we do not know. Check what one RL holds before you price it."
    //      `RL` and the known `RO` (roll) are one letter apart, which is exactly
    //      why the copy shows the raw code instead of guessing a noun.
    //
    //   2. AWARDS ON THE RECORD, NOT ONE OF THEM EVIDENCE. The newest is
    //      SURPLUS — used stock, which two blocks below we tell her is a
    //      disqualifier — and the one behind it carries no cost at all. So
    //      `newestUsableAward()` finds nothing, and because the awards array is
    //      NON-EMPTY, `pricePoint()` must abstain rather than fall back to
    //      `lastPricePerUnit`. Falling back is exactly how a used-goods price
    //      became the instruction "Quote less than $4.10 for each piece" beside
    //      a block calling used stock a disqualifier (D-A5). The guard was
    //      written for that and no record in the corpus exercised it.
    //
    // `lastPricePerUnit` IS the surplus award's cost, which is not a mistake in
    // this fixture — it is the live invariant. `last_price` equals the newest
    // award's `unit_cost` whatever that award is, so on a surplus-newest record
    // the field IS the used price. That is the whole reason the raw field may
    // never reach the instruction.
    //
    // Category `electrical` on purpose: it already holds real records.
    id: "mp-097",
    solicitation: "SPE-SYNTH-0008",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE-SYNTH-0008",
    amendedOn: null,
    nsn: "6145-99-000-0008",
    plainName: "Electrical wire",
    officialName: "WIRE, ELECTRICAL",
    category: "electrical", // FSC 6145
    naics: null,
    quantity: 40,
    // THE FIRST STATE: a code we cannot name.
    unitOfIssue: "RL",
    amc: "1",
    amsc: "Z",
    lastPricePerUnit: 12.4,
    lastPriceDate: "2026-06-02",
    standardPrice: null,
    deliveryDays: 45,
    setAside: null,
    fobDestination: false,
    // Absent, not false: the feed returns the flag or nothing on both of these,
    // so a synthetic writing `false` authors a state it never produces.
    fastAward: null,
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-10",
    buyer: "DLA Troop Support",
    partNumbers: "WE-2214",
    buyerContact: { name: "M. Okafor", email: "m.okafor@dla.mil", phone: "215-737-1000" },
    approvedSources: [{ cage: "0TY63", partNumber: "WE-2214" }],
    // THE SECOND STATE: awards, and not one of them evidence of a new-stock
    // price. Newest first, as the feed sorts them.
    awards: [
      {
        cage: "0TY63",
        contract: "SPE7M226V0101",
        quantity: 30,
        unitCost: 12.4,
        awardedOn: "2026-06-02",
        surplus: true,
        partNumber: "WE-2214",
      },
      {
        cage: "0TY63",
        contract: "SPE7M225V0940",
        quantity: 25,
        unitCost: null,
        awardedOn: "2025-11-18",
        surplus: false,
        partNumber: "WE-2214",
      },
    ],
  },
  {
    // SYNTHETIC — TWO states, both about measuring rather than counting:
    //
    //   1. A CONTINUOUS MEASURE. `FT` is in the noun table but has NO
    //      multiplier, and `unitWarning()` splits row 2 in half for exactly
    //      this: on a container the danger is the hidden count, but a foot is a
    //      foot, and "we do not know how many items that is" reads as nonsense
    //      where she most needs to trust the sentence. So FT/GL/LB/YD get the
    //      other half — "Your price is for one foot, not for the whole order."
    //      That wording was specified, built, and reached by nothing: every
    //      unit in the corpus was EA, HD or a container.
    //
    //   2. A PRICE WITH NO QUANTITY. `quantity` is `dibbs_quantity` on the
    //      OPPORTUNITY; the price and its date come from the NSN's awards. A
    //      record can carry a nameable unit and a fresh enough award while the
    //      solicitation says nothing about how many — so the per-unit ceiling
    //      still stands and the TOTAL must not. mp-091 was the corpus's only
    //      null-quantity record and it has no price at all, so
    //      `priceAdvice()`'s "The order paper does not say how many they want
    //      this time" branch — the one that keeps the ceiling and drops the
    //      total — had no carrier either.
    //
    // The award is eighteen months old: inside the 24-month usable window, past
    // the 12-month fresh one, and the quantity question is asked BEFORE the
    // fresh/ageing split, so this lands on the no-quantity branch by the
    // ladder's own precedence rather than by a date chosen to force it.
    //
    // Category `pipes-valves` on purpose: it already holds a real record.
    id: "mp-098",
    solicitation: "SPE-SYNTH-0009",
    dlaOrderUrl: null,
    paper: null,
    version: "SPE-SYNTH-0009",
    amendedOn: null,
    nsn: "4720-99-000-0009",
    plainName: "Nonmetallic tubing",
    officialName: "TUBING, NONMETALLIC",
    category: "pipes-valves", // FSC 4720
    naics: null,
    // THE SECOND STATE: the order paper does not say how many.
    quantity: null,
    // THE FIRST STATE: measured, not counted.
    unitOfIssue: "FT",
    amc: "1",
    amsc: "Z",
    lastPricePerUnit: 3.4,
    lastPriceDate: "2025-02-26",
    standardPrice: null,
    deliveryDays: 90,
    setAside: null,
    fobDestination: false,
    // Absent, not false: the feed returns the flag or nothing on both of these,
    // so a synthetic writing `false` authors a state it never produces.
    fastAward: null,
    repeats: true,
    needsDrawings: null,
    dibbsStatus: "Open",
    postedOn: "2026-08-18",
    closesOn: "2026-09-12",
    buyer: "DLA Aviation",
    partNumbers: "TN-0915",
    buyerContact: { name: "R. Deiter", email: "richard.deiter@dla.mil", phone: "804-279-1000" },
    approvedSources: [{ cage: "1M338", partNumber: "TN-0915" }],
    awards: [
      {
        cage: "1M338",
        contract: "SPE4A725T4410",
        quantity: 1200,
        unitCost: 3.4,
        awardedOn: "2025-02-26",
        surplus: false,
        partNumber: "TN-0915",
      },
      {
        cage: "1M338",
        contract: "SPE4A724T3180",
        quantity: 900,
        unitCost: 3.15,
        awardedOn: "2024-05-14",
        surplus: false,
        partNumber: "TN-0915",
      },
    ],
  },
];

/**
 * The sample-data banner reads these. DERIVED, never hand-kept: they were
 * three literals maintained beside the list they describe, and the first
 * fixture added after they were written made the banner say "19 real orders
 * plus 3 made-up ones" about a corpus of 19.
 */
const SYNTHETIC = (o: MicroOrder) => o.solicitation.startsWith("SPE-SYNTH");

/** "2026-08-18" → "18 August 2026". UTC noon so no timezone moves the day. */
const writtenOut = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const REAL = MICRO_ORDERS.filter((o) => !SYNTHETIC(o));

/** The newest posting date carried by a REAL record — "" when there is none.
 *
 *  It was `… ?? MICRO_ORDERS[0].postedOn`: a fallback to a SYNTHETIC's date on
 *  a value that RENDERS, inside the one sentence whose whole job is to say
 *  which part of the corpus is real. Unreachable today, because REAL is
 *  non-empty by construction — but a displayed value with a fallback is a
 *  number waiting to be wrong, and this one would have been wrong about the
 *  realness claim itself (D-A4). The empty string is not a date and cannot be
 *  read as one, and the banner's own gate fails on it rather than printing a
 *  made-up day as the day DLA posted. */
const REAL_POSTED_ON = [...new Set(REAL.map((o) => o.postedOn))].sort().slice(-1)[0];

export const CORPUS = {
  /** Real DLA DIBBS solicitations, pulled through the HigherGov API. */
  real: REAL.length,
  /** Hand-written to reach states the picked day did not carry. */
  synthetic: MICRO_ORDERS.filter(SYNTHETIC).length,
  /**
   * The day the REAL records were posted, read off the records themselves.
   *
   * It was the string literal "18 August 2026" sitting inside the block whose
   * own docblock says these are DERIVED and never hand-kept — the same shape of
   * mistake the counts above were written to end. The banner sentence says
   * "real DLA orders posted on …", so this reads the real records only; the
   * synthetics carry their own dates and are counted separately.
   */
  postedOn: REAL_POSTED_ON ? writtenOut(REAL_POSTED_ON) : "",
} as const;

export function getMicroOrder(id: string): MicroOrder | undefined {
  return MICRO_ORDERS.find((o) => o.id === id);
}
