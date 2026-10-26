// DEMO: the mentor bench on the Mentors page.
//
// These are GovPreneurs' real mentors, copied from the production Success Center
// (titles, prices and descriptions as members see them there, 26 Oct 2026). The
// story mentor (persona.ts MENTOR) is Diana Potts, so her name and bio are not
// typed here. Photos are in public/demo/people. No email or phone is shown.
// Ernie Hansen is left out on purpose: he is the salesperson behind every
// "Book a call" (SALES_ADVISOR, under a made-up name).
//
// `hours` is the Eastern wall-clock window in which the mentor takes calls.
// `busyShare` is the share of half-hour slots that the sample calendar marks
// as taken, so that every mentor looks like a person with a real diary.

import { MENTOR } from "@/demo/story/persona";
import { PROGRAM_SPECIALIST } from "@/demo/sc/home/people";
import { registerSearchEntries } from "@/demo/nav/searchIndex";

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
  /** The photo from the production Success Center, or null for initials. */
  avatarUrl: string | null;
  /** Listed, not bookable yet (production shows "Coming soon"). */
  comingSoon?: boolean;
}

export const STORY_MENTOR_ID = "mentor-diana-potts";

const photo = (slug: string) => `/demo/people/${slug}.jpg`;
const weekdays = [1, 2, 3, 4, 5];

export const BENCH: BenchMentor[] = [
  {
    id: STORY_MENTOR_ID,
    name: MENTOR.name,
    title: MENTOR.title,
    bio: MENTOR.bio,
    consultationDescription:
      "Book a call with me for guidance on positioning your business for disaster-related opportunities and understanding the overall framework of government contracting.",
    price: 97,
    hours: { start: 9, end: 16, lunch: 12 },
    days: weekdays,
    busyShare: 0.45,
    calendarName: "Mentor consultation",
    avatarUrl: photo("diana-potts"),
  },
  {
    id: "mentor-tim-sabir",
    name: "Tim Sabir",
    title: "Mentor",
    bio: "Tim founded GovPreneurs.",
    consultationDescription:
      "Book a call with me for marketing-related contracts, program and services questions, or partnership opportunities.",
    price: 197,
    hours: { start: 10, end: 16 },
    days: [1, 2, 3, 4],
    busyShare: 0.55,
    calendarName: "Mentor consultation",
    avatarUrl: photo("tim-sabir"),
  },
  {
    id: "mentor-sinan-murat",
    name: "Sinan Murat",
    title: "Digital Compliance Mentor",
    bio: "Sinan reviews members' digital presence.",
    consultationDescription:
      "Reviews every member's digital presence, walks them through fixes on a 1:1 call, runs weekly office hours.",
    price: 97,
    hours: { start: 9, end: 16 },
    days: weekdays,
    busyShare: 0.35,
    calendarName: "Mentor consultation",
    avatarUrl: photo("sinan-murat"),
  },
  {
    id: "mentor-maryam-abd",
    name: PROGRAM_SPECIALIST.name,
    title: PROGRAM_SPECIALIST.title,
    bio: PROGRAM_SPECIALIST.bio,
    // Her prod description (production lists her as Program Specialist, with no
    // call price); the title is Karthik's, and the price matches the other mentors.
    consultationDescription: PROGRAM_SPECIALIST.bio,
    price: 97,
    hours: { start: 9, end: 16 },
    days: weekdays,
    busyShare: 0.4,
    calendarName: "Mentor consultation",
    avatarUrl: PROGRAM_SPECIALIST.avatarUrl,
  },
  {
    id: "mentor-jp-cervantes",
    name: "JP Cervantes",
    title: "Mentor",
    bio: "JP is a defense contractor who specializes in security training and instruction.",
    consultationDescription:
      "Defense contractor specializing in security training and instruction, with deep expertise in protective intelligence and risk advisory. JP helps organizations prepare their teams, assess threats, and operate safely in high-stakes environments.",
    price: 97,
    hours: { start: 11, end: 17 },
    days: [1, 3, 4, 5],
    busyShare: 0.45,
    calendarName: "Mentor consultation",
    avatarUrl: photo("jp-cervantes"),
  },
  {
    id: "mentor-tiffany-lymon",
    name: "Tiffany Lymon",
    title: "Mentor",
    bio: "Tiffany is a Business & Leadership Alignment Strategist.",
    consultationDescription:
      "Tiffany Lymon is a Business & Leadership Alignment Strategist who helps organizations turn scattered effort into a focused wheelhouse by aligning people, infrastructure, and message. With more than 20 years of experience and clients ranging from Prudential and Lockheed Martin to the City of Gaithersburg, she helps service providers stop chasing stretch bids and become the obvious choice for the projects and partnerships that fit.",
    price: 97,
    hours: { start: 9, end: 14 },
    days: [1, 2, 3, 4],
    busyShare: 0.4,
    calendarName: "Mentor consultation",
    avatarUrl: photo("tiffany-lymon"),
  },
  {
    id: "mentor-alex-lazatin",
    name: "Alex Lazatin",
    title: "Mentor",
    bio: "Retired U.S. Army Special Forces Lieutenant Colonel and government contracting expert specializing in defense, operations, and security cooperation.",
    consultationDescription:
      "Retired U.S. Army Special Forces Lieutenant Colonel and government contracting expert specializing in defense, operations, and security cooperation.",
    price: 97,
    hours: { start: 9, end: 15 },
    days: weekdays,
    busyShare: 0.4,
    calendarName: "Mentor consultation",
    avatarUrl: photo("alex-lazatin"),
    comingSoon: true,
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
    avatarUrl: m.avatarUrl,
    bio: m.bio,
    consultationPrice: String(m.price),
    consultationDescription: m.consultationDescription,
    formEnabled: false,
    formDescription: null as string | null,
    comingSoon: m.comingSoon === true,
  };
}

// The command palette finds each mentor and sends the member to the Mentors page.
registerSearchEntries([
  ...BENCH.map((m) => ({
    label: `${m.name}: ${m.title.split(" · ")[0]}`,
    hint: "Mentor",
    to: "/find-a-mentor",
    keywords: ["mentor", "book", "call", "consultation", m.name],
  })),
  { label: "Book a mentor call", hint: "Mentors", to: "/find-a-mentor", keywords: ["schedule", "appointment", "consultation"] },
]);
