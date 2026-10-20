// THE CONTRACTOR's kinds of work (read through src/demo/grant/domains.ts).
//
// What a real notice for each kind of building work asks for: the buyer's needs,
// what the contractor hands over, the rules and what goes wrong. The detail page,
// the sample documents and Grant's generated reviews read it. Every claim about
// Ninebark Builders must be true of persona.ts: two electrical crews, two HVAC
// crews, a carpentry crew, bonded to $1.5M a job and $4M in total.

import type { Domain } from "../../../grant/domains";

/** Named as the agency's type is, so the shared code can read either member's keys. */
export type AgencyDomainKey = "hvac" | "electrical" | "repair" | "designBuild" | "specialty";

/** The kind of work a story opportunity is when DOMAIN_OF does not name it. */
export const DEFAULT_DOMAIN: AgencyDomainKey = "repair";

/** Which kind of work each of the contractor's opportunities is. A new story entry needs a line here. */
export const DOMAIN_OF: Record<string, AgencyDomainKey> = {
  W912PM27B0004: "hvac",
  FA445227Q0007: "hvac",
  "W91247-27-R-0019": "hvac",
  "W91247-27-R-0007": "repair",
  "36C24627B0012": "hvac",
  "W91247-27-Q-0031": "electrical",
  W912PM27B0006: "hvac",
  "6973GH-27-R-00031": "hvac",
  "27-0118": "electrical",
  "173-27004": "hvac",
  "FTCC-IFB-27-03": "hvac",
  "B27-014": "electrical",
  W912HN27R4012: "repair",
  "36C24627B0009": "hvac",
  "W91247-27-Q-0044": "hvac",
  FA480927Q0014: "hvac",
  N4008527R0031: "electrical",
  "W91247-27-R-0026": "specialty",
  "36C77627R0015": "repair",
  W912PM27R0004: "designBuild",
  "B27-021": "hvac",
  "DAC-27-0412": "electrical",
  "CC-27-06": "hvac",
  "CC-27-09": "specialty",
  "PWC-2627-14": "specialty",
};

// No "price" document: the shared price schedule prints a base year and option
// years, and a construction job is priced once, by line item.

/** Repair or alteration of buildings: the code most of her federal notices carry. */
const REPAIR_PSC = "Z2JZ (Repair or alteration of miscellaneous buildings)";

export const DOMAINS: Record<AgencyDomainKey, Domain> = {
  hvac: {
    key: "hvac",
    service: "HVAC replacement",
    scopeLine: "The contractor takes out the old heating and cooling equipment, sets the new units, connects the piping, power and controls, and starts the system up.",
    intent: "The buyer wants the building heated and cooled through the work, with the fewest outages. A system that is started up, balanced and handed over with its papers counts more than a fast install.",
    needs: [
      "Take out the old units, piping and controls that the drawings show.",
      "Set and connect the new equipment, with the power and controls it needs.",
      "Keep the building in use: book each outage ahead and keep the spaces cool or warm while the work goes on.",
      "Start up, test and balance the system, then train the building staff.",
    ],
    deliverables: [
      "Equipment submittals for approval before anything is ordered",
      "A phasing plan and an outage schedule",
      "Test, adjust and balance reports",
      "As-built drawings, warranties and the operating manuals",
    ],
    technical: [
      "Equipment that matches the specifications, or an approved equal.",
      "Refrigerant handled by EPA-certified technicians.",
      "Controls tied into the building's existing system.",
      "Work to the current mechanical and electrical codes.",
    ],
    personnel: [
      "A superintendent on site every work day.",
      "A quality control manager who reviews each step.",
      "A site safety officer, and a background check and base pass for each worker on a federal site.",
    ],
    risks: [
      "Equipment lead times can run longer than the schedule. Get the dates in writing before you price.",
      "Outages in an occupied building are booked days ahead. A missed window costs crew days.",
      "Old ductwork and piping hide surprises. Walk the site before you bid.",
    ],
    fit: {
      rating: "strong",
      text: "HVAC replacement is one of your codes, and your two HVAC crews do it every month, with your own electricians on the power.",
      short: "HVAC replacement is your crews' work.",
    },
    fitBold: "your two HVAC crews do it every month",
    scoring: [
      { factor: "Technical approach and schedule", weight: 40 },
      { factor: "Past performance on similar jobs", weight: 30 },
      { factor: "Price", weight: 30 },
    ],
    documents: ["pws", "wage"],
    priceLines: ["Demolition and removal, lump sum", "HVAC equipment and installation, lump sum", "Controls, lump sum", "Testing, balancing and closeout, lump sum"],
    competition: "HVAC replacements of this size draw local mechanical contractors and small general contractors.",
    reference: "pp-pope-office-hvac",
    leadWith: "your Pope job: the same kind of work, rated Very Good",
    psc: REPAIR_PSC,
    plan: "Write a phasing plan with the outage dates and the equipment lead times.",
  },
  electrical: {
    key: "electrical",
    service: "electrical upgrade",
    scopeLine: "The contractor replaces the electrical service, panels, wiring or lighting the drawings show, and tests every circuit before it goes live.",
    intent: "The buyer wants the new power in place with short, planned outages. Safe work and a clean test record count more than speed.",
    needs: [
      "Take out the old service, panels or fixtures the drawings show.",
      "Install the new equipment, feeders and circuits.",
      "Plan each outage with the building staff, with temporary power where the work needs it.",
      "Test every circuit and label every panel before handover.",
    ],
    deliverables: [
      "Submittals for the switchgear, panels and fixtures",
      "An outage plan with dates",
      "Test reports for every circuit",
      "As-built drawings and updated panel schedules",
    ],
    technical: [
      "Work to the National Electrical Code and the buyer's standards.",
      "Licensed electricians on every crew.",
      "Lockout and tagout on every circuit before work starts.",
      "Equipment that matches the specifications, or an approved equal.",
    ],
    personnel: [
      "A licensed electrical contractor and a superintendent on site.",
      "A quality control manager.",
      "A background check and base pass for each worker on a federal site.",
    ],
    risks: [
      "Switchgear lead times can run months. Order early or plan around them.",
      "An outage that runs long shuts the building. Have temporary power ready.",
      "Old wiring can be worse than the drawings show. Walk the site before you bid.",
    ],
    fit: {
      rating: "strong",
      text: "Electrical work is one of your codes, and your two electrical crews do service upgrades and panels every month.",
      short: "Electrical work is your crews' work.",
    },
    fitBold: "your two electrical crews do service upgrades and panels every month",
    scoring: [
      { factor: "Technical approach and outage plan", weight: 40 },
      { factor: "Past performance on similar jobs", weight: 30 },
      { factor: "Price", weight: 30 },
    ],
    documents: ["pws", "wage"],
    priceLines: ["Demolition and removal, lump sum", "Electrical equipment and installation, lump sum", "Temporary power, lump sum", "Testing and closeout, lump sum"],
    competition: "Electrical upgrades of this size draw local electrical contractors and small general contractors.",
    reference: "pp-turnrow-barracks-electrical",
    leadWith: "your Fort Bragg barracks electrical work and your Pope panel job",
    psc: REPAIR_PSC,
    plan: "Write an outage plan with the dates and the switchgear lead time.",
  },
  repair: {
    key: "repair",
    service: "building repair and renovation",
    scopeLine: "The contractor repairs and renovates the building the drawings show, running every trade from start to closeout.",
    intent: "The buyer wants the building back in use on schedule, with the work done once. A contractor who manages every trade and the paperwork counts most.",
    needs: [
      "Run the whole job as general contractor, with every trade on one schedule.",
      "Repair or replace the building systems and finishes the drawings show.",
      "Keep the site safe and clean, and protect the parts of the building in use.",
      "Close out with inspections, as-built drawings and warranties.",
    ],
    deliverables: [
      "A schedule and a submittal register",
      "Daily reports and a quality control log",
      "Monthly payment requests with certified payrolls",
      "As-built drawings, warranties and the closeout papers",
    ],
    technical: [
      "Work to the current building codes and the buyer's standards.",
      "Performance and payment bonds on federal work over $150,000.",
      "Certified payrolls under the wage decision on federal work.",
      "A written safety plan and a quality control plan.",
    ],
    personnel: [
      "A project manager and a superintendent on site every work day.",
      "A quality control manager.",
      "A site safety officer, and a background check and base pass for each worker.",
    ],
    risks: [
      "A job this size ties up bond room. Check your single and total limits first.",
      "Subcontractor prices can move between bid and award. Get quotes held for 90 days.",
      "Progress payments come monthly, after the work. Plan the cash for the first two months.",
    ],
    fit: {
      rating: "good",
      text: "Building repair is your primary code. You self-perform the electrical and HVAC work and would sub out the rest.",
      short: "Building repair is your primary code.",
    },
    fitBold: "You self-perform the electrical and HVAC work",
    scoring: [
      { factor: "Technical approach and schedule", weight: 35 },
      { factor: "Past performance on similar jobs", weight: 35 },
      { factor: "Price", weight: 30 },
    ],
    documents: ["pws", "wage"],
    priceLines: ["General conditions, lump sum", "Demolition, lump sum", "Building work, lump sum", "Mechanical and electrical work, lump sum"],
    competition: "Building repairs draw general contractors from across the region. The larger ones have bigger bond lines.",
    reference: "pp-tallow-branch-medical",
    leadWith: "your Pope job and the trades you self-perform",
    psc: REPAIR_PSC,
    plan: "Write a schedule with each trade and the bond you need.",
  },
  designBuild: {
    key: "designBuild",
    service: "design-build construction",
    scopeLine: "The contractor designs and builds a new facility, with its own architects and engineers on the team.",
    intent: "The buyer wants one firm to own the design and the build. A team with a design record and a large bond line counts most.",
    needs: [
      "Hire the architects and engineers and design the facility.",
      "Build it to the approved design, with every trade.",
      "Run the design reviews with the buyer at each stage.",
      "Commission the systems and hand the building over.",
    ],
    deliverables: [
      "Design packages at each review stage",
      "A schedule and a submittal register",
      "Commissioning reports",
      "As-built drawings, warranties and the closeout papers",
    ],
    technical: [
      "Licensed architects and engineers on the team.",
      "Performance and payment bonds for the full price.",
      "Work to the buyer's design standards and the building codes.",
      "A written safety plan and a quality control plan.",
    ],
    personnel: [
      "A design manager and a project manager.",
      "A superintendent and a quality control manager.",
      "A site safety officer.",
    ],
    risks: [
      "The bond is for the full price, many times a small firm's line.",
      "Design costs are spent before the first building payment.",
      "Design changes late in the job can wipe out the margin.",
    ],
    fit: {
      rating: "weak",
      text: "Design-build at this scale needs a design team and a bond line many times yours.",
      short: "Design-build at this scale is outside your size.",
    },
    fitBold: "a bond line many times yours",
    scoring: [
      { factor: "Design and technical approach", weight: 40 },
      { factor: "Past performance on design-build", weight: 35 },
      { factor: "Price", weight: 25 },
    ],
    documents: ["pws", "wage"],
    priceLines: ["Design, lump sum", "Construction, lump sum", "Commissioning, lump sum"],
    competition: "Design-build facilities draw regional and national builders with design teams on staff.",
    reference: "pp-tallow-branch-medical",
    leadWith: "the electrical and HVAC package you could sub to the winner",
    psc: "Y1JZ (Construction of miscellaneous buildings)",
    plan: "Find out which builders are bidding, and offer them your electrical and HVAC package.",
  },
  specialty: {
    key: "specialty",
    service: "specialty trade work",
    scopeLine: "The contractor does work for a specialty trade the notice names, with that trade's licenses and factory training.",
    intent: "The buyer wants a firm that does this one trade every day. Licenses and the maker's training count most.",
    needs: [
      "Do the specialty work the notice names.",
      "Supply the parts and the trained technicians.",
      "Inspect and test the work to the trade's standards.",
      "Keep records of every visit and repair.",
    ],
    deliverables: [
      "A work plan and a schedule",
      "Inspection and test records",
      "Parts lists and warranties",
      "A closeout report",
    ],
    technical: [
      "The trade's own license and inspections.",
      "Technicians trained by the equipment's maker.",
      "Parts that match the existing equipment.",
      "Work to the trade's codes and the buyer's standards.",
    ],
    personnel: [
      "A licensed lead for the trade.",
      "Trained technicians.",
      "A background check for each worker on site.",
    ],
    risks: [
      "The trade's license and training take months to get.",
      "Parts for older equipment can be hard to find.",
      "A firm outside the trade would sub nearly all of it.",
    ],
    fit: {
      rating: "weak",
      text: "This is a specialty trade you don't do. Your crews are electrical, HVAC and carpentry.",
      short: "This is a trade you don't do.",
    },
    fitBold: "a specialty trade you don't do",
    scoring: [
      { factor: "Technical approach", weight: 40 },
      { factor: "Past performance in the trade", weight: 35 },
      { factor: "Price", weight: 25 },
    ],
    documents: ["pws"],
    priceLines: ["Labor, lump sum", "Parts and materials, lump sum", "Testing, lump sum"],
    competition: "Specialty work draws the firms that do that one trade.",
    leadWith: "a partner who does the trade every day",
    psc: REPAIR_PSC,
    plan: "Skip it, or ask a firm in the trade whether it needs electrical help.",
  },
};
