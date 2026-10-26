// THE JANITORIAL FIRM, part 2 (read through src/demo/story/workspace.ts):
// Reggie's work in progress — closed pursuits, mentor reviews, wallet and tasks.
// Source: demo-storyboard/janitorial-pack.md, sections 11 and 12.
//
// The hero (Fort Bragg pressure washing) starts with NO mentor review: Tim sends
// it live on the call, and the presenter's "Diana answers" control plays the day
// forward. The threads below show the other two verdicts, Discuss and Pass, so
// all three are on screen.

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
    id: "36C24627Q0041",
    title: "Quarterly canteen deep cleaning — Fayetteville VA Medical Center",
    agency: "Department of Veterans Affairs",
    stage: "submitted",
    value: 7_200,
    note: "Submitted 5 days ago. The current contract ends 26 Oct, so expect an answer within a week.",
    daysAgo: 5,
    next: { label: "See what you sent", to: "/pipeline" },
  },
  {
    id: "FA480925F0123",
    title: "Dormitory pressure washing — Seymour Johnson AFB",
    agency: "Department of the Air Force",
    stage: "won",
    value: 84_600,
    note: "Won and delivered. Your first federal prime contract.",
    daysAgo: 323,
    next: { label: "Add it to My Business", to: "/my-business" },
  },
  {
    id: "W912PM26QA017",
    title: "Custodial and refuse service — Jordan Lake (Poe's Ridge)",
    agency: "Department of the Army",
    stage: "not_awarded",
    value: 41_800,
    note: "Not awarded. Lowest price won; you were about 11% higher.",
    daysAgo: 150,
    next: { label: "Read the debrief notes", to: "/pipeline" },
  },
];

export const MENTOR_REVIEWS: MentorReviewStory[] = [
  {
    id: "rev-rest-area-discuss",
    oppId: "54-SH-06-PR34172",
    title: "Should I bid the I-95 rest areas in Cumberland County?",
    status: "mentor_replied",
    unread: true,
    openedDaysAgo: 2,
    lastMessageDaysAgo: 0,
    outcome:
      "Let's talk first. This is a seven-day staffing business, not a cleaning job. Book 20 minutes and bring a seven-day schedule with its payroll cost.",
    price: 97,
  },
  {
    id: "rev-epa-pass",
    oppId: "68HERC27R0031",
    title: "Should I go after the EPA campus custodial in RTP?",
    status: "closed",
    unread: false,
    openedDaysAgo: 9,
    lastMessageDaysAgo: 8,
    outcome: "Pass for now. It's nearly your whole revenue, 85 miles away, and 21 firms bid last time.",
    price: 97,
  },
  {
    id: "rev-reference-howto",
    oppId: null,
    title: "The Seymour Johnson job was too small for a CPARS. How do I get a reference?",
    status: "closed",
    unread: false,
    openedDaysAgo: 41,
    lastMessageDaysAgo: 38,
    outcome:
      "Ask the COR for a one-page letter now, while they remember the job, or send a past-performance questionnaire with your next quote. Diana sent a template.",
    price: 0,
  },
];

export const WALLET: WalletStory = {
  balance: 306,
  mentorReviewPrice: 97,
  entries: [
    { label: "Wallet top-up", amount: 500, daysAgo: 20 },
    { label: "Mentor review — EPA campus custodial", amount: -97, daysAgo: 9 },
    { label: "Mentor review — I-95 rest areas", amount: -97, daysAgo: 2 },
  ],
};

export const TASKS: StoryTask[] = [
  {
    id: "task-ava-pressure-washing",
    title: "Answer Ava's 3 questions on the Fort Bragg pressure-washing quote",
    why: "Ava can't finish the quote without your project and QC managers, your sandblasting plan and your backup rig.",
    dueInDays: 3,
    done: false,
    to: `/ava/${HERO_IDS.hero}`,
    source: "ava",
  },
  {
    id: "task-sarah-rest-area",
    title: "Book 20 minutes with Diana on the I-95 rest areas",
    why: "Diana wants to see a seven-day schedule and its payroll cost before you decide.",
    dueInDays: 4,
    done: false,
    to: "/mentors/rev-rest-area-discuss",
    source: "mentor",
  },
  {
    id: "task-ashepoo",
    title: "Reply to Ashepoo Facility Solutions about the Army Reserve centers",
    why: "Grant says team up. They want a local subcontractor for the North Carolina centers near Fayetteville.",
    dueInDays: 5,
    done: false,
    to: "/partners",
    source: "partners",
  },
  {
    id: "task-sandblasting-question",
    title: "Send the sandblasting question before questions close",
    why: "Ask how many square feet were sandblasted last year and whether lead-painted surfaces are excluded. It decides your square-foot price.",
    dueInDays: 7,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-wage-class",
    title: "Ask DPW which wage class it expects for pressure washing",
    why: "The Army listed General Maintenance Worker in 2021: $21.41 plus $5.92 health and welfare. Your price floor depends on the answer.",
    dueInDays: 7,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-blasting-sub",
    title: "Get a signed rate from a blasting subcontractor",
    why: "You don't own a sandblaster, and its cost has to fit inside your one square-foot price.",
    dueInDays: 8,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-cor-letter",
    title: "Ask the Seymour Johnson COR for a reference letter",
    why: "The dorm job was too small for a CPARS. A one-page letter is your federal reference; use Diana's template.",
    dueInDays: 10,
    done: false,
    to: "/mentors/rev-reference-howto",
    source: "mentor",
  },
  {
    id: "task-hubzone-recert",
    title: "Start your HUBZone recertification",
    why: "It's due in 38 days. 41% of your staff live in a HUBZone, above the 35% floor, but night crews turn over.",
    dueInDays: 30,
    done: false,
    to: "/my-business",
    source: "roadmap",
  },
];

/** Diana's written threads, keyed by review id (MENTOR_REVIEWS). */
export const MENTOR_THREADS: Record<string, ThreadMessageStory[]> = {
  "rev-rest-area-discuss": [
    {
      author: "member",
      daysAgo: 2,
      hour: 7,
      html: "<p>Hi Diana — NCDOT is bidding custodial for the I-95 rest areas in Cumberland County, about $400K a year. They're staffed 16 hours a day, every day, with a $14.48 wage floor. Should I bid it?</p>",
    },
    {
      author: "mentor",
      daysAgo: 0,
      hour: 9,
      html: "<p>Reggie, <strong>let's talk first</strong>. This is a seven-day staffing business, not a cleaning job: 365 days a year, holidays included, a supervisor within 50 miles, and 5% of each month held back in the first year.</p><p>Book 20 minutes with me and bring a seven-day schedule with its payroll cost. — Diana</p>",
    },
  ],
  "rev-epa-pass": [
    {
      author: "member",
      daysAgo: 9,
      hour: 6,
      html: "<p>Diana, the EPA campus in Research Triangle Park is a small-business set-aside, about $1.6M a year. Should we go after it?</p>",
    },
    {
      author: "mentor",
      daysAgo: 8,
      hour: 14,
      html: "<p><strong>Pass for now.</strong> It's nearly your whole revenue, 85 miles away, and 21 firms bid last time. Win the Fort Bragg exterior work first and build toward a job this size. — Diana</p>",
    },
    { author: "member", daysAgo: 8, hour: 16, html: "<p>Understood. Passing, and putting the time into Fort Bragg.</p>" },
  ],
  "rev-reference-howto": [
    {
      author: "member",
      daysAgo: 41,
      hour: 7,
      html: "<p>The Seymour Johnson dorm job was too small for a CPARS. How do I get a federal reference out of it?</p>",
    },
    {
      author: "mentor",
      daysAgo: 38,
      hour: 14,
      html: "<p>Ask the COR for a one-page letter now, while they remember the job: the dates, the scope, on time, no rework. Or send a past-performance questionnaire with your next quote. My template is attached.</p>",
      attachments: ["COR-reference-letter-template.docx"],
    },
  ],
};

/** Her verdict on each thread that has one. */
export const MENTOR_RECOMMENDATIONS: Record<string, "pursue" | "discuss" | "pass"> = {
  "rev-rest-area-discuss": "discuss",
  "rev-epa-pass": "pass",
};

/** What each closed pursuit's dialog on the Pipeline says. */
export function closedPursuitDetail(id: string, daysAgo: number): ClosedPursuitDetail | null {
  if (id === "36C24627Q0041") {
    return {
      heading: "What you sent",
      lead: `You sent your quote ${daysAgo} days ago. The current contract ends 26 October, so expect an answer within a week.`,
      points: [
        "Four deep cleans a year of the medical center's canteen: hoods, walls, floors and equipment.",
        "Your plan: a night crew of three, so the canteen never closes during the day.",
        "Your references: the Seymour Johnson dorms and Briar Glen Medical Offices.",
        "Your price: $7,200 a year.",
      ],
      link: { label: "See VA work coming up", to: "/forecasts" },
    };
  }
  if (id === "W912PM26QA017") {
    return {
      heading: "Debrief notes",
      lead: "The Corps gave the winning total and said every quote was acceptable. Yours was about 11% higher.",
      points: [
        "Lowest price technically acceptable: every acceptable quote ties on quality, so price decides.",
        "Under simplified buying the Corps owes a short explanation, not a full debrief, and that's what you got.",
        "You priced four visits a week in peak season; the work statement asked for three plus call-outs.",
        `${PERSONA.ownerFirstName}, 30 firms quoted the same work in 2026. On Corps lake jobs, expect a crowd and know your price floor.`,
      ],
      link: { label: "See the Cape Fear locks job", to: "/opportunities/W912PM27QA004" },
    };
  }
  if (id === "FA480925F0123") {
    return {
      heading: "Award",
      lead: "You won this call and delivered it. It was your first federal prime contract. The value was $84,600.",
      points: [
        "Hot-water washing of 14 dormitories, their stairwells, sidewalks and dumpster pads, with the wash water kept out of the storm drains.",
        "Done between September and November 2025, around the airmen's schedule. Too small for a CPARS, so ask the COR for a reference letter.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return null;
}
