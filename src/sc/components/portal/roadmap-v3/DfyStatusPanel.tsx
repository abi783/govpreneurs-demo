"use client";

// Roadmap v3 — what the right-hand column becomes once she has BOUGHT the
// done-for-you work. Ported from the frozen prototype; every fact is now
// read from the live system:
//
//   WORKING  blue — the enrollment's own status. The kickoff call books
//            through the real delivery calendar (book-delivery — free; the
//            call is included in what she paid). A form handoff points at
//            the section's real intake form.
//   DONE     green — the record our team produced, read from the live
//            SuccessCenter profile. A field we do not hold is omitted rather
//            than guessed.

import { useState } from "react";
import { BookingSheet } from "./BookingSheet";
import { RECORD_FIELDS, SERVICE_COPY } from "./detailContent";
import { useMemberDate } from "./memberDate";
import type { RoadmapSubStep, V3Offer, V3Record, EnrollmentSignal } from "@sc/lib/roadmapV3/types";
import { ArrowRight, CalendarCheck, Check, ClipboardList, Clock, Phone, Users } from "./Icon";
import type { UsageReceipt } from "@sc/lib/billing/walletReceipt";
import {
  RECEIPT_LABEL,
  RECEIPT_PREPARING_LABEL,
  RECEIPT_UNAVAILABLE_LABEL,
  RECEIPT_UNAVAILABLE_NOTE,
  VIEW_RECEIPT_LABEL,
} from "@sc/lib/walletCopy";

/**
 * The receipt of her most recent purchase of this service (PRD §8.5 "View
 * invoice"). She sees the receipt, never the invoice, so the words say
 * "receipt"; the link goes to our receipt route (`receiptPath` in
 * lib/billing/walletReceipt.ts), which redirects to the provider's page. A
 * provider with no page (HighLevel) gives the number alone. A member is never shown a
 * failure, so anything that is not ready or preparing reads "Unavailable".
 */
export function ReceiptFact({ receipt }: { receipt: UsageReceipt }) {
  let value: React.ReactNode;
  if (receipt.state === "ready") {
    value = (
      <>
        {receipt.number ?? RECEIPT_LABEL}
        {receipt.url && (
          <>
            {" · "}
            <a className="dfys__receipt-link" href={receipt.url} target="_blank" rel="noopener noreferrer">
              {VIEW_RECEIPT_LABEL}
            </a>
          </>
        )}
      </>
    );
  } else if (receipt.state === "preparing") {
    value = <span className="dfys__receipt-muted">{RECEIPT_PREPARING_LABEL}</span>;
  } else {
    value = (
      <span className="dfys__receipt-muted" title={RECEIPT_UNAVAILABLE_NOTE}>
        {RECEIPT_UNAVAILABLE_LABEL}
      </span>
    );
  }
  return (
    <div className="dfys__fact">
      <dt>{RECEIPT_LABEL}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function recordRows(slug: string, record: V3Record): { label: string; term?: string; value: string }[] {
  const defs = RECORD_FIELDS[slug] ?? [];
  const rows: { label: string; term?: string; value: string }[] = [];
  for (const def of defs) {
    const raw = record[def.key];
    const value = Array.isArray(raw) ? raw.join(", ") : raw;
    if (!value) continue;
    rows.push({ label: def.label, term: def.term, value });
  }
  return rows;
}

function DeliveryTrail({
  sub,
  team,
  handoff,
  kickoffBooked,
}: {
  sub: RoadmapSubStep;
  team: string | null;
  handoff: "call" | "form";
  kickoffBooked: boolean;
}) {
  const memberDate = useMemberDate();
  const withAgency = sub.awaiting?.who === "them";
  // Two shapes of agency wait, and they are opposite ways round: usually we
  // have filed something and they are sitting on it; sometimes (a capability
  // statement waiting on SAM) they have to clear it before our team can even
  // start. Saying "our team finished their part" in the second case would be
  // a claim about work nobody has done.
  const oursPending = sub.awaiting?.who === "them" && sub.awaiting.ourPart === "pending";
  type Row = { key: string; mark: "done" | "now"; title: string; sub?: string };
  const rows: Row[] = [];

  if (sub.kickoffOn) {
    rows.push({
      key: "call",
      mark: "done",
      title:
        handoff === "call"
          ? `Your call was on ${memberDate(sub.kickoffOn)}`
          : `Your form came in on ${memberDate(sub.kickoffOn)}`,
      sub: sub.kickoffNote,
    });
  } else if (kickoffBooked) {
    rows.push({ key: "call", mark: "now", title: "Your kickoff call is booked" });
  }

  const agencyRow = (): Row => {
    const a = sub.awaiting as Extract<RoadmapSubStep["awaiting"], { who: "them" }>;
    return {
      key: "them",
      mark: "now",
      title: oursPending ? `Waiting on ${a.from}` : `Sent to ${a.from}`,
      sub: `They have ${a.what}.${a.eta ? ` Expected by ${memberDate(a.eta)}.` : ""}`,
    };
  };

  // When their part comes first, so does their row.
  if (oursPending) rows.push(agencyRow());

  rows.push({
    key: "us",
    mark: withAgency && !oursPending ? "done" : "now",
    title: oursPending
      ? `Our team starts once ${(sub.awaiting as { from: string }).from} clears it`
      : withAgency
        ? "Our team finished their part"
        : "Our team is working on it",
    sub: withAgency && !oursPending ? undefined : (team ?? undefined),
  });

  if (sub.awaiting?.who === "them" && !oursPending) rows.push(agencyRow());

  return (
    <ol className="dfys-trail">
      {rows.map((r) => (
        <li key={r.key} className={`dfys-trail__row is-${r.mark}`}>
          <span className="dfys-trail__mark" aria-hidden>
            {r.mark === "done" ? <Check size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={2.5} />}
          </span>
          <span className="dfys-trail__body">
            <span className="dfys-trail__title">{r.title}</span>
            {r.sub ? <span className="dfys-trail__sub">{r.sub}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The form handoff — our team needs facts, not a conversation. */
function KickoffForm({ team, formLink }: { team: string; formLink: string | null }) {
  return (
    <div className="dfys-call">
      <div className="dfys-call__head">
        <span className="dfys-call__icon" aria-hidden>
          <ClipboardList size={17} strokeWidth={1.75} />
        </span>
        <div>
          <p className="dfys-call__title">Fill in your form</p>
          <p className="dfys-call__with">for {team}</p>
        </div>
      </div>
      <p className="dfys-call__why">
        Our team needs a few facts about your business before they can start. There is no call to
        book for this one.
      </p>
      {/* Only when the section actually carries a form — a button that goes
          nowhere is worse than the sentence alone. */}
      {formLink ? (
        <a href={formLink} target="_blank" rel="noreferrer" className="rm2-btn rm2-btn--green">
          Open the form <ArrowRight size={14} aria-hidden />
        </a>
      ) : (
        <p className="dfys-call__why">We will email it to you.</p>
      )}
    </div>
  );
}

/** The kickoff call for work she has just paid for — free, real calendar. */
function KickoffCall({
  offer,
  team,
  locationId,
  enrollment,
  fixtureMode,
}: {
  offer: V3Offer;
  team: string;
  locationId: string;
  enrollment: EnrollmentSignal | undefined;
  fixtureMode: boolean;
}) {
  const memberDate = useMemberDate();
  const [open, setOpen] = useState(false);
  const [bookedLabel, setBookedLabel] = useState<string | null>(null);
  const upcoming =
    enrollment?.deliveryAppointmentAt && new Date(enrollment.deliveryAppointmentAt) > new Date()
      ? enrollment.deliveryAppointmentAt
      : null;
  const booked = bookedLabel ?? (upcoming ? memberDate(upcoming) : null);

  return (
    <div className={`dfys-call${booked ? " is-booked" : ""}`}>
      {booked ? (
        <>
          <span className="dfys-call__mark" aria-hidden>
            <CalendarCheck size={16} strokeWidth={2} />
          </span>
          <div className="dfys-call__body">
            <p className="dfys-call__when">Your call is on {booked}.</p>
            <p className="dfys-call__sub">The joining link is in your email.</p>
          </div>
        </>
      ) : (
        <>
          <div className="dfys-call__head">
            <span className="dfys-call__icon" aria-hidden>
              <Users size={17} strokeWidth={1.75} />
            </span>
            <div>
              <p className="dfys-call__title">Book your first call</p>
              <p className="dfys-call__with">with {team}</p>
            </div>
          </div>
          <p className="dfys-call__why">
            We go through your details together so our team can start. The call is included in what
            you paid.
          </p>
          <button type="button" className="rm2-btn rm2-btn--green" onClick={() => setOpen(true)}>
            <Phone size={14} aria-hidden /> Pick a time
          </button>
        </>
      )}

      <BookingSheet
        open={open}
        onOpenChange={setOpen}
        locationId={locationId}
        mode={{ kind: "delivery", sectionId: offer.sectionId, serviceTitle: offer.serviceTitle }}
        title="Book your first call"
        whoName={team}
        whoRole="Your specialist team"
        callName="We go through your details so our team can start."
        price={0}
        wallet={null}
        disabled={fixtureMode}
        avatar={
          <span className="dfys-call__icon dfys-call__icon--lg" aria-hidden>
            <Users size={20} strokeWidth={1.75} />
          </span>
        }
        onBooked={setBookedLabel}
      />
    </div>
  );
}

export function DfyStatusPanel({
  offer,
  sub,
  handoff = "form",
  record,
  enrollment,
  locationId,
  doneLink,
  fixtureMode,
}: {
  offer: V3Offer;
  sub: RoadmapSubStep;
  handoff?: "call" | "form";
  record: V3Record;
  enrollment: EnrollmentSignal | undefined;
  locationId: string;
  /** Admin override for the button on a delivered service. Absent = the
   *  business page, which is where most services' results land. */
  doneLink?: { label: string; url: string };
  fixtureMode: boolean;
}) {
  const memberDate = useMemberDate();
  const copy = SERVICE_COPY[offer.slug];
  const name = copy?.name ?? offer.serviceTitle;
  const team = copy?.deliveredBy ?? null;

  // ── Done ──────────────────────────────────────────────────────────
  if (sub.state === "done") {
    const rows = recordRows(offer.slug, record);
    return (
      <section className="dfys dfys--done">
        <header className="dfys__head">
          <span className="dfys__mark" aria-hidden>
            <Check size={20} strokeWidth={3} />
          </span>
          <div>
            <h3 className="dfys__title">{name} — done</h3>
            <p className="dfys__sub">
              Our team finished this. Read it over and tell us if anything is wrong.
            </p>
          </div>
        </header>

        {rows.length > 0 && (
          <dl className="dfys__grid">
            {rows.map((r) => (
              <div key={r.label} className="dfys__cell">
                <dt className="dfys__label">
                  {r.label}
                  {r.term ? <span className="dfys__term">{r.term}</span> : null}
                </dt>
                <dd className="dfys__value">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {enrollment?.receipt ? (
          <dl className="dfys__facts">
            <ReceiptFact receipt={enrollment.receipt} />
          </dl>
        ) : null}

        {/* One door, to the place the record lives and can be corrected —
            the business page unless the admin pointed this step somewhere the
            result actually lands (a SAM profile, a SLED registry). */}
        <a href={doneLink?.url ?? `/${locationId}/business`} className="rm2-btn rm2-btn--green">
          {doneLink?.label ?? "See it in My Business"} <ArrowRight size={14} />
        </a>
      </section>
    );
  }

  // ── Working ───────────────────────────────────────────────────────
  const eta = sub.awaiting && sub.awaiting.who !== "you" ? sub.awaiting.eta : null;
  const kickoffBooked = !!(
    enrollment?.deliveryAppointmentAt && new Date(enrollment.deliveryAppointmentAt) > new Date()
  );
  const started = sub.state === "in_progress" && sub.awaiting?.who !== "you";
  // A form handoff with no form is not a handoff: the service's intake gate
  // has been removed (Capability Statement, 2026-09-10), so there is nothing
  // to ask her for and nothing to open.
  const formToFill = handoff === "form" && !!offer.intakeFormLink;

  return (
    <section className="dfys dfys--working">
      <header className="dfys__head">
        <span className="dfys__mark" aria-hidden>
          <Clock size={19} strokeWidth={2} />
        </span>
        <div>
          <p className="dfys__owned">
            <Check size={12} strokeWidth={3} aria-hidden /> You bought this
          </p>
          <h3 className="dfys__title">{name}</h3>
          <p className="dfys__sub">
            {started
              ? "There is nothing for you to do today. Here is where it has got to."
              : formToFill
                ? "Fill in your form and our team can start."
                : handoff === "call" && team && !kickoffBooked
                  ? "Book your first call and our team can start."
                  : "Our team is on this. There is nothing for you to do today."}
          </p>
        </div>
      </header>

      {started ? (
        <DeliveryTrail sub={sub} team={team} handoff={handoff} kickoffBooked={kickoffBooked} />
      ) : (
        team &&
        (handoff === "call" ? (
          <KickoffCall
            offer={offer}
            team={team}
            locationId={locationId}
            enrollment={enrollment}
            fixtureMode={fixtureMode}
          />
        ) : formToFill ? (
          <KickoffForm team={team} formLink={offer.intakeFormLink} />
        ) : null)
      )}

      <dl className="dfys__facts">
        {eta ? (
          <div className="dfys__fact">
            <dt>Expected by</dt>
            <dd>{memberDate(eta)}</dd>
          </div>
        ) : (offer.turnaround ?? copy?.turnaround) ? (
          <div className="dfys__fact">
            <dt>How long it takes</dt>
            <dd>{offer.turnaround ?? copy?.turnaround}</dd>
          </div>
        ) : null}
        {team ? (
          <div className="dfys__fact">
            <dt>Who does it</dt>
            <dd>{team}</dd>
          </div>
        ) : null}
        {enrollment?.receipt ? <ReceiptFact receipt={enrollment.receipt} /> : null}
      </dl>

      {/* The "What our team is doing" scope list was removed 2026-08-21 —
          it duplicated the step's own checklist, which now retitles itself
          "Our team is working on:" once the work has actually started. */}
    </section>
  );
}
