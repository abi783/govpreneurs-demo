// Verbatim from the GovPreneurs funnel's co-checklist.js `sections` array.
export interface CoChecklistSection {
  num: number;
  title: string;
  label: string;
  intro: string;
  miss: string;
  items: string[];
}

export const CO_CHECKLIST_SECTIONS: CoChecklistSection[] = [
  {
    num: 1,
    title: "Can you be found?",
    label: "Pre-Qualification",
    intro:
      "Before reading a single word of your proposal, a contracting officer runs an automatic check. If you fail here, your proposal is eliminated without anyone looking at it.",
    miss: "An expired SAM registration or wrong NAICS code disqualifies your proposal before anyone reads it. This check takes seconds and is entirely automatic.",
    items: [
      "My SAM.gov registration is active with no exclusions or debarments",
      "My business is in good legal and financial standing",
      "My NAICS code matches this specific contract opportunity",
      "If this is a set-aside contract, my business qualifies for that set-aside",
    ],
  },
  {
    num: 2,
    title: "Did you complete your full SAM profile?",
    label: "SAM Representations & Certifications",
    intro:
      "Most businesses register on SAM.gov and stop. Inside SAM there is an entire section called Representations and Certifications that must be fully completed before you can legally receive a government contract. Most first-timers never find it.",
    miss: "Registering on SAM and assuming you are done. The representations and certifications section is a separate requirement — and it is mandatory. Leaving it blank or incomplete can disqualify your business even if everything else is in order.",
    items: [
      "I have completed the Representations and Certifications section inside SAM.gov",
      "My business size, revenue, and employee count are accurately reflected in SAM",
      "My small business status is confirmed for the NAICS code on this opportunity",
      "My SAM profile has been reviewed and updated in the last 12 months",
    ],
  },
  {
    num: 3,
    title: "Are you actually small enough?",
    label: "Small Business Size Standard",
    intro:
      "Being a small business is not a single standard. The government defines small business differently depending on the contract category. For one NAICS code the limit might be $8 million in annual revenue. For another it could be 500 employees. You must verify your size against the specific code used in each opportunity.",
    miss: "Assuming small business status is universal. A business that qualifies as small for one contract may not qualify for another. This is one of the most common and costly surprises in government contracting.",
    items: [
      "I know the size standard for the specific NAICS code on this opportunity",
      "My business revenue or employee count falls within that size limit",
      "If I have set-aside certifications, they are current and active",
      "I have verified my size status specifically for this opportunity — not just in general",
    ],
  },
  {
    num: 4,
    title: "Do you understand the work?",
    label: "Technical Approach",
    intro:
      "A contracting officer scores how well your proposal responds to the specific requirement in front of them. Generic proposals fail here even when the business is fully qualified.",
    miss: "Copying and pasting from a previous proposal. A contracting officer wants to see that you read and understood this specific opportunity — what it requires, when it is due, and how your approach fits.",
    items: [
      "My proposal directly responds to this Statement of Work — not a generic version",
      "I explain HOW I will do the work, not just WHAT I will do",
      "My approach is realistic for the timeline and requirements of this specific contract",
      "I have identified potential risks and explained how I will handle them",
      "My proposal is complete with no unanswered sections or missing requirements",
    ],
  },
  {
    num: 5,
    title: "Can you prove you've done it before?",
    label: "Past Performance",
    intro:
      "Past performance is one of the most heavily weighted evaluation factors in government contracting. A contracting officer needs evidence — not claims — that your business can deliver.",
    miss: "Writing 'we have extensive experience in this area' with no documentation. Contracting officers need specifics — who hired you, what you did, how much it was worth, and what the outcome was. Vague statements do not count.",
    items: [
      "I have documented experience in a similar scope of work",
      "I have at least one verifiable reference from a past project I can provide",
      "My past work is relevant to this contract — same industry, similar size, comparable scope",
      "I can demonstrate measurable results from past work, not just a list of clients",
    ],
  },
  {
    num: 6,
    title: "Who will actually do the work?",
    label: "Key Personnel & Staffing",
    intro:
      "For most contracts, a contracting officer wants to know who specifically is delivering the work — not just that your company will handle it. Named individuals, their qualifications, and their availability are evaluated.",
    miss: "Saying 'our team will handle it' without naming anyone. Contracting officers want to see who is doing the work, what their background is, and why they are qualified for this specific contract.",
    items: [
      "I can name the specific people who will lead and deliver this contract",
      "Those key personnel have directly relevant experience and qualifications",
      "I have current resumes or bios ready for key personnel",
      "My staffing plan is realistic for the scope, timeline, and budget of this contract",
    ],
  },
  {
    num: 7,
    title: "Can your business actually deliver?",
    label: "Responsibility Determination",
    intro:
      "Before awarding a contract, a contracting officer must formally determine that your business is responsible — meaning you have the capacity, finances, and resources to actually perform the work.",
    miss: "Winning a contract you cannot sustain. A contracting officer evaluates your real-world ability to perform — not just how your proposal reads. Financial instability or lack of resources can disqualify you even after a strong proposal.",
    items: [
      "My business has the staff, equipment, or resources needed to perform this contract",
      "My finances are stable enough to sustain the work without interruption",
      "I have the required licenses, certifications, or credentials for this contract type",
      "There is a clear management plan for how the work will be overseen day to day",
      "I can mobilize and begin work within the timeline the contract requires",
    ],
  },
  {
    num: 8,
    title: "Do you have the right insurance?",
    label: "Insurance & Bonding",
    intro:
      "Most government contracts require specific types of insurance at specific coverage amounts. General business insurance is usually not enough. You must have the right coverage in place before you can sign a contract or begin work.",
    miss: "Having some insurance but not the right kind. Many businesses win a contract and then discover their coverage does not meet the requirements. Finding out after award creates serious problems and delays.",
    items: [
      "I have general liability insurance currently active for my business",
      "I know what specific insurance types and minimum coverage amounts this contract requires",
      "My insurance certificates are current and ready to be provided upon request",
      "If bonding is required for this contract, I know my bonding capacity and have verified I qualify",
    ],
  },
  {
    num: 9,
    title: "Can you show your work will meet standards?",
    label: "Quality Control",
    intro:
      "For service contracts especially, a contracting officer looks for a documented quality control process — evidence that you have a structured way to ensure your deliverables meet the required standard. Good intentions are not enough.",
    miss: "Submitting a proposal that says 'we are committed to quality' without explaining how that quality is maintained. A contracting officer needs to see a process, not a promise.",
    items: [
      "I have a documented internal process for reviewing and checking my own work",
      "I understand how my performance will be measured on this contract",
      "I have a clear plan for addressing errors, delays, or problems if they arise",
      "I can demonstrate consistent quality delivery through past work or client references",
    ],
  },
  {
    num: 10,
    title: "Are you priced to win?",
    label: "Price & Cost Evaluation",
    intro:
      "Price is evaluated separately but carries significant weight. Contracting officers look for pricing that is reasonable — not automatically the lowest. A price that is too low raises questions about whether you can actually deliver.",
    miss: "Pricing too high without justification, or pricing so low it looks unsustainable. Either extreme creates doubt. A contracting officer wants to see that your price makes sense relative to what you are promising to deliver.",
    items: [
      "My price is competitive with what the market typically charges for this type of work",
      "My price is realistic — not so low that it would be impossible to deliver at that cost",
      "I have a clear breakdown showing how I calculated my price",
      "My pricing is consistent with the staffing, resources, and timeline in my technical approach",
    ],
  },
  {
    num: 11,
    title: "Does your business look credible online?",
    label: "Digital Presence Check",
    intro:
      "Contracting officers and their colleagues verify businesses online — before the proposal, after the proposal, and before award. What they find, or do not find, influences how seriously your business is taken.",
    miss: "A weak or inconsistent online presence after a strong proposal. Your website, your contact information, and your overall digital credibility are checked. Businesses that look unestablished online raise concerns even when their proposal is strong.",
    items: [
      "My business website is professional and clearly describes what my company does",
      "My contact information is consistent across my website, SAM profile, and all registrations",
      "My online presence matches the claims I made in my proposal",
      "There are no red flags, negative reviews, or missing information when someone searches my business name",
    ],
  },
  {
    num: 12,
    title: "Are there any conflicts of interest?",
    label: "Organizational Conflict of Interest",
    intro:
      "If your business has any relationship — financial, personal, or professional — with parties involved in this procurement, it may disqualify you. This includes situations where past work gave your business an unfair advantage in understanding the requirements.",
    miss: "Not knowing a conflict exists. Consultants who helped develop a statement of work, businesses with financial ties to the agency, or companies with access to non-public procurement information can all be disqualified without realizing why. Disclosure early is always better than disqualification late.",
    items: [
      "My business has no financial or personal relationship with anyone evaluating this proposal",
      "I did not write, review, or help develop the requirements or statement of work for this contract",
      "My business does not have access to non-public information related to this procurement",
      "If there is any potential conflict, I have disclosed it to the contracting officer proactively",
    ],
  },
];

export const CO_CHECKLIST_TOTAL_ITEMS = CO_CHECKLIST_SECTIONS.reduce(
  (a, s) => a + s.items.length,
  0,
);

export const CO_CHECKLIST_STORAGE_KEY = "tools:co-checklist";

export type CoChecklistTopClass = "t-strong" | "t-good" | "t-partial" | "t-low";

export interface CoChecklistVerdict {
  label: string;
  title: string;
  sub: string;
  msg: string;
  topClass: CoChecklistTopClass;
  missingCount: number;
  gapAreas: string[];
  gapHeadline: string | null;
  gapSummary: string | null;
}

/** "A", "A and B", "A, B, and C" */
function joinProse(arr: string[]): string {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

/** Faithful port of co-checklist.js's showResult() scoring/copy logic. */
export function evaluateCoChecklist(checked: Set<string>): CoChecklistVerdict {
  const count = checked.size;
  const pct = Math.round((count / CO_CHECKLIST_TOTAL_ITEMS) * 100);

  let label: string;
  let title: string;
  let msg: string;
  let topClass: CoChecklistTopClass;

  if (pct === 100) {
    label = "Submission ready";
    title = "You are ready to compete.";
    topClass = "t-strong";
    msg =
      "Every box is checked. Your business has done the preparation that most small businesses skip. The next step is finding the right opportunities and tailoring your proposal to each specific requirement.";
  } else if (pct >= 75) {
    label = "Almost ready";
    title = "Strong position — a few gaps to close.";
    topClass = "t-good";
    msg =
      "You are further along than most businesses that attempt government contracting. A few specific gaps to close and you are in a genuinely competitive position. Do not submit until those items are addressed.";
  } else if (pct >= 50) {
    label = "Foundational gaps present";
    title = "You have a start — but gaps that will cost you.";
    topClass = "t-partial";
    msg =
      "Some of the unchecked items below do not just weaken your proposal — they can get it disqualified before anyone reads it. Closing these gaps is the work that has to happen before you bid.";
  } else {
    label = "Not yet ready";
    title = "There is important work to do before you submit.";
    topClass = "t-low";
    msg =
      "Most businesses start exactly where you are. The gap is not your capability — it is your preparation. Getting these items in place is the difference between proposals that move forward and proposals that get rejected before they are read.";
  }

  const sub = `You scored ${count} of ${CO_CHECKLIST_TOTAL_ITEMS}`;

  let missingCount = 0;
  const gapAreas: string[] = [];
  CO_CHECKLIST_SECTIONS.forEach((s) => {
    let m = 0;
    s.items.forEach((_, j) => {
      if (!checked.has(`c${s.num}i${j}`)) m++;
    });
    if (m) {
      missingCount += m;
      gapAreas.push(s.label);
    }
  });

  const hasNeg = missingCount > 0;
  const gapHeadline = hasNeg
    ? `${missingCount}${missingCount === 1 ? " gap a contracting officer would flag" : " gaps a contracting officer would flag"}`
    : null;
  const gapSummary = hasNeg
    ? `Your unchecked items fall across ${gapAreas.length} evaluation ${gapAreas.length === 1 ? "area" : "areas"} — ${joinProse(gapAreas)}. Each one is something a contracting officer could flag before your proposal moves forward, so these are the areas to close before you submit.`
    : null;

  return { label, title, sub, msg, topClass, missingCount, gapAreas, gapHeadline, gapSummary };
}
