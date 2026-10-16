"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TimezoneSelect, useBookingTimezone } from "./TimezoneSelect";
import { useRouter } from "next/navigation";

interface Props {
  locationId: string;
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

export function BookOnboardingModal({ locationId, onClose }: Props) {
  const router = useRouter();
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(new Date()));
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookedAt, setBookedAt] = useState<string | null>(null);
  const fetchedRanges = useRef<Set<string>>(new Set());
  const [tz, setTz] = useBookingTimezone(locationId);
  // Timezone switch: GHL groups slot days by the REQUESTED tz, so cached
  // buckets from the old zone are wrong — drop them and refetch.
  useEffect(() => {
    fetchedRanges.current.clear();
    setSlotsByDate({});
    setSelectedDate(null);
    setSelectedSlotISO(null);
  }, [tz]);

  useEffect(() => {
    const startMs = startOfMonth(viewMonth).getTime();
    const endMs = endOfMonth(viewMonth).getTime();
    const key = `${tz}:${startMs}-${endMs}`;
    if (fetchedRanges.current.has(key)) return;
    fetchedRanges.current.add(key);

    setLoadingSlots(true);
    setSlotsError(null);
    fetch(`/api/portal/${locationId}/onboarding-availability?startMs=${startMs}&endMs=${endMs}&timezone=${encodeURIComponent(tz)}`)
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as AvailabilityResp;
        if (!r.ok) {
          setSlotsError(data.error ?? `HTTP ${r.status}`);
          return;
        }
        setSlotsByDate((prev) => ({ ...prev, ...(data.slots ?? {}) }));
      })
      .catch((err) => setSlotsError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingSlots(false));
  }, [viewMonth, locationId, tz]);

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

  async function handleConfirm() {
    if (!selectedSlotISO) return;
    setBooking(true);
    setBookError(null);
    try {
      const start = new Date(selectedSlotISO);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const res = await fetch(`/api/portal/${locationId}/book-onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: selectedSlotISO,
          endTime: end.toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBookError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setBookedAt(selectedSlotISO);
      router.refresh();
    } catch (err) {
      setBookError(err instanceof Error ? err.message : String(err));
    } finally {
      setBooking(false);
    }
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={() => !booking && onClose()}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <p className="text-base font-bold text-gray-900">Book Onboarding Call</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {bookedAt ? (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#16a34a" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Onboarding call booked!</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(bookedAt).toLocaleString(undefined, {
                  weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz,
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold"
              style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 flex-1 overflow-auto">
            <p className="text-base font-bold text-gray-900 mb-5">Select Date &amp; Time</p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6">
              <div>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "#15803d", color: "#ffffff" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <p className="text-sm font-semibold text-gray-900 min-w-[110px] text-center">{monthLabel}</p>
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "#15803d", color: "#ffffff" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-y-2 text-[0.7rem] font-medium text-gray-500 mb-1">
                  {dayHeaders.map((d) => (
                    <div key={d} className="text-center">{d}</div>
                  ))}
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
                      <button
                        key={i}
                        disabled={!enabled}
                        onClick={() => { setSelectedDate(key); setSelectedSlotISO(null); }}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                        style={
                          isSel
                            ? { background: "#15803d", color: "#ffffff", fontWeight: 700 }
                            : enabled
                            ? { background: "#dcfce7", color: "#15803d", fontWeight: 600 }
                            : { color: "#d1d5db", fontWeight: 400 }
                        }
                      >
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
                      const t = new Date(iso);
                      const label = t.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: tz });
                      const isSel = selectedSlotISO === iso;
                      return (
                        <button
                          key={iso}
                          onClick={() => setSelectedSlotISO(iso)}
                          className="px-4 py-3 text-base font-bold transition-colors cursor-pointer"
                          style={
                            isSel
                              ? { borderRadius: 8, background: "#15803d", color: "#ffffff", border: "1px solid #15803d" }
                              : { borderRadius: 8, background: "#ffffff", color: "#15803d", border: "1px solid #15803d" }
                          }
                        >
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
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <TimezoneSelect value={tz} onChange={setTz} />
              </p>
            </div>
          </div>
        )}

        {!bookedAt && (
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
            {bookError && (
              <p className="text-xs font-semibold mb-2" style={{ color: "#b91c1c" }}>{bookError}</p>
            )}
            {selectedSlotISO ? (
              <button
                onClick={handleConfirm}
                disabled={booking}
                className="w-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
                style={{ borderRadius: 8, background: "#15803d", color: "#ffffff" }}
              >
                {booking ? "Booking…" : "Confirm & Book"}
              </button>
            ) : (
              <button
                disabled
                className="w-full px-4 py-2.5 text-sm font-bold opacity-50"
                style={{ borderRadius: 8, background: "#9ca3af", color: "#ffffff" }}
              >
                Pick a time slot
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
