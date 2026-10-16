"use client";

import { useState } from "react";
import { Card } from "@sc/components/ui/Card";
// DEMO: the type only. lib/ghl/appointments.ts holds server code, so it does not come across.
import type { GHLAppointment } from "@/demo/sc/home/types";
import { AppointmentHistoryDrawer } from "./AppointmentHistoryDrawer";
import { RescheduleModal } from "./RescheduleModal";

interface Props {
  locationId: string;
  appointment: GHLAppointment | null;
  /** Full appointment list for the contact (enriched with calendarName +
   *  assignedUserName upstream in page.tsx). Powers the Booking History
   *  drawer. */
  appointments: GHLAppointment[];
  /** Main contact's IANA timezone from GHL — when set, the card (and the
   *  history drawer) render times in this zone and show it as a line on
   *  the card. Null = fall back to the viewer's browser zone. */
  contactTimezone?: string | null;
}

/** Reschedule is hidden inside this window before the appointment starts. */
const RESCHEDULE_CUTOFF_MS = 60 * 60 * 1000;

function isUrl(v?: string): boolean {
  if (!v) return false;
  return /^https?:\/\//i.test(v.trim());
}

function startsInLabel(start: Date): string | null {
  const diffMs = start.getTime() - Date.now();
  if (diffMs <= 0) return null;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `Starts in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Starts in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `Starts in ${days} day${days === 1 ? "" : "s"}`;
}

export function NextAppointmentCard({ locationId, appointment, appointments, contactTimezone = null }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const hasHistory = appointments.length > 0;

  if (!appointment) {
    return (
      <>
        <Card className="p-5 flex flex-col items-center justify-center gap-3 min-h-[120px]">
          <div className="text-[0.7rem] text-[var(--text-muted)]">No appointments yet</div>
          {hasHistory && (
            <button
              onClick={() => setHistoryOpen(true)}
              className="text-[0.72rem] font-semibold text-[var(--green-text)] hover:underline"
            >
              Booking History
            </button>
          )}
        </Card>
        {hasHistory && (
          <AppointmentHistoryDrawer
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            appointments={appointments}
            timezone={contactTimezone}
          />
        )}
      </>
    );
  }

  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  const startsInMs = start.getTime() - Date.now();
  const isPast = startsInMs < 0;
  const tz = contactTimezone ?? undefined;
  // Reschedule allowed only for a future appointment at least an hour out,
  // and only when we know which calendar to pull availability from.
  const canReschedule = startsInMs >= RESCHEDULE_CUTOFF_MS && !!appointment.calendarId;
  const canJoin = !isPast && isUrl(appointment.address);
  const dateLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: tz });
  const timeLabel = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: tz });
  const countdown = isPast ? null : startsInLabel(start);
  const durationMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const durationLabel = durationMin > 0
    ? durationMin >= 60
      ? `${Math.round(durationMin / 60 * 10) / 10} hr`
      : `${durationMin} min`
    : null;

  return (
    <>
      <Card className="p-5 flex flex-col gap-2 min-h-[120px]">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="block w-3 h-px bg-[var(--green-text)] opacity-60" />
            {isPast ? "Last Appointment" : "Next Appointment"}
          </div>
          {countdown ? (
            <span
              className="text-[0.6rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(34,197,94,0.10)", color: "#22c55e" }}
            >
              {countdown}
            </span>
          ) : appointment.appointmentStatus ? (
            <span className="text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-[var(--text-muted)] bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
              {appointment.appointmentStatus}
            </span>
          ) : null}
        </div>

        <p className="text-[0.95rem] font-extrabold text-white leading-tight truncate">
          {appointment.title || appointment.calendarName || "Appointment"}
        </p>

        <div className="text-[0.78rem] text-[var(--text-secondary)] flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{dateLabel} · {timeLabel}</span>
        </div>

        {durationLabel && (
          <div className="text-[0.78rem] text-[var(--text-secondary)] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
            <span>{durationLabel}</span>
          </div>
        )}

        {contactTimezone && (
          <div className="text-[0.78rem] text-[var(--text-secondary)] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3 7.5 7.03 7.5 12s2.015 9 4.5 9zM3.6 9h16.8M3.6 15h16.8" />
            </svg>
            <span className="truncate">{contactTimezone.replace(/_/g, " ")}</span>
          </div>
        )}

        {appointment.address && !isUrl(appointment.address) && (
          <div className="text-[0.78rem] flex items-center gap-1.5 min-w-0">
            <svg className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[var(--text-secondary)] truncate">{appointment.address}</span>
          </div>
        )}

        {appointment.assignedUserName && (
          <div className="text-[0.78rem] text-[var(--text-secondary)] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate">{appointment.assignedUserName}</span>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] bg-white/[0.04] border border-white/[0.08] text-[var(--text-secondary)] text-[0.75rem] font-semibold hover:bg-white/[0.08] transition-colors"
          >
            Booking History
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          {(canReschedule || canJoin) && (
            <div className="flex gap-2">
              {canReschedule && (
                <button
                  onClick={() => setRescheduleOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-white/[0.04] border border-white/[0.1] text-[var(--text-secondary)] text-[0.8rem] font-bold hover:bg-white/[0.08] transition-colors"
                >
                  Reschedule
                </button>
              )}
              {canJoin && (
                <a
                  href={appointment.address!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-[var(--green-mid)] border border-[rgba(0,166,90,0.3)] text-white text-[0.8rem] font-bold hover:bg-[var(--green-bright)] transition-colors"
                >
                  Join Meeting
                </a>
              )}
            </div>
          )}
        </div>
      </Card>

      <AppointmentHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        appointments={appointments}
        timezone={contactTimezone}
      />
      {rescheduleOpen && (
        <RescheduleModal
          locationId={locationId}
          appointment={appointment}
          contactTimezone={contactTimezone}
          onClose={() => setRescheduleOpen(false)}
        />
      )}
    </>
  );
}
