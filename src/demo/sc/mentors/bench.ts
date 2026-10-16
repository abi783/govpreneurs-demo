// DEMO: the mentor bench on the Mentors page.
//
// Sarah Mitchell comes from the story (persona.ts MENTOR), so her name, title
// and bio are never typed here. The other five mentors are fictional. They
// have no photo: the Mentors page draws their initials.
//
// `hours` is the Eastern wall-clock window in which the mentor takes calls.
// `busyShare` is the share of half-hour slots that the sample calendar marks
// as taken, so that every mentor looks like a person with a real diary.

import { MENTOR } from "@/demo/story/persona";
import { MENTOR_REVIEW_PRICE } from "@/demo/state/wallet";

export interface BenchMentor {
  id: string;
  name: string;
  title: string;
  bio: string;
  /** What the mentor covers, in one sentence for the card. */
  consultationDescription: string;
  /** The price of one 30-minute call, in dollars. */
  price: number;
  /** First and last start hour, Eastern time. The last call ends 30 minutes later. */
  hours: { start: number; end: number; lunch?: number };
  /** Days of the week the mentor takes calls (0 = Sunday). */
  days: number[];
  busyShare: number;
  /** The name that calendar entries show. */
  calendarName: string;
}

export const SARAH_ID = "mentor-sarah-mitchell";

export const BENCH: BenchMentor[] = [
  {
    id: SARAH_ID,
    name: MENTOR.name,
    title: MENTOR.title,
    bio: MENTOR.bio,
    consultationDescription:
      "Pick the right bids, check your price, and read your proposal before you send it. Best for food-service and facilities bids.",
    price: MENTOR_REVIEW_PRICE,
    hours: { start: 9, end: 16, lunch: 12 },
    days: [1, 2, 3, 4, 5],
    busyShare: 0.45,
    calendarName: "Mentor consultation",
  },
  {
    id: "mentor-renee-calloway",
    name: "Renee Calloway",
    title: "Proposal writing and capture · former proposal director",
    bio: "Renee led proposal teams at a facilities-services contractor for 11 years. She has written or reviewed more than 200 federal proposals.",
    consultationDescription:
      "Write an approach section that scores. Bring a draft or a solicitation and Renee will mark what the evaluators will look for.",
    price: 110,
    hours: { start: 10, end: 17 },
    days: [1, 2, 3, 4],
    busyShare: 0.4,
    calendarName: "Mentor consultation",
  },
  {
    id: "mentor-tomas-delgado",
    name: "Tomas Delgado",
    title: "SBA certifications · former SBA business opportunity specialist",
    bio: "Tomas helped small businesses through the SBA certification process for 9 years: woman-owned (WOSB), 8(a), HUBZone and veteran-owned.",
    consultationDescription:
      "Find out which set-asides you qualify for and what the SBA will ask you to prove. Good before you apply for a certification.",
    price: 85,
    hours: { start: 9, end: 15 },
    days: [2, 3, 4, 5],
    busyShare: 0.5,
    calendarName: "Mentor consultation",
  },
  {
    id: "mentor-priya-raman",
    name: "Priya Raman",
    title: "State, local and school purchasing · former county purchasing director",
    bio: "Priya ran purchasing for a county school system and sat on bid committees for eight years. She knows how schools and cities score a quote.",
    consultationDescription:
      "Win state, city and school-district work. Learn how to register, where to find bids, and what buyers read first.",
    price: 75,
    hours: { start: 9, end: 16 },
    days: [1, 2, 3, 4, 5],
    busyShare: 0.35,
    calendarName: "Mentor consultation",
  },
  {
    id: "mentor-calvin-brooks",
    name: "Calvin Brooks",
    title: "Pricing and cost proposals · former Army contract price analyst",
    bio: "Calvin reviewed contractor prices for the Army for 13 years. He teaches small businesses to price labor, food cost and overhead without under-bidding.",
    consultationDescription:
      "Build a price that wins and still pays you. Calvin checks your labor rates, overhead and margin line by line.",
    price: 120,
    hours: { start: 11, end: 17 },
    days: [1, 3, 4, 5],
    busyShare: 0.45,
    calendarName: "Mentor consultation",
  },
  {
    id: "mentor-angela-ruiz",
    name: "Angela Ruiz",
    title: "VA contracting and veteran set-asides · former VA contracting officer",
    bio: "Angela bought food and facility services for VA medical centers for 12 years. She explains how the VA buys and what its evaluators score.",
    consultationDescription:
      "Sell to VA medical centers. Learn the VA's forms, its veteran set-aside rules, and how a hospital kitchen contract is scored.",
    price: 95,
    hours: { start: 9, end: 14 },
    days: [1, 2, 3, 4],
    busyShare: 0.4,
    calendarName: "Mentor consultation",
  },
];

export function getBenchMentor(id: string): BenchMentor | undefined {
  return BENCH.find((m) => m.id === id);
}

/** The mentor shape that the lifted Mentors page and booking modal read. */
export function toPortalMentor(m: BenchMentor) {
  return {
    id: m.id,
    name: m.name,
    title: m.title,
    email: null as string | null,
    phone: null as string | null,
    avatarUrl: null as string | null,
    bio: m.bio,
    consultationPrice: String(m.price),
    consultationDescription: m.consultationDescription,
    formEnabled: false,
    formDescription: null as string | null,
    comingSoon: false,
  };
}
