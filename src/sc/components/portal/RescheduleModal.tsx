"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TimezoneSelect, useBookingTimezone } from "./TimezoneSelect";
// DEMO: the type only. lib/ghl/appointments.ts holds server code, so it does not come across.
import type { GHLAppointment } from "@/demo/sc/home/types";

interface Props {
  locationId: string;
  appointment: GHLAppointment;
  /** Main contact's IANA timezone — used to label the current time. */
  contactTimezone?: string | null;
  onClose: () => void;
}

interface AvailabilityResp {
  slots?: Record<string, string[]>;
  error?: string;
}

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/**
 * Reschedule an existing appointment in place. Reuses the booking-modal
 * slot-picker pattern but is generic — it pulls availability for the
 * appointment's own calendar and PUT-reschedules it (preserving duration).
 */
export function RescheduleModal({ locationId, appointment, contactTimezone = null, onClose }: Props) {
  const router = useRouter();
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(new Date()));
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [doneAt, setDoneAt] = useState<string | null>(null);
  const [tz, setTz] = useBookingTimezone(locationId);
  const fetchedRanges = useRef<Set<string>>(new Set());

  // Timezone switch: GHL groups slot days by the REQUESTED tz, so cached
  // buckets from the old zone are wrong — drop them and refetch.
  useEffect(() => {
    fetchedRanges.current.clear();
    setSlotsByDate({});
    setSelectedDate(null);
    setSelectedSlotISO(null);
  }, [tz]);

  const durationMs = Math.max(0, new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime());

  useEffect(() => {
    if (!appointment.calendarId) { setSlotsError("This appointment has no calendar to reschedule against."); return; }
    const startMs = startOfMonth(viewMonth).getTime();
    const endMs = endOfMonth(viewMonth).getTime();
    const key = `${tz}:${startMs}-${endMs}`;
    if (fetchedRanges.current.has(key)) return;
    fetchedRanges.current.add(key);

    setLoadingSlots(true);
    setSlotsError(null);
    fetch(`/api/portal/${locationId}/calendar-availability?calendarId=${encodeURIComponent(appointment.calendarId)}&appointmentId=${encodeURIComponent(appointment.id)}&startMs=${startMs}&endMs=${endMs}&timezone=${encodeURIComponent(tz)}`)
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as AvailabilityResp;
        if (!r.ok) { setSlotsError(data.error ?? `HTTP ${r.status}`); return; }
        setSlotsByDate((prev) => ({ ...prev, ...(data.slots ?? {}) }));
      })
      .catch((err) => setSlotsError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingSlots(false));
  }, [viewMonth, locationId, appointment.calendarId, appointment.id, tz]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const monthGrid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const days: Array<Date | null> = [];
    const lead = (first.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) days.push(null);
    const last = endOfMonth(viewMonth).getDate();
    for (let d = 1; d <= last; d++) days.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    return days;
  }, [viewMonth]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slotsForSelected = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  const currentLabel = new Date(appointment.startTime).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: tz,
  });

  async function handleConfirm() {
    if (!selectedSlotISO) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const start = new Date(selectedSlotISO);
      const end = new Date(start.getTime() + (durationMs || 30 * 60 * 1000));
      const res = await fetch(`/api/portal/${locationId}/reschedule-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointment.id, startTime: selectedSlotISO, endTime: end.toISOString() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSubmitError(data.error ?? `HTTP ${res.status}`); return; }
      setDoneAt(selectedSlotISO);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={() => !submitting && onClose()}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <p className="text-base font-bold text-gray-900">Reschedule appointment</p>
            <p className="text-xs text-gray-500 mt-0.5">Currently {currentLabel}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {doneAt ? (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#16a34a" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Rescheduled!</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(doneAt).toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz })}
              </p>
            </div>
            <button onClick={onClose} className="px-5 py-2 text-sm font-bold" style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 flex-1 overflow-auto">
              <p className="text-base font-bold text-gray-900 mb-5">Pick a new date &amp; time</p>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6">
                <div>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#1d4ed8", color: "#ffffff" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <p className="text-sm font-semibold text-gray-900 min-w-[110px] text-center">{monthLabel}</p>
                    <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "#1d4ed8", color: "#ffffff" }}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-y-2 text-[0.7rem] font-medium text-gray-500 mb-1">
                    {DAY_HEADERS.map((d) => <div key={d} className="text-center">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-2 justify-items-center">
                    {monthGrid.map((d, i) => {
                      if (!d) return <div key={i} className="w-9 h-9" />;
                      const key = ymd(d);
                      const has = (slotsByDate[key]?.length ?? 0) > 0;
                      const isPast = d < today;
                      const isSel = selectedDate === key;
                      const enabled = !isPast && has;
                      return (
                        <button key={i} disabled={!enabled}
                          onClick={() => { setSelectedDate(key); setSelectedSlotISO(null); }}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm cursor-pointer disabled:cursor-not-allowed"
                          style={isSel ? { background: "#1d4ed8", color: "#ffffff", fontWeight: 700 } : enabled ? { background: "#dbeafe", color: "#1d4ed8", fontWeight: 600 } : { color: "#d1d5db", fontWeight: 400 }}>
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  {loadingSlots && <p className="mt-3 text-xs text-gray-400">Loading availability…</p>}
                  {slotsError && <p className="mt-3 text-xs font-semibold" style={{ color: "#b91c1c" }}>{slotsError}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  {selectedDate ? (
                    slotsForSelected.length === 0 ? (
                      <p className="text-xs text-gray-400">No slots on this day.</p>
                    ) : (
                      slotsForSelected.map((iso) => {
                        const label = new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: tz });
                        const isSel = selectedSlotISO === iso;
                        return (
                          <button key={iso} onClick={() => setSelectedSlotISO(iso)}
                            className="px-4 py-3 text-base font-bold cursor-pointer"
                            style={isSel ? { borderRadius: 8, background: "#1d4ed8", color: "#ffffff", border: "1px solid #1d4ed8" } : { borderRadius: 8, background: "#ffffff", color: "#1d4ed8", border: "1px solid #1d4ed8" }}>
                            {label}
                          </button>
                        );
                      })
                    )
                  ) : (
                    <p className="text-xs text-gray-400">Pick a date to see available times.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-1">Time zone</p>
                <div className="text-sm text-gray-600"><TimezoneSelect value={tz} onChange={setTz} /></div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
              {submitError && <p className="text-xs font-semibold mb-2" style={{ color: "#b91c1c" }}>{submitError}</p>}
              <div className="flex gap-2">
                <button onClick={handleConfirm} disabled={submitting || !selectedSlotISO}
                  className="flex-1 px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
                  style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}>
                  {submitting ? "Rescheduling…" : "Confirm New Time"}
                </button>
                <button onClick={onClose} disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                  style={{ borderRadius: 8, background: "#6b7280", color: "#ffffff" }}>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
