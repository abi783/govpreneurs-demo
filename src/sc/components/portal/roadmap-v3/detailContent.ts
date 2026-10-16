// Roadmap v3 — static content, ported verbatim from the frozen prototype
// (roadmap-v2/prototype/src/routes/roadmap.tsx + lib/grant/*). The checklists
// here are the page's own copy; where the member actually STANDS comes from
// the server payload. `portalPath` values are resolved against /{locationId}
// by the client ("" = portal home, "tasks" = the tasks page).

export type SubStepDetail = {
  items: string[];
  why: string;
  group?: string;
  /** A footnote under the checklist, marked with `*`. Required href on
   *  purpose — a footnote styled as a link that goes nowhere is a dead chip. */
  note?: { label: string; href: string };
  help?: "dfy" | "pursuit" | "mentor-call";
  /**
   * Replaces the "Do it yourself" panel for a step where doing it yourself
   * is not the alternative on offer — her mentor's own plan, or a video, not
   * a course. Outranks both the course fallback and the "dfyBought ||
   * !notStarted" rules that make the plain DIY card die with its offer: her
   * mentor's plan is not half of anything, so it renders whatever state the
   * step is in.
   */
  selfServe?: {
    title: string;
    desc: string;
    cta: string;
    /** Internal route, or an http(s) URL — the panel picks the right element. */
    href: string;
    /** Which glyph fits: a plan she follows, or a video/course she watches. */
    icon: "plan" | "course";
  };
  /**
   * Opens the step with its intake form instead of its checklist.
   *
   * Only Digital Compliance sets it. That step does not begin with the twelve
   * things on its list — it begins with a twelve-FIELD form the specialist
   * reads before he audits anything, and the call that submitting it earns.
   * The two closed stages hide the checklist AND the done-for-you pair: a
   * twelve-item list she cannot act on yet is twelve things she appears to be
   * behind on, and an offer shown before the call pre-empts the call.
   */
  audit?: boolean;
  /** Overrides the service's own turnaround for THIS step. */
  dfyDuration?: string;
  /** What we need from her before our team can start: a call, or a form. */
  handoff?: "call" | "form";
};

/**
 * The GovPreneurs course. ONE URL, used by "Do it yourself" on any step with
 * no alternative of its own, by "How your AI team works" on Meet Your AI
 * Agents, and by "How to Send to Mentor" below — hoisted here so the fact
 * that all three share one destination is stated once rather than repeated
 * as three literals. Declared before SUB_STEP_DETAIL, which reads it.
 */
export const COURSE_URL =
  "https://hub.govpreneurs.com/courses/products/e87faa84-4142-4a51-81c3-70a5d2c02d0b";

/**
 * The hub LESSON, not the course landing page.
 *
 * Two buttons open it: "How your AI team works" on Meet Your AI Agents, and
 * "How to Send to Mentor" on Send to Mentor. Both promise a specific video,
 * so landing either on the catalogue would make her hunt for the thing the
 * button just promised.
 *
 * Separate from COURSE_URL, which stays the catalogue because its remaining
 * user — the DIY card's fallback on any step with no resource of its own —
 * means "go and learn this area" rather than "watch this".
 */
export const HUB_LESSON_URL =
  "https://hub.govpreneurs.com/courses/products/bac8fa04-59b3-4c44-b6a9-fa3c829ee20c" +
  "/modules/db7b94a6-8227-4524-8ca1-3b9cf41d6668" +
  "/lessons/11722422-7ca1-4eb8-97bd-ed64cce8694a" +
  "?template_id=Classic&lessonRouteName=post-overview-v2";

export const SUB_STEP_DETAIL: Record<string, SubStepDetail> = {
  // ── Foundation ────────────────────────────────────────────────────
  "p1-business-setup": {
    dfyDuration: "3–5 days",
    items: ["LLC / entity formation", "EIN", "Business bank account"],
    why: "These three make your business a legal thing the government can pay. Nothing else can start until they exist.",
  },
  // Digital Identity merged into this step (25 Aug 2026) — one service, one
  // audit form. Its four items (Submit Audit Form / Domain / email / phone)
  // are the first four lines below, under the same longer names this file
  // already used for them.
  "p1-digital-compliance": {
    audit: true,
    handoff: "call",
    dfyDuration: "5–7 days",
    items: [
      "Submit Audit Form",
      "Website/footer",
      "Domain",
      "Business email",
      "Business phone",
      "A2P Brand",
      "A2P Campaign",
      "Contact/Consent",
      "Government Page",
      "Letterhead",
      "Privacy Policy",
      "LinkedIn",
    ],
    why: "Buyers and primes check before they call. A clean site on your own domain says you are real.",
  },
  "p1-federal-registration": {
    dfyDuration: "8–10 weeks",
    items: ["Entity validation", "UEI", "SAM registration", "IRS/TIN validation", "CAGE"],
    why: "This is the registration that lets a federal buyer pay you. Until it is active, no one can award you anything.",
  },
  "p1-sled-registration": {
    group: "Your Mentor Suggested Registrations:",
    items: ["State Registration", "City Vendors", "County Vendors", "Local Agencies", "Prime Registrations"],
    note: { label: "Set by your Mentor", href: "/mentors" },
    why: "Only the registrations that open work you actually want. We will not send you chasing the rest.",
  },

  // ── Visibility & Credibility ─────────────────────────────────────────
  "p2-capability-statement": {
    dfyDuration: "3 days",
    items: [
      "Company & Contact Information",
      "Core Competencies",
      "Past Performance",
      "Differentiators",
      "Company Data",
      "Government Codes & Credentials",
      "Targeting & Relevance Check",
      "Final Document Check",
    ],
    why: "This is the one page every buyer asks for. It is also what unlocks your AI team.",
  },
  "p2-sbs-registration": {
    handoff: "call",
    dfyDuration: "3 days",
    items: ["Create SBA Profile (SBS)", "Optimize your SBA profile", "Verify the finished profile"],
    why: "This is how federal buyers find businesses like yours. A few minutes here, more visibility for months.",
  },

  "p2-cmmc-level-1": {
    items: ["CMMC 2.0 Level 1"],
    why: 'CMMC 2.0 Level 1 ("Foundational") is the baseline cybersecurity standard for Department of Defense (DoD) contractors who handle Federal Contract Information (FCI) but do not process Controlled Unclassified Information (CUI). It requires the implementation of 17 basic cyber hygiene practices and an annual self-assessment.',
  },

  // ── Search, Save & Send ───────────────────────────────────────────
  // `help: "mentor-call"` is the whole wiring: it swaps the done-for-you pair
  // for MentorCallCard. No service backs a mentor call, so nothing is listed
  // in DFY_FOR_SUBSTEP for it.
  "p3-positioning-call": {
    help: "mentor-call",
    items: ["Book your positioning call", "Receive your strategy"],
    why: "Your mentor learns your business on this call. What you agree here shapes everything after it.",
  },
  "p3-planned-pursuit": {
    group: "Getting started with your AI team",
    items: ["Watch all the AI videos", "Interact with Hunter"],
    help: "pursuit",
    why: "Hunter finds the work. Using him is how he learns what to bring you.",
  },
  "p3-send-to-mentor": {
    // "Do it yourself" is the wrong offer here twice over: there is nothing
    // to buy on this step, and sending work to your mentor is not a thing
    // you do INSTEAD of us doing it. What she wants in that slot is how to
    // do it well.
    selfServe: {
      title: "How to Send to Mentor",
      desc: "A short video on what to send and what happens next.",
      cta: "Watch the video",
      href: HUB_LESSON_URL,
      icon: "course",
    },
    items: ["Send 5 opportunities you like to your mentor"],
    note: { label: "Your Mentor's guidance on what to bid", href: "/mentors" },
    // DEMO: US wording ("two weeks", not "a fortnight"), and no "what wins".
    why: "Your mentor has seen what works and what wastes two weeks. Ask before you commit to one.",
  },

  // ── Execution ─────────────────────────────────────────────────────
  // Ava is named with her ship state attached — she is the one agent of the
  // three whose work does not exist yet, so the row says so where it is read.
  // Drop "(Coming Soon!)" the day drafting ships.
  /* Prime and CMMC are SLED's shape deliberately: a checklist and a
     done-for-you offer, no bespoke panel. Prime carries `diyEnabled: false` —
     registering with a prime is not something we hand her resources to do
     herself. */
  "p3-prime-registration": {
    items: [
      "Identify the primes that buy your work",
      "Register on each prime's supplier portal",
      "Submit your capability statement",
      "Confirm your registration is active",
    ],
    why: "Primes subcontract most of what they win. Being on their vendor list is how they find you when they need what you do.",
  },

  "p4-proposal-building": {
    items: [
      "Ava - Your Proposal Builder (Coming Soon!)",
      "You correct the work details",
      "Add past performance",
      "Price it",
    ],
    why: "Ava will write the first draft, so you will be correcting a page instead of facing a blank one.",
  },
  "p4-review-submit": {
    items: [
      "Make sure your prices, forms, signature and due date are all correct before you send.",
      "Mentor Reviewed (Before Submission)",
    ],
    why: "A last read-through, with you deciding what is right. Once a bid is sent it cannot be taken back.",
  },
};

export const DEFAULT_DETAIL: SubStepDetail = {
  items: ["Your mentor sets this up with you in the program."],
  why: "Your mentor shapes this part of the roadmap around your business.",
};

/** What sits under a sub-step she cannot start yet, in place of its state. */
export const GATED_CAPTION = "Don't start yet";

/** Days an outstanding input may sit before the mark escalates to red. */
export const GRACE_DAYS = 7;

export const MENTOR_CALL_NAME: Record<number, string> = {
  2: "Digital Compliance Call",
  3: "Positioning Strategy Call",
  4: "Targeting Strategy Call",
};

export const MENTOR_CALL_BLURB: Record<number, string> = {
  // Free, and it says so first: she earns this call by filling in the audit
  // form, and that is the whole offer. The prototype's wording, minus "with
  // our digital compliance specialist" — his name and title are on the card
  // directly above this line, which the prototype had no roster for.
  2: "Book a free complimentary call. We go through your audit together and agree what still needs doing.",
  3: "Book a call for guidance on positioning your business, and on how government buying works.",
  4: "Book a call to choose the job you will bid first, and what has to be ready before you bid it.",
};

// ── Static service copy, from the frozen catalog (lib/grant/dfyServices.ts).
// Prices are NOT here — they come from the DB sections, which are what the
// enroll route charges. `proof` is deliberately not ported: the prototype
// marks every figure PLACEHOLDER, and a claim we cannot stand behind is worse
// than no claim.
export type ServiceCopy = {
  name: string;
  deliveredBy?: string;
  benefit?: string;
  yourPart?: string;
  turnaround?: string;
};

export const SERVICE_COPY: Record<string, ServiceCopy> = {
  "llc-application": {
    name: "LLC Application",
    deliveredBy: "GovPreneurs Business Formation Specialists",
    turnaround: "3–5 days",
  },
  "sam-registration": {
    name: "SAM.gov Registration",
    deliveredBy: "GovPreneurs Federal Registration Specialists",
    benefit:
      "You can't be paid a federal dollar without an active SAM.gov registration — it's the system of record that issues your UEI and clears you to win awards. Our team files the whole thing and clears the rejections that stall most first-timers.",
    turnaround: "8–10 weeks",
  },
  "capability-statement": {
    name: "Capability Statement",
    deliveredBy: "GovPreneurs Capability Statement Writers",
    benefit:
      "Buyers use it to size you up in 60 seconds — we write it: NAICS codes, past performance, and differentiators, formatted the way federal buyers expect.",
    turnaround: "3 days",
  },
  "sbs-visibility-setup": {
    name: "SBS Visibility Setup",
    deliveredBy: "GovPreneurs SBA Profile Specialists",
    turnaround: "3 days",
  },
  "sled-enrollment": {
    name: "SLED Enrollment",
    deliveredBy: "GovPreneurs State and Local Registration Specialists",
    benefit:
      "Most state and local agencies won't take your bid until you're a registered vendor in their state. We file that registration for you — one state — so a technicality never knocks you out of a job you'd otherwise win.",
    turnaround: "1–2 weeks",
  },
  "cmmc-level-1": {
    name: "CMMC 2.0 Level 1",
    deliveredBy: "GovPreneurs Cybersecurity Compliance Specialists",
    benefit:
      "Defense contracts that touch federal contract information require a current CMMC self-assessment on file. Our team runs the assessment with you and files the affirmation, so a cybersecurity clause never rules you out of a bid.",
  },
  "govcompliant-digital-setup": {
    name: "GovCompliant Digital Setup",
    deliveredBy: "GovPreneurs Digital Compliance Specialists",
    yourPart: "Answer a few questions about your business. We do the rest.",
    benefit:
      "Buyers look you up before they call you. This makes every place they look — your site, your email, your phone number — say the same thing, and say you are a real business.",
  },
};

// What each line of a done-for-you scope actually means, keyed by the item's
// own label. An item with no entry renders as a bare bullet — a line we
// cannot explain properly should say nothing rather than pad itself out.
export const DFY_SCOPE_NOTES: Record<string, string> = {
  "LLC / entity formation": "We file with the state so your business exists as a legal entity.",
  EIN: "Your federal tax number from the IRS. Every registration asks for it.",
  "Business bank account":
    "An account in the business name, keeping company money separate from yours.",
  "Website and footer":
    "A live site showing the business details buyers check, the same on every page.",
  Domain: "Your own web address, so your site and email carry your business name.",
  Email: "Email at your own domain. A free address makes a real business look temporary.",
  Phone: "A business number that reaches you, listed the same way everywhere.",
  "A2P Brand": "Registers your business with the phone carriers so your texts are allowed through.",
  "A2P Campaign": "Registers what you send and why. Without it, carriers block business texts.",
  "Contact and consent": "The contact form and the permission wording the carriers require.",
  "Government page": "A page written for government buyers, carrying your codes and credentials.",
  Letterhead: "Your letterhead for quotes, letters and proposals, matching the rest.",
  "Privacy policy": "Required before carriers approve texting, and before buyers trust your form.",
  LinkedIn: "A company page that matches your site. Buyers look you up before they call.",
  "Entity validation": "SAM checks your legal name and address against IRS and state records.",
  UEI: "Your Unique Entity ID — how the government identifies you in every system.",
  "SAM registration": "Registration in SAM.gov. No federal agency can pay you without it.",
  "IRS/TIN validation":
    "SAM matches your tax number to IRS records. A mismatch is the usual hold-up.",
  CAGE: "Your CAGE code, issued once SAM clears. Agencies use it to identify you.",
  "Create SBA Profile (SBS)":
    "Your profile in the SBA's Small Business Search, where buyers go to find suppliers.",
  "Optimize your SBA profile":
    "We write it to match the work you want and the words buyers actually search.",
  "Verify the finished profile": "We check the finished profile with you before it goes live.",
  "Company & Contact Information":
    "Your name, address, contacts and codes, laid out the way buyers expect them.",
  "Core Competencies": "The three or four things you do best, so a buyer sees the fit fast.",
  "Past Performance": "The jobs you have done, with the detail that shows you can do this one.",
  Differentiators: "Why you and not the next company. Specific claims, never general ones.",
  "Company Data": "Your size, certifications and business type, so buyers know what you fit.",
  "Government Codes & Credentials":
    "Your NAICS, PSC and UEI in one place, so a buyer can check you in seconds.",
  "Targeting & Relevance Check":
    "We match the wording to the agencies you want, so it speaks to the right buyer.",
  "Final Document Check": "A last read for accuracy and layout before a buyer sees it.",
  "State Registration": "Registering you to sell to your state, so the state can pay you.",
  "City Vendors": "Signing you up to city vendor lists, where smaller contracts are posted.",
  "County Vendors": "County purchasing lists, where local contracts are posted.",
  "Local Agencies": "School districts, transit and utilities near you, each with its own list.",
};

export function scopeNote(label: string): string | null {
  return DFY_SCOPE_NOTES[label] ?? null;
}

// The record panel's facts per service — which live profile fields the
// deliverable consists of. Plain sentence first, official term underneath.
export const RECORD_FIELDS: Record<
  string,
  { key: "legalName" | "ein" | "uei" | "cage" | "website" | "phone" | "email" | "sledStates"; label: string; term?: string }[]
> = {
  "llc-application": [
    { key: "legalName", label: "Registered business name", term: "Legal name" },
    { key: "ein", label: "Federal tax number", term: "EIN" },
  ],
  "sam-registration": [
    { key: "legalName", label: "Registered business name", term: "Legal name" },
    { key: "uei", label: "Your government ID number", term: "UEI" },
    { key: "cage", label: "Your facility code", term: "CAGE" },
  ],
  "govcompliant-digital-setup": [
    { key: "website", label: "Website" },
    { key: "email", label: "Business email" },
    { key: "phone", label: "Business phone" },
  ],
  "sbs-visibility-setup": [
    { key: "legalName", label: "Registered business name", term: "Legal name" },
    { key: "uei", label: "Your government ID number", term: "UEI" },
  ],
  "sled-enrollment": [{ key: "sledStates", label: "State registrations" }],
};

const DAY_FMT: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

/**
 * "12 May 2026" — written out so nobody has to work out which number is the
 * month.
 *
 * `tz` is the MEMBER's IANA zone. Pass it for anything a member reads: without
 * it the date renders in whatever zone the reader's browser is in, so a call
 * held at 19:00 UTC on 12 August shows as the 13th to anyone at UTC+5 or
 * further east while the appointment card, which formats in the member's zone,
 * still says the 12th. Member-facing callers get it from `useMemberDate()`;
 * omitting it is right only where the reader IS the subject, as on /admin.
 */
export function fullDate(iso: string, tz?: string): string {
  return new Date(iso).toLocaleDateString("en-GB", tz ? { ...DAY_FMT, timeZone: tz } : DAY_FMT);
}

export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });
}

export function parseMoney(p: string | null | undefined): number {
  if (!p) return 0;
  return Number(String(p).replace(/[^0-9.]/g, "")) || 0;
}
