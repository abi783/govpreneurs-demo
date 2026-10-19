// DEMO: what each kind of contract in the story asks for. The caterer's kinds of
// food-service work are here; the agency's are in src/demo/members/agency/grant/domains.ts.
//
// The story gives every opportunity a title, a summary and facts. This file adds
// the ordinary detail that a real notice for that kind of work carries: what the
// buyer needs, what the cook must hand over, what the rules are, and what goes
// wrong. The detail page, the sample documents and Grant's analysis all read it,
// so the three never disagree.
//
// Style: short sentences, plain words, one name for one thing. A "quote" is for a
// request for quote, a "proposal" for a request for proposal, a "bid" for an
// invitation for bid, and a "reply" for sources sought.

import { byMember, own } from "@/demo/member";
import type { StoryOpportunity } from "@/demo/story/opportunities";
import type { AgencyDomainKey } from "@/demo/members/agency/grant/domains";
import type { AgencyDomainKey as ConstructionDomainKey } from "@/demo/members/construction/grant/domains";
import type { PastPerformanceId } from "@/demo/story/persona";
import { customerShort, EVENT_RANGE, MEALS_PER_DAY, PP } from "./facts";

const pack = own(
  import.meta.glob<typeof import("@/demo/members/agency/grant/domains")>("/src/demo/members/*/grant/domains.ts", { eager: true }),
);

const MEALS = MEALS_PER_DAY.toLocaleString("en-US");

export type CatererDomainKey =
  | "dining"
  | "cafe"
  | "events"
  | "school"
  | "hospital"
  | "field"
  | "boxed"
  | "senior"
  | "detention"
  | "staffing"
  | "construction";

type PackDomainKey = AgencyDomainKey | ConstructionDomainKey;

export type DomainKey = CatererDomainKey | PackDomainKey;

/** The caterer's kinds of work, by opportunity. */
const CATERER_DOMAIN_OF: Record<string, CatererDomainKey> = {
  "SP4701-26-Q-0021": "field",
  "W912EE-26-R-0066": "dining",
  "SP4701-26-R-0078": "dining",
  "FAYNC-2026-R-08": "cafe",
  "CUMCO-2026-014": "detention",
  "W912PM-26-Q-0017": "events",
  "NCNG-2026-21": "field",
  "VA247-26-R-0112": "hospital",
  "W912PM-26-Q-0033": "cafe",
  "RCSC-2026-09": "school",
  "W912EE-27-S-0004": "dining",
  "FA4800-26-Q-0044": "boxed",
  "DUR-CO-2026-12": "senior",
  "N40085-26-Q-0089": "staffing",
  "N40085-26-R-0102": "events",
  "CCSC-2026-22": "school",
  "W912PM-26-R-0058": "dining",
  "W912HN-26-Q-0014": "cafe",
  "GS04Q-26-RM-0019": "cafe",
  "N62470-26-Q-0044": "cafe",
  "W912PM-26-R-0071": "cafe",
  "VA247-26-R-0166": "hospital",
  "WCS-2026-R-44": "school",
  "W912PM-26-Q-0084": "events",
  "GCS-2026-RFP-19": "school",
  "N62470-26-R-0078": "dining",
  "NCSU-FM-26-022": "dining",
  "UNC-FAC-2026-31": "cafe",
  "FA4800-26-R-0091": "dining",
  "W912HN-26-Q-0048": "cafe",
  "W912PM-26-Q-0102": "boxed",
  "NCDOT-2026-FAC-09": "boxed",
  "VBPS-2026-RFP-14": "school",
  "CCS-2026-014": "school",
  "CFPUA-2026-31": "boxed",
  "ONSLOW-2026-22": "school",
  "W912PM-26-R-0118": "dining",
  "N62470-26-R-0153": "construction",
  "VA247-26-R-0301": "hospital",
  "CMS-CLT-2026-31": "school",
  "W912HN-26-R-0099": "dining",
  "W912DY-26-R-0091": "field",
  "RCBOE-GA-2026-7": "school",
};

/** Which kind of work each story opportunity is. A new story entry needs a line here. */
export const DOMAIN_OF: Record<string, DomainKey> = byMember<Record<string, DomainKey>>({
  pack: pack.DOMAIN_OF,
  caterer: CATERER_DOMAIN_OF,
});

export function domainOf(opp: StoryOpportunity): DomainKey {
  return DOMAIN_OF[opp.id] ?? byMember<DomainKey>({ pack: pack.DEFAULT_DOMAIN, caterer: "dining" });
}

/** The word a notice type uses for what the cook sends. */
export function offerWord(opp: StoryOpportunity): "quote" | "proposal" | "bid" | "reply" {
  switch (opp.noticeType) {
    case "Request for Quote":
    case "Combined Synopsis/Solicitation":
      return "quote";
    case "Request for Proposal":
    case "Solicitation":
      return "proposal";
    case "Invitation for Bid":
      return "bid";
    case "Sources Sought":
    case "Special Notice":
      return "reply";
  }
}

/** The buyer in two or three words, for use inside a sentence. */
export function buyerShort(opp: StoryOpportunity): string {
  const a = opp.agency;
  if (/Army/.test(a)) return "the Army";
  if (/Navy/.test(a)) return "the Navy";
  if (/Air Force/.test(a)) return "the Air Force";
  if (/Veterans/.test(a)) return "the VA";
  if (/General Services/.test(a)) return "GSA";
  if (/National Guard/.test(a)) return "the National Guard";
  if (/Transportation/.test(a)) return "NCDOT";
  if (/^City of/.test(a)) return "the city";
  if (/University/.test(a)) return "the university";
  if (/Utility/.test(a)) return "the utility";
  if (/Schools?\b|Board of Education/.test(a)) return "the school district";
  if (/County/.test(a)) return "the county";
  return a;
}

export interface Domain {
  key: DomainKey;
  /** The work, as a noun phrase: "dining facility food service". */
  service: string;
  /** One sentence on what the buyer is buying. */
  scopeLine: string;
  /** What the buyer cares about most, in one or two sentences. */
  intent: string;
  needs: string[];
  deliverables: string[];
  technical: string[];
  personnel: string[];
  risks: string[];
  /** How well the work matches the member's kitchen. */
  fit: { rating: "strong" | "good" | "watch" | "weak"; text: string; short: string };
  /** Scoring factors for a proposal, with weights that add to 100. */
  scoring: { factor: string; weight: number }[];
  /** Documents on the notice, besides the solicitation itself. */
  documents: ("pws" | "wage" | "price" | "menu" | "sites")[];
  /** Price lines on the price form. */
  priceLines: string[];
  /** Sentence about who else is likely to compete, from the public record. */
  competition: string;
  /** The past job that is the best reference. Default: by kind of work (generator.ts). */
  reference?: PastPerformanceId;
  /** Bold phrase inside `fit.text`. Default: the generator's own list. */
  fitBold?: string;
  /** What a response should lead with. Default: the rail's own list. */
  leadWith?: string;
  /** Product and service code on the page. Default: food service. */
  psc?: string;
  /** The checklist's planning line. */
  plan?: string;
}

const CATERER_DOMAINS: Record<CatererDomainKey, Domain> = {
  dining: {
    key: "dining",
    service: "dining facility food service",
    scopeLine: "The cook runs the kitchen and the serving line, and serves every meal on the schedule.",
    intent: "The buyer wants every meal served on time and safe. A failed inspection costs more than a high price.",
    needs: [
      "Cook and serve breakfast, lunch and dinner on the posted schedule.",
      "Supply the food, the staff and the cleaning supplies. The buyer supplies the building and the large equipment.",
      "Follow the weekly menu that the dining facility manager approves.",
      "Keep the serving line, the dish room and the dining area clean every day.",
    ],
    deliverables: [
      "A signed meal count sheet for every meal",
      "A 21-day cycle menu with a nutrition analysis",
      "Daily temperature and sanitation logs",
      "A monthly invoice that matches the signed counts",
    ],
    technical: [
      "A written food-safety plan based on HACCP (Hazard Analysis and Critical Control Points).",
      "Hot food at 135 degrees F or hotter. Cold food at 41 degrees F or colder.",
      "Allergen labels on every dish on the line.",
      "Pass the buyer's public health inspections with no repeat critical findings.",
    ],
    personnel: [
      "A full-time food service manager whom the buyer can name.",
      "A certified food protection manager on every shift.",
      "A background check and base access for each worker.",
    ],
    risks: [
      "The contract pays by the meal count. A low count lowers your income.",
      "Wage rates are set by a wage determination and can rise in each option year.",
      "The first 90 days are the hardest: you hire, train and buy food before the first invoice is paid.",
    ],
    fit: {
      rating: "strong",
      text: "Daily high-volume meal service is the work your kitchen already does.",
      short: "Daily meal service is your core work.",
    },
    scoring: [
      { factor: "Technical approach and staffing plan", weight: 40 },
      { factor: "Past performance on similar work", weight: 30 },
      { factor: "Price", weight: 30 },
    ],
    documents: ["pws", "wage", "price", "menu"],
    priceLines: ["Breakfast, price per meal", "Lunch, price per meal", "Dinner, price per meal", "Holiday and weekend premium, per day"],
    competition:
      "Dining contracts of this size usually draw a handful of offers, and the firm that holds the work now has the edge.",
  },
  cafe: {
    key: "cafe",
    service: "cafe and counter service",
    scopeLine: "The cook runs a cafe or counter, sells the food and keeps the area clean.",
    intent: "The buyer wants staff to eat on site, and a vendor who is there every day.",
    needs: [
      "Run the cafe or counter on the posted days and hours.",
      "Cook or prepare the food, sell it, and keep the area clean.",
      "Offer a daily menu with a hot choice, a cold choice and a healthy choice.",
      "Cater special orders when the buyer asks.",
    ],
    deliverables: [
      "A sample weekly menu with prices",
      "A daily sales report",
      "A monthly report that shows sales, waste and customer comments",
      "A staffing schedule for the counter",
    ],
    technical: [
      "A food service permit for the county where the cafe sits.",
      "A written food-safety plan (HACCP).",
      "A point-of-sale system that can report each day's sales.",
      "Allergen labels on every item.",
    ],
    personnel: [
      "An on-site manager during opening hours.",
      "A certified food protection manager on every shift.",
      "A background check for each worker.",
    ],
    risks: [
      "Sales set your income. A quiet week lowers it, so plan the menu around what staff buy.",
      "The buyer may close the site on short notice, for a holiday or a security event.",
      "A daily cafe needs steady staff. Hiring for early shifts takes time.",
    ],
    fit: {
      rating: "good",
      text: "Cafe work uses your kitchen and your event menus. A daily counter is new for you.",
      short: "Your menus fit. A daily counter is new.",
    },
    scoring: [
      { factor: "Approach and sample menu", weight: 40 },
      { factor: "Experience", weight: 30 },
      { factor: "Price", weight: 30 },
    ],
    documents: ["pws", "price", "menu"],
    priceLines: ["Cafe management fee, per month", "Event catering, price per guest", "Special orders, price per guest"],
    competition: "Cafe contracts draw local caterers and a few regional firms. The current vendor often bids again.",
  },
  events: {
    key: "events",
    service: "event and ceremony catering",
    scopeLine: "The cook plans, cooks, serves and cleans up for events of different sizes.",
    intent: "The buyer wants every event to run without a surprise. Guests and commanders notice mistakes.",
    needs: [
      "Cater events from small meetings to large dinners, on short notice.",
      "Plan the menu, cook the food, set up the room, serve the guests and clean up.",
      "Offer menus for different diets, including halal, vegetarian and allergen-free.",
      "Quote each event from a price list and deliver on the date.",
    ],
    deliverables: [
      "A menu and a price list for each size of event",
      "A written plan for each event: staff, timing, equipment",
      "An invoice for each event, with the guest count",
      "A follow-up note on problems and fixes",
    ],
    technical: [
      "A food service permit for the county.",
      "Hot and cold holding equipment that works away from your kitchen.",
      "Servers, linens, tables and chairs, or a rental partner who has them.",
      "A written food-safety plan (HACCP).",
    ],
    personnel: [
      "An event lead who stays on site for the whole event.",
      "Servers and cooks sized to the guest count.",
      "Base access for each worker, with a background check.",
    ],
    risks: [
      "Event sizes change at the last minute. Price the largest events with care.",
      "Many events fall on weekends and holidays. Overtime raises your cost.",
      "A late or cold meal at a ceremony is a reputation risk with the unit.",
    ],
    fit: {
      rating: "strong",
      text: `Event catering is your strongest work. You cooked for events of ${EVENT_RANGE}.`,
      short: "Event catering is your strongest work.",
    },
    scoring: [
      { factor: "Event approach and menus", weight: 40 },
      { factor: "Past performance on events", weight: 30 },
      { factor: "Price", weight: 30 },
    ],
    documents: ["pws", "price", "menu"],
    priceLines: ["Reception, price per guest", "Plated dinner, price per guest", "Buffet dinner, price per guest", "Server staffing, price per hour"],
    competition: "Event catering draws many local caterers.",
  },
  school: {
    key: "school",
    service: "school meal service",
    scopeLine: "The cook prepares breakfast and lunch to the USDA meal pattern on school days.",
    intent: "The school wants meals that meet the USDA rules and that children eat.",
    needs: [
      "Prepare breakfast and lunch on school days to the USDA meal pattern.",
      "Serve or deliver the meals to each school on time.",
      "Offer choices that meet calorie, sodium and whole-grain limits.",
      "Track every meal for the school's reimbursement claim.",
    ],
    deliverables: [
      "A monthly menu approved by the school's nutrition director",
      "Daily production and meal count records",
      "Temperature logs for every school and every meal",
      "A monthly invoice and a count for the reimbursement claim",
    ],
    technical: [
      "Menus that follow the USDA meal pattern for each grade group.",
      "Allergen and special-diet menus with a doctor's note on file.",
      "A written food-safety plan (HACCP) and a school health inspection.",
      "Equipment that holds food hot and cold through service.",
    ],
    personnel: [
      "A site manager at each school.",
      "A certified food protection manager on every shift.",
      "A background check for each worker who works near children.",
    ],
    risks: [
      "The school year has fixed dates. A late meal affects the whole day's schedule.",
      "Student counts change each month. Price per meal, not per month.",
      "The USDA reviews records. A gap in the records can cost the school its reimbursement.",
    ],
    fit: {
      rating: "strong",
      text: `You cooked ${MEALS} meals a day to USDA meal patterns for ${PP.county.customerName}.`,
      short: "You already cook to USDA meal patterns.",
    },
    scoring: [
      { factor: "Meal quality and menu plan", weight: 35 },
      { factor: "Past performance with schools", weight: 30 },
      { factor: "Price", weight: 35 },
    ],
    documents: ["pws", "price", "menu"],
    priceLines: ["Breakfast, price per meal", "Lunch, price per meal", "Snack, price per meal", "Special-diet meal, price per meal"],
    competition: "School meals draw national food service firms and local caterers. Local firms win on service.",
  },
  hospital: {
    key: "hospital",
    service: "patient meal service",
    scopeLine: "The cook prepares patient meals to a dietitian's order and delivers them to the ward.",
    intent: "The hospital wants the right diet on the right tray, every time.",
    needs: [
      "Prepare patient meals to the dietitian's order for each patient.",
      "Cook renal, diabetic, low-sodium and texture-modified diets.",
      "Deliver trays to the wards on the posted schedule and keep them at the right temperature.",
      "Work with the hospital dietitians to fix diet errors the same day.",
    ],
    deliverables: [
      "Trays labeled with the patient, the diet and the allergens",
      "A temperature check at each tray line",
      "A daily count of trays by diet type",
      "A monthly quality report for the dietitians",
    ],
    technical: [
      "Therapeutic diets that follow the hospital diet manual.",
      "Texture-modified food (pureed, minced, mechanical soft) that is safe to swallow.",
      "A written food-safety plan (HACCP) and tray-line temperature checks every service.",
      "Insulated carts or a delivery van that keeps trays hot and cold.",
    ],
    personnel: [
      "A lead cook with therapeutic diet experience.",
      "A tray-line team with food-handler certificates.",
      "A background check and a health screening for each worker.",
    ],
    risks: [
      "A diet error can harm a patient. The buyer will check your process closely.",
      "Tray timing is strict. A late tray affects care.",
      "Federal buyers ask for a past performance rating. Yours may not be filed yet.",
    ],
    fit: {
      rating: "good",
      text: `You delivered therapeutic diet trays at ${customerShort(PP.womack)}. That is direct proof.`,
      short: `${customerShort(PP.womack)} proves you can run therapeutic diets.`,
    },
    scoring: [
      { factor: "Diet safety and quality plan", weight: 40 },
      { factor: "Past performance on patient meals", weight: 35 },
      { factor: "Price", weight: 25 },
    ],
    documents: ["pws", "wage", "price", "menu"],
    priceLines: ["Patient tray, price per tray", "Modified-texture tray, price per tray", "Nourishment and snack, price per patient day"],
    competition: "Patient meal work draws a few specialist firms. Few small caterers can show therapeutic diet records.",
  },
  field: {
    key: "field",
    service: "hot meals delivered to a field site",
    scopeLine: "The cook prepares hot meals and delivers them in insulated containers to the field.",
    intent: "The unit wants hot meals in the field without running its own field kitchen. On-time delivery matters most.",
    needs: [
      "Cook and pack hot meals, and deliver them to the drop points on the posted schedule.",
      "Keep the food hot, at 135 degrees F or hotter, until the unit serves it.",
      "Confirm the headcount 72 hours ahead of each delivery.",
      "Take back the empty containers and trash after each meal.",
    ],
    deliverables: [
      "A signed delivery ticket for each drop",
      "A temperature log for each delivery",
      "A rotation menu approved by the unit",
      "A monthly invoice that matches the delivery tickets",
    ],
    technical: [
      "Insulated food containers that hold temperature for at least four hours.",
      "A delivery vehicle that can reach the drop points on the posted schedule.",
      "A written food-safety plan (HACCP) for packing, transport and holding.",
      "Allergen labels on every container.",
    ],
    personnel: [
      "A rotation manager whom the unit can call at any hour.",
      "A food-handler certificate for every cook.",
      "A driver with a clean record and base access.",
    ],
    risks: [
      "Delivery times can be 5:30 AM. That means a 3:30 AM start for the kitchen.",
      "Dates and headcounts change at short notice.",
      "A late or cold meal in the field is the failure the unit remembers.",
    ],
    fit: {
      rating: "strong",
      text: "Field meals are cook, pack and deliver. That is your food-service code and your mobile food code.",
      short: "Field meals are cook, pack and deliver.",
    },
    scoring: [
      { factor: "Delivery plan and reliability", weight: 40 },
      { factor: "Menu variety and food quality", weight: 25 },
      { factor: "Price", weight: 35 },
    ],
    documents: ["pws", "wage", "price", "sites"],
    priceLines: ["Hot breakfast, price per meal", "Hot dinner, price per meal", "Box lunch, price per meal", "Delivery to a second drop point, per trip"],
    competition: "Field meal work draws regional caterers.",
  },
  boxed: {
    key: "boxed",
    service: "boxed and packed meals",
    scopeLine: "The cook packs meals in boxes and delivers them to the door at the posted time.",
    intent: "The crew wants a boxed meal at the door at the stated time, every time.",
    needs: [
      "Pack meals in boxes or bags, labeled, and deliver them by the posted time.",
      "Take orders the day before and confirm the count.",
      "Offer a standard box and a box for special diets.",
      "Deliver to each site on the route and collect any returns.",
    ],
    deliverables: [
      "A signed delivery ticket for each stop",
      "A daily order and delivery log",
      "A weekly menu with the allergens listed",
      "A monthly invoice that matches the tickets",
    ],
    technical: [
      "Packaging that keeps hot and cold food at safe temperatures.",
      "A refrigerated or insulated delivery van.",
      "A written food-safety plan (HACCP) for packing and transport.",
      "Lot or date labels on every box.",
    ],
    personnel: [
      "A packing lead and a driver for each route.",
      "A food-handler certificate for every cook and packer.",
      "A background check for each driver if the site is secure.",
    ],
    risks: [
      "Early delivery times mean an overnight or pre-dawn kitchen shift.",
      "The route can be long. Fuel and driver time raise your cost.",
      "Late orders and returns waste food. Set a firm cutoff in your plan.",
    ],
    fit: {
      rating: "good",
      text: "Boxed meals sit in your mobile food-service code, and your two vans can run a route.",
      short: "Boxed meals fit your vans and your code.",
    },
    scoring: [
      { factor: "Delivery plan and reliability", weight: 40 },
      { factor: "Past performance", weight: 25 },
      { factor: "Price", weight: 35 },
    ],
    documents: ["pws", "price", "menu", "sites"],
    priceLines: ["Boxed breakfast, price per box", "Boxed lunch, price per box", "Special-diet box, price per box", "Extra delivery stop, per trip"],
    competition: "Boxed meal work draws many small caterers. Price and route time decide it.",
  },
  senior: {
    key: "senior",
    service: "senior nutrition meals",
    scopeLine: "The cook prepares hot lunches for older adults and delivers some meals to homes.",
    intent: "The county wants hot, safe lunches that older adults want to eat, delivered on time.",
    needs: [
      "Prepare hot lunches that meet the older adult nutrition rules.",
      "Deliver the lunches to each senior center before service.",
      "Pack and deliver a smaller number of meals to homes.",
      "Offer diabetic, low-sodium and soft-food choices.",
    ],
    deliverables: [
      "A monthly menu approved by a registered dietitian",
      "A daily count of meals by site",
      "Temperature logs at each delivery",
      "A monthly invoice and the reports the state requires",
    ],
    technical: [
      "Menus that meet the state's older adult nutrition standards.",
      "Hot and cold holding equipment for each delivery.",
      "A written food-safety plan (HACCP).",
      "Allergen and special-diet labels.",
    ],
    personnel: [
      "A lead cook and a delivery driver.",
      "A food-handler certificate for every cook.",
      "A background check for each driver who goes to homes.",
    ],
    risks: [
      "The route between the centers is long. Drive time raises your cost.",
      "Meal counts change with the weather and the month.",
      "A cold meal reaches people who may have little else to eat that day.",
    ],
    fit: {
      rating: "good",
      text: "Batch cooking and delivery are your work. Older adult nutrition rules are new for you.",
      short: "Batch cooking fits. The nutrition rules are new.",
    },
    scoring: [
      { factor: "Menu and nutrition plan", weight: 35 },
      { factor: "Past performance", weight: 30 },
      { factor: "Price", weight: 35 },
    ],
    documents: ["pws", "price", "menu", "sites"],
    priceLines: ["Congregate lunch, price per meal", "Home-delivered meal, price per meal", "Special-diet meal, price per meal"],
    competition: "Senior meal work draws regional caterers and a few non-profit kitchens.",
  },
  detention: {
    key: "detention",
    service: "detention center meals",
    scopeLine: "The cook prepares three meals a day off site and delivers them hot to the annex.",
    intent: "The county wants reliable, safe, low-cost meals with no surprises.",
    needs: [
      "Prepare breakfast, lunch and dinner off site and deliver them hot to the annex.",
      "Meet the state jail standards for calories and diets.",
      "Offer medical, religious and allergen diets when the jail orders them.",
      "Count the meals with the jail staff at each delivery.",
    ],
    deliverables: [
      "A signed delivery ticket for every meal",
      "A temperature log for every delivery",
      "A cycle menu approved by a dietitian",
      "A monthly invoice that matches the signed counts",
    ],
    technical: [
      "Insulated carts that hold food at 135 degrees F or hotter.",
      "Tamper-evident trays and approved utensils for a secure site.",
      "A written food-safety plan (HACCP).",
      "A county food service permit for the preparation kitchen.",
    ],
    personnel: [
      "A food-handler certificate for every cook.",
      "A background check and an entry badge for each driver.",
      "A lead cook for the contract.",
    ],
    risks: [
      "A sealed bid is decided on price. Thin margins leave no room for waste.",
      "Entry to a secure site takes time. Late deliveries start a chain of problems.",
      "A single missed meal is a serious event for the county.",
    ],
    fit: {
      rating: "strong",
      text: "Hot meals cooked off site and delivered three times a day are your work.",
      short: "Hot meals, cooked off site and delivered.",
    },
    scoring: [{ factor: "Lowest price from a qualified bidder", weight: 100 }],
    documents: ["pws", "price", "menu", "sites"],
    priceLines: ["Breakfast, price per meal", "Lunch, price per meal", "Dinner, price per meal", "Special-diet meal, price per meal"],
    competition: "Sealed bids for jail meals draw national and regional firms. Price decides it.",
  },
  staffing: {
    key: "staffing",
    service: "mess attendant staffing",
    scopeLine: "The contractor supplies workers for the dish room, serving line and cleaning. There is no cooking.",
    intent: "The buyer wants people at the dish line and serving line, not a kitchen.",
    needs: [
      "Supply mess attendants for the dish room, the serving line and cleaning.",
      "Cover every shift at every facility on the posted schedule.",
      "Replace a missing worker the same day.",
      "Follow the facility's sanitation rules.",
    ],
    deliverables: [
      "A daily roster of workers at each facility",
      "A timesheet for each worker, signed by the facility manager",
      "A monthly invoice by labor hour",
      "A quality control report",
    ],
    technical: [
      "A labor management system that tracks hours at each facility.",
      "Uniforms and non-slip shoes for each worker.",
      "Training on sanitation before the first shift.",
    ],
    personnel: [
      "A site supervisor for each group of facilities.",
      "A background check and base access for every worker.",
      "A food-handler certificate for every worker.",
    ],
    risks: [
      "This is a staffing contract. It does not use a kitchen.",
      "Margins come from labor, and wage rates are set by a wage determination.",
      "Twelve sites need many workers on short notice.",
    ],
    fit: {
      rating: "weak",
      text: "This is staffing, not cooking. It does not use your kitchen or your menus.",
      short: "Staffing does not use your kitchen.",
    },
    scoring: [
      { factor: "Staffing and replacement plan", weight: 35 },
      { factor: "Past performance on staffing", weight: 30 },
      { factor: "Price", weight: 35 },
    ],
    documents: ["pws", "wage", "price"],
    priceLines: ["Mess attendant, price per labor hour", "Site supervisor, price per labor hour", "Overtime, price per labor hour"],
    competition: "Staffing work draws national labor firms. Margins are thin and price decides it.",
  },
  construction: {
    key: "construction",
    service: "galley design, build and food service",
    scopeLine: "The contractor designs and builds a new galley, then runs the food service in it.",
    intent: "The buyer wants one firm to build the galley and run it.",
    needs: [
      "Design and build a new galley to the Navy's standard.",
      "Equip the galley and pass the commissioning inspection.",
      "Run the food service in the new galley for the contract term.",
      "Keep the old galley open while the work is done.",
    ],
    deliverables: [
      "Design drawings and a construction schedule",
      "Commissioning records and training for the staff",
      "Daily meal counts once the galley is open",
      "Monthly invoices for the food service",
    ],
    technical: [
      "A licensed general contractor and licensed trades.",
      "Performance and payment bonds on the construction work.",
      "A written food-safety plan (HACCP) for the new galley.",
    ],
    personnel: [
      "A project manager and a licensed superintendent.",
      "A food service manager for the operating years.",
      "A background check and base access for every worker.",
    ],
    risks: [
      "Construction and food service are two different businesses in one contract.",
      "The bond for the build is many times your largest bond.",
      "Construction delays push back the date you start to earn.",
    ],
    fit: {
      rating: "weak",
      text: "The build half of this contract is outside your business.",
      short: "The build half is outside your business.",
    },
    scoring: [
      { factor: "Design and build approach", weight: 40 },
      { factor: "Past performance on both parts", weight: 35 },
      { factor: "Price", weight: 25 },
    ],
    documents: ["pws", "wage", "price"],
    priceLines: ["Design and construction, lump sum", "Equipment, lump sum", "Food service, price per meal"],
    competition: "Design-build galley work draws large construction and food service teams.",
  },
};

// The pack on stage brings only its own keys.
const DOMAINS = { ...CATERER_DOMAINS, ...pack.DOMAINS } as Record<DomainKey, Domain>;

export function domainFor(opp: StoryOpportunity): Domain {
  return DOMAINS[domainOf(opp)];
}

export { DOMAINS };
