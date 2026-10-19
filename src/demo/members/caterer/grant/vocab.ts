// THE CATERER's words for Grant's generated reviews (read through src/demo/grant/vocab.ts).
// These are the sentences the generator always used; they moved here unchanged.

import { PERSONA } from "../../../story/persona";
import { COOKS, PARTNER } from "../../../grant/facts";
import type { GrantVocab } from "../../../grant/vocab";

/** Sample wage rates. They are for the demonstration and are not the Department of Labor's. */
const WAGE_ROWS: string[][] = [
  ["Occupation", "Hourly rate", "Health and welfare"],
  ["Cook I", "$14.58", "$5.36"],
  ["Cook II", "$16.24", "$5.36"],
  ["Baker", "$15.10", "$5.36"],
  ["Food Service Worker", "$11.89", "$5.36"],
  ["Dishwasher", "$11.53", "$5.36"],
  ["Driver, light truck", "$14.12", "$5.36"],
  ["Dining Facility Attendant", "$12.07", "$5.36"],
];

export const VOCAB: GrantVocab = {
  base: "your kitchen",
  crew: "your kitchen",
  teamOf: `a ${COOKS}-person kitchen`,
  peers: "caterers",
  bigWork: "federal food service work",
  nearRun: "Your two refrigerated vans can make the run in one trip.",
  farTrip: "Each event means a long haul for staff and food.",
  travelCost: "fuel and driver time",
  frontCost: "you hire and buy food",
  priceAdvice: "Price from your real food cost and the wage rates. A kitchen this close keeps delivery cost low.",
  fitsWin: "A win fits your kitchen with the staff you have.",
  canRun: `Your kitchen and your ${COOKS}-person team can run this work.`,
  fitsYou: "your kitchen and your size",
  edge: "a close kitchen and a clean record",
  cashLine: "A **bonding line** and a second crew",
  localPartner: "A local partner makes a daily run possible.",
  recordWhy: "A first federal prime near your kitchen is the record that larger buyers look for.",
  firstMatch: "Camp Mackall field meals",
  isTarget: (f) =>
    Boolean(f.opp.targetAgency) ||
    /Veterans/.test(f.opp.agency) ||
    (/Army/.test(f.opp.agency) && /Fort Bragg|Camp Mackall|Pope/.test(f.place.city)) ||
    (/Schools?/.test(f.opp.agency) && f.place.state === PERSONA.hqState),
  wide: () => null,

  cost: "your real food cost",
  insuranceLine: "No bond is asked for. Your general liability and vehicle insurance are on file, and they meet the notice.",
  nearLine: "That is close enough for your two vans.",
  farLine: "A daily run adds fuel and driver time.",
  sizeFix: "Only with a partner or more staff. A surety needs weeks to build a bond line, and a second crew takes time to hire. Open Partners to find a prime.",
  partnerHint: (opp) => (opp.agency.includes("Army") ? `${PARTNER.name} looks for woman-owned subcontractors at Fort Bragg. ` : ""),
  localQuestion: {
    question: (place) => `Could you place a **crew or a partner** near ${place}?`,
    payoff: "A yes shows whether the **daily drive** is a real limit.",
    yes: { gist: "You said you can place a crew or a partner nearby, so the distance is less of a limit.", ack: "Good. A local crew or a partner is what makes a long daily run workable. I raised my confidence." },
    no: { gist: "You cannot place a crew nearby, so the distance stays a real limit.", ack: "Then the distance stays a real limit. A partner on Partners may be the way around it. My confidence stays where it was." },
  },
  reactions: {},

  eligibility: (d) => [
    "A food service permit from the local health department.",
    ...(d.key !== "staffing" && d.key !== "construction" ? ["A food-handler certificate for each person who prepares food."] : []),
    "General liability insurance of $1M for each occurrence, commercial vehicle insurance, and workers' compensation.",
  ],
  collect: "Collect certificates, insurance proof and references.",
  attachments: "the certificates and references",
  travelRisk: "A daily run adds cost.",

  trade: "Food service",
  sizeStandard: { long: "$47.0 million", short: "$47.0M" },
  dueInClauses: () => "5:00 PM Eastern",
  clauses: () => ({}),
  extraClauses: () => [],
  wageRows: WAGE_ROWS,
};
