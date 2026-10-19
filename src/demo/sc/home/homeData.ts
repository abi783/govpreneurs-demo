// DEMO: the data behind the Success Center home.
//
// In production the home is a server page: it reads the database and
// GoHighLevel, then hands the result to the client components. Here the same
// hand-over is built from the story (persona, mentor, wallet, tasks,
// opportunities, mentor reviews) and from what the visitor has changed in the
// demo store. `buildHomeData()` runs on every render of the page, so a booking,
// a charge or a ticked step shows at once.

import { walletAmountsFrom, type WalletAmounts } from "@sc/lib/billing/walletDisplay";
import { byMember, own } from "@/demo/member";
import type { EnrolledService } from "@sc/components/portal/RoadmapEnrollmentList";
import type { ActivePlaybook } from "@sc/types/portal";
import { getWalletBalance, getWalletEntries } from "@/demo/state/wallet";
import { listMentorReviews } from "@/demo/state/mentorReviews";
import { isoDaysFromNow } from "@/demo/story/clock";
import { HERO_IDS, getOpportunity } from "@/demo/story/opportunities";
import { MENTOR, PERSONA } from "@/demo/story/persona";
import { CLOSED_PURSUITS, MENTOR_REVIEWS } from "@/demo/story/workspace";
import { BENCH, getBenchMentor, toPortalMentor } from "@/demo/sc/mentors/bench";
import { readBusiness } from "@/demo/sc/business/state";
import { getActionPlans } from "./actionPlan";
import { PROGRAM_SPECIALIST } from "./people";
import { getHomeProgress } from "./progress";
import {
  appointmentsForHome,
  assignedMentorId,
  freeSessionsLeft,
  getActivity,
  getProfileImages,
} from "./store";
import { CONTACT_TIMEZONE } from "./time";
import type { GHLAppointment, MainStepProgress, WalletUsageItem } from "./types";

const { homeActivity } = own(
  import.meta.glob<typeof import("@/demo/members/agency/sc/home")>("/src/demo/members/*/sc/home.ts", { eager: true }),
);

export interface ActivityItem {
  id: string;
  kind: "ava" | "mentor" | "grant" | "bid" | "booking" | "message" | "wallet";
  title: string;
  detail: string;
  at: string;
  to: string;
}

export interface HomeData {
  locationId: string;
  businessName: string;
  planName: string;
  ownerFirstName: string;
  contact: { firstName: string; lastName: string; email: string; phone: string; photoUrl: string | null };
  company: { accountName: string; address: string; website: string; logoUrl: string | null };
  meta: { entityRenewal: string; uei: string; cage: string; primaryNaics: string };
  programSpecialist: { name: string; title: string; avatarUrl: null; bio: string; calendarId: null };
  assignedMentor: ReturnType<typeof toPortalMentor> | null;
  freeRemaining: number;
  contactTimezone: string;
  featuredAppointment: GHLAppointment | null;
  appointments: GHLAppointment[];
  walletBalance: number;
  walletAmounts: WalletAmounts;
  walletUsage: WalletUsageItem[];
  walletTotalSpent: number;
  playbooks: ActivePlaybook[];
  progressPercent: number;
  mainSteps: MainStepProgress[];
  enrolledServices: EnrolledService[];
  deliveredServices: { id: string; title: string; link: string; kind: "view" | "sign" }[];
  currentOffer: { title: string; done: boolean }[];
  sidebarSettings: Record<string, string | null>;
  activity: ActivityItem[];
}

const SEEDED_WALLET_IDS = /^tx-\d$/;

function longDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function usageFromWallet(): WalletUsageItem[] {
  return getWalletEntries()
    .filter((e) => e.amount < 0)
    .map((e, i): WalletUsageItem => ({
      id: e.id,
      kind: "booking",
      title: e.label,
      amount: Math.abs(e.amount),
      currency: "USD",
      at: e.at,
      pending: false,
      receipt: { state: "ready", number: `GP-${String(1042 + i).padStart(5, "0")}` },
    }));
}

function currentOfferRows(): { title: string; done: boolean }[] {
  const debits = getWalletEntries().filter((e) => e.amount < 0);
  const row = (e: { label: string; id: string }) => ({
    title: e.label.replace(" — ", ": "),
    done: SEEDED_WALLET_IDS.test(e.id),
  });
  return [
    { title: `Positioning call with ${MENTOR.name}`, done: true },
    { title: "Capability statement", done: true },
    ...debits.filter((e) => SEEDED_WALLET_IDS.test(e.id)).map(row),
    { title: "Prime contractor registration", done: false },
    // Every charge the visitor adds in the demo joins the list until it is delivered.
    ...debits.filter((e) => !SEEDED_WALLET_IDS.test(e.id)).map(row),
  ];
}

/** Eight in the morning today, or five minutes ago when it is earlier than that. */
function earlierToday(hour: number): string {
  const start = new Date();
  start.setHours(hour, 0, 0, 0);
  return new Date(Math.min(Date.now() - 5 * 60_000, start.getTime())).toISOString();
}

function relativeAt(daysAgo: number, hour = 15): string {
  return isoDaysFromNow(-daysAgo, hour);
}

function activityFeed(): ActivityItem[] {
  const items: ActivityItem[] = [];

  const hero = getOpportunity(HERO_IDS.hero);
  if (hero?.ava) {
    items.push({
      id: "act-ava",
      kind: "ava",
      title: `Ava is drafting your quote: ${hero.plainTitle}`,
      detail: hero.ava.statusLine,
      at: earlierToday(8),
      to: `/ava/${hero.id}`,
    });
  }

  for (const review of listMentorReviews()) {
    if (review.status !== "responded" || !review.unread) continue;
    const opp = review.oppKey ? getOpportunity(review.oppKey) : undefined;
    items.push({
      id: `act-review-${review.id}`,
      kind: "mentor",
      title: `${review.mentorName} replied on ${opp?.plainTitle ?? review.title}`,
      detail: MENTOR_REVIEWS.find((r) => r.id === review.id)?.outcome ?? review.lastMessagePreview,
      at: new Date(Math.min(Date.now() - 45 * 60_000, new Date(review.lastMessageAt).getTime())).toISOString(),
      to: `/mentors/${review.id}`,
    });
  }

  const twin = getOpportunity(HERO_IDS.twin);
  if (twin?.pursuit) {
    items.push({
      id: "act-grant",
      kind: "grant",
      title: `Grant advised you to pass: ${twin.plainTitle}`,
      detail: twin.pursuit.note,
      at: relativeAt(twin.pursuit.lastActivityDaysAgo),
      to: `/opportunities/${twin.id}`,
    });
  }

  const submitted = CLOSED_PURSUITS.find((p) => p.stage === "submitted");
  if (submitted) {
    items.push({
      id: "act-bid",
      kind: "bid",
      title: `Your bid is in: ${submitted.title}`,
      detail: submitted.note,
      at: relativeAt(submitted.daysAgo),
      to: submitted.next.to,
    });
  }

  // DEMO: lines only one member's story has (the agency: Sarah's Pass on Visit NC
  // and her answer on the NC Guard rating).
  items.push(...byMember({ caterer: () => [], pack: homeActivity })());

  for (const a of getActivity()) {
    items.push({
      id: a.id,
      kind: a.kind === "wallet" ? "wallet" : a.kind === "message" ? "message" : "booking",
      title: a.title,
      detail: a.detail,
      at: a.at,
      to: a.to,
    });
  }

  return items.sort((x, y) => y.at.localeCompare(x.at)).slice(0, 6);
}

/**
 * DEMO: the contact card reads what the visitor typed in My Business, so a phone number edited
 * there shows here too. A missing or odd value falls back to the story.
 */
function typedContact(fieldKey: string): string | null {
  try {
    const v = readBusiness().rows.find((r) => r.fieldKey === fieldKey)?.value;
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object" && typeof (v as { url?: unknown }).url === "string") return (v as { url: string }).url.trim() || null;
  } catch {
    /* the My Business record is not readable: use the story */
  }
  return null;
}

export function buildHomeData(): HomeData {
  const progress = getHomeProgress();
  const walletBalance = getWalletBalance();
  const usage = usageFromWallet();
  const { featured, all } = appointmentsForHome();
  const mentor = getBenchMentor(assignedMentorId()) ?? BENCH[0];
  const images = getProfileImages();

  return {
    locationId: PERSONA.locationId,
    businessName: PERSONA.businessName,
    planName: PERSONA.plan,
    ownerFirstName: PERSONA.ownerFirstName,
    contact: {
      firstName: (typedContact("primary_contact_name") ?? PERSONA.ownerName).split(" ")[0] || PERSONA.ownerFirstName,
      lastName: (typedContact("primary_contact_name") ?? PERSONA.ownerName).split(" ").slice(1).join(" "),
      email: typedContact("email") ?? PERSONA.email,
      phone: typedContact("phone") ?? PERSONA.phone,
      photoUrl: images.contactPhoto,
    },
    company: {
      accountName: PERSONA.businessName,
      address: PERSONA.physicalAddress,
      website: typedContact("website") ?? PERSONA.website,
      logoUrl: images.companyLogo,
    },
    meta: {
      entityRenewal: longDate(PERSONA.samActiveUntil),
      uei: PERSONA.uei,
      cage: PERSONA.cage,
      primaryNaics: PERSONA.primaryNaics,
    },
    programSpecialist: {
      name: PROGRAM_SPECIALIST.name,
      title: PROGRAM_SPECIALIST.title,
      avatarUrl: null,
      bio: PROGRAM_SPECIALIST.bio,
      calendarId: null,
    },
    assignedMentor: toPortalMentor(mentor),
    freeRemaining: freeSessionsLeft(),
    contactTimezone: CONTACT_TIMEZONE,
    featuredAppointment: featured,
    appointments: all,
    walletBalance,
    walletAmounts: walletAmountsFrom({ paidBalance: walletBalance, promotionalCredit: 0 })!,
    walletUsage: usage,
    walletTotalSpent: usage.reduce((s, u) => s + u.amount, 0),
    playbooks: getActionPlans(),
    progressPercent: progress.percent,
    mainSteps: progress.mainSteps,
    enrolledServices: progress.enrollment,
    deliveredServices: [
      { id: "del-cap-statement", title: "Capability statement", link: PERSONA.capabilityStatementFile, kind: "view" },
      { id: "del-sam", title: "SAM.gov registration record", link: "/my-business", kind: "view" },
    ],
    currentOffer: currentOfferRows(),
    sidebarSettings: {
      filesLink: "/my-business",
      filesTitle: "Your Files",
      filesDescription: "Your capability statement, SAM.gov registration and business documents are in My Business.",
      filesButtonLabel: "Open My Business",
      servicesLink: null,
      feedbackLink: null,
      feedbackTitle: null,
      feedbackDescription: null,
      feedbackButtonLabel: null,
      affiliateLink: null,
      affiliateTitle: null,
      affiliateDescription: null,
      affiliateButtonLabel: null,
      socialFacebook: null,
      socialTwitter: null,
      socialYoutube: null,
      socialLinkedin: null,
      socialInstagram: null,
    },
    activity: activityFeed(),
  };
}
