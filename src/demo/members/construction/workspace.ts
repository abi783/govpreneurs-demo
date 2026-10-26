// THE CONTRACTOR, part 2 (read through src/demo/story/workspace.ts): Derrick's
// work in progress — closed pursuits, mentor reviews, wallet and tasks.
// Source: demo-storyboard/construction-pack.md, sections 11 and 12.
//
// The hero (the Fort Bragg training building) starts with NO mentor review: Tim
// sends it live on the call, and the presenter's "Diana answers" control plays
// the day forward. The threads below show the other two verdicts, Discuss and
// Pass, so all three are on screen.

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
    id: "FA445227Q0003",
    title: "Electrical service upgrade — Pope Army Airfield hangar office",
    agency: "Department of the Air Force",
    stage: "submitted",
    value: 118_500,
    note: "Submitted 5 days ago. The Air Force expects to award in about 3 weeks.",
    daysAgo: 5,
    next: { label: "See what you sent", to: "/pipeline" },
  },
  {
    id: "FA445225C0019",
    title: "HVAC and electrical repair — Pope Army Airfield office building",
    agency: "Department of the Air Force",
    stage: "won",
    value: 186_400,
    note: "Won and delivered; CPARS Very Good. Your first federal prime contract.",
    daysAgo: 395,
    next: { label: "Add it to My Business", to: "/my-business" },
  },
  {
    id: "26-0087",
    title: "HVAC upgrade, a classroom building — Fayetteville State University",
    agency: "Fayetteville State University, NC",
    stage: "not_awarded",
    value: 418_000,
    note: "Not awarded. Lost on price by 4.2%; the bid tab and your call notes are in your files.",
    daysAgo: 63,
    next: { label: "Read the call notes", to: "/pipeline" },
    scope: "sled",
  },
];

export const MENTOR_REVIEWS: MentorReviewStory[] = [
  {
    id: "rev-school-summer",
    oppId: "173-27004",
    title: "Review my bid plan for the summer school HVAC job",
    status: "mentor_replied",
    unread: true,
    openedDaysAgo: 2,
    lastMessageDaysAgo: 0,
    outcome:
      "Let's talk first. The work has to fit between the last school day and the first teacher workday, and the chiller lead time decides if that's possible. Bring the supplier's written date.",
    price: 97,
  },
  {
    id: "rev-barracks-pass",
    oppId: "W912HN27R4012",
    title: "Should I go after the $25M–$35M barracks repair at Fort Bragg?",
    status: "closed",
    unread: false,
    openedDaysAgo: 9,
    lastMessageDaysAgo: 8,
    outcome: "Pass as prime. It's far past your bond line. Ask the bidders for the electrical and HVAC package instead.",
    price: 97,
  },
  {
    id: "rev-matoc-howto",
    oppId: null,
    title: "How do I get on the Fort Bragg Minor Construction MATOC?",
    status: "closed",
    unread: false,
    openedDaysAgo: 41,
    lastMessageDaysAgo: 38,
    outcome:
      "Watch for the sources sought. Have three similar jobs from the last six years, a surety letter with single and aggregate limits, and your CPARS. Diana sent a checklist.",
    price: 0,
  },
];

export const WALLET: WalletStory = {
  balance: 306,
  mentorReviewPrice: 97,
  entries: [
    { label: "Wallet top-up", amount: 500, daysAgo: 20 },
    { label: "Mentor review — Fort Bragg barracks repair", amount: -97, daysAgo: 9 },
    { label: "Mentor review — summer school HVAC bid plan", amount: -97, daysAgo: 2 },
  ],
};

export const TASKS: StoryTask[] = [
  {
    id: "task-ava-training-building",
    title: "Answer Ava's 3 questions on the Fort Bragg training building bid",
    why: "Ava can't finish the bid without your quality and safety staff, your controls plan and how you keep the building cool.",
    dueInDays: 3,
    done: false,
    to: `/ava/${HERO_IDS.hero}`,
    source: "ava",
  },
  {
    id: "task-surety",
    title: "Get the bid bond and the final-bond OK from your surety",
    why: "$730K on top of $2.9M in bonded work is $3.6M of your $4M aggregate. Get the OK in writing this week.",
    dueInDays: 4,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-blackjack-oak",
    title: "Reply to Blackjack Oak Federal Builders about the VA fan coils",
    why: "Grant says team up. They want a HUBZone firm to self-perform the mechanical and electrical work.",
    dueInDays: 5,
    done: false,
    to: "/partners",
    source: "partners",
  },
  {
    id: "task-lead-times",
    title: "Get written chiller and switchboard lead times",
    why: "240 days is tight if the equipment takes months to arrive. Get the dates from your suppliers in writing.",
    dueInDays: 7,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-site-visit",
    title: "Go to the site visit at Building 2-4417",
    why: "See the chiller pad, the electrical room and how the unit uses the building before you price the phasing.",
    dueInDays: 8,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-wage-class",
    title: "Send the wage-class question to the contract specialist",
    why: "The wage decision has no HVAC mechanic class. Ask which class covers refrigerant piping before questions close in 15 days.",
    dueInDays: 10,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-va-sources-sought",
    title: "Answer the VA fan coil sources sought with Blackjack Oak",
    why: "The VA counts the answers to decide how to set it aside. Answer as a team before it closes in 14 days.",
    dueInDays: 14,
    done: false,
    to: `/opportunities/${HERO_IDS.teamUp}`,
    source: "partners",
  },
  {
    id: "task-hubzone-recert",
    title: "Start your HUBZone recertification",
    why: "It's due in 44 days. Keep 35% of your staff living in a HUBZone: you're at 9 of 25.",
    dueInDays: 30,
    done: false,
    to: "/my-business",
    source: "roadmap",
  },
];

/** Diana's written threads, keyed by review id (MENTOR_REVIEWS). */
export const MENTOR_THREADS: Record<string, ThreadMessageStory[]> = {
  "rev-school-summer": [
    {
      author: "member",
      daysAgo: 2,
      hour: 7,
      html: "<p>Hi Diana — Cumberland County Schools is bidding the summer HVAC job for a classroom wing: a chiller, air handlers and controls, about $1.05M. We did one of their schools in 2024 and finished early. Here's my bid plan. Am I missing anything?</p>",
      attachments: ["Ninebark-CCS-summer-HVAC-bid-plan.pdf"],
    },
    {
      author: "mentor",
      daysAgo: 0,
      hour: 9,
      html: "<p>Derrick, the plan is sound, but <strong>let's talk first</strong>. The work has to fit between the last school day and the first teacher workday, and the chiller lead time decides if that's possible. If the chiller lands in August, you miss the window and the school opens without air.</p><p>Book 20 minutes with me this week and bring the supplier's written ship date. — Diana</p>",
    },
  ],
  "rev-barracks-pass": [
    {
      author: "member",
      daysAgo: 9,
      hour: 6,
      html: "<p>Diana, USACE Savannah has a barracks repair at Fort Bragg on the All tab, $25M–$35M, small-business set-aside. It's right in our backyard. Is it worth a try?</p>",
    },
    {
      author: "mentor",
      daysAgo: 8,
      hour: 14,
      html: "<p><strong>Pass as prime.</strong> It's far past your bond line: your single limit is $1.5M, and this needs a surety to back more than $25M. No surety will stretch that far for a first USACE job. Ask the bidders for the electrical and HVAC package instead. That's real work at your size, and it puts your name in front of the firms that win these. — Diana</p>",
    },
    { author: "member", daysAgo: 8, hour: 16, html: "<p>Understood. Passing, and I'll call the bidders when the plan holders' list posts.</p>" },
  ],
  "rev-matoc-howto": [
    {
      author: "member",
      daysAgo: 41,
      hour: 7,
      html: "<p>Most of the HUBZone work at Fort Bragg seems to go through a MATOC we're not on. How do we get on the Minor Construction MATOC?</p>",
    },
    {
      author: "mentor",
      daysAgo: 38,
      hour: 14,
      html: "<p>You can't join it midway; you get on when the Army competes the next one. Watch for the sources sought, and answer it. Have three things ready: three similar jobs from the last six years, a surety letter with your single and aggregate limits, and your CPARS — the federal performance rating — from the Pope job. I've attached a checklist.</p>",
      attachments: ["MATOC-sources-sought-checklist.docx"],
    },
  ],
};

/** Her verdict on each thread that has one. */
export const MENTOR_RECOMMENDATIONS: Record<string, "pursue" | "discuss" | "pass"> = {
  "rev-school-summer": "discuss",
  "rev-barracks-pass": "pass",
};

/** What each closed pursuit's dialog on the Pipeline says. */
export function closedPursuitDetail(id: string, daysAgo: number): ClosedPursuitDetail | null {
  if (id === "FA445227Q0003") {
    return {
      heading: "What you sent",
      lead: `You sent your quote ${daysAgo} days ago. The Air Force expects to award in about 3 weeks.`,
      points: [
        "A new 400A service, a panel and feeders for a hangar office, done in 75 days.",
        "Your outage plan: two weekend shutdowns, booked 14 days ahead with the squadron.",
        "Your references: the Pope office building job and the Cumberland County school job.",
        "Your price: $118,500.",
      ],
      link: { label: "See Pope work coming up", to: "/forecasts" },
    };
  }
  if (id === "26-0087") {
    return {
      heading: "Call notes",
      lead: "The university awarded it to a bid 4.2% lower than yours. You called the designer after the bid tab posted.",
      points: [
        "The low bidder priced a different controls approach, which the specs allowed as an \"or equal\".",
        "Next time, ask before bids close whether \"or equal\" controls are allowed, and price both.",
        `${PERSONA.ownerFirstName}, Fayetteville State has a switchgear job on your list now. You know this buyer's numbers.`,
      ],
      link: { label: "See the switchgear job", to: "/opportunities/27-0118" },
    };
  }
  if (id === "FA445225C0019") {
    return {
      heading: "Award",
      lead: "You won this contract and delivered it. It was your first federal prime contract. The value was $186,400.",
      points: [
        "Six split-system heat pumps replaced, two old panels moved to a new 400A panel, and the units tied into the building's controls.",
        "Done in 5½ months. The Air Force rated it Very Good.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return null;
}
