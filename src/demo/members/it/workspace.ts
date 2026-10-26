// THE IT SERVICES FIRM, part 2 (read through src/demo/story/workspace.ts):
// Hector's work in progress — closed pursuits, mentor reviews, wallet and tasks.
// Source: demo-storyboard/it-services-pack.md, sections 11 and 12.
//
// The hero (the Army Reserve help desk) starts with NO mentor review: Tim sends
// it live on the call, and the presenter's "Diana answers" control plays the
// day forward. The threads below show the other two verdicts, Discuss and Pass,
// so all three are on screen.

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
    id: "W91242-26-Q-0093",
    title: "Laptop imaging and deployment, 650 devices — NC Guard Joint Force Headquarters, Raleigh",
    agency: "Department of the Army",
    stage: "submitted",
    value: 74_000,
    note: "Submitted 6 days ago. The Guard expects to award in about 3 weeks.",
    daysAgo: 6,
    next: { label: "See what you sent", to: "/pipeline" },
  },
  {
    id: "FA480924C0011",
    title: "Desktop support — 4th Communications Squadron, Seymour Johnson AFB",
    agency: "Department of the Air Force",
    stage: "won",
    value: 492_600,
    note: "Won and running. Your first federal prime contract; interim CPARS Very Good.",
    daysAgo: 965,
    next: { label: "Add it to My Business", to: "/my-business" },
  },
  {
    id: "W91247-26-Q-0412",
    title: "Windows 11 upgrade surge — XVIII Airborne Corps G-6 (8(a))",
    agency: "Department of the Army",
    stage: "not_awarded",
    value: 186_000,
    note: "Not awarded. Lost on price by 11%; the debrief notes are in your files.",
    daysAgo: 58,
    next: { label: "Read the debrief notes", to: "/pipeline" },
  },
];

export const MENTOR_REVIEWS: MentorReviewStory[] = [
  {
    id: "rev-pope-sources-sought",
    oppId: "FA445227R0004",
    title: "Should I answer the Pope 43 CS sources sought? The last two went sole-source.",
    status: "mentor_replied",
    unread: true,
    openedDaysAgo: 2,
    lastMessageDaysAgo: 0,
    outcome:
      "Let's talk first. Two or more capable 8(a) answers can turn it into a competition. Bring your Seymour Johnson CPARS; 20 minutes.",
    price: 97,
  },
  {
    id: "rev-hoke-chromebooks",
    oppId: "HCS-2027-TECH-02",
    title: "Should I bid Hoke County Schools' Chromebook purchase?",
    status: "closed",
    unread: false,
    openedDaysAgo: 9,
    lastMessageDaysAgo: 8,
    outcome: "Pass. It's a device buy, and resellers win on device price. Offer the district summer repair and imaging instead.",
    price: 97,
  },
  {
    id: "rev-sprs-howto",
    oppId: null,
    title: "How do I post my CMMC self-assessment in SPRS?",
    status: "closed",
    unread: false,
    openedDaysAgo: 41,
    lastMessageDaysAgo: 38,
    outcome:
      "Score the 110 controls, enter the score and your plan date in SPRS, and have an officer affirm it every year. Diana sent a checklist.",
    price: 0,
  },
];

export const WALLET: WalletStory = {
  balance: 306,
  mentorReviewPrice: 97,
  entries: [
    { label: "Wallet top-up", amount: 500, daysAgo: 20 },
    { label: "Mentor review — Hoke County Chromebook purchase", amount: -97, daysAgo: 9 },
    { label: "Mentor review — Pope 43 CS sources sought", amount: -97, daysAgo: 2 },
  ],
};

export const TASKS: StoryTask[] = [
  {
    id: "task-ava-help-desk",
    title: "Answer Ava's 3 questions on the Army Reserve help desk quote",
    why: "Ava can't finish the quote without your site lead and alternate, how you staff six seats in 30 days, and how you price the techs.",
    dueInDays: 3,
    done: false,
    to: `/ava/${HERO_IDS.hero}`,
    source: "ava",
  },
  {
    id: "task-security-plus",
    title: "Book Security+ exams for your two techs",
    why: "Every tech with admin rights needs Security+ on day one. Two of the six you'd put there don't have it yet.",
    dueInDays: 5,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-brackwater",
    title: "Reply to Brackwater Federal Solutions about the Army hospital IT",
    why: "Grant says team up. They hold 8(a) STARS III and want a local firm for 9 deskside techs.",
    dueInDays: 5,
    done: false,
    to: "/partners",
    source: "partners",
  },
  {
    id: "task-wage-floor",
    title: "Price six techs at or above the wage floor",
    why: "The wage determination sets $37.50 an hour plus $5.92 health and welfare for a PC support technician. Show it line by line.",
    dueInDays: 7,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-gear-question",
    title: "Ask whether the Army issues laptops and tools to the techs",
    why: "It changes your price. Send the question before Q&A closes in 10 days; every bidder sees the answer.",
    dueInDays: 9,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-seymour-cpars",
    title: "Send your CPARS with the Seymour Johnson follow-on quote",
    why: "You're the incumbent, rated Very Good. Put the rating in front of them.",
    dueInDays: 10,
    done: false,
    to: "/opportunities/FA480927Q0006",
    source: "grant",
  },
  {
    id: "task-pope-sources-sought",
    title: "Answer the Pope 43 CS sources sought",
    why: "Two or more capable 8(a) answers can turn the next contract into a competition. It closes in 16 days.",
    dueInDays: 14,
    done: false,
    to: "/opportunities/FA445227R0004",
    source: "mentor",
  },
  {
    id: "task-cmmc-items",
    title: "Close 4 of 9 open CMMC items and update SPRS",
    why: "Your Level 2 self-assessment scores 92 of 110. Any job that touches controlled information will ask for it.",
    dueInDays: 30,
    done: false,
    to: "/my-business",
    source: "roadmap",
  },
];

/** Diana's written threads, keyed by review id (MENTOR_REVIEWS). */
export const MENTOR_THREADS: Record<string, ThreadMessageStory[]> = {
  "rev-pope-sources-sought": [
    {
      author: "member",
      daysAgo: 2,
      hour: 7,
      html: "<p>Hi Diana — Pope's 763 ESS posted a sources sought for the 43rd Communications Squadron's IT support, about $900K a year. The last two contracts went sole-source to a tribe-owned firm. Is it worth answering, or is it already decided?</p>",
    },
    {
      author: "mentor",
      daysAgo: 0,
      hour: 9,
      html: "<p>Hector, it's worth answering, but <strong>let's talk first</strong>. A sources sought is how the Air Force decides how to buy the next one. If two or more capable 8(a) firms answer, it can become an 8(a) competition instead of another sole source.</p><p>Book 20 minutes with me this week and bring your Seymour Johnson CPARS. — Diana</p>",
    },
  ],
  "rev-hoke-chromebooks": [
    {
      author: "member",
      daysAgo: 9,
      hour: 6,
      html: "<p>Diana, Hoke County Schools wants 2,400 Chromebooks with setup, $700K–$800K. We re-imaged 4,800 for Cumberland County in 2023. Should I bid it?</p>",
    },
    {
      author: "mentor",
      daysAgo: 8,
      hour: 14,
      html: "<p><strong>Pass.</strong> It's a device buy, and resellers win on device price. The setup is a small part of the money. Offer the district summer repair and imaging instead; that's the work your Cumberland County job proves. — Diana</p>",
    },
    { author: "member", daysAgo: 8, hour: 16, html: "<p>Makes sense. Passing, and I'll write to their technology director about summer imaging.</p>" },
  ],
  "rev-sprs-howto": [
    {
      author: "member",
      daysAgo: 41,
      hour: 7,
      html: "<p>The Army keeps asking for our CMMC score in SPRS. How do I post it?</p>",
    },
    {
      author: "mentor",
      daysAgo: 38,
      hour: 14,
      html: "<p>Score yourself against the 110 controls, then enter the score and the date you'll close the open items in SPRS, the Defense Department's supplier performance system. An officer of the company has to affirm it every year. I've attached a checklist.</p>",
      attachments: ["SPRS-self-assessment-checklist.docx"],
    },
  ],
};

/** Her verdict on each thread that has one. */
export const MENTOR_RECOMMENDATIONS: Record<string, "pursue" | "discuss" | "pass"> = {
  "rev-pope-sources-sought": "discuss",
  "rev-hoke-chromebooks": "pass",
};

/** What each closed pursuit's dialog on the Pipeline says. */
export function closedPursuitDetail(id: string, daysAgo: number): ClosedPursuitDetail | null {
  if (id === "W91242-26-Q-0093") {
    return {
      heading: "What you sent",
      lead: `You sent your quote ${daysAgo} days ago. The Guard expects to award in about 3 weeks.`,
      points: [
        "Image, tag and deliver 650 laptops to Guard units across the state in 45 days.",
        "Your plan: two techs at the Raleigh headquarters and one on the road for unit drop-offs.",
        "Your references: the Seymour Johnson desktop support and the Cumberland County Chromebook job.",
        "Your price: $74,000.",
      ],
      link: { label: "See Guard work coming up", to: "/forecasts" },
    };
  }
  if (id === "W91247-26-Q-0412") {
    return {
      heading: "Debrief notes",
      lead: "It was lowest price technically acceptable. You were acceptable on every factor, and the award went to a quote 11% lower than yours.",
      points: [
        "The winner, Kettle Creek Technologies, priced every tech at exactly the wage floor: $37.50 an hour plus $5.92.",
        "You priced $41.00 to keep your staff. On a lowest-price buy, $3.50 an hour lost it.",
        `${PERSONA.ownerFirstName}, for the Army Reserve help desk: show the floor, and put any premium only where the work statement asks for experience.`,
      ],
      link: { label: "See the help desk quote", to: `/opportunities/${HERO_IDS.hero}` },
    };
  }
  if (id === "FA480924C0011") {
    return {
      heading: "Award",
      lead: "You won this contract and it is running. It is your first federal prime contract. The value is $492,600 over 3 years.",
      points: [
        "Two on-site techs for the squadron's desktop support, plus an imaging surge for 1,100 Windows 11 laptops.",
        "It ends in February 2027. The interim rating is Very Good, and the follow-on is on your list now.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return null;
}
