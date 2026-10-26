// THE CATERER, part 2 (read through src/demo/story/workspace.ts): Amira's work in progress — closed pursuits, mentor
// reviews, wallet and tasks. Open pursuits live on the opportunities
// themselves (opportunities.ts `pursuit`), so the Pipeline is the union of
// those and the closed ones below.

import { HERO_IDS } from "./opportunities";
import { PERSONA } from "../../story/persona";
import type { ClosedPursuit, ClosedPursuitDetail, MentorReviewStory, StoryTask, ThreadMessageStory, WalletStory } from "../../story/workspace";


export const CLOSED_PURSUITS: ClosedPursuit[] = [
  {
    id: "W912PM-26-Q-0009",
    title: "Holiday event catering — Fort Bragg MWR",
    agency: "Department of the Army",
    stage: "submitted",
    value: 96_000,
    note: "Submitted 6 days ago. The Army expects to award in about 3 weeks.",
    daysAgo: 6,
    next: { label: "See what you sent", to: "/pipeline" },
  },
  {
    id: "W81K04-24-Q-0187",
    title: "Patient meal support — Womack Army Medical Center",
    agency: "Department of the Army",
    stage: "won",
    value: 126_000,
    note: "Won and delivered. Your first federal prime contract.",
    daysAgo: 140,
    next: { label: "Add it to My Business", to: "/my-business" },
  },
  {
    id: "FA4800-26-Q-0007",
    title: "Lodging breakfast service — Seymour Johnson AFB",
    agency: "Department of the Air Force",
    stage: "not_awarded",
    value: 188_000,
    note: "Not awarded. Lost on price by about 4%; the debrief is in your notes.",
    daysAgo: 45,
    next: { label: "Read the debrief notes", to: "/pipeline" },
  },
];



export const MENTOR_REVIEWS: MentorReviewStory[] = [
  {
    id: "rev-fayetteville-proposal",
    oppId: "FAYNC-2026-R-08",
    title: "Review my Fayetteville Public Works proposal",
    status: "mentor_replied",
    unread: true,
    openedDaysAgo: 2,
    lastMessageDaysAgo: 0,
    outcome:
      "Strong draft. Move the event-catering examples to the top of section 2, and name Janet Reyes as your first reference.",
    price: 97,
  },
  {
    id: "rev-mackall-pursue",
    oppId: HERO_IDS.hero,
    title: "Should I pursue Camp Mackall field meals?",
    status: "closed",
    unread: false,
    openedDaysAgo: 3,
    lastMessageDaysAgo: 2,
    outcome: "Pursue it. Get your last two cooks food-handler certified this week.",
    price: 97,
  },
  {
    id: "rev-womack-closeout",
    oppId: null,
    title: "How do I get a performance rating for my Womack contract?",
    status: "closed",
    unread: false,
    openedDaysAgo: 38,
    lastMessageDaysAgo: 35,
    outcome:
      "Email the contracting officer and ask for an interim CPARS rating. Diana sent a template.",
    price: 0,
  },
];



export const WALLET: WalletStory = {
  /** Balance after the entries below. */
  balance: 306,
  /** The price of one mentor review. */
  mentorReviewPrice: 97,
  entries: [
    { label: "Wallet top-up", amount: 500, daysAgo: 20 },
    { label: "Mentor review — Camp Mackall field meals", amount: -97, daysAgo: 3 },
    { label: "Mentor review — Fayetteville Public Works proposal", amount: -97, daysAgo: 2 },
  ],
};


export const TASKS: StoryTask[] = [
  {
    id: "task-ava-mackall",
    title: "Answer Ava's 3 questions on Camp Mackall field meals",
    why: "Ava can't finish the quote without your delivery times and staffing plan.",
    dueInDays: 3,
    done: false,
    to: `/ava/${HERO_IDS.hero}`,
    source: "ava",
  },
  {
    id: "task-certificates",
    title: "Upload food-handler certificates for your last 2 cooks",
    why: "Cumberland County needs one for every cook. Ava paused that bid until you upload them.",
    dueInDays: 7,
    done: false,
    to: "/ava/CUMCO-2026-014",
    source: "ava",
  },
  {
    id: "task-read-sarah",
    title: "Read Diana's notes on your Fayetteville proposal",
    why: "She replied today. The proposal is due in 14 days.",
    dueInDays: 2,
    done: false,
    to: "/mentors/rev-fayetteville-proposal",
    source: "mentor",
  },
  {
    id: "task-send-reply",
    title: "Send your Fort Bragg sources-sought reply",
    why: "Ava drafted it. A reply costs nothing and can shape the next dining contract.",
    dueInDays: 10,
    done: false,
    to: "/ava/W912EE-27-S-0004",
    source: "ava",
  },
  {
    id: "task-contact-cdg",
    title: "Contact Carolina Dining Group about Fort Bragg dining",
    why: "Grant says this is a team bid. They are looking for woman-owned subcontractors.",
    dueInDays: 5,
    done: false,
    to: "/partners",
    source: "grant",
  },
  {
    id: "task-targeting-call",
    title: "Book your quarterly targeting call with Diana",
    why: "Plan your next quarter of bids around Fort Bragg and the VA.",
    dueInDays: 14,
    done: false,
    to: "/roadmap",
    source: "roadmap",
  },
  {
    id: "task-cap-statement",
    title: "Upload your capability statement",
    why: "Hunter uses it to explain every match.",
    dueInDays: null,
    done: true,
    to: "/my-business",
    source: "roadmap",
  },
  {
    id: "task-positioning-call",
    title: "Positioning call with Diana",
    why: "Diana set your targets: Fort Bragg, the VA and NC school districts.",
    dueInDays: null,
    done: true,
    to: "/roadmap",
    source: "roadmap",
  },
];

/** Diana's written threads, keyed by review id (MENTOR_REVIEWS). */
export const MENTOR_THREADS: Record<string, ThreadMessageStory[]> = {
  "rev-fayetteville-proposal": [
    { author: "member", daysAgo: 2, hour: 16, html: "<p>Hi Diana — Ava finished my proposal for the Fayetteville Public Works cafe and events contract. It's due in two weeks. Could you read it before I send it? I'm most worried about section 2, our experience, because we have never run a daily cafe.</p>", attachments: ["Haddad-Catering-Fayetteville-proposal.docx"] },
    { author: "mentor", daysAgo: 0, hour: 9, html: "<p>Amira, this is a strong draft. Three changes before you send it:</p><ol><li><strong>Move your event work to the top of section 2.</strong> The city scores approach at 40%. Your church and county events are your best evidence; right now they are on page 6.</li><li><strong>Call the county summer program what it is: daily service.</strong> 1,100 meals a day for 11 weeks answers the \"never run a cafe\" worry better than any sentence about it.</li><li><strong>Name Janet Reyes as your first reference.</strong> Purchasing officers call the first name on the list.</li></ol><p>Your price is in the right place. Don't lower it. — Diana</p>" },
  ],
  "rev-mackall-pursue": [
    { author: "member", daysAgo: 3, hour: 11, html: "<p>Diana, Hunter put the Camp Mackall field meals quote at the top of my list and Grant says bid. Before Ava starts — should I pursue it? It would be my biggest federal job as prime.</p>" },
    { author: "mentor", daysAgo: 2, hour: 15, html: "<p><strong>Pursue it.</strong> It is woman-owned only, it has no incumbent, and it is sized for your kitchen. Two things this week:</p><ul><li>Get your last two cooks food-handler certified. The quote asks for proof for every cook.</li><li>Plan the 3:30 AM starts now, before you price it. Early starts cost overtime.</li></ul><p>Lead with your Carolina Dining Group work at Fort Bragg. Same base, same kind of work. — Diana</p>" },
    { author: "member", daysAgo: 2, hour: 17, html: "<p>Thank you! Booking the food-handler course for Thursday.</p>" },
  ],
  "rev-womack-closeout": [
    { author: "member", daysAgo: 38, hour: 10, html: "<p>My Womack Army Medical Center contract ended, but there is no performance rating for it. How do I get one? Grant says it would help my next VA bid.</p>" },
    { author: "mentor", daysAgo: 35, hour: 14, html: "<p>Email the contracting officer and ask for an interim CPARS rating — CPARS is the federal performance rating system. Keep it short: the contract number, the dates, and one line on what you delivered. I've attached a template you can copy.</p>", attachments: ["CPARS-request-template.docx"] },
  ],
};

/** Her verdict on each thread that has one. */
export const MENTOR_RECOMMENDATIONS: Record<string, "pursue" | "discuss" | "pass"> = {
  "rev-mackall-pursue": "pursue",
  "rev-fayetteville-proposal": "discuss",
};

/** What each closed pursuit's dialog on the Pipeline says. */
export function closedPursuitDetail(id: string, daysAgo: number): ClosedPursuitDetail | null {
  if (id === "W912PM-26-Q-0009") {
    return {
      heading: "What you sent",
      lead: `You sent your quote ${daysAgo} days ago. The Army expects to award in about 3 weeks.`,
      points: [
        "Menus for each holiday event at Fort Bragg Morale, Welfare and Recreation (MWR).",
        "A staffing plan for cooks and servers, with food-handler certificates.",
        "Your references: Riverside Fellowship Church events and Cumberland County summer meals.",
        "Your price: $96,000.",
      ],
      link: { label: "See event catering coming up", to: "/forecasts" },
    };
  }
  if (id === "FA4800-26-Q-0007") {
    return {
      heading: "Debrief notes",
      lead: "The Air Force told you the award went to a firm that priced about 4% lower. Your technical score was equal to the winner's.",
      points: [
        "Your price was close. A small cut per breakfast would have changed the result.",
        `Price breakfast per guest, not per day. Ask the base for the lodging head count before you quote.`,
        `${PERSONA.ownerFirstName}, the next contract is already on the Forecasts page. You know this buyer's number now.`,
      ],
      link: { label: "See the next lodging breakfast forecast", to: "/forecasts/b8df4a0e3186f2939a144fd849a2ff9c" /* SEYMOUR_FORECAST_KEY */ },
    };
  }
  if (id === "W81K04-24-Q-0187") {
    return {
      heading: "Award",
      lead: "You won this contract and delivered it. It was your first federal prime contract. The value was $126,000.",
      points: [
        "You made therapeutic diet trays for the inpatient wards while the kitchen was rebuilt.",
        "The Army has not yet written your performance rating. Ask for an interim rating: Diana sent you a template.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return null;
}
