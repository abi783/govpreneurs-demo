"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TimezoneSelect, useBookingTimezone } from "./TimezoneSelect";
import { MentorPhoto } from "./MentorPhoto";
import { useRouter } from "next/navigation";

interface BookingMentor {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  ghlUserId: string | null;
}

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

/**
 * Strategy Call booking modal. Mirrors the decision tree from
 * BookingPickerModal — auto-skip the picker when the center has an
 * assigned mentor on the calendar OR when exactly one mentor matches;
 * otherwise show the picker grid. After the customer picks (or auto-
 * skip resolves) the modal renders the slot picker against the
 * strategy-call calendar's availability.
 *
 * Picking a mentor here also stamps SuccessCenter.assignedMentorId
 * on the server when the center has none — see
 * /api/portal/[locationId]/book-strategy-call.
 */
export function BookStrategyCallModal({ locationId, onClose }: Props) {
  const router = useRouter();

  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [eligibleMentors, setEligibleMentors] = useState<BookingMentor[]>([]);
  const [chosenMentorId, setChosenMentorId] = useState<string | null>(null);
  const [pickerResolved, setPickerResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCalendarLoading(true);
    fetch(`/api/portal/${locationId}/strategy-call-mentors`)
      .then(async (r) => {
        if (cancelled) return;
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setCalendarError(data.error ?? `HTTP ${r.status}`);
          setEligibleMentors([]);
          setPickerResolved(true);
          return;
        }
        const matched = (data.mentors ?? []) as BookingMentor[];
        const assignedId = (data.assignedMentorId ?? null) as string | null;
        setEligibleMentors(matched);

        if (assignedId) {
          const assigned = matched.find((m) => m.id === assignedId);
          if (assigned) {
            setChosenMentorId(assigned.id);
            setPickerResolved(true);
            return;
          }
        }
        if (matched.length === 1) {
          setChosenMentorId(matched[0].id);
          setPickerResolved(true);
          return;
        }
        if (matched.length === 0) {
          setChosenMentorId(null);
          setPickerResolved(true);
          return;
        }
        setPickerResolved(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setCalendarError(err instanceof Error ? err.message : String(err));
        setPickerResolved(true);
      })
      .finally(() => {
        if (!cancelled) setCalendarLoading(false);
      });
    return () => { cancelled = true; };
  }, [locationId]);

  const [tz, setTz] = useBookingTimezone(locationId);
  // Timezone switch: GHL groups slot days by the REQUESTED tz, so cached
  // buckets from the old zone are wrong — drop them and refetch.
  useEffect(() => {
    fetchedRanges.current.clear();
    setSlotsByDate({});
    setSelectedDate(null);
    setSelectedSlotISO(null);
  }, [tz]);
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

  useEffect(() => {
    if (!pickerResolved) return;
    const startMs = startOfMonth(viewMonth).getTime();
    const endMs = endOfMonth(viewMonth).getTime();
    const key = `${tz}:${startMs}-${endMs}`;
    if (fetchedRanges.current.has(key)) return;
    fetchedRanges.current.add(key);

    setLoadingSlots(true);
    setSlotsError(null);
    fetch(`/api/portal/${locationId}/strategy-call-availability?startMs=${startMs}&endMs=${endMs}&timezone=${encodeURIComponent(tz)}`)
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
  }, [pickerResolved, viewMonth, locationId, tz]);

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
      const res = await fetch(`/api/portal/${locationId}/book-strategy-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: chosenMentorId,
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
          <p className="text-base font-bold text-gray-900">Book Strategy Call</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {bookedAt ? (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#1d4ed8" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Strategy call booked!</p>
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
        ) : calendarLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">Loading…</div>
        ) : !pickerResolved ? (
          <div className="px-6 py-5 flex-1 overflow-auto">
            <p className="text-sm text-gray-600 mb-4">
              Pick the mentor you&apos;d like for your strategy call. They&apos;ll become your assigned mentor for everything that follows.
            </p>
            <p className="text-sm font-bold text-gray-900 mb-3">Choose your specialist</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {eligibleMentors.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setChosenMentorId(m.id);
                    setPickerResolved(true);
                  }}
                  className="text-left flex gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#dbeafe")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#eff6ff")}
                >
                  <MentorPhoto
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    fallback={
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "#bfdbfe", color: "#1d4ed8" }}>
                        {m.name.slice(0, 1)}
                      </div>
                    }
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                    {m.title && <p className="text-xs text-gray-500 truncate">{m.title}</p>}
                    {m.bio && <p className="text-[0.7rem] text-gray-500 mt-1 line-clamp-2">{m.bio}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 flex-1 overflow-auto">
            {calendarError && (
              <p className="text-xs font-semibold mb-3" style={{ color: "#b91c1c" }}>{calendarError}</p>
            )}
            {chosenMentorId && (() => {
              const m = eligibleMentors.find((x) => x.id === chosenMentorId);
              if (!m) return null;
              return (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <MentorPhoto
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-10 h-10 rounded-full object-cover"
                    fallback={
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#bfdbfe", color: "#1d4ed8" }}>
                        {m.name.slice(0, 1)}
                      </div>
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">Booking with {m.name}</p>
                    {m.title && <p className="text-xs text-gray-500 truncate">{m.title}</p>}
                  </div>
                  {eligibleMentors.length > 1 && (
                    <button
                      onClick={() => { setPickerResolved(false); setSelectedDate(null); setSelectedSlotISO(null); }}
                      className="text-[0.7rem] font-semibold underline"
                      style={{ color: "#1d4ed8" }}
                    >
                      Change
                    </button>
                  )}
                </div>
              );
            })()}

            <p className="text-base font-bold text-gray-900 mb-5">Select Date &amp; Time</p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6">
              <div>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "#1d4ed8", color: "#ffffff" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <p className="text-sm font-semibold text-gray-900 min-w-[110px] text-center">{monthLabel}</p>
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "#1d4ed8", color: "#ffffff" }}
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
                            ? { background: "#1d4ed8", color: "#ffffff", fontWeight: 700 }
                            : enabled
                            ? { background: "#dbeafe", color: "#1d4ed8", fontWeight: 600 }
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
                              ? { borderRadius: 8, background: "#1d4ed8", color: "#ffffff", border: "1px solid #1d4ed8" }
                              : { borderRadius: 8, background: "#ffffff", color: "#1d4ed8", border: "1px solid #1d4ed8" }
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
              <div className="text-sm text-gray-600"><TimezoneSelect value={tz} onChange={setTz} /></div>
            </div>
          </div>
        )}

        {!bookedAt && pickerResolved && !calendarLoading && (
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
            {bookError && (
              <p className="text-xs font-semibold mb-2" style={{ color: "#b91c1c" }}>{bookError}</p>
            )}
            {selectedSlotISO ? (
              <button
                onClick={handleConfirm}
                disabled={booking}
                className="w-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
                style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}
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
