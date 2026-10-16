// CANONICAL DATASET — 60 North Carolina roofing & construction opportunities
// for Marcus Williams / Williams Construction LLC (Fayetteville, NC, SDVOSB).
// Do not introduce Texas/Houston references. All buyers, locations, and scopes
// are NC-area and aligned to Marcus's primary lane (NAICS 238160 + adjacent).

export type MatchTier = "strong" | "good" | "stretch" | "longshot";
export type Eligibility = "qualify" | "needs_cert" | "closed_to_new" | null;
export type OppMode = "prime" | "partner";
export type OppScope = "fed" | "sled";

/** HigherGov opportunity category. Undefined ⇒ "contract" (the unlabeled default). */
export type OppCategory = "contract" | "grant" | "forecast" | "product_buy";

/** DIBBS product-buy facts. Present only on product_buy opportunities. */
export interface Dibbs {
  quantity: number | null;
  deliverDays: number | null;
  fastAward: boolean;
}

export interface Opportunity {
  noticeId: string;
  title: string;
  agency: string;
  subAgency?: string;
  workType: string;
  valueLow: number;
  valueHigh: number;
  location: string;
  zip?: string; // PoP ZIP code, when known
  closesAt: string; // ISO
  postedAt?: string | null; // ISO — real posted date when known
  matchTier: MatchTier;
  matchScore: number;
  hunterReasoning: string;
  eligibility: Eligibility;
  setAside?: string;
  amendedAt?: string;
  newToBidders?: boolean;
  mode: OppMode;
  scope: OppScope;
  naicsCode?: string;
  /** Informational only (industry day, sources sought, RFI). Read by the Grant lib's
   *  `synthesize()` to pick a sources-sought vs solicitation notice type. */
  informational?: boolean;
  // partner mode (a recent winner or prime with sub needs)
  partnerName?: string;
  partnerContext?: string;
  awardedValue?: string;
}

// Anchored "now" for deterministic mocks.
const NOW = new Date("2026-05-07T09:00:00-05:00");
const days = (n: number) => new Date(NOW.getTime() + n * 86400000).toISOString();
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3600000).toISOString();

type Seed = Omit<Opportunity, "noticeId" | "mode" | "scope"> & {
  id: string;
  mode?: OppMode;
  scope?: OppScope;
};

const SEEDS: Seed[] = [
  // ═══════════════════════════ STRONG (18) ═══════════════════════════
  // Marcus-sized, in-lane, NC-local, set-asides he qualifies for.

  { id: "W912EE-26-R-0066", title: "Re-roof of 6 barracks (modified bitumen) — Fort Bragg", agency: "USACE", subAgency: "Wilmington District / Fort Bragg DPW", workType: "Modified bitumen re-roofing", valueLow: 420_000, valueHigh: 560_000, location: "Fort Bragg, NC", closesAt: days(18), matchTier: "strong", matchScore: 96, hunterReasoning: "Right in your lane — re-roof of 6 barracks at Fort Bragg, $480K, SDVOSB set-aside you qualify for. This is the kind you win.", eligibility: "qualify", setAside: "SDVOSB", newToBidders: true },

  { id: "W912PM-26-Q-0017", title: "TPO re-roof, Hangar 4 — Pope Army Airfield", agency: "USACE", subAgency: "Wilmington District", workType: "TPO single-ply roofing", valueLow: 310_000, valueHigh: 470_000, location: "Pope AAF, NC", closesAt: days(11), matchTier: "strong", matchScore: 94, hunterReasoning: "Hangar TPO at Pope, $390K, SDVOSB. 15 minutes from your shop and the scope is straight out of your portfolio.", eligibility: "qualify", setAside: "SDVOSB", amendedAt: hoursAgo(28) },

  { id: "SP4701-26-Q-0021", title: "Standing-seam metal roof — Camp Mackall SOF training facility", agency: "USACE", subAgency: "Wilmington District", workType: "Standing-seam metal roofing", valueLow: 540_000, valueHigh: 780_000, location: "Camp Mackall, NC", closesAt: days(26), matchTier: "strong", matchScore: 93, hunterReasoning: "Metal roof at Camp Mackall, $660K, SDVOSB set-aside. Steady scope for your crews and your 4 commercial references cover the past performance bar.", eligibility: "qualify", setAside: "SDVOSB" },

  { id: "N40085-26-Q-0089", title: "Roof preventive maintenance — MCB Camp Lejeune (12 buildings)", agency: "Navy", subAgency: "NAVFAC Mid-Atlantic", workType: "Roof repair & PM", valueLow: 180_000, valueHigh: 235_000, location: "Jacksonville, NC", closesAt: days(9), matchTier: "strong", matchScore: 91, hunterReasoning: "Multi-building roof PM at Lejeune, $210K, Total Small Business. Small dollar keeps the field thin — your kind of bid.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "CUMCO-2026-014", title: "Roof replacement — Cumberland County Detention Annex", agency: "Cumberland County, NC", workType: "Modified bitumen re-roofing", valueLow: 290_000, valueHigh: 410_000, location: "Fayetteville, NC", closesAt: days(20), matchTier: "strong", matchScore: 92, hunterReasoning: "Cumberland County re-roof, $350K, local — no federal hurdles, and you've done county work before. The kind that builds your local resume fast.", eligibility: "qualify", scope: "sled" },

  { id: "FAYNC-2026-R-08", title: "Re-roof and gutter replacement — Fayetteville Public Works facility", agency: "City of Fayetteville", workType: "Re-roofing & exterior", valueLow: 185_000, valueHigh: 235_000, location: "Fayetteville, NC", closesAt: days(14), matchTier: "strong", matchScore: 90, hunterReasoning: "City of Fayetteville facility re-roof, $210K, open competition. You're in the room every week — this one's yours to lose.", eligibility: "qualify", scope: "sled" },

  { id: "W912PM-26-Q-0033", title: "Building envelope repair, modified bitumen — Fort Bragg DPW", agency: "USACE", subAgency: "Wilmington District / Fort Bragg DPW", workType: "Building envelope & roofing", valueLow: 420_000, valueHigh: 640_000, location: "Fort Bragg, NC", closesAt: days(24), matchTier: "strong", matchScore: 92, hunterReasoning: "Bragg envelope + roofing, $530K, SDVOSB. Same DPW that buys your kind of work every quarter.", eligibility: "qualify", setAside: "SDVOSB" },

  { id: "N40085-26-R-0102", title: "Shingle re-roofing, family housing block — MCAS Cherry Point", agency: "Navy", subAgency: "NAVFAC Mid-Atlantic", workType: "Asphalt shingle roofing", valueLow: 510_000, valueHigh: 720_000, location: "Cherry Point, NC", closesAt: days(31), matchTier: "strong", matchScore: 89, hunterReasoning: "Cherry Point housing re-roof, $615K, SDVOSB. Workable drive (3h) and the scope is what your crews do every week.", eligibility: "qualify", setAside: "SDVOSB" },

  { id: "FA4800-26-Q-0044", title: "Hangar roof repair — Seymour Johnson AFB Bldg 3700", agency: "Air Force", subAgency: "4th CONS — Seymour Johnson AFB", workType: "Metal roof repair", valueLow: 390_000, valueHigh: 580_000, location: "Goldsboro, NC", closesAt: days(13), matchTier: "strong", matchScore: 90, hunterReasoning: "Hangar roof repair at Seymour Johnson, $480K, Total Small Business. 70 miles from Fayetteville and your crews do hangar work.", eligibility: "qualify", setAside: "Total Small Business", amendedAt: hoursAgo(42) },

  { id: "CCSC-2026-22", title: "Re-roof of 3 elementary schools", agency: "Cumberland County Schools", workType: "Re-roofing program (3 schools)", valueLow: 680_000, valueHigh: 910_000, location: "Fayetteville, NC", closesAt: days(35), matchTier: "strong", matchScore: 93, hunterReasoning: "3-school re-roof for your home county, $795K, open competition. Sized right at your largest past job — strongest possible past-performance case.", eligibility: "qualify", scope: "sled" },

  { id: "W912PM-26-R-0058", title: "Barracks roof and envelope — XVIII Airborne Corps complex", agency: "USACE", subAgency: "Wilmington District / Fort Bragg DPW", workType: "Roof + envelope renovation", valueLow: 1_100_000, valueHigh: 1_600_000, location: "Fort Bragg, NC", closesAt: days(40), matchTier: "strong", matchScore: 88, hunterReasoning: "Bragg barracks roof + envelope, $1.35M, SDVOSB. Just above your past ceiling but right on the line — this is the next step up.", eligibility: "qualify", setAside: "SDVOSB" },

  { id: "RCSC-2026-09", title: "Roof replacement — Robeson County high school gymnasium", agency: "Robeson County Schools", workType: "Standing-seam metal roofing", valueLow: 195_000, valueHigh: 245_000, location: "Lumberton, NC", closesAt: days(16), matchTier: "strong", matchScore: 89, hunterReasoning: "Robeson County school roof, $220K, open bid. 40 minutes south — fast mobilization, clean scope, no federal paperwork.", eligibility: "qualify", scope: "sled" },

  { id: "W912HN-26-Q-0014", title: "Warehouse roof replacement — USACE Charleston field office", agency: "USACE", subAgency: "Savannah District", workType: "TPO re-roofing", valueLow: 360_000, valueHigh: 520_000, location: "Charleston, SC", closesAt: days(22), matchTier: "strong", matchScore: 87, hunterReasoning: "USACE Charleston warehouse re-roof, $440K, SDVOSB. Out of state but driveable, and Savannah District awards to first-time NC primes regularly.", eligibility: "qualify", setAside: "SDVOSB", newToBidders: true },

  { id: "NCNG-2026-21", title: "Armory roof and weatherproofing — NC National Guard, Hope Mills", agency: "NC National Guard", workType: "Roofing & weatherproofing", valueLow: 190_000, valueHigh: 240_000, location: "Hope Mills, NC", closesAt: days(12), matchTier: "strong", matchScore: 90, hunterReasoning: "NC Guard armory, $215K, open. 10 miles from your shop and the NCNG procurement office knows local SDVOSB firms by name.", eligibility: "qualify", scope: "sled" },

  { id: "GS04Q-26-RM-0019", title: "Federal facility re-roof — Greensboro federal building", agency: "GSA", subAgency: "Region 4", workType: "Re-roofing & weatherproofing", valueLow: 620_000, valueHigh: 870_000, location: "Greensboro, NC", closesAt: days(28), matchTier: "strong", matchScore: 87, hunterReasoning: "GSA Region 4 federal building re-roof, $745K, Total Small Business. Region 4 awards roughly half this dollar tier to small primes.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "N62470-26-Q-0044", title: "Siding & exterior replacement — MCAS New River BEQ", agency: "Navy", subAgency: "NAVFAC Mid-Atlantic", workType: "Siding & exterior envelope", valueLow: 380_000, valueHigh: 560_000, location: "Jacksonville, NC", closesAt: days(33), matchTier: "strong", matchScore: 88, hunterReasoning: "MCAS New River siding job, $470K, SDVOSB. Siding is your secondary NAICS — clean past-performance fit.", eligibility: "qualify", setAside: "SDVOSB" },

  { id: "DUR-CO-2026-12", title: "Re-roof of 2 Durham County library branches", agency: "Durham County, NC", workType: "Re-roofing", valueLow: 180_000, valueHigh: 240_000, location: "Durham, NC", closesAt: days(17), matchTier: "strong", matchScore: 88, hunterReasoning: "Durham County library re-roof, $210K, open. Small enough that you'll likely see 3–4 bidders. Easy add to your county portfolio.", eligibility: "qualify", scope: "sled" },

  { id: "NEW-partner-13", title: "Bordeaux Construction seeking SDVOSB roofing subs — Fort Bragg housing IDIQ", agency: "USACE", subAgency: "Wilmington District (Bordeaux Construction prime)", workType: "Roofing sub package", valueLow: 42_000_000, valueHigh: 42_000_000, location: "Fort Bragg, NC", closesAt: days(180), matchTier: "strong", matchScore: 91, hunterReasoning: "Bordeaux just won this $42M Bragg housing IDIQ — they're a NC mid-size prime with SDVOSB sub goals. You're 30 minutes from their Durham office. Worth reaching out this week.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Bordeaux Construction", partnerContext: "won $42M Fort Bragg housing IDIQ 2 weeks ago", awardedValue: "$42M" },

  // ═══════════════════════════ GOOD (24) ═══════════════════════════
  // Solid fit, usually one realistic flag (slight stretch, multi-site, etc.).

  { id: "VA247-26-R-0112", title: "Roof replacement — VA Fayetteville Medical Center, Bldg 4", agency: "VA", subAgency: "NCO 6", workType: "Modified bitumen re-roofing", valueLow: 620_000, valueHigh: 840_000, location: "Fayetteville, NC", closesAt: days(21), matchTier: "good", matchScore: 86, hunterReasoning: "Solid fit — VA Fayetteville roof replacement, $720K, Total Small Business. Slightly above your largest job but well within reach.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "W912PM-26-R-0071", title: "Re-roof of vehicle maintenance facility — Fort Bragg DPW", agency: "USACE", subAgency: "Wilmington District / Fort Bragg DPW", workType: "TPO re-roofing", valueLow: 820_000, valueHigh: 1_150_000, location: "Fort Bragg, NC", closesAt: days(29), matchTier: "good", matchScore: 82, hunterReasoning: "Bragg vehicle maintenance re-roof, $985K, TSB. Right scope, right place — the only watch-out is the 12-week schedule on an active motor pool.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "VA247-26-R-0166", title: "Multi-building roof program — VA Salisbury Health Care System", agency: "VA", subAgency: "NCO 6", workType: "Multi-building re-roofing", valueLow: 1_400_000, valueHigh: 2_100_000, location: "Salisbury, NC", closesAt: days(45), matchTier: "good", matchScore: 78, hunterReasoning: "VA Salisbury roof program, $1.75M, TSB. Above your past ceiling — bondable but you'd want to confirm your surety can go to $2.1M before you commit.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "WCS-2026-R-44", title: "Re-roof and HVAC curb replacement — Wake County middle school", agency: "Wake County Public Schools", workType: "Re-roofing + HVAC curbs", valueLow: 890_000, valueHigh: 1_200_000, location: "Raleigh, NC", closesAt: days(38), matchTier: "good", matchScore: 80, hunterReasoning: "Wake County school re-roof, $1.05M, open. Solid local SLED. Coordinating curbs with HVAC sub is the only wrinkle — pencil that in early.", eligibility: "qualify", scope: "sled" },

  { id: "W912PM-26-Q-0084", title: "Roof repair IDIQ — Fort Bragg DPW small projects", agency: "USACE", subAgency: "Wilmington District / Fort Bragg DPW", workType: "Roof repair IDIQ", valueLow: 250_000, valueHigh: 750_000, location: "Fort Bragg, NC", closesAt: days(36), matchTier: "good", matchScore: 81, hunterReasoning: "Bragg small-projects IDIQ, $250K–$750K task orders, SDVOSB. Getting on this vehicle means steady call-in work for 5 years.", eligibility: "qualify", setAside: "SDVOSB" },

  { id: "GCS-2026-RFP-19", title: "Re-roof — Guilford County high school auxiliary buildings", agency: "Guilford County Schools", workType: "Re-roofing (3 aux bldgs)", valueLow: 480_000, valueHigh: 680_000, location: "Greensboro, NC", closesAt: days(32), matchTier: "good", matchScore: 78, hunterReasoning: "Guilford schools aux building re-roof, $580K, open. Standard SLED — 2h drive is the only flag.", eligibility: "qualify", scope: "sled" },

  { id: "N62470-26-R-0078", title: "TPO re-roof of two warehouses — MCB Camp Lejeune", agency: "Navy", subAgency: "NAVFAC Mid-Atlantic", workType: "TPO re-roofing (2 warehouses)", valueLow: 1_100_000, valueHigh: 1_600_000, location: "Jacksonville, NC", closesAt: days(41), matchTier: "good", matchScore: 79, hunterReasoning: "Lejeune two-warehouse re-roof, $1.35M, TSB. Above your largest job — strong fit if your concurrent capacity has room.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "NCSU-FM-26-022", title: "Standing-seam metal re-roof — NC State engineering facility", agency: "NC State University", workType: "Standing-seam metal roofing", valueLow: 1_100_000, valueHigh: 1_500_000, location: "Raleigh, NC", closesAt: days(48), matchTier: "good", matchScore: 76, hunterReasoning: "NC State engineering metal re-roof, $1.3M, open. UNC-system procurement is straightforward and you've done metal work — just slightly above your usual.", eligibility: "qualify", scope: "sled" },

  { id: "UNC-FAC-2026-31", title: "Building envelope weatherproofing — UNC Chapel Hill mechanical building", agency: "UNC Chapel Hill", workType: "Building envelope", valueLow: 410_000, valueHigh: 590_000, location: "Chapel Hill, NC", closesAt: days(50), matchTier: "good", matchScore: 75, hunterReasoning: "UNC envelope weatherproofing, $500K, open. 2h drive, standard scope. UNC system tends toward 5–7 bidders.", eligibility: "qualify", scope: "sled" },

  { id: "FA4800-26-R-0091", title: "Re-roof of 3 hangars (phased) — Seymour Johnson AFB", agency: "Air Force", subAgency: "4th CONS — Seymour Johnson AFB", workType: "Multi-hangar re-roofing", valueLow: 1_800_000, valueHigh: 2_600_000, location: "Goldsboro, NC", closesAt: days(55), matchTier: "good", matchScore: 74, hunterReasoning: "Seymour Johnson 3-hangar phased re-roof, $2.2M, TSB. Same base you already work — the size is the only stretch, and phasing makes the bond manageable.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "W912HN-26-Q-0048", title: "Roof maintenance — Charleston AFB lodging", agency: "Air Force", subAgency: "USACE Savannah District", workType: "Roof repair & PM", valueLow: 200_000, valueHigh: 245_000, location: "North Charleston, SC", closesAt: days(15), matchTier: "good", matchScore: 76, hunterReasoning: "Charleston AFB lodging roof PM, $220K, SDVOSB. Tight per-trip margin from Fayetteville — only bid if you can stack it with the Savannah warehouse job.", eligibility: "qualify", setAside: "SDVOSB" },

  { id: "W912PM-26-Q-0102", title: "Siding replacement — Fort Bragg legacy housing block", agency: "USACE", subAgency: "Wilmington District / Fort Bragg DPW", workType: "Siding & exterior", valueLow: 610_000, valueHigh: 890_000, location: "Fort Bragg, NC", closesAt: days(25), matchTier: "good", matchScore: 81, hunterReasoning: "Bragg housing siding, $750K, TSB. Your secondary NAICS scope, local. Only watch-out is coordinating around occupied housing units.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "NCDOT-2026-FAC-09", title: "Maintenance shed re-roof program (5 districts)", agency: "NCDOT", workType: "Re-roofing program (multi-site)", valueLow: 720_000, valueHigh: 1_050_000, location: "Multiple, NC", closesAt: days(43), matchTier: "good", matchScore: 73, hunterReasoning: "NCDOT 5-district maintenance shed program, $885K, open. Multi-site logistics is the wrinkle — works if you have a sub network or staged crews.", eligibility: "qualify", scope: "sled" },

  { id: "VBPS-2026-RFP-14", title: "Re-roof of elementary school — Virginia Beach City Schools", agency: "Virginia Beach City Public Schools, VA", workType: "Re-roofing", valueLow: 540_000, valueHigh: 770_000, location: "Virginia Beach, VA", closesAt: days(37), matchTier: "good", matchScore: 72, hunterReasoning: "Virginia Beach elementary re-roof, $655K, open. Out of state but within your geo. Mobilization cost is real — 4.5h each way.", eligibility: "qualify", scope: "sled" },

  { id: "RCBOE-GA-2026-7", title: "Roof replacement — Richmond County school, Augusta", agency: "Richmond County Schools, GA", workType: "Re-roofing", valueLow: 1_000_000, valueHigh: 1_450_000, location: "Augusta, GA", closesAt: days(46), matchTier: "good", matchScore: 70, hunterReasoning: "Richmond County GA school re-roof, $1.2M, open. Further out (4.5h) and SLED registration in GA is required — only if your pipeline thins.", eligibility: "qualify", scope: "sled" },

  { id: "CCS-2026-014", title: "Multi-building re-roof program — Charleston County School District", agency: "Charleston County School District, SC", workType: "Multi-school re-roofing", valueLow: 1_200_000, valueHigh: 1_700_000, location: "Charleston, SC", closesAt: days(52), matchTier: "good", matchScore: 75, hunterReasoning: "Charleston County SC re-roof program, $1.45M, open. Slightly above your past dollar but the multi-school structure lets you phase crews.", eligibility: "qualify", scope: "sled" },

  { id: "CFPUA-2026-31", title: "Pump station roof and weatherproofing program", agency: "Cape Fear Public Utility Authority", workType: "Roofing & weatherproofing", valueLow: 190_000, valueHigh: 245_000, location: "Wilmington, NC", closesAt: days(19), matchTier: "good", matchScore: 79, hunterReasoning: "Cape Fear PUA pump-station program, $220K, open. Small dollar, NC-coastal, easy add — utility work isn't your usual but the scope is just roofing.", eligibility: "qualify", scope: "sled" },

  { id: "ONSLOW-2026-22", title: "Emergency roof repair program — Onslow County schools", agency: "Onslow County Schools", workType: "Roof repair (storm damage)", valueLow: 160_000, valueHigh: 235_000, location: "Jacksonville, NC", closesAt: days(8), matchTier: "good", matchScore: 78, hunterReasoning: "Onslow County storm-damage school roof repair, $195K, open. Tight window — only bid if you can mobilize a crew this week.", eligibility: "qualify", scope: "sled" },

  { id: "NEW-partner-1", title: "Sterling Roofing seeking envelope subs — Camp Lejeune barracks renovation", agency: "Navy", subAgency: "NAVFAC (Sterling Roofing prime)", workType: "Roofing & envelope sub package", valueLow: 3_200_000, valueHigh: 3_200_000, location: "Jacksonville, NC", closesAt: days(180), matchTier: "good", matchScore: 84, hunterReasoning: "Sterling Roofing won this $3.2M Camp Lejeune envelope job last month — as a large prime they have small-business goals to hit. Worth reaching out.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Sterling Roofing", partnerContext: "won $3.2M Camp Lejeune barracks envelope renovation last month", awardedValue: "$3.2M" },

  { id: "NEW-partner-2", title: "Hensel Phelps seeking SDVOSB subs — Fort Bragg housing modernization", agency: "USACE", subAgency: "Wilmington District (Hensel Phelps prime)", workType: "Roofing & envelope subs", valueLow: 48_000_000, valueHigh: 48_000_000, location: "Fort Bragg, NC", closesAt: days(180), matchTier: "good", matchScore: 80, hunterReasoning: "Hensel Phelps just took on this $48M Bragg housing modernization. They've got SDVOSB sub goals and your past performance is local — short window to land on their bench.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Hensel Phelps", partnerContext: "won $48M Fort Bragg housing modernization IDIQ 3 weeks ago", awardedValue: "$48M" },

  { id: "NEW-partner-3", title: "Clark Construction sub bench — MCAS Cherry Point hangar envelope", agency: "Navy", subAgency: "NAVFAC (Clark Construction prime)", workType: "Hangar envelope subs", valueLow: 22_000_000, valueHigh: 22_000_000, location: "Cherry Point, NC", closesAt: days(180), matchTier: "good", matchScore: 76, hunterReasoning: "Clark Construction won this $22M Cherry Point hangar envelope job last month. They'll be filling the roofing sub package now — small window.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Clark Construction", partnerContext: "won $22M Cherry Point hangar envelope contract last month", awardedValue: "$22M" },

  { id: "NEW-partner-4", title: "Whiting-Turner seeking roofing & siding subs — VA Salisbury campus modernization", agency: "VA", subAgency: "OCFM (Whiting-Turner prime)", workType: "Roofing & siding subs", valueLow: 18_000_000, valueHigh: 18_000_000, location: "Salisbury, NC", closesAt: days(180), matchTier: "good", matchScore: 75, hunterReasoning: "Whiting-Turner just won this $18M VA Salisbury campus modernization. They reliably use NC-local SDVOSB roofing subs — your file would land well there.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Whiting-Turner", partnerContext: "won $18M VA Salisbury campus modernization 6 weeks ago", awardedValue: "$18M" },

  { id: "NEW-partner-5", title: "M.A. Mortenson facilities IDIQ sub bench — Pope Army Airfield", agency: "USACE", subAgency: "Wilmington District (Mortenson prime)", workType: "Facilities IDIQ subs", valueLow: 35_000_000, valueHigh: 35_000_000, location: "Pope AAF, NC", closesAt: days(180), matchTier: "good", matchScore: 77, hunterReasoning: "Mortenson holds this $35M Pope AAF facilities IDIQ and they're staffing task-order subs now. Your hangar past performance is a clean fit.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "M.A. Mortenson", partnerContext: "holds $35M Pope AAF facilities IDIQ — staffing task-order subs", awardedValue: "$35M" },

  { id: "NEW-partner-14", title: "T.A. Loving Co. sub bench — Seymour Johnson AFB phased re-roofing", agency: "Air Force", subAgency: "4th CONS (T.A. Loving prime)", workType: "Roofing subs", valueLow: 24_000_000, valueHigh: 24_000_000, location: "Goldsboro, NC", closesAt: days(180), matchTier: "good", matchScore: 79, hunterReasoning: "T.A. Loving (Goldsboro NC large prime) won this $24M Seymour Johnson program — they're local and lean heavily on NC SDVOSB subs. Easiest warm intro on your list.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "T.A. Loving Co.", partnerContext: "Goldsboro NC prime, won $24M Seymour Johnson phased re-roofing 4 weeks ago", awardedValue: "$24M" },

  { id: "NEW-partner-15", title: "ECC Constructors sub bench — USACE Savannah small projects IDIQ", agency: "USACE", subAgency: "Savannah District (ECC Constructors prime)", workType: "Construction subs (small projects)", valueLow: 14_000_000, valueHigh: 14_000_000, location: "Savannah District (NC/SC/GA)", closesAt: days(180), matchTier: "good", matchScore: 71, hunterReasoning: "ECC holds the $14M Savannah small-projects IDIQ. Task orders are right in your dollar range. Worth a one-page introduction to their NC region manager.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "ECC Constructors", partnerContext: "holds $14M USACE Savannah small-projects IDIQ", awardedValue: "$14M" },

  // ═══════════════════════════ STRETCH (12) ═══════════════════════════
  // Bonding gap, size gap, scope edge, or out-of-state mobilization.

  { id: "W912PM-26-R-0118", title: "Major re-roof program — 14 buildings, Fort Bragg cantonment area", agency: "USACE", subAgency: "Wilmington District / Fort Bragg DPW", workType: "Multi-building re-roofing program", valueLow: 3_800_000, valueHigh: 5_400_000, location: "Fort Bragg, NC", closesAt: days(56), matchTier: "stretch", matchScore: 62, hunterReasoning: "14-building Bragg re-roof, $4.6M, TSB. Local and exactly your scope — but $4.6M is 5x your largest past contract. Realistic only with a teaming partner and a co-surety.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "N62470-26-R-0153", title: "Design-build housing envelope — MCB Camp Lejeune BEQ", agency: "Navy", subAgency: "NAVFAC Mid-Atlantic", workType: "Design-build envelope", valueLow: 6_200_000, valueHigh: 8_500_000, location: "Jacksonville, NC", closesAt: days(60), matchTier: "stretch", matchScore: 55, hunterReasoning: "Lejeune BEQ design-build envelope, $7.35M. Design-build adds an architect-of-record requirement you don't carry — only feasible as a sub or as JV with a DB firm.", eligibility: "qualify" },

  { id: "VA247-26-R-0301", title: "Hospital tower envelope replacement — VA Durham", agency: "VA", subAgency: "NCO 6", workType: "Hospital envelope", valueLow: 4_400_000, valueHigh: 6_100_000, location: "Durham, NC", closesAt: days(50), matchTier: "stretch", matchScore: 58, hunterReasoning: "VA Durham tower envelope, $5.25M, TSB. Hospital work needs ICRA-trained crews — without that past performance you'd score low on the technical evaluation.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "CMS-CLT-2026-31", title: "5-year roofing IDIQ — Charlotte-Mecklenburg Schools", agency: "Charlotte-Mecklenburg Schools", workType: "Roofing IDIQ", valueLow: 10_000_000, valueHigh: 25_000_000, location: "Charlotte, NC", closesAt: days(65), matchTier: "stretch", matchScore: 50, hunterReasoning: "CMS 5-year roofing IDIQ, $10–25M ceiling, open. IDIQs reward incumbents — CMS has 2–3 firms on it now. Realistic only as a sub to one of them.", eligibility: "qualify", scope: "sled" },

  { id: "FA4800-26-R-0144", title: "Airfield support facility full replacement — Seymour Johnson AFB", agency: "Air Force", subAgency: "4th CONS — Seymour Johnson AFB", workType: "Vertical construction + roofing", valueLow: 9_200_000, valueHigh: 13_000_000, location: "Goldsboro, NC", closesAt: days(70), matchTier: "stretch", matchScore: 48, hunterReasoning: "Seymour Johnson airfield support replacement, $11M, open. Vertical construction is a step beyond your roofing-led portfolio — bid only as a teaming partner.", eligibility: "qualify" },

  { id: "W912HN-26-R-0099", title: "Multi-trade building envelope renewal — Fort Stewart, GA", agency: "USACE", subAgency: "Savannah District", workType: "Envelope renewal (multi-trade)", valueLow: 2_600_000, valueHigh: 3_900_000, location: "Fort Stewart, GA", closesAt: days(58), matchTier: "stretch", matchScore: 53, hunterReasoning: "Fort Stewart envelope renewal, $3.25M, TSB. Right scope but 6h drive — mobilization eats your margin unless you stage equipment locally.", eligibility: "qualify", setAside: "Total Small Business" },

  { id: "W912PM-26-R-0152", title: "New maintenance hangar construction — Pope Army Airfield", agency: "USACE", subAgency: "Wilmington District", workType: "New hangar construction", valueLow: 7_400_000, valueHigh: 10_200_000, location: "Pope AAF, NC", closesAt: days(72), matchTier: "stretch", matchScore: 47, hunterReasoning: "Pope AAF new hangar, $8.8M. Vertical-construction lead with structural steel — your roof-and-envelope wheelhouse covers maybe 25% of scope.", eligibility: "qualify" },

  { id: "NEW-partner-6", title: "Skanska seeking roofing subs — Norfolk Naval Shipyard barracks", agency: "Navy", subAgency: "NAVFAC Mid-Atlantic (Skanska prime)", workType: "Roofing subs", valueLow: 62_000_000, valueHigh: 62_000_000, location: "Norfolk, VA", closesAt: days(180), matchTier: "stretch", matchScore: 62, hunterReasoning: "Skanska won this $62M Norfolk shipyard barracks renovation — they fill SDVOSB roofing sub goals. Worth a one-page intro; 4.5h to Norfolk is the realistic flag.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Skanska", partnerContext: "won $62M Norfolk Naval Shipyard barracks renovation 5 weeks ago", awardedValue: "$62M" },

  { id: "NEW-partner-7", title: "Brasfield & Gorrie sub bench — VA Charleston outpatient clinic", agency: "VA", subAgency: "OCFM (Brasfield & Gorrie prime)", workType: "Roofing & envelope subs", valueLow: 48_000_000, valueHigh: 48_000_000, location: "North Charleston, SC", closesAt: days(180), matchTier: "stretch", matchScore: 58, hunterReasoning: "Brasfield & Gorrie won this $48M VA Charleston outpatient clinic — SE-region prime that uses small-business roofing subs. Distance is the flag, not capability.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Brasfield & Gorrie", partnerContext: "won $48M VA Charleston outpatient clinic 2 months ago", awardedValue: "$48M" },

  { id: "NEW-partner-8", title: "Caddell Construction seeking SDVOSB subs — Marine Corps Logistics Base, Albany", agency: "Navy", subAgency: "NAVFAC (Caddell prime)", workType: "Construction subs", valueLow: 80_000_000, valueHigh: 80_000_000, location: "Albany, GA", closesAt: days(180), matchTier: "stretch", matchScore: 54, hunterReasoning: "Caddell holds this $80M MCLB Albany contract and SDVOSB sub goals are tight on this one. Albany is far (6h) — only if your pipeline thins.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Caddell Construction", partnerContext: "holds $80M MCLB Albany contract, tight SDVOSB sub goals", awardedValue: "$80M" },

  { id: "NEW-partner-9", title: "Turner Construction seeking bonded roofing subs — Joint Base Langley-Eustis", agency: "Air Force", subAgency: "Joint Base Langley-Eustis (Turner prime)", workType: "Roofing subs", valueLow: 58_000_000, valueHigh: 58_000_000, location: "Hampton, VA", closesAt: days(180), matchTier: "stretch", matchScore: 56, hunterReasoning: "Turner just won this $58M Langley-Eustis program — large prime, formal SBLO outreach process. 4h to Hampton; getting on the bench is more about paperwork than win.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Turner Construction", partnerContext: "won $58M Joint Base Langley-Eustis renovation 6 weeks ago", awardedValue: "$58M" },

  { id: "NEW-partner-10", title: "Barnhill Contracting sub package — Cumberland County courthouse renovation", agency: "Cumberland County, NC", subAgency: "Barnhill Contracting prime", workType: "Roofing & envelope subs", valueLow: 14_000_000, valueHigh: 14_000_000, location: "Fayetteville, NC", closesAt: days(180), matchTier: "stretch", matchScore: 65, hunterReasoning: "Barnhill (Rocky Mount NC prime) won the $14M Cumberland courthouse renovation — your courthouse is two blocks from your shop. Easiest local intro you'll see this quarter.", eligibility: "qualify", mode: "partner", scope: "sled", partnerName: "Barnhill Contracting", partnerContext: "won $14M Cumberland County courthouse renovation 3 weeks ago", awardedValue: "$14M" },

  { id: "NEW-partner-16", title: "Mortenson airfield support subs — Seymour Johnson AFB", agency: "Air Force", subAgency: "4th CONS (Mortenson prime)", workType: "Roofing & envelope subs", valueLow: 32_000_000, valueHigh: 32_000_000, location: "Goldsboro, NC", closesAt: days(180), matchTier: "stretch", matchScore: 60, hunterReasoning: "Mortenson took the $32M Seymour Johnson airfield support program — competing prime to T.A. Loving's work and they're hungry for local subs. Two NC primes to reach out to on the same base.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "M.A. Mortenson", partnerContext: "won $32M Seymour Johnson airfield support program 2 months ago", awardedValue: "$32M" },

  // ═══════════════════════════ LONG SHOT (6) ═══════════════════════════
  // Closed pools, certification gaps, or fundamental capability gaps.

  { id: "W912DY-26-R-0091", title: "Fuel storage facility re-roofing program — DLA multi-site", agency: "DLA Energy", workType: "Specialty re-roofing (fuel facilities)", valueLow: 4_800_000, valueHigh: 6_900_000, location: "Multi-state (NC, VA, SC, GA, FL)", closesAt: days(45), matchTier: "longshot", matchScore: 32, hunterReasoning: "DLA fuel facility re-roofing, $5.85M. Specialty fuel-handling past performance you don't have, and multi-state mobilization stacks against you. Track as a sub opportunity if anything.", eligibility: "qualify" },

  { id: "W912EE-26-R-0144", title: "USACE Wilmington civil construction IDIQ on-ramp — existing pool only", agency: "USACE", subAgency: "Wilmington District", workType: "Civil construction IDIQ", valueLow: 50_000_000, valueHigh: 200_000_000, location: "NC", closesAt: days(48), matchTier: "longshot", matchScore: 18, hunterReasoning: "On-ramp closed for new entrants until FY28 recompete. Track for then; don't spend time now.", eligibility: "closed_to_new" },

  { id: "SP4701-26-R-0078", title: "SOCOM specialty facility re-roof — Camp Mackall (TS-cleared)", agency: "USSOCOM", subAgency: "USACE Wilmington District", workType: "Specialty re-roofing (cleared)", valueLow: 1_800_000, valueHigh: 2_600_000, location: "Camp Mackall, NC", closesAt: days(54), matchTier: "longshot", matchScore: 25, hunterReasoning: "Right next door but requires TS-cleared crew — clearance process alone is 12+ months. Not a path you can take in this cycle.", eligibility: "needs_cert", setAside: "Cleared personnel required" },

  { id: "NEW-partner-11", title: "Whiting-Turner nationwide IDIQ sub bench — VA OCFM", agency: "VA", subAgency: "OCFM (Whiting-Turner prime)", workType: "National roofing sub bench", valueLow: 400_000_000, valueHigh: 400_000_000, location: "Nationwide", closesAt: days(180), matchTier: "longshot", matchScore: 22, hunterReasoning: "Whiting-Turner's $400M VA OCFM IDIQ would put you on a national bench — but their NC slot is likely filled. Long-shot intro at best.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Whiting-Turner", partnerContext: "holds $400M VA OCFM nationwide IDIQ", awardedValue: "$400M" },

  { id: "VA101-26-R-0411", title: "Design-build hospital tower — VA Hampton, VA", agency: "VA", subAgency: "OCFM", workType: "Design-build healthcare", valueLow: 48_000_000, valueHigh: 72_000_000, location: "Hampton, VA", closesAt: days(75), matchTier: "longshot", matchScore: 15, hunterReasoning: "$60M VA Hampton design-build hospital tower. Specialty market — realistic only as a minority JV partner in 5+ years.", eligibility: "qualify" },

  { id: "NEW-partner-12", title: "Lendlease mega-program sub bench — Atlantic regional military housing renewal", agency: "Army", subAgency: "Lendlease prime", workType: "Housing program subs", valueLow: 1_200_000_000, valueHigh: 1_200_000_000, location: "Multi-state SE", closesAt: days(180), matchTier: "longshot", matchScore: 12, hunterReasoning: "Lendlease's $1.2B Atlantic military housing program — they tier their subs through regional GCs, not direct. Path in is via a tier-2 partner first.", eligibility: "qualify", mode: "partner", scope: "fed", partnerName: "Lendlease", partnerContext: "holds $1.2B Atlantic regional military housing renewal program", awardedValue: "$1.2B" },
];

const TIER_DEFAULT_SCORE: Record<MatchTier, number> = { strong: 88, good: 72, stretch: 55, longshot: 40 };

const AGENCY_ABBREV: Record<string, string> = {
  "USACE": "USACE",
  "Navy": "Navy",
  "Air Force": "USAF",
  "VA": "VA",
  "GSA": "GSA",
  "Army": "Army",
  "DLA Energy": "DLA",
  "USSOCOM": "SOCOM",
  "NCDOT": "NCDOT",
  "NC National Guard": "NCNG",
  "Cumberland County, NC": "Cumberland Co",
  "City of Fayetteville": "Fayetteville",
  "Cumberland County Schools": "CCSC",
  "Robeson County Schools": "RCSC",
  "Durham County, NC": "Durham Co",
  "Wake County Public Schools": "WCPSS",
  "Guilford County Schools": "GCS",
  "NC State University": "NC State",
  "UNC Chapel Hill": "UNC",
  "Virginia Beach City Public Schools, VA": "VBCPS",
  "Richmond County Schools, GA": "RCBOE",
  "Charleston County School District, SC": "CCSD",
  "Cape Fear Public Utility Authority": "CFPUA",
  "Onslow County Schools": "Onslow Co",
  "Charlotte-Mecklenburg Schools": "CMS",
};

const OPPS_BUILT: Opportunity[] = SEEDS.map(({ id, mode, scope, ...rest }) => ({
  noticeId: id,
  mode: mode ?? "prime",
  scope: scope ?? "fed",
  ...rest,
}));

export const OPPORTUNITIES: Opportunity[] = OPPS_BUILT;

export const TOTAL_OPEN_OPPORTUNITIES = 0;
export const TOTAL_STRONG_MATCHES = 0

// Mock data removed during real-data wiring — kept as an empty export so
// consumers (routes/index.tsx) still resolve the named import.
export const PRESAVED_IDS: string[] = [];

// ───── Adapter: rich Opportunity → flat CardOpportunity for the card UI ─────

export interface CardOpportunity {
  id: string;
  title: string;
  geminiPlainEnglishTitle?: string | null;
  agency: string;
  agencyAbbrev: string;
  subAgency?: string;
  workType: string;
  naicsCode?: string;
  /** NAICS taxonomy description for `naicsCode`, resolved once per rendered page
   *  by lib/useNaicsDescriptions.ts. Undefined until it resolves, and when it
   *  never does — the Scope cell then falls back to the bare code. The mapper
   *  never sets this field. */
  naicsDescription?: string;
  setAside?: string;
  value: string;
  valEstLow?: number | null;
  valEstHigh?: number | null;
  valueIsEstimate?: boolean;
  location: string;
  zip?: string;
  daysUntilClose: number;
  closeDateAbsolute: string;
  postedAt?: string; // ISO date
  matchTier: MatchTier;
  matchScore: number;
  hunterReasoning: string | null;
  aiSummary?: string | null;
  eligibilityFlag?: "qualifies" | "needs-cert" | null;
  isNew?: boolean;
  isUpdated?: boolean;
  amendedRelative?: string;
  closed?: boolean;
  mode: OppMode;
  scope: OppScope;
  partnerName?: string;
  partnerContext?: string;
  awardedValue?: string;
  prereqGated?: boolean;
  noticeType?: string | null;
  /** Opportunity category. Undefined treated as "contract". */
  category?: OppCategory;
  /** DIBBS facts — present only when category === "product_buy". */
  dibbs?: Dibbs;
}

// Stretch-mode mock data removed during real-data wiring — empty export keeps
// routes/index.tsx resolving the named import.
export const STRETCH_MODE_OPPORTUNITIES: CardOpportunity[] = [];

const MS_DAY = 86400000;

function fmtAbs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function fmtValueRange(low: number, high: number): string {
  const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
    return `$${n}`;
  };
  if (low === 0 && high === 0) return "Value not disclosed";
  if (low === high) return fmt(low);
  return `${fmt(low)} – ${fmt(high)}`;
}

export function toCardOpportunity(opp: Opportunity): CardOpportunity {
  const closesMs = new Date(opp.closesAt).getTime();
  const computedDays = Math.ceil((closesMs - NOW.getTime()) / MS_DAY);
  const closed = opp.eligibility === "closed_to_new";
  const eligibilityFlag: CardOpportunity["eligibilityFlag"] =
    opp.eligibility === "qualify" ? "qualifies" :
    opp.eligibility === "needs_cert" ? "needs-cert" : null;
  const amendedRelative = opp.amendedAt
    ? (() => {
        const h = Math.round((NOW.getTime() - new Date(opp.amendedAt!).getTime()) / 3600000);
        if (h < 1) return "Updated just now";
        if (h < 24) return `Updated ${h}h ago`;
        const d = Math.round(h / 24);
        return `Updated ${d} day${d === 1 ? "" : "s"} ago`;
      })()
    : undefined;
  // Partner mode shows the prime's awarded value; primes show the bid value range.
  const value = opp.mode === "partner" && opp.awardedValue
    ? `Awarded ${opp.awardedValue}`
    : fmtValueRange(opp.valueLow, opp.valueHigh);
  return {
    id: opp.noticeId,
    title: opp.title,
    agency: opp.agency,
    agencyAbbrev: AGENCY_ABBREV[opp.agency] ?? opp.agency,
    subAgency: opp.subAgency,
    workType: opp.workType,
    naicsCode: opp.naicsCode,
    setAside: opp.setAside,
    value,
    valueIsEstimate: false,
    location: opp.location,
    daysUntilClose: closed ? -1 : computedDays,
    closeDateAbsolute: fmtAbs(opp.closesAt),
    matchTier: opp.matchTier,
    matchScore: opp.matchScore,
    hunterReasoning: opp.hunterReasoning,
    eligibilityFlag,
    isNew: opp.newToBidders,
    isUpdated: !!opp.amendedAt,
    amendedRelative,
    closed,
    mode: opp.mode,
    scope: opp.scope,
    partnerName: opp.partnerName,
    partnerContext: opp.partnerContext,
    awardedValue: opp.awardedValue,
  };
}
