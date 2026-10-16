"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TimezoneSelect, useBookingTimezone } from "./TimezoneSelect";
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
// DEMO: the Add funds dialog replaces the link to the GoHighLevel billing page.
import { openAddFunds } from "@/demo/sc/home/addFunds";

export interface BookableMentor {
  id: string;
  name: string;
  consultationPrice: string | null;
  /** When true, the modal shows a message form instead of the booking
   *  calendar (admin "Enable Form" flag on the mentor). */
  formEnabled?: boolean;
  formDescription?: string | null;
}

interface BookProps {
  mentor: BookableMentor;
  locationId: string;
  walletCurrency: string;
  optimisticBalance: number | null;
  onBalanceChange: (b: number | null) => void;
  userToken: string | null;
  onClose: () => void;
  /** When true, the modal advertises "Free" instead of the price + skips the can-afford check.
      Server is still authoritative — it will only book free if the assigned-mentor + remaining-free conditions are met. */
  freeBooking?: boolean;
}

interface AvailabilityResp {
  slots?: Record<string, string[]>;
  price?: number;
  currency?: string;
  error?: string;
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

/** The address form, in this modal's own blue (FD4). */
const ADDRESS_FORM_CLASSES = legacyAddressFormClasses("bg-[#1d4ed8]");
/** The pilot terms box, in this modal's own blue (FD4). */
const TERMS_BOX_CLASSES = legacyTermsBoxClasses("accent-[#1d4ed8]");

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BookMentorModal({
  mentor, locationId, walletCurrency, optimisticBalance, onBalanceChange, userToken, onClose, freeBooking = false,
}: BookProps) {
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
  // Message-form state (mentor.formEnabled path).
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const fetchedRanges = useRef<Set<string>>(new Set());

  const price = parsePrice(mentor.consultationPrice);
  const balance = optimisticBalance ?? 0;
  // Free-session pool covers any otherwise-paid consultation first (since
  // 2026-07-10). Surfaces that already know the pool pass `freeBooking`;
  // the rest learn it from a fail-soft fetch. Server re-checks on book.
  const [fetchedFreeLeft, setFetchedFreeLeft] = useState(0);
  useEffect(() => {
    if (freeBooking) return;
    let cancelled = false;
    fetch(`/api/portal/${locationId}/free-sessions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!cancelled && typeof j?.left === "number") setFetchedFreeLeft(j.left); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [locationId, freeBooking]);
  const isFreeCovered = freeBooking || fetchedFreeLeft > 0;
  const canAfford = isFreeCovered || balance >= price;
  // The two pools, read when the modal opens: the footer shows them apart.
  const fetchedAmounts = useWalletAmounts(locationId);
  // DEMO: the footer follows the live balance, so it is right after the member adds funds.
  const walletAmounts =
    optimisticBalance != null
      ? { paidBalance: optimisticBalance, promotionalCredit: fetchedAmounts?.promotionalCredit ?? 0 }
      : fetchedAmounts;
  const breakdown = isFreeCovered ? null : purchaseBreakdown(price, walletAmounts);
  const [coveredByCredit, setCoveredByCredit] = useState(false);
  const money = (n: number) => formatMoney(n, walletCurrency);
  const rechargeUrl = `https://app.govpreneurs.com/v2/location/${locationId}/settings/company-billing/billing?tab=wallet_transactions`;
  // The pilot terms box (PRD §8.2): only on a paid booking, as the server decides.
  const showTerms = useCheckoutTerms(locationId);
  const termsOn = isFreeCovered ? false : showTerms;
  const terms = useTermsGate(termsOn);
  // A free consultation writes no invoice row, so it never asks (D14).
  const addressGate = useBusinessAddressGate(locationId);
  const cancelAddress = addressGate.cancel;
  // A new slot closes the form: the kept booking holds the slot she confirmed.
  useEffect(() => {
    cancelAddress();
  }, [selectedSlotISO, cancelAddress]);
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
    if (mentor.formEnabled) return; // form mode — no calendar to load
    const startMs = startOfMonth(viewMonth).getTime();
    const endMs = endOfMonth(viewMonth).getTime();
    const key = `${tz}:${startMs}-${endMs}`;
    if (fetchedRanges.current.has(key)) return;
    fetchedRanges.current.add(key);

    setLoadingSlots(true);
    setSlotsError(null);
    fetch(
      `/api/portal/${locationId}/mentor-availability?mentorId=${mentor.id}&startMs=${startMs}&endMs=${endMs}&timezone=${encodeURIComponent(tz)}`
    )
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
  }, [viewMonth, mentor.id, locationId, tz]);

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
    return purchaseThroughGate(addressGate, !isFreeCovered, book);
  }

  async function book() {
    if (!selectedSlotISO) return;
    setBooking(true);
    setBookError(null);
    try {
      const start = new Date(selectedSlotISO);
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      const res = await fetch(`/api/portal/${locationId}/book-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: mentor.id,
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
      else if (!isFreeCovered) onBalanceChange((optimisticBalance ?? 0) - price);
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

  async function handleSendMessage() {
    const trimmed = message.trim();
    if (!trimmed) { setSendError("Please write a message first."); return; }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/portal/${locationId}/mentor-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId: mentor.id, message: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  // ── Form mode — admin flipped "Enable Form" on this mentor: the modal is
  // a message form instead of the booking calendar. No wallet involvement.
  if (mentor.formEnabled) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={() => !sending && onClose()}
      >
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <p className="text-base font-bold text-gray-900">Message {mentor.name}</p>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={sending}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {sent ? (
            <div className="px-5 py-8 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#16a34a" }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Message sent!</p>
                <p className="text-sm text-gray-600 mt-1">Your Mentor will follow up with you soon.</p>
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
            <div className="px-5 py-5 flex flex-col gap-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                {mentor.formDescription?.trim() || "Send a message to your Mentor and they'll get back to you."}
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={2000}
                placeholder="Write your message…"
                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 resize-none"
                disabled={sending}
              />
              {sendError && (
                <p className="text-xs font-semibold" style={{ color: "#b91c1c" }}>{sendError}</p>
              )}
              <button
                onClick={handleSendMessage}
                disabled={sending || message.trim().length === 0}
                className="w-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
                style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}
              >
                {sending ? "Sending…" : "Send Message"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <p className="text-base font-bold text-gray-900">Book with {mentor.name}</p>
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
              style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 flex-1 overflow-auto">
            <p className="text-base font-bold text-gray-900 mb-5">Select Date & Time</p>
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-600">
                {isFreeCovered ? (
                  <span className="font-bold" style={{ color: "#15803d" }}>Complimentary session</span>
                ) : (
                  <>{selectedSlotISO ? "You will be charged " : "Price "}
                    <span className="font-bold text-gray-900">{formatMoney(price, walletCurrency)}</span>
                  </>
                )}
                {" · "}{WALLET_BALANCE_LABEL}:{" "}
                <span className="font-semibold">{walletAmounts ? money(walletAmounts.paidBalance) : "—"}</span>
              </p>
            </div>
            <PromotionalCreditLine amounts={walletAmounts} format={money} className="text-xs text-gray-600 mb-1" />
            <PurchaseBreakdownLine breakdown={breakdown} format={money} className="text-xs text-gray-600 mb-2" />
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
                    style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}
                  >
                    {booking
                      ? "Booking…"
                      : isFreeCovered
                        ? "Confirm & Book (Free)"
                        : `Confirm & Book (${formatMoney(price, walletCurrency)})`}
                  </button>
                ) : (
                  /* DEMO: was <a href={rechargeUrl} target="_blank">. A button opens the in-app Add funds dialog. */
                  <button
                    type="button"
                    onClick={openAddFunds}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold"
                    style={{ borderRadius: 8, background: "#d4a017", color: "#ffffff" }}
                  >
                    Recharge Wallet
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
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
