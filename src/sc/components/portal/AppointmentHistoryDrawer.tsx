"use client";

import { useEffect, useMemo } from "react";
// DEMO: the type only. lib/ghl/appointments.ts holds server code, so it does not come across.
import type { GHLAppointment } from "@/demo/sc/home/types";

interface Props {
  open: boolean;
  onClose: () => void;
  appointments: GHLAppointment[];
  /** Main contact's IANA timezone — when set, timeline dates/times render
   *  in this zone (matching the Next Appointment card). */
  timezone?: string | null;
}

// Portal-theme (white drawer) status pill palette. Keys are lower-cased
// GHL appointment statuses; unknown values fall back to a neutral gray.
const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; dot: string; ring: string }
> = {
  confirmed: { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6", ring: "#dbeafe" },
  scheduled: { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6", ring: "#dbeafe" },
  new:       { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6", ring: "#dbeafe" },
  showed:    { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0", dot: "#22c55e", ring: "#dcfce7" },
  noshow:    { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca", dot: "#ef4444", ring: "#fee2e2" },
  "no-show": { bg: "#fee2e2", text: "#b91c1c", border: "#fecaca", dot: "#ef4444", ring: "#fee2e2" },
  cancelled: { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb", dot: "#9ca3af", ring: "#f3f4f6" },
  canceled:  { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb", dot: "#9ca3af", ring: "#f3f4f6" },
  invalid:   { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb", dot: "#9ca3af", ring: "#f3f4f6" },
};

// Group by month for the timeline heading — modern-CRM feel.
function monthKey(iso: string, tz?: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: tz });
}

interface TimelineItemProps {
  appt: GHLAppointment;
  isLast: boolean;
  tz?: string;
}

function TimelineItem({ appt, isLast, tz }: TimelineItemProps) {
  const start = new Date(appt.startTime);
  const end = new Date(appt.endTime);
  const durationMin = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const status = (appt.appointmentStatus ?? "").toLowerCase();
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.cancelled;
  const dateLabel = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: tz });
  const timeLabel = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: tz });

  return (
    <div className="relative pl-10 pb-6 last:pb-0">
      {/* Vertical rail — sits behind the dot; hidden on the last item */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[15px] top-6 bottom-0 w-px bg-gray-200"
        />
      )}

      {/* Colored dot on the rail */}
      <span
        aria-hidden
        className="absolute left-[9px] top-2 w-[14px] h-[14px] rounded-full flex items-center justify-center"
        style={{ background: style.ring, border: `1px solid ${style.dot}` }}
      >
        <span
          className="w-[6px] h-[6px] rounded-full"
          style={{ background: style.dot }}
        />
      </span>

      {/* Content */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[0.7rem] font-semibold text-gray-500 tracking-wide">
            {dateLabel} · {timeLabel}
            {durationMin > 0 && <span className="text-gray-400"> · {durationMin} min</span>}
          </div>
          <div className="text-[0.9rem] font-bold text-gray-900 truncate mt-0.5">
            {appt.title || appt.calendarName || "Appointment"}
          </div>
          {(appt.calendarName || appt.assignedUserName) && (
            <div className="text-[0.72rem] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              {appt.calendarName && (
                <span className="font-medium" style={{ color: "#15803d" }}>
                  {appt.calendarName}
                </span>
              )}
              {appt.calendarName && appt.assignedUserName && <span className="text-gray-300">·</span>}
              {appt.assignedUserName && <span>{appt.assignedUserName}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {typeof appt.amount === "number" && appt.amount > 0 && (
            <span
              className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full border"
              style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}
              title="Credits paid for this call"
            >
              {formatMoney(appt.amount, appt.currency)}
            </span>
          )}
          {status && (
            <span
              className="text-[0.6rem] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full border"
              style={{ background: style.bg, color: style.text, borderColor: style.border }}
            >
              {status}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatMoney(amount: number, currency?: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

export function AppointmentHistoryDrawer({ open, onClose, appointments, timezone = null }: Props) {
  const tz = timezone ?? undefined;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const { upcomingGroups, pastGroups, total } = useMemo(() => {
    const now = Date.now();
    const upSorted = appointments
      .filter((a) => new Date(a.startTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const paSorted = appointments
      .filter((a) => new Date(a.startTime).getTime() < now)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Preserve section-internal ordering while grouping by month header.
    function groupByMonth(list: GHLAppointment[]) {
      const groups: { key: string; items: GHLAppointment[] }[] = [];
      for (const appt of list) {
        const key = monthKey(appt.startTime, tz);
        const existing = groups.find((g) => g.key === key);
        if (existing) existing.items.push(appt);
        else groups.push({ key, items: [appt] });
      }
      return groups;
    }

    return {
      upcomingGroups: groupByMonth(upSorted),
      pastGroups: groupByMonth(paSorted),
      total: appointments.length,
    };
  }, [appointments, tz]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="absolute top-0 right-0 h-full bg-white shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]"
        style={{ width: "min(600px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Booking History</h2>
            <p className="text-[0.7rem] text-gray-500 mt-0.5">
              {total === 0 ? "No appointments" : `${total} appointment${total === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {total === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">No booking history yet.</p>
            </div>
          ) : (
            <>
              {upcomingGroups.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-gray-900">Upcoming</h3>
                    <span className="text-[0.65rem] font-semibold text-gray-400">
                      {upcomingGroups.reduce((n, g) => n + g.items.length, 0)}
                    </span>
                    <span className="flex-1 h-px bg-gray-100" />
                  </div>
                  {upcomingGroups.map((group) => (
                    <div key={group.key} className="mb-4 last:mb-0">
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3 ml-10">
                        {group.key}
                      </div>
                      {group.items.map((appt, i) => (
                        <TimelineItem
                          key={appt.id}
                          appt={appt}
                          isLast={i === group.items.length - 1}
                          tz={tz}
                        />
                      ))}
                    </div>
                  ))}
                </section>
              )}
              {pastGroups.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-gray-900">Past</h3>
                    <span className="text-[0.65rem] font-semibold text-gray-400">
                      {pastGroups.reduce((n, g) => n + g.items.length, 0)}
                    </span>
                    <span className="flex-1 h-px bg-gray-100" />
                  </div>
                  {pastGroups.map((group) => (
                    <div key={group.key} className="mb-4 last:mb-0">
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-gray-400 mb-3 ml-10">
                        {group.key}
                      </div>
                      {group.items.map((appt, i) => (
                        <TimelineItem
                          key={appt.id}
                          appt={appt}
                          isLast={i === group.items.length - 1}
                          tz={tz}
                        />
                      ))}
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* DEMO: styled-jsx is not installed, so this is a plain <style> tag. */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
