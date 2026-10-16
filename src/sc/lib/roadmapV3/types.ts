// Roadmap v3 — shared types.
//
// The Roadmap/RoadmapStep/RoadmapSubStep shapes are ported from the frozen
// prototype (roadmap-v2/prototype/src/lib/mock/currentMember.ts), which is
// the build spec. Do not extend them casually — the page's rendering rules
// (status pills, buckets, grace escalation) are written against exactly
// these fields and the prototype documents what each one means.

import type { V3AgentCard } from "./agents";
import type { FormField, FormResult } from "./forms";
import type { WalletAmounts } from "@sc/lib/billing/walletDisplay";
import type { UsageReceipt } from "@sc/lib/billing/walletReceipt";

/**
 * The member's wallet on the roadmap. `balance` is both pools added: the
 * purchase and booking checks read it. The screens show `paidBalance` and
 * `promotionalCredit` as two numbers.
 */
export type V3Wallet = { balance: number; currency: string } & WalletAmounts;

export type SubStepState = "done" | "in_progress" | "todo";

/**
 * While a step is running, who it is sitting on. A third-party wait must name
 * what and who; it carries an ETA when we have a date we can stand behind and
 * null when we do not, because an invented date is worse than none. Waiting on
 * her carries no copy at all: the pill points at Tasks, where the asks stay
 * current.
 *
 * `ourPart` says whether our side of a third-party wait is finished. It
 * defaults to "done" — the original shape, where we file something and the
 * agency sits on it. "pending" is the other order: the agency has to clear
 * something before our team can begin (Capability Statement waiting on SAM).
 */
export type Awaiting =
  | { who: "you" }
  | { who: "us"; eta: string }
  | { who: "them"; what: string; from: string; eta: string | null; ourPart?: "done" | "pending" };

export type RoadmapSubStep = {
  id: string;
  label: string;
  state: SubStepState;
  /** Forecast in whole weeks — never presented as an outcome. */
  weeks: number;
  /** ISO date she finished it. Only meaningful when state is "done". */
  doneOn?: string;
  /** When the work actually started — only shown alongside doneOn. */
  startedOn?: string;
  /** ISO date this step became her turn. Absent = "assume it just opened". */
  openedAt?: string;
  awaiting?: Awaiting;
  /** When her kickoff call happened. A record, never inferred. */
  kickoffOn?: string;
  /** One line on what the call settled, written by whoever took it. */
  kickoffNote?: string;
};

export type RoadmapStepState = "complete" | "current" | "locked";

export type RoadmapStep = {
  index: number;
  label: string;
  state: RoadmapStepState;
  subSteps: RoadmapSubStep[];
};

export type Roadmap = {
  overallPercent: number;
  currentStepIndex: number;
  currentStepLabel: string;
  currentStepSub: { complete: number; total: number };
  estWeeksRemaining: number;
  steps: RoadmapStep[];
};

/** The nine validator service keys the mapping reads. */
export type ValidationKey =
  | "llc"
  | "sam"
  | "sbs"
  | "capability"
  | "sled"
  | "sos"
  | "website"
  | "email"
  | "a2p"
  | "cmmc";

/** DFY catalog slugs — the prototype's service ids, matched by TaskSection.dfySlug. */
export type DfySlug =
  | "llc-application"
  | "govcompliant-digital-setup"
  | "sam-registration"
  | "sbs-visibility-setup"
  | "capability-statement"
  | "sled-enrollment"
  | "prime-contractor-registration"
  | "cmmc-level-1";

export type EnrollmentSignal = {
  /** enrolled → ready → booked → in_progress → delivered (or null). */
  deliveryStatus: string | null;
  /** She has submitted the intake form we need before work can start. */
  intakeSubmittedAt: string | null;
  /** The backing section actually has an intake form to submit. */
  hasIntakeForm: boolean;
  enrolledAt: string;
  deliveryAppointmentAt: string | null;
  /** The receipt of her MOST RECENT purchase of this service (PRD §8.5 "View invoice"). */
  receipt?: UsageReceipt;
};

export type BookingSignal = {
  /** confirmed | showed | no-show | cancelled | invalid (or null). */
  appointmentStatus: string | null;
  startTime: string;
  meetingLocation: string | null;
  /** The EARLIEST call on this step she showed up to. The step finished the
   *  first time the call happened, not on a later follow-up. */
  firstShowedAt?: string;
};

/** Everything the pure mapping reads. Built by payload.ts, faked by tests. */
export type V3Signals = {
  validations: Partial<Record<ValidationKey, { status: string; checkedAt: string }>>;
  enrollmentsBySlug: Partial<Record<DfySlug, EnrollmentSignal>>;
  /** Slugs whose service an admin marked delivered (DeliveredService link). */
  deliveredSlugs: DfySlug[];
  /** Promised delivery dates from SuccessCenter.dfyDeliveryDates (ISO). */
  deliveryDates: Partial<Record<"llc" | "sam" | "sbs" | "capability" | "sled", string>>;
  /** Stage in the "Diana | Caps Statement" pipeline; null when unsynced. The
   *  Capability Statement step reads it since that service dropped its intake
   *  form (2026-09-10). */
  capsStage: string | null;
  bookings: { positioning?: BookingSignal; targeting?: BookingSignal; compliance?: BookingSignal };
  /** membershipStartedAt ?? createdAt — when the three day-one steps opened. */
  memberSince: string;
  /**
   * Whether the Digital Compliance audit form (MemberValidation
   * `digital_compliance_intake`, `data.inputs`) carries website, domain,
   * email AND phone. `email` is a required form field, so the gate turns in
   * practice on the three optional ones. Feeds EARLY_RELEASE_CHECKS in
   * programme.ts — Federal Registration opens on these four facts rather
   * than waiting for the whole Digital Compliance step.
   */
  dcIdentityFactsPresent: boolean;
};

/** A real, purchasable service behind a sub-step's Done-for-you panel. */
export type V3Offer = {
  slug: DfySlug;
  /** RoadmapStep id the enroll API expects as stepId. */
  stepId: string;
  /** TaskSection id — book-delivery / delivery-availability key off it. */
  sectionId: string;
  /** TaskSection.serviceName — the exact title enroll matches on. */
  serviceTitle: string;
  /** Display price as configured ("$2,997"). */
  price: string;
  priceOptions: { id: string; label: string; price: string; description?: string }[] | null;
  intakeFormLink: string | null;
  /** "3–5 days" style turnaround, from the section's DFY duration. */
  turnaround: string | null;
};

export type V3CallState = "required" | "booked" | "completed" | "missed";

export type V3Call = {
  stepId: string;
  /** The step row exists and has a booking calendar. */
  bookable: boolean;
  price: number;
  state: V3CallState;
  startTime: string | null;
  meetingLocation: string | null;
};

/** The record panel's facts — read from the live SuccessCenter row. */
export type V3Record = {
  legalName: string | null;
  ein: string | null;
  uei: string | null;
  cage: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  sledStates: string[];
};

export type V3Payload = {
  roadmap: Roadmap;
  /**
   * Admin-configured per-sub-step settings from /admin/roadmapv3, keyed by
   * effective sub-step id. items/why win over the static SUB_STEP_DETAIL
   * copy; cardType/callKey/diyLink steer the right column; static
   * help/handoff/note survive for bound ids where cardType is absent (auto).
   */
  detail: Record<
    string,
    {
      items?: { title: string; description?: string; done?: boolean }[];
      /** The member ticks these lines herself ("Click here if completed"). */
      selfTick?: boolean;
      /** A done step whose service she may buy again (REPEATABLE_SLUGS):
       *  her purchase count, and whether the newest is still being delivered.
       *  `working` is the newest purchase's own state while it is, so the
       *  service panel shows that purchase rather than the finished step. */
      repeat?: {
        count: number;
        inProgress: boolean;
        working?: Partial<Pick<RoadmapSubStep, "state" | "awaiting" | "openedAt" | "kickoffOn">>;
      };
      /** Set when items come from the member's live Action Plan (Playbook). */
      itemsSource?: "action-plan";
      why?: string;
      diyLink?: string;
      /** Per-step "Do it yourself" card wording. Absent = the generic
       *  copy in DIY_CARD_DEFAULTS, which is what every step said before
       *  2026-08-28. */
      diyTitle?: string;
      diyDescription?: string;
      cardType?: "dfy" | "call" | "pursuit" | "none";
      callKey?: "positioning" | "targeting" | "compliance";
      /** The verification the member can run on this step, if any. */
      verifyKey?: "llc" | "sam" | "sbs" | "capability" | "sled" | "cmmc";
      drawer?: {
        videoUrl?: string;
        benefit?: string;
        deliveredBy?: string;
        turnaround?: string;
        yourPart?: string;
      };
      /** AI agent cards this step declares, in display order. Empty/absent =
       *  no cards, which is how every step behaved before 2026-08-25. */
      agents?: V3AgentCard[];
      /** False hides the "Do it yourself" card. Absent = shown, which is how
       *  every step behaved before 2026-08-27. */
      diyEnabled?: boolean;
      /** A form the member fills in BEFORE the service is offered. While
       *  `submitted` is false the DFY card is held back — the point of the
       *  card is to collect what our team needs before she can buy.
       *
       *  It opens in a right drawer rather than navigating away, so everything
       *  needed to RENDER and SUBMIT it travels here: title/description/
       *  buttonLabel are already resolved (admin override, else the form's own
       *  copy), and `prefill` holds what we already know about her. */
      form?: {
        title: string;
        description: string;
        buttonLabel: string;
        /** What the drawer POSTs to /api/portal/{locationId}/verify. */
        validationKey: string;
        fields: FormField[];
        /** Field key → value we already hold. Missing key = ask her. */
        prefill: Record<string, string>;
        submitted: boolean;
        /** What the check found, once she has submitted. */
        results?: FormResult[];
        /** Optional button on the results card — a link out, or a jump to
         *  another sub-step on this page. */
        doneButton?:
          | { label: string; url: string }
          | { label: string; phaseIndex: number; subId: string };
      };
      /** The button on a DELIVERED service. Absent = "See it in My Business"
       *  pointing at the member's business page. */
      doneLink?: { label: string; url: string };
    }
  >;
  /** Per-step mentor overrides (admin-configured), keyed by effective id. */
  stepMentors: Record<string, { name: string; title: string | null; email: string | null; avatarUrl: string | null }>;
  /** Non-null = QA fixture mode; commerce is disabled. */
  scenarioId: string | null;
  /**
   * True on /roadmap/v3-preview: the member's REAL state rendered against the
   * SHIPPED FILE, ignoring this environment's RoadmapV3Step rows.
   *
   * Commerce is off here for the same reason it is off under ?scenario=, and
   * it is not optional. The card prices from the file and the booking route
   * prices from the rows, so on an environment whose rows have drifted the two
   * disagree by construction — which is the whole reason to be looking at this
   * page. A preview that could take money would charge the number it is not
   * showing.
   */
  previewMode: boolean;
  offers: Partial<Record<string, V3Offer>>;
  /**
   * The new-customer intake bundle — non-null only while a real backing
   * section exists AND the member's offer window is still open. The chip and
   * modal render only off this.
   */
  intake: (V3Offer & { closesAt: string; listTotal: number }) | null;
  /** Slugs she owns (enrollment exists, any status) — flips offer → status panel. */
  purchasedSlugs: DfySlug[];
  enrollmentsBySlug: Partial<Record<DfySlug, EnrollmentSignal>>;
  wallet: V3Wallet | null;
  mentor: { name: string; title: string | null; email: string | null; avatarUrl: string | null } | null;
  calls: { positioning: V3Call | null; targeting: V3Call | null; compliance: V3Call | null };
  record: V3Record;
  /** Prefills + last results for the member-run verification panel. */
  verify: {
    prefill: {
      legalName: string | null;
      mailingZip: string | null;
      dsbsProfileUrl: string | null;
      articlesUrl: string | null;
      capabilityUrl: string | null;
      cmmcUrl: string | null;
      sledRegistrations: { registryType: string; state: string; businessName: string }[];
    };
    latest: Partial<
      Record<
        "llc" | "sam" | "sbs" | "capability" | "sled" | "cmmc",
        {
          status: string;
          message: string | null;
          checkedAt: string;
          /** What the validator extracted — the fields the panel shows her so
           *  she can see what she is confirming. Member-run keys only; the
           *  largest of these on production is 23KB (SAM), most under 1KB. */
          data: unknown;
        }
      >
    >;
  };
  freeSessionsLeft: number;
  walletRechargeVideoUrl: string | null;
  /**
   * The pilot checkout additions and the success view with its invoice line
   * (PRD §8.2, §8.3). The server decides (`purchaseConfirmationEnabled`); the
   * browser never reads the settings. False keeps today's screens.
   */
  purchaseConfirmation: boolean;
  iframeOnly: boolean;
  /**
   * The member's own IANA timezone, for rendering every date on this page.
   *
   * Without it `toLocaleDateString` uses the READER's zone, so a call held at
   * 19:00 UTC on 12 August reads "13 August" to anyone at UTC+5 or further
   * east while the appointment card, which formats in the member's zone,
   * still says the 12th. Null when GHL has no timezone for her, which falls
   * back to the reader's zone — the behaviour this replaces.
   */
  timeZone: string | null;
  /** Resolved EARLY_RELEASE_CHECKS (programme.ts) — unmetPrereqs() reads this
   *  rather than raw signals, so client-side gating stays a pure function. */
  earlyRelease: Record<string, Record<string, boolean>>;
};

/* ── Digital Compliance, the member's view (PR #123, compliance-chain) ─────── */
/* Served on its own page, /[locationId]/digital-compliance, by
   `loadDcStep` (lib/roadmapV3/dcStepLoad.ts) — NOT part of V3Payload, so the
   roadmap never waits on the GHL invoice read. Computed from the same
   per-item facts the Command Center reads (`facts-read.ts`), so the member
   and her mentor cannot be told two different stories. */

/**
 * One row's state, in the member's terms.
 *  verified   a mentor checked it and it passes
 *  gaps       a mentor looked and sent it back — `gapNote` says why
 *  sent       on record, waiting for the mentor to check it
 *  needs_you  we need something from her
 *  pending    we are doing it (done-for-you)
 *  outside    waiting on an outside body (the A2P carrier), nothing for her to do
 *  blocked    cannot start until another step comes through
 */
export type V3DcRowWord = "verified" | "gaps" | "sent" | "needs_you" | "pending" | "outside" | "blocked";

export interface V3DcRow {
  /** `RoadmapChecklistItem.id` (dc_item_2026_N) — what the send route takes. */
  itemId: string;
  /** Production key (websiteCage, domainMatch, …). */
  key: string;
  /** The item in plain words. */
  label: string;
  /** What she would paste: a link, or a plain value (a phone number, an A2P id). */
  inputKind: "url" | "text";
  word: V3DcRowWord;
  /** One sentence to her, e.g. "You sent this — Sinan checks it next." */
  line: string;
  /** What is on record, or null. */
  value: string | null;
  /** Who supplied what is on record: she did, or we did for her. */
  suppliedBy: "you" | "us" | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  /** The mentor's note when `word` is "gaps". */
  gapNote: string | null;
  /** May she paste and send a value for this row right now. */
  canSend: boolean;
}

/** The chain: audit form sent → call booked → call held → all nine verified. */
export interface V3DcChain {
  formAt: string | null;
  bookedAt: string | null;
  heldAt: string | null;
  allVerifiedAt: string | null;
}

/** 14 days from the call being held, 21 at the outside. No call held, no clock. */
export interface V3DcClock {
  state: "not_started" | "running" | "ran_out" | "finished";
  /** Days left of the 14 while running (negative once past it); else null. */
  daysLeft: number | null;
  /** Whole days from the call to the last verification, once finished. */
  finishedInDays: number | null;
  /** The sentence to show her. */
  line: string;
}

export interface V3DcInvoice {
  number: string | null;
  /** In major units (dollars). */
  amount: number | null;
  currency: string;
  /** "paid" | "sent" | "overdue" | … as the billing system says it. */
  status: string;
  issuedAt: string | null;
}

/** What she bought from us for this step, when she did. */
export interface V3DcDfy {
  title: string;
  /** What we agreed to do, in the mentor's words. Null until written. */
  scope: string | null;
  enrolledAt: string | null;
  dueAt: string | null;
  sowUrl: string | null;
  /** Null when the invoices could not be read — never an empty list pretending to be "none". */
  invoices: V3DcInvoice[] | null;
}

export interface V3DcStep {
  /** The compliance mentor's name, for "Send to Sinan". */
  mentorName: string;
  verified: number;
  total: number;
  needsYou: number;
  chain: V3DcChain;
  clock: V3DcClock;
  rows: V3DcRow[];
  dfy: V3DcDfy | null;
}
