// THE TRUCKING COMPANY, part 2 (read through src/demo/story/workspace.ts):
// Tanya's work in progress — closed pursuits, mentor reviews, wallet and tasks.
// Source: demo-storyboard/trucking-pack.md, sections 11 and 12.
//
// The hero (the Fayetteville VA supply and linen runs) starts with NO mentor
// review: Tim sends it live on the call, and the presenter's "Diana answers"
// control plays the day forward. The threads below show the other two
// verdicts, Discuss and Pass, so all three are on screen.

import { HERO_IDS } from "./opportunities";
import { PERSONA } from "../../story/persona";
import type {
  ClosedPursuit,
  ClosedPursuitDetail,
  MentorReviewStory,
  StoryTask,
  ThreadMessageStory,
  WalletStory,
} from "../../story/workspace";

/** Pursuits whose opportunity is no longer open, so it is not in the feed. */
export const CLOSED_PURSUITS: ClosedPursuit[] = [
  {
    id: "W91247-26-Q-0466",
    title: "CONEX and generator moves for an 82nd Airborne training area",
    agency: "Department of the Army",
    stage: "submitted",
    value: 28_600,
    note: "Submitted 5 days ago. The Army expects to award in about 2 weeks.",
    daysAgo: 5,
    next: { label: "See what you sent", to: "/pipeline" },
  },
  {
    id: "W9124725PA044",
    title: "On-call trailer and container hauling — 18th Airborne Corps, Fort Bragg",
    agency: "Department of the Army",
    stage: "won",
    value: 41_400,
    note: "Won and delivered. Your first federal prime contract; the rating isn't written yet.",
    daysAgo: 384,
    next: { label: "Add it to My Business", to: "/my-business" },
  },
  {
    id: "36C24626Q0957",
    title: "Chilled freight routes — Hampton VA to eight VISN 6 sites",
    agency: "Department of Veterans Affairs",
    stage: "not_awarded",
    value: 1_350_000,
    note: "Not awarded. It went to the carrier already doing the work; the debrief notes are in your files.",
    daysAgo: 18,
    next: { label: "Read the debrief notes", to: "/pipeline" },
  },
];

export const MENTOR_REVIEWS: MentorReviewStory[] = [
  {
    id: "rev-lab-courier",
    oppId: "W81K0427QA014",
    title: "Review my quote for the Fort Bragg lab courier",
    status: "mentor_replied",
    unread: true,
    openedDaysAgo: 2,
    lastMessageDaysAgo: 0,
    outcome:
      "Let's talk before you send it. One night driver can't cover two rush calls at once, and the work statement scores response time. Bring your night schedule.",
    price: 97,
  },
  {
    id: "rev-tps-pass",
    oppId: "HTC711-27-R-R004",
    title: "Should I go after the national secure-freight program (TPS)?",
    status: "closed",
    unread: false,
    openedDaysAgo: 9,
    lastMessageDaysAgo: 8,
    outcome:
      "Pass. It's for carriers SDDC has already approved for secure cargo. Join SDDC's carrier program, haul DoD freight for two years, then look again.",
    price: 97,
  },
  {
    id: "rev-sddc-howto",
    oppId: null,
    title: "How do I get into SDDC's carrier program?",
    status: "closed",
    unread: false,
    openedDaysAgo: 40,
    lastMessageDaysAgo: 37,
    outcome:
      "Register in SDDC's Freight Carrier Registration Program: three straight years of DOT authority, a SCAC, a Syncada account, a DoD bond and cargo insurance. Diana sent a checklist.",
    price: 0,
  },
];

export const WALLET: WalletStory = {
  balance: 306,
  mentorReviewPrice: 97,
  entries: [
    { label: "Wallet top-up", amount: 500, daysAgo: 20 },
    { label: "Mentor review — national secure-freight program", amount: -97, daysAgo: 9 },
    { label: "Mentor review — Fort Bragg lab courier quote", amount: -97, daysAgo: 2 },
  ],
};

export const TASKS: StoryTask[] = [
  {
    id: "task-ava-va-routes",
    title: "Answer Ava's 3 questions on the VA supply and linen runs",
    why: "Ava can't finish the quote without your PM and Alternate, which trucks run the routes and how you answer the license line.",
    dueInDays: 3,
    done: false,
    to: `/ava/${HERO_IDS.hero}`,
    source: "ava",
  },
  {
    id: "task-license-question",
    title: "Ask the contract specialist about the license line and the bond",
    why: "The price schedule asks for a \"hazardous material license number\" and doesn't say what bond drivers need. Ask before Q&A closes in 9 days.",
    dueInDays: 6,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-fuel-price",
    title: "Get a fuel-adjustment answer, or set your diesel base price",
    why: "Five fixed-price years at 400 miles a day. At 8 mpg, every 50-cent rise in diesel costs about $6,000 a year.",
    dueInDays: 7,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-courier-notes",
    title: "Read Diana's notes on your lab courier quote",
    why: "She wants to talk before you send it. The rush calls need more drivers than your night schedule has.",
    dueInDays: 2,
    done: false,
    to: "/mentors/rev-lab-courier",
    source: "mentor",
  },
  {
    id: "task-brightwater",
    title: "Reply to Brightwater Sustainment about Fort Bragg's logistics contract",
    why: "Grant says team up. They want a local service-disabled veteran-owned carrier for the freight runs and trailer moves.",
    dueInDays: 5,
    done: false,
    to: "/partners",
    source: "partners",
  },
  {
    id: "task-interim-rating",
    title: "Ask for an interim rating on your Fort Bragg hauling job",
    why: "The job ended on 30 September and the rating isn't written. Every bid you send asks for past performance.",
    dueInDays: 10,
    done: false,
    to: "/my-business",
    source: "roadmap",
  },
  {
    id: "task-capability",
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
    why: "Diana set your targets: the VA, Fort Bragg, Camp Lejeune and NCDOT.",
    dueInDays: null,
    done: true,
    to: "/roadmap",
    source: "roadmap",
  },
];

/** Diana's written threads, keyed by review id (MENTOR_REVIEWS). */
export const MENTOR_THREADS: Record<string, ThreadMessageStory[]> = {
  "rev-lab-courier": [
    {
      author: "member",
      daysAgo: 2,
      hour: 6,
      html: "<p>Hi Diana — Fort Bragg's Army hospital wants a lab specimen courier: twice-daily runs plus rush calls within 2 hours, day or night, about $125K a year. It's on post, 12 miles from my yard. Here's my quote. Am I missing anything?</p>",
      attachments: ["Rockfish-Run-lab-courier-quote.pdf"],
    },
    {
      author: "mentor",
      daysAgo: 0,
      hour: 9,
      html: "<p>Tanya, the price is fair, but <strong>let's talk before you send it</strong>. One night driver can't cover two rush calls at once, and the work statement scores response time. If two clinics call at 2 AM, one of them waits past the 2 hours.</p><p>Book 20 minutes with me this week and bring your night schedule. — Diana</p>",
    },
  ],
  "rev-tps-pass": [
    {
      author: "member",
      daysAgo: 9,
      hour: 6,
      html: "<p>Diana, USTRANSCOM has the national secure-freight program on the All tab, about $200M a year shared across carriers. We haul DoD freight already. Is it worth a try?</p>",
    },
    {
      author: "mentor",
      daysAgo: 8,
      hour: 14,
      html: "<p><strong>Pass.</strong> It's for carriers SDDC has already approved for secure cargo: a security clearance for the company, cleared drivers and satellite tracking. Build toward it instead. Join SDDC's carrier program, haul DoD freight for two years, then look again. — Diana</p>",
    },
    { author: "member", daysAgo: 8, hour: 16, html: "<p>Passing. I'll start the carrier paperwork.</p>" },
  ],
  "rev-sddc-howto": [
    {
      author: "member",
      daysAgo: 40,
      hour: 7,
      html: "<p>Most of the DoD freight around here seems to go to carriers SDDC has registered. How do I get into SDDC's carrier program?</p>",
    },
    {
      author: "mentor",
      daysAgo: 37,
      hour: 14,
      html: "<p>Register in the Freight Carrier Registration Program. You need three straight years of DOT authority (you have nine), a SCAC for each mode, a U.S. Bank Syncada account, a DoD performance bond and cargo insurance. It opens in seasons, so watch SDDC's site. I've attached a checklist.</p>",
      attachments: ["SDDC-carrier-registration-checklist.docx"],
    },
  ],
};

/** Her verdict on each thread that has one. */
export const MENTOR_RECOMMENDATIONS: Record<string, "pursue" | "discuss" | "pass"> = {
  "rev-lab-courier": "discuss",
  "rev-tps-pass": "pass",
};

/** What each closed pursuit's dialog on the Pipeline says. */
export function closedPursuitDetail(id: string, daysAgo: number): ClosedPursuitDetail | null {
  if (id === "W91247-26-Q-0466") {
    return {
      heading: "What you sent",
      lead: `You sent your quote ${daysAgo} days ago. The Army expects to award in about 2 weeks.`,
      points: [
        "Moves of CONEX containers and generators into an 82nd Airborne training area and back.",
        "Your plan: two flatbeds and a tractor, booked through the unit's range schedule.",
        "Your reference: the 18th Airborne Corps trailer and container job.",
        "Your price: $28,600.",
      ],
      link: { label: "See Fort Bragg work coming up", to: "/forecasts" },
    };
  }
  if (id === "36C24626Q0957") {
    return {
      heading: "Debrief notes",
      lead: "VA awarded it to the carrier already running the routes. You asked for a debrief and got it.",
      points: [
        "Your price was about 7% above the winner's.",
        "The weak spot: one reefer and no named backup. The winner's temperature-log plan scored higher.",
        "Next time, name a backup reefer (a rental agreement counts) and price the long legs with a team driver.",
        `${PERSONA.ownerFirstName}, the Fayetteville supply and linen runs have no reefer leg, so you start that one even.`,
      ],
      link: { label: "See the VA supply runs", to: `/opportunities/${HERO_IDS.hero}` },
    };
  }
  if (id === "W9124725PA044") {
    return {
      heading: "Award",
      lead: "You won this contract and delivered it. It was your first federal prime contract. The value was $41,400.",
      points: [
        "46 on-call moves of office trailers, CONEX containers and generators in 12 months.",
        "The rating isn't written yet. Ask the contracting officer for an interim one.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return null;
}
