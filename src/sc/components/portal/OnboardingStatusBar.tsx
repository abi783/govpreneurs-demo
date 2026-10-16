"use client";

import { useEffect, useState } from "react";
import { BookOnboardingModal } from "./BookOnboardingModal";

// The Sign Onboarding CTA surfaces in the 10 minutes before the call start
// time. Inlined here so this client component doesn't pull from
// @/lib/onboarding — that module now imports Prisma (for
// loadOnboardingSettings) and dragging a server-only chunk into a "use
// client" file fails the Turbopack build with a node:module error.
const ONBOARDING_SIGN_WINDOW_MS = 10 * 60 * 1000;

// Brief lifespan of the "Starting now" label before it flips to "Ongoing".
// Set at 60s so it doesn't feel twitchy at the 30s tick rate below.
const STARTING_NOW_WINDOW_MS = 60 * 1000;

type Phase = "upcoming" | "starting-now" | "ongoing" | "done";

interface Props {
  locationId: string;
  signed: boolean;
  signedDocUrl: string | null;
  appointment: {
    startTime: string;
    endTime: string;
    address: string | null;
    meetingLocationType: string | null;
  } | null;
  /** Live admin-configurable document URL — the "Sign Onboarding" button
   *  opens this. Server passes the resolved value (custom URL when admin
   *  has set GlobalSettings.onboardingDocumentUrl, else the hardcoded
   *  fallback in lib/onboarding.ts). */
  documentUrl: string;
  /** False when the admin cleared the onboarding calendar id — no call to
   *  book, so unsigned members get Sign Onboarding instead of Book. */
  bookingEnabled: boolean;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function upcomingCountdown(diffMs: number) {
  const minutes = Math.round(diffMs / (60 * 1000));
  if (minutes < 60) return `Starts in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rem = minutes - hours * 60;
    return rem === 0 ? `Starts in ${hours}h` : `Starts in ${hours}h ${rem}m`;
  }
  const days = Math.floor(hours / 24);
  return `Starts in ${days} day${days === 1 ? "" : "s"}`;
}

function phaseLabel(phase: Phase, diffMs: number) {
  switch (phase) {
    case "upcoming":     return upcomingCountdown(diffMs);
    case "starting-now": return "Starting now";
    case "ongoing":      return "Ongoing";
    case "done":         return "Done";
  }
}

export function OnboardingStatusBar({ locationId, signed, signedDocUrl, appointment, documentUrl, bookingEnabled }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const now = useNow();

  // Phase derived from now vs. appointment window. When there is no
  // appointment the phase is meaningless and we don't render the label.
  let phase: Phase = "upcoming";
  let diffMs = 0;
  if (appointment) {
    const startMs = new Date(appointment.startTime).getTime();
    const endMs = new Date(appointment.endTime).getTime();
    diffMs = startMs - now;
    if (now < startMs) phase = "upcoming";
    else if (now < startMs + STARTING_NOW_WINDOW_MS) phase = "starting-now";
    else if (now < endMs) phase = "ongoing";
    else phase = "done";
  }

  // Pill state — the "Sign Required" branch surfaces the outstanding
  // signature action once the call has started (or ended) without the
  // document being signed.
  const isOnboarded = signed;
  const needsSignature = !!appointment && !signed && (phase === "ongoing" || phase === "done");

  const borderColor = isOnboarded ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)";
  const pillBg = isOnboarded ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";
  const pillColor = isOnboarded ? "#22c55e" : "#f87171";
  const pillLabel =
    isOnboarded ? "Onboarded"
    : needsSignature ? "Sign Required"
    : appointment ? "Onboarding Booked"
    : "Onboarding Required";

  const isMeetingUrl = !!(appointment?.address && /^https?:\/\//i.test(appointment.address));
  // Hide the meeting link once the customer has signed OR the call is Done.
  const showJoinButton = !!appointment && isMeetingUrl && !signed && phase !== "done";
  // Sign CTA surfaces in the last 10 min before start AND stays visible
  // through Ongoing / Done until the customer signs (diffMs is negative
  // once the call starts, which trivially satisfies the <= window check).
  // With booking disabled there is no call at all — signing IS onboarding,
  // so the CTA shows immediately for anyone unsigned.
  const showSignButton =
    !signed && (bookingEnabled ? !!appointment && diffMs <= ONBOARDING_SIGN_WINDOW_MS : true);

  return (
    <>
      <div
        className="mb-4 rounded-[var(--radius-lg)] px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{
          background: "var(--glass-bg)",
          border: `1px solid ${borderColor}`,
        }}
      >
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          <span
            className="text-[0.62rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: pillBg, color: pillColor, border: `1px solid ${borderColor}` }}
          >
            {pillLabel}
          </span>
          <div>
            <div className="text-[0.85rem] font-bold text-white">Onboarding Status</div>
            {appointment ? (
              <div className="text-[0.72rem] text-[var(--text-secondary)] flex items-center gap-3 mt-0.5 flex-wrap">
                <span>{formatDateTime(appointment.startTime)}</span>
                <span className="text-[var(--text-muted)]">· {phaseLabel(phase, diffMs)}</span>
              </div>
            ) : (
              <div className="text-[0.72rem] text-[var(--text-secondary)] mt-0.5">
                {signed
                  ? "Onboarding document signed. You're all set."
                  : bookingEnabled
                    ? "Schedule your onboarding call to get started."
                    : "Sign your onboarding document to get started."}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {signed && signedDocUrl && (
            <a
              href={signedDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--green-mid)] border border-[rgba(0,166,90,0.3)] text-white text-[0.72rem] font-semibold hover:bg-[var(--green-bright)]"
            >
              View Signed Document
            </a>
          )}
          {showJoinButton && (
            <a
              href={appointment!.address!}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--green-mid)] border border-[rgba(0,166,90,0.3)] text-white text-[0.72rem] font-semibold hover:bg-[var(--green-bright)]"
            >
              Join Meeting
            </a>
          )}
          {showSignButton && (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--gold)] border border-[var(--gold)] text-white text-[0.72rem] font-semibold hover:bg-[var(--gold-bright)]"
            >
              Sign Onboarding
            </a>
          )}
          {bookingEnabled && !appointment && !signed && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--gold)] border border-[var(--gold)] text-white text-[0.72rem] font-semibold hover:bg-[var(--gold-bright)]"
            >
              Book Onboarding
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <BookOnboardingModal locationId={locationId} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
