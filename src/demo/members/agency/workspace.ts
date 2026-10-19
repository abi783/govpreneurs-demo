// THE AGENCY, part 2 (read through src/demo/story/workspace.ts): Dana's work
// in progress — closed pursuits, mentor reviews, wallet and tasks.
//
// The hero (the Family Advocacy campaign) starts with NO mentor review: Tim
// sends it live on the call, and the presenter's "Sarah answers" control plays
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
    id: "W91247-26-Q-0457",
    title: "Orientation video series — Fort Bragg Army Community Service",
    agency: "Department of the Army",
    stage: "submitted",
    value: 42_000,
    note: "Submitted 5 days ago. The Army expects to award in about 3 weeks.",
    daysAgo: 5,
    next: { label: "See what you sent", to: "/pipeline" },
  },
  {
    id: "W91242-25-P-A118",
    title: "Digital recruiting campaign — NC Army National Guard",
    agency: "Department of the Army",
    stage: "won",
    value: 86_400,
    note: "Won and delivered. Your first federal prime contract.",
    daysAgo: 234,
    next: { label: "Add it to My Business", to: "/my-business" },
  },
  {
    id: "CUMCO-EM-2026-07",
    title: "Hurricane preparedness campaign — Cumberland County Emergency Services",
    agency: "Cumberland County, NC",
    stage: "not_awarded",
    value: 64_000,
    note: "Not awarded. Lost on price by about 6%; the debrief is in your notes.",
    daysAgo: 50,
    next: { label: "Read the debrief notes", to: "/pipeline" },
    scope: "sled",
  },
];

export const MENTOR_REVIEWS: MentorReviewStory[] = [
  {
    id: "rev-fast-proposal",
    oppId: "FAY-TR-2027-04",
    title: "Review my FAST bus ridership proposal",
    status: "mentor_replied",
    unread: true,
    openedDaysAgo: 2,
    lastMessageDaysAgo: 0,
    outcome:
      "Strong draft. Lead with the stormwater results, put the Spanish-language plan on page one, and name Teresa Wynn as your first reference.",
    price: 97,
  },
  {
    id: "rev-visitnc-pass",
    oppId: "VNC-2027-ADV-01",
    title: "Should I go after the Visit NC tourism campaign?",
    status: "closed",
    unread: false,
    openedDaysAgo: 9,
    lastMessageDaysAgo: 8,
    outcome: "Pass. A national media buy is for large agencies with tourism records; build toward it instead.",
    price: 97,
  },
  {
    id: "rev-ncng-rating",
    oppId: null,
    title: "How do I get a performance rating for my NC Guard campaign?",
    status: "closed",
    unread: false,
    openedDaysAgo: 41,
    lastMessageDaysAgo: 38,
    outcome: "Email the contracting officer and ask for an interim CPARS rating. Sarah sent a template.",
    price: 0,
  },
];

export const WALLET: WalletStory = {
  balance: 306,
  mentorReviewPrice: 97,
  entries: [
    { label: "Wallet top-up", amount: 500, daysAgo: 20 },
    { label: "Mentor review — Visit NC tourism campaign", amount: -97, daysAgo: 9 },
    { label: "Mentor review — FAST bus ridership proposal", amount: -97, daysAgo: 2 },
  ],
};

export const TASKS: StoryTask[] = [
  {
    id: "task-ava-family-advocacy",
    title: "Answer Ava's 3 questions on the Family Advocacy campaign",
    why: "Ava can't finish the quote without your project manager, your video plan and the app line.",
    dueInDays: 3,
    done: false,
    to: `/ava/${HERO_IDS.hero}`,
    source: "ava",
  },
  {
    id: "task-app-question",
    title: "Ask the contract specialist about the app line",
    why: "Grant says to ask whether a news partner's app counts. Questions close in 9 days.",
    dueInDays: 6,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-read-sarah",
    title: "Read Sarah's notes on your FAST proposal",
    why: "She replied today. The proposal is due in 14 days.",
    dueInDays: 2,
    done: false,
    to: "/mentors/rev-fast-proposal",
    source: "mentor",
  },
  {
    id: "task-bluestone",
    title: "Reply to Bluestone Veteran Media Group about the VA campaign",
    why: "Grant says team up. They want a woman-owned video crew for the Southeast shoots.",
    dueInDays: 5,
    done: false,
    to: "/partners",
    source: "partners",
  },
  {
    id: "task-print-quotes",
    title: "Get locked rate quotes from the four local papers",
    why: "Five fixed-price years of weekly print: lock the rates before you price the quote.",
    dueInDays: 7,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-rating",
    title: "Ask for an interim rating on your NC Guard campaign",
    why: "Grant uses it as past performance on the Guard's next campaign. Sarah sent a template.",
    dueInDays: 10,
    done: false,
    to: "/mentors/rev-ncng-rating",
    source: "mentor",
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
    title: "Positioning call with Sarah",
    why: "Sarah set your targets: Fort Bragg, the NC Guard, the VA and NC state agencies.",
    dueInDays: null,
    done: true,
    to: "/roadmap",
    source: "roadmap",
  },
];

/** Sarah's written threads, keyed by review id (MENTOR_REVIEWS). */
export const MENTOR_THREADS: Record<string, ThreadMessageStory[]> = {
  "rev-fast-proposal": [
    {
      author: "member",
      daysAgo: 2,
      hour: 16,
      html: "<p>Hi Sarah — Ava finished my proposal for the FAST bus ridership campaign. It's due in two weeks. Could you read it before I send it? I'm most worried about section 2, our experience, because we have never run a transit campaign.</p>",
      attachments: ["Lantern-Row-FAST-ridership-proposal.docx"],
    },
    {
      author: "mentor",
      daysAgo: 0,
      hour: 9,
      html: "<p>Dana, this is a strong draft. Three changes before you send it:</p><ol><li><strong>Lead section 2 with your stormwater campaign for the city.</strong> Same buyer, a public-behavior campaign, measured results. Right now it is on page 5.</li><li><strong>Put the Spanish-language plan on page one.</strong> The city scores reach at 30%, and a third of FAST riders speak Spanish at home.</li><li><strong>Name Teresa Wynn as your first reference.</strong> Purchasing officers call the first name on the list.</li></ol><p>Your price is in the right place. Don't lower it. — Sarah</p>",
    },
  ],
  "rev-visitnc-pass": [
    {
      author: "member",
      daysAgo: 9,
      hour: 10,
      html: "<p>Sarah, Visit NC's national tourism campaign is on the All tab. It's huge, but it's our state. Is it worth a try?</p>",
    },
    {
      author: "mentor",
      daysAgo: 8,
      hour: 14,
      html: "<p><strong>Pass.</strong> It is a national media buy, and the state will score past tourism campaigns of that size. You have none yet, and the proposal alone would take your team three weeks. Build toward it instead: win the regional work in front of you, and ask Visit NC for its list of approved subcontractors. — Sarah</p>",
    },
    { author: "member", daysAgo: 8, hour: 16, html: "<p>That makes sense. Passing, and I'll ask about their subcontractor list.</p>" },
  ],
  "rev-ncng-rating": [
    {
      author: "member",
      daysAgo: 41,
      hour: 10,
      html: "<p>My NC Guard recruiting campaign ended in February, but there is no performance rating for it. How do I get one? Grant says it would help on the Guard's next campaign.</p>",
    },
    {
      author: "mentor",
      daysAgo: 38,
      hour: 14,
      html: "<p>Email the contracting officer and ask for an interim CPARS rating — CPARS is the federal performance rating system. Keep it short: the contract number, the dates, and one line on what you delivered: six videos, the geofenced ads, and leads routed to recruiters within 5 minutes. I've attached a template you can copy.</p>",
      attachments: ["CPARS-request-template.docx"],
    },
  ],
};

/** Her verdict on each thread that has one. */
export const MENTOR_RECOMMENDATIONS: Record<string, "pursue" | "discuss" | "pass"> = {
  "rev-fast-proposal": "discuss",
  "rev-visitnc-pass": "pass",
};

/** What each closed pursuit's dialog on the Pipeline says. */
export function closedPursuitDetail(id: string, daysAgo: number): ClosedPursuitDetail | null {
  if (id === "W91247-26-Q-0457") {
    return {
      heading: "What you sent",
      lead: `You sent your quote ${daysAgo} days ago. The Army expects to award in about 3 weeks.`,
      points: [
        "Eight captioned orientation videos for new families, two minutes each.",
        "A shoot plan for three Army Community Service buildings, with consent forms.",
        "Your references: the NC Guard campaign and the City of Fayetteville stormwater campaign.",
        "Your price: $42,000.",
      ],
      link: { label: "See Army Community Service work coming up", to: "/forecasts" },
    };
  }
  if (id === "CUMCO-EM-2026-07") {
    return {
      heading: "Debrief notes",
      lead: "The county told you the award went to a firm that priced about 6% lower. Your creative score was the highest.",
      points: [
        "Your price was close. Fewer paid-media weeks before storm season would have closed the gap.",
        "Price the media buy separately from the creative, so the county can see where the money goes.",
        `${PERSONA.ownerFirstName}, the county's public-health campaign is on your list now. You know this buyer's number.`,
      ],
      link: { label: "See the public-health campaign", to: "/opportunities/CUMCO-PH-2027-03" },
    };
  }
  if (id === "W91242-25-P-A118") {
    return {
      heading: "Award",
      lead: "You won this contract and delivered it. It was your first federal prime contract. The value was $86,400.",
      points: [
        "Six 15-second videos, geofenced ads around 40 high schools and the State Fair, and leads routed to recruiters within 5 minutes.",
        "The Army has not yet written your performance rating. Ask for an interim rating: Sarah sent you a template.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return null;
}
