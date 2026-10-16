"use client";

import { useEffect, useState } from "react";
import { BookStrategyCallModal } from "./BookStrategyCallModal";

// Same 60-second lifespan for "Starting now" as OnboardingStatusBar, so
// the two cards feel consistent when stacked on top of each other.
const STARTING_NOW_WINDOW_MS = 60 * 1000;

type Phase = "upcoming" | "starting-now" | "ongoing" | "done";

interface Props {
  locationId: string;
  appointment: {
    startTime: string;
    endTime: string;
    address: string | null;
    meetingLocationType: string | null;
    /** Raw GHL appointment status — powers the right-side chip and
     *  the Reschedule button when the mentor marks the call
     *  "noshow" / "cancelled". */
    status: string | null;
  } | null;
  /** Persisted / live "the strategy call happened" flag. Kept true
   *  once SuccessCenter.strategyCallCompletedAt is stamped, even if
   *  the admin swaps the calendar id later. */
  completed: boolean;
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

export function StrategyCallStatusBar({ locationId, appointment, completed }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const now = useNow();

  const statusLower = (appointment?.status ?? "").toLowerCase();
  const isShowed = statusLower === "showed";
  const isNoShow = statusLower === "noshow" || statusLower === "no-show";
  const isCancelled = statusLower === "cancelled" || statusLower === "canceled" || statusLower === "invalid";
  const isReschedulable = isNoShow || isCancelled;

  // Phase derived from now vs. appointment window. Cancelled / no-show
  // appointments jump straight to "done" so the countdown line doesn't
  // read as if the call is still upcoming.
  let phase: Phase = "upcoming";
  let diffMs = 0;
  if (appointment) {
    const startMs = new Date(appointment.startTime).getTime();
    const endMs = new Date(appointment.endTime).getTime();
    diffMs = startMs - now;
    if (isReschedulable) phase = "done";
    else if (now < startMs) phase = "upcoming";
    else if (now < startMs + STARTING_NOW_WINDOW_MS) phase = "starting-now";
    else if (now < endMs) phase = "ongoing";
    else phase = "done";
  }

  const isCompleted = completed || isShowed;

  // A cancelled / no-show appointment counts as "no active booking" for
  // the pill — the customer needs to book again — even though we're
  // still surfacing the past appointment for context.
  const effectivelyNoBooking = !appointment || isReschedulable;

  const borderColor = isCompleted ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)";
  const pillBg = isCompleted ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";
  const pillColor = isCompleted ? "#22c55e" : "#f87171";
  const pillLabel = isCompleted
    ? "Strategy Call Completed"
    : effectivelyNoBooking
      ? "Strategy Call Required"
      : "Strategy Call Booked";

  // Right-side appointment-status chip: only shows once the appointment
  // has a definitive status (showed / no-show / cancelled). Neutral
  // states leave this off so we don't clutter the row.
  let chip: { label: string; bg: string; color: string; border: string } | null = null;
  if (isShowed) {
    chip = { label: "Showed",    bg: "rgba(34,197,94,0.12)",  color: "#22c55e", border: "rgba(34,197,94,0.5)" };
  } else if (isNoShow) {
    chip = { label: "No Show",   bg: "rgba(239,68,68,0.12)",  color: "#f87171", border: "rgba(239,68,68,0.5)" };
  } else if (isCancelled) {
    chip = { label: "Cancelled", bg: "rgba(156,163,175,0.15)", color: "#9ca3af", border: "rgba(156,163,175,0.5)" };
  }

  const isMeetingUrl = !!(appointment?.address && /^https?:\/\//i.test(appointment.address));
  const showJoinButton = !!appointment && isMeetingUrl && !isCompleted && phase !== "done";
  const showRescheduleButton = isReschedulable;
  const showBookButton = !appointment && !isCompleted;

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
            <div className="text-[0.85rem] font-bold text-white">Strategy Call Status</div>
            {appointment ? (
              <div className="text-[0.72rem] text-[var(--text-secondary)] flex items-center gap-3 mt-0.5 flex-wrap">
                <span>{formatDateTime(appointment.startTime)}</span>
                {!isReschedulable && (
                  <span className="text-[var(--text-muted)]">· {phaseLabel(phase, diffMs)}</span>
                )}
              </div>
            ) : (
              <div className="text-[0.72rem] text-[var(--text-secondary)] mt-0.5">
                {isCompleted
                  ? "Strategy call complete. You're all set."
                  : "Schedule your strategy call with a mentor to lock in your positioning."}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {chip && (
            <span
              className="text-[0.62rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ background: chip.bg, color: chip.color, border: `1px solid ${chip.border}` }}
            >
              {chip.label}
            </span>
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
          {showRescheduleButton && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--gold)] border border-[var(--gold)] text-white text-[0.72rem] font-semibold hover:bg-[var(--gold-bright)]"
            >
              Reschedule
            </button>
          )}
          {showBookButton && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--gold)] border border-[var(--gold)] text-white text-[0.72rem] font-semibold hover:bg-[var(--gold-bright)]"
            >
              Book Strategy Call
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <BookStrategyCallModal locationId={locationId} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
