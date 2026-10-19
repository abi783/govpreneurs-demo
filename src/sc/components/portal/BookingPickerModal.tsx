"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TimezoneSelect, useBookingTimezone } from "./TimezoneSelect";
import { MentorPhoto } from "./MentorPhoto";
import { useRouter } from "next/navigation";
import { useWalletAmounts } from "./useWalletAmounts";
import { PromotionalCreditLine, PurchaseBreakdownLine } from "./WalletAmountLines";
import { AddressStep } from "./AddressStep";
import { legacyAddressFormClasses } from "./legacyAddressFormClasses";
import { useBusinessAddressGate } from "./useBusinessAddressGate";
import { purchaseThroughGate } from "./addressGate";
import { TermsBox, legacyTermsBoxClasses } from "./TermsBox";
import { useCheckoutTerms } from "./useCheckoutTerms";
import { checkoutErrorText, termsRequestFields } from "./checkoutTerms";
import { useTermsGate } from "./useTermsGate";
import { purchaseBreakdown } from "@sc/lib/billing/walletDisplay";
import { CREDIT_COVERED_PURCHASE, WALLET_BALANCE_LABEL } from "@sc/lib/walletCopy";

export interface BookingMentor {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  ghlUserId: string | null;
}

interface Props {
  stepId: string;
  stepTitle: string;
  bookingTitle: string;
  bookingDescription: string | null;
  bookingPrice: string | null;
  locationId: string;
  walletBalance: number | null;
  walletCurrency: string;
  onBalanceChange: (b: number | null) => void;
  userToken: string | null;
  onClose: () => void;
}

function parsePrice(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return 0;
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * The address form, in this modal's own purple. Legacy on every page, also on
 * the Design System `/tasks` page (FD4).
 */
const ADDRESS_FORM_CLASSES = legacyAddressFormClasses("bg-[#7c3aed]");

/** The pilot terms box, in this modal's own purple (FD4). */
const TERMS_BOX_CLASSES = legacyTermsBoxClasses("accent-[#7c3aed]");

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Per-step booking picker. On mount, fetches the calendar's teamMembers (via
 * the admin calendars list — same data the admin UI uses) and joins them
 * against the active mentor pool by `ghlUserId`.
 *
 * Decision tree:
 *   - `bookingUseAssignedMentor` + assignedMentor is on the calendar → skip picker.
 *   - Exactly one mentor on the calendar → skip picker.
 *   - Multiple mentors → render picker first.
 *   - No mentor mapping → skip picker, mentorId stays null (individual calendar).
 */
export function BookingPickerModal({
  stepId,
  stepTitle,
  bookingTitle,
  bookingDescription,
  bookingPrice,
  locationId,
  walletBalance,
  walletCurrency,
  onBalanceChange,
  userToken,
  onClose,
}: Props) {
  const router = useRouter();
  const price = parsePrice(bookingPrice);
  const balance = walletBalance ?? 0;
  // Free-session pool: covers priced calls before the wallet is touched.
  // Resolved by the booking-mentors fetch below; server re-checks on book.
  const [freeLeft, setFreeLeft] = useState(0);
  const coveredByFree = price > 0 && freeLeft > 0;
  const canAfford = price === 0 || coveredByFree || balance >= price;
  // The two pools, read when the modal opens: the footer shows them apart.
  const walletAmounts = useWalletAmounts(locationId);
  const paidBooking = price > 0 && !coveredByFree;
  const breakdown = paidBooking ? purchaseBreakdown(price, walletAmounts) : null;
  // The pilot terms box (PRD §8.2): only on a paid booking, as the server decides.
  const showTerms = useCheckoutTerms(locationId);
  const termsOn = paidBooking ? showTerms : false;
  const terms = useTermsGate(termsOn);
  const [coveredByCredit, setCoveredByCredit] = useState(false);
  const money = (n: number) => formatMoney(n, walletCurrency);
  const rechargeUrl = `https://app.govpreneurs.com/v2/location/${locationId}/settings/company-billing/billing?tab=wallet_transactions`;

  // The set of mentors eligible for this calendar. Resolved by hitting the
  // admin calendars list and joining client-side against the mentor pool.
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [eligibleMentors, setEligibleMentors] = useState<BookingMentor[]>([]);
  const [chosenMentorId, setChosenMentorId] = useState<string | null>(null);
  // Tracks whether the picker step is done — either auto-skipped or user-picked.
  const [pickerResolved, setPickerResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCalendarLoading(true);
    fetch(`/api/portal/${locationId}/booking-mentors?stepId=${encodeURIComponent(stepId)}`)
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
        const useAssigned = !!data.bookingUseAssignedMentor;
        const assignedId = (data.assignedMentorId ?? null) as string | null;
        if (typeof data.freeSessionsLeft === "number") setFreeLeft(data.freeSessionsLeft);
        setEligibleMentors(matched);

        if (useAssigned && assignedId) {
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
  }, [stepId, locationId]);

  // ── Slot fetch ──
  const [tz, setTz] = useBookingTimezone(locationId);
  // Timezone switch: GHL groups slot days by the REQUESTED tz, so cached
  // buckets from the old zone are wrong — drop them and refetch. A mentor
  // switch does the same: mentors can keep different hours
  // (lib/booking/mentorHours.ts), so one mentor's times are not another's.
  useEffect(() => {
    fetchedRanges.current.clear();
    setSlotsByDate({});
    setSelectedDate(null);
    setSelectedSlotISO(null);
  }, [tz, chosenMentorId]);
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
  // Only a paid booking writes an invoice row, so only it asks (D14).
  const addressGate = useBusinessAddressGate(locationId);
  const cancelAddress = addressGate.cancel;
  // A new slot or mentor closes the form: the kept booking holds what she confirmed.
  useEffect(() => {
    cancelAddress();
  }, [selectedSlotISO, chosenMentorId, cancelAddress]);

  useEffect(() => {
    if (!pickerResolved) return;
    const startMs = startOfMonth(viewMonth).getTime();
    const endMs = endOfMonth(viewMonth).getTime();
    const key = `${tz}:${chosenMentorId ?? ""}:${startMs}-${endMs}`;
    if (fetchedRanges.current.has(key)) return;
    fetchedRanges.current.add(key);

    setLoadingSlots(true);
    setSlotsError(null);
    const mentorQs = chosenMentorId ? `&mentorId=${encodeURIComponent(chosenMentorId)}` : "";
    fetch(
      `/api/portal/${locationId}/booking-availability?stepId=${encodeURIComponent(stepId)}${mentorQs}&startMs=${startMs}&endMs=${endMs}&timezone=${encodeURIComponent(tz)}`
    )
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as { slots?: Record<string, string[]>; error?: string };
        if (!r.ok) {
          setSlotsError(data.error ?? `HTTP ${r.status}`);
          return;
        }
        setSlotsByDate((prev) => ({ ...prev, ...(data.slots ?? {}) }));
      })
      .catch((err) => setSlotsError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingSlots(false));
  }, [pickerResolved, viewMonth, stepId, locationId, tz, chosenMentorId]);

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

  function handleConfirm() {
    if (!terms.allowsPay()) return;
    return purchaseThroughGate(addressGate, paidBooking, book);
  }

  async function book() {
    if (!selectedSlotISO) return;
    setBooking(true);
    setBookError(null);
    try {
      const start = new Date(selectedSlotISO);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const res = await fetch(`/api/portal/${locationId}/book-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          mentorId: chosenMentorId,
          startTime: selectedSlotISO,
          endTime: end.toISOString(),
          userToken,
          ...termsRequestFields(termsOn === true, terms.ticked),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBookError(checkoutErrorText(data.error, res.status));
        return;
      }
      if (typeof data.balance === "number") onBalanceChange(data.balance);
      else if (price > 0 && !data.usedFreeSession) onBalanceChange((walletBalance ?? 0) - price);
      if (data.usedFreeSession && typeof data.freeSessionsLeft === "number") setFreeLeft(data.freeSessionsLeft);
      setCoveredByCredit(breakdown?.creditCoversAll === true);
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

  // ── Render ──
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
          <div className="min-w-0">
            <p className="text-base font-bold text-gray-900 truncate">{bookingTitle}</p>
            <p className="text-[0.7rem] text-gray-500 truncate">{stepTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {bookedAt ? (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#7c3aed" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Booking confirmed!</p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(bookedAt).toLocaleString(undefined, {
                  weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz,
                })}
              </p>
              {coveredByCredit && <p className="text-xs text-gray-600 mt-2">{CREDIT_COVERED_PURCHASE}</p>}
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold"
              style={{ borderRadius: 8, background: "#7c3aed", color: "#ffffff" }}
            >
              Close
            </button>
          </div>
        ) : calendarLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">Loading…</div>
        ) : !pickerResolved ? (
          // ── Mentor picker (multi-mentor) ──
          <div className="px-6 py-5 flex-1 overflow-auto">
            {bookingDescription && (
              <p className="text-sm text-gray-600 mb-4">{bookingDescription}</p>
            )}
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
                  style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f3e8ff")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#faf5ff")}
                >
                  <MentorPhoto
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    fallback={
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "#e9d5ff", color: "#6d28d9" }}>
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
          // ── Calendar + slot picker ──
          <div className="px-6 py-5 flex-1 overflow-auto">
            {calendarError && (
              <p className="text-xs font-semibold mb-3" style={{ color: "#b91c1c" }}>{calendarError}</p>
            )}
            {chosenMentorId && (() => {
              const m = eligibleMentors.find((x) => x.id === chosenMentorId);
              if (!m) return null;
              return (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
                  <MentorPhoto
                    src={m.avatarUrl}
                    alt={m.name}
                    className="w-10 h-10 rounded-full object-cover"
                    fallback={
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#e9d5ff", color: "#6d28d9" }}>
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
                      style={{ color: "#6d28d9" }}
                    >
                      Change
                    </button>
                  )}
                </div>
              );
            })()}

            <p className="text-base font-bold text-gray-900 mb-5">Select Date & Time</p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-6">
              <div>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "#7c3aed", color: "#ffffff" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <p className="text-sm font-semibold text-gray-900 min-w-[110px] text-center">{monthLabel}</p>
                  <button
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "#7c3aed", color: "#ffffff" }}
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
                            ? { background: "#7c3aed", color: "#ffffff", fontWeight: 700 }
                            : enabled
                            ? { background: "#ede9fe", color: "#6d28d9", fontWeight: 600 }
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
                              ? { borderRadius: 8, background: "#7c3aed", color: "#ffffff", border: "1px solid #7c3aed" }
                              : { borderRadius: 8, background: "#ffffff", color: "#6d28d9", border: "1px solid #7c3aed" }
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">
                {coveredByFree ? (
                  <>
                    <span className="font-bold" style={{ color: "#15803d" }}>Covered by your free session</span>
                    {" — "}
                    <span className="font-semibold">{freeLeft}</span> left · the{" "}
                    <span className="font-semibold line-through">{formatMoney(price, walletCurrency)}</span> fee is waived
                  </>
                ) : price > 0 ? (
                  <>
                    {selectedSlotISO ? "You will be charged " : "Price "}
                    <span className="font-bold text-gray-900">{formatMoney(price, walletCurrency)}</span>
                    {" · "}{WALLET_BALANCE_LABEL}:{" "}
                    <span className="font-semibold">{walletAmounts ? money(walletAmounts.paidBalance) : "—"}</span>
                  </>
                ) : (
                  <span className="font-bold" style={{ color: "#15803d" }}>Free</span>
                )}
              </p>
            </div>
            {paidBooking && (
              <>
                <PromotionalCreditLine amounts={walletAmounts} format={money} className="text-xs text-gray-600 mb-1" />
                <PurchaseBreakdownLine breakdown={breakdown} format={money} className="text-xs text-gray-600 mb-2" />
              </>
            )}
            {price > 0 && !canAfford && selectedSlotISO && (
              <p className="text-xs font-semibold mb-2" style={{ color: "#b91c1c" }}>
                Insufficient wallet balance — recharge{" "}
                {formatMoney(Math.max(0, price - balance), walletCurrency)} to confirm.
              </p>
            )}
            {bookError && (
              <p className="text-xs font-semibold mb-2" style={{ color: "#b91c1c" }}>{bookError}</p>
            )}
            {termsOn && (
              <TermsBox
                {...terms.box}
                disabled={booking || addressGate.asking}
                classes={TERMS_BOX_CLASSES}
              />
            )}
            <AddressStep gate={addressGate} classes={ADDRESS_FORM_CLASSES}>
              {selectedSlotISO ? (
                canAfford ? (
                  <button
                    onClick={handleConfirm}
                    disabled={booking || terms.payDisabled}
                    className="w-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
                    style={{ borderRadius: 8, background: "#7c3aed", color: "#ffffff" }}
                  >
                    {booking
                      ? "Booking…"
                      : coveredByFree
                        ? "Confirm & Book (uses 1 free session)"
                        : price > 0
                          ? `Confirm & Book (${formatMoney(price, walletCurrency)})`
                          : "Confirm & Book"}
                  </button>
                ) : (
                  <a
                    href={rechargeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold"
                    style={{ borderRadius: 8, background: "#d4a017", color: "#ffffff" }}
                  >
                    Recharge Wallet
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                )
              ) : (
                <button
                  disabled
                  className="w-full px-4 py-2.5 text-sm font-bold opacity-50"
                  style={{ borderRadius: 8, background: "#9ca3af", color: "#ffffff" }}
                >
                  Pick a time slot
                </button>
              )}
            </AddressStep>
          </div>
        )}
      </div>
    </div>
  );
}
