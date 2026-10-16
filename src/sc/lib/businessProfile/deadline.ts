/**
 * When the intake is due, and when it is not due at all. Pure.
 *
 * PRD §6.3: `profile_due_at = call_at − 72 hours`. Derived, never typed.
 *
 * It is `null` until a call is booked, and then it must not render — "a
 * deadline with no cause is just pressure". The note returns only when both the
 * call and the date are on the payload.
 *
 * The prep window is measured from those two dates rather than restated, so the
 * sentence cannot drift from `PREP_HOURS` (which cannot be imported here:
 * `onboarding.ts` opens a Prisma client and this is read by a client
 * component). The date is written out — "Tue, Aug 18", never "8/18/26".
 */

/** Every date the member is shown is in the program's own timezone.
 *
 *  EXPORTED BECAUSE IT IS A RULE, NOT A DETAIL. A second module formatting a
 *  member-facing date in the runtime's own zone is not just inconsistent — it
 *  is a hydration error, because the server runs in UTC and the browser does
 *  not. The task ledger's due chip learned that the hard way. */
export const PROGRAM_TZ = "America/New_York";
const MS_PER_HOUR = 3_600_000;
/** Named, because she is meeting a person even before one is assigned. */
const DEFAULT_MENTOR = "your mentor";

/** Capitalise a word that begins a sentence. Idempotent on a real first name. */
export function sentenceStart(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The date, written out in full — "Friday, May 8, 2026".
 *
 * It was "Tue, Aug 18": a short weekday, no year, and the rest of the sentence
 * carrying the urgency. The banner leads with the urgency now (`deadlineLead`),
 * so this line's whole job is to be the unambiguous date, and an abbreviated
 * one with no year is not that.
 *
 * US ORDER, DELIBERATELY. The prototype prints "Friday, 8 May 2026", which is
 * the British order; the program runs in `America/New_York` for US members, so
 * copying the order across would be importing a bug rather than matching a
 * design.
 */
const DAY_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: PROGRAM_TZ,
};

/** Whole days from `from` to `to`, counted in the program's own timezone so
 *  "tomorrow" turns over at midnight in New York and not in UTC. */
function daysBetween(from: number, to: number): number {
  const key = (at: number) =>
    new Date(at).toLocaleDateString("en-CA", { timeZone: PROGRAM_TZ });
  const day = (at: number) => Date.parse(`${key(at)}T00:00:00Z`);
  return Math.round((day(to) - day(from)) / (MS_PER_HOUR * 24));
}

/**
 * The urgency, as the banner's opening words — "Due tomorrow", "Due in 5 days".
 *
 * SEPARATE FROM THE SENTENCE BECAUSE IT IS READ SEPARATELY. The banner opens
 * with how soon, beside the count, and explains underneath; burying "due" in
 * the second line made the one dated fact on the page the last thing read.
 *
 * `null` when no call is booked, for the same reason `deadlineNote` is: a
 * deadline with no cause is just pressure.
 */
export function deadlineLead(input: DeadlineInput, now: number = Date.now()): string | null {
  const callAt = instant(input.callAt);
  const dueAt = instant(input.profileDueAt);
  if (callAt === null || dueAt === null) return null;
  if (Math.round((callAt - dueAt) / MS_PER_HOUR) <= 0) return null;

  const days = daysBetween(now, dueAt);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/** The two dates and the person, exactly as `payload.onboarding` carries them. */
export interface DeadlineInput {
  /** The positioning call is behind her — the second deadline is live. */
  callHasHappened?: boolean;
  /** A week after that call, for the rest of the record. */
  fullRecordDueAt?: string | null;
  /** The next booked call. The CAUSE — without it there is no deadline. */
  callAt: string | null;
  /** `call_at − 72h`, derived by `profileDueAt()`. */
  profileDueAt: string | null;
  mentorName: string | null;
}

function instant(iso: string | null): number | null {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  return Number.isFinite(at) ? at : null;
}

/**
 * When her answers are due, in one sentence — or `null`, which is what a member
 * with no booked call is told about her deadline.
 */
export function deadlineNote(input: DeadlineInput): string | null {
  const callAt = instant(input.callAt);
  const dueAt = instant(input.profileDueAt);
  if (callAt === null || dueAt === null) return null;

  // A date at or after the call is not a prep window, and saying "0 hours
  // before your call" would be worse than saying nothing.
  const hours = Math.round((callAt - dueAt) / MS_PER_HOUR);
  if (hours <= 0) return null;

  const day = new Date(dueAt).toLocaleDateString("en-US", DAY_FORMAT);
  /* FIRST NAME ONLY WHEN THERE IS A NAME. The prototype takes the first word of
     its mentor constant, which is always a person; ours falls back to "your
     mentor", and the first word of that is "your". */
  const named = input.mentorName?.trim();
  /* CAPITALISED, BECAUSE IT OPENS A SENTENCE. A first name already is; the
     fallback is not, and unassigned is the common case rather than the edge —
     every member reads this before a mentor is attached to their record. It
     rendered as "September 10, 2026. your mentor reads this before your first
     mentor call." */
  const who = sentenceStart(named ? (named.split(/\s+/)[0] as string) : DEFAULT_MENTOR);
  /* THE DATE, THEN WHO IS WAITING FOR IT — the prototype's shape. It used to
     read "Due Tue, Aug 18 — 72 hours before your call, so Diana arrives with a
     plan": the word "Due" competed with the lead above it, and the prep window
     is a rule about how we set the date, not something she can act on. Who
     reads this, and when, is. The window is still measured rather than
     restated; `hours` is what proves there is one at all. */
  return `${day}. ${who} reads this before your first mentor call.`;
}

/* ── after the call: the rest of the record ───────────────────────────────
 *
 * A SECOND DEADLINE, AND ONLY EVER AFTER THE FIRST IS BEHIND HER. Before the
 * positioning call the fourteen are the only thing being asked; a date for work
 * she has not been introduced to is pressure with no cause, which is the same
 * rule that keeps the first deadline hidden until a call is booked.
 * ──────────────────────────────────────────────────────────────────────── */

/** How soon the rest of the record is wanted, or null while it is not. */
export function fullRecordLead(input: DeadlineInput, now: number = Date.now()): string | null {
  const at = instant(input.fullRecordDueAt ?? null);
  if (!input.callHasHappened || at === null) return null;

  const days = daysBetween(now, at);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/** The sentence under it: the date, then why the rest is wanted. */
export function fullRecordNote(input: DeadlineInput): string | null {
  const at = instant(input.fullRecordDueAt ?? null);
  if (!input.callHasHappened || at === null) return null;
  const day = new Date(at).toLocaleDateString("en-US", DAY_FORMAT);
  return `${day}. The rest of your record is what we search on, so the work we find fits you.`;
}
