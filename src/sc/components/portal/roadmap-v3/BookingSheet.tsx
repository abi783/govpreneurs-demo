"use client";

// Roadmap v3 — the booking sheet, ported from the prototype's
// MentorBookingModal with the invented diary replaced by the real calendar:
// availability comes from the portal availability APIs and confirming books
// through book-call (mentor calls, wallet/free-session aware) or
// book-delivery (kickoff calls for bought work — free, included in the
// price). Rendered in-tree (no portal) so the .gpds-rm3 scope applies.
//
// Dates are written out in full ("Monday, 24 August 2026"), never 24/08/26:
// a member reading English as a second language should never have to work
// out which number is the month.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { formatUSD } from "./detailContent";
import { PromotionalCreditLine, PurchaseBreakdownLine } from "../WalletAmountLines";
import { purchaseBreakdown, walletAmountsFrom, type WalletAmounts } from "@sc/lib/billing/walletDisplay";
import type { V3Wallet } from "@sc/lib/roadmapV3/types";
import { WALLET_BALANCE_LABEL } from "@sc/lib/walletCopy";
import { useBusinessAddressGate } from "../useBusinessAddressGate";
import { AddressStep } from "../AddressStep";
import { purchaseThroughGate } from "../addressGate";
import { RM3_ADDRESS_FORM_CLASSES } from "./addressFormClasses";
import { checkoutErrorText, termsRequestFields } from "../checkoutTerms";
import { useTermsGate } from "../useTermsGate";
import { TermsConsent } from "./PilotCheckout";
import { Avatar } from "./Avatar";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "./Icon";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const SLOT_MINUTES = 30;

function longDate(d: Date): string {
  return `${["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export type BookingMode =
  | { kind: "call"; stepId: string; userToken: string | null }
  | { kind: "delivery"; sectionId: string; serviceTitle: string };

export function BookingSheet({
  open,
  onOpenChange,
  locationId,
  mode,
  title,
  whoName,
  whoRole,
  callName,
  price,
  freeSessions = 0,
  wallet,
  avatar,
  disabled,
  purchaseConfirmation = false,
  onBooked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  mode: BookingMode;
  title: string;
  whoName: string;
  whoRole: string;
  callName: string;
  /** 0 = included in what she bought — no wallet gate at all. */
  price: number;
  freeSessions?: number;
  /** Null when the wallet is unknown, or when the call is included (price 0). */
  wallet: V3Wallet | null;
  avatar?: ReactNode;
  /** Fixture mode — everything renders, nothing books. */
  disabled?: boolean;
  /** The payload's `purchaseConfirmation`: a paid call shows the pilot terms box (PRD §8.2). */
  purchaseConfirmation?: boolean;
  onBooked?: (whenLabel: string) => void;
}) {
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [slotsByDate, setSlotsByDate] = useState<Record<string, string[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "America/New_York";
    }
  });
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Her balance, refreshable without losing the day and time she has picked.
     Seeded from the server payload and replaced only by an explicit re-check,
     so a stale prop can never overwrite what she just topped up. */
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [liveAmounts, setLiveAmounts] = useState<WalletAmounts | null>(null);
  const [checking, setChecking] = useState(false);
  const free = price <= 0 || freeSessions > 0;
  /* A paid mentor call records an invoice row, so the address step has its
     say first. A free or included call, and a kickoff call, record none (D14). */
  const recordsInvoice = mode.kind === "call" && !free;
  /* The pilot terms box goes with the invoice: only on a paid mentor call. */
  const termsOn = recordsInvoice && purchaseConfirmation;
  const terms = useTermsGate(termsOn);
  const resetTerms = terms.reset;
  const addressGate = useBusinessAddressGate(locationId);
  const cancelAddress = addressGate.cancel;

  /* The kept booking holds the slot of the moment she pressed confirm. If she
     closes the sheet or picks another time, the address step closes too, so a
     later confirm books what the screen shows. */
  useEffect(() => {
    cancelAddress();
  }, [open, pickedSlot, cancelAddress]);

  // The member's own timezone from her GHL contact, when we hold one.
  useEffect(() => {
    if (!open) return;
    fetch(`/api/portal/${locationId}/contact-timezone`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.timezone === "string" && d.timezone) setTimezone(d.timezone);
      })
      .catch(() => null);
  }, [open, locationId]);

  /** Re-read the wallet after she has topped it up in the other tab. */
  const recheckBalance = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/portal/${locationId}/wallet-balance`);
      const data = (await res.json().catch(() => null)) as { balance?: number } | null;
      if (typeof data?.balance === "number") setLiveBalance(data.balance);
      setLiveAmounts((prev) => walletAmountsFrom(data) ?? prev);
    } catch {
      /* display only — the booking route re-checks the balance server-side */
    } finally {
      setChecking(false);
    }
  }, [locationId]);

  /** One month's free times. Throws on failure — the caller decides. */
  const fetchMonth = useCallback(
    async (m: Date): Promise<Record<string, string[]>> => {
      const startMs = Math.max(Date.now(), m.getTime());
      const endMs = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime();
      if (endMs <= startMs) return {};
      const qs = `startMs=${startMs}&endMs=${endMs}&timezone=${encodeURIComponent(timezone)}`;
      const url =
        mode.kind === "call"
          ? `/api/portal/${locationId}/booking-availability?stepId=${mode.stepId}&${qs}`
          : `/api/portal/${locationId}/delivery-availability?sectionId=${mode.sectionId}&${qs}`;
      const res = await fetch(url);
      const data = (await res.json().catch(() => ({}))) as {
        slots?: Record<string, string[]>;
        error?: string;
      };
      // A failed request is NOT an empty calendar. Conflating the two is how
      // "we could not reach GHL" came to read as "she has no free times".
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      return data.slots && typeof data.slots === "object" ? data.slots : {};
    },
    [locationId, mode, timezone],
  );

  const loadSlots = useCallback(() => {
    setLoadingSlots(true);
    setSlotsError(null);
    fetchMonth(month)
      .then(setSlotsByDate)
      .catch((err) => {
        setSlotsByDate({});
        setSlotsError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoadingSlots(false));
  }, [fetchMonth, month]);

  useEffect(() => {
    if (open) loadSlots();
  }, [open, loadSlots]);

  /**
   * Open on a month that actually has times.
   *
   * A calendar that books from tomorrow, keeps no weekend hours and is read in
   * a timezone hours ahead can legitimately have NOTHING in the calendar month
   * she opens — on 28 Aug the compliance calendar's first slot was 31 Aug
   * 12:45 New York, which is 1 Sep in Manila. The month then renders entirely
   * greyed out, which reads as "this calendar has no availability" when the
   * truth is "not in August". GHL's own widget lands on the first free day; so
   * does this now.
   *
   * Runs once per opening, and only when the current month came back empty —
   * her own month navigation is never overridden.
   */
  const advanced = useRef(false);
  useEffect(() => {
    if (!open) {
      advanced.current = false;
      return;
    }
    if (advanced.current || loadingSlots || slotsError) return;
    if (Object.keys(slotsByDate).length > 0) return;
    advanced.current = true;
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    let live = true;
    fetchMonth(next)
      .then((slots) => {
        if (!live || Object.keys(slots).length === 0) return;
        setSlotsByDate(slots);
        setMonth(next);
      })
      .catch(() => null); // the visible month already says what it knows
    return () => {
      live = false;
    };
  }, [open, loadingSlots, slotsError, slotsByDate, month, fetchMonth]);

  useEffect(() => {
    if (!open) {
      setPickedDay(null);
      setPickedSlot(null);
      setError(null);
      setSlotsError(null);
      resetTerms();
    }
  }, [open, resetTerms]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 1; i <= days; i++) out.push(new Date(month.getFullYear(), month.getMonth(), i));
    return out;
  }, [month]);

  const now = new Date();
  const atCurrentMonth =
    month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth();

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  /* A re-check after she tops up beats the prop she arrived with. */
  const balance = liveBalance ?? wallet?.balance ?? null;
  const amounts = liveAmounts ?? walletAmountsFrom(wallet);
  const canAfford = free || balance == null || balance >= price;
  const daySlots = pickedDay ? (slotsByDate[pickedDay] ?? []) : [];

  async function confirm() {
    if (!pickedSlot || disabled) return;
    if (!terms.allowsPay()) return;
    await purchaseThroughGate(addressGate, recordsInvoice, () => book(pickedSlot));
  }

  async function book(slot: string) {
    setBooking(true);
    setError(null);
    try {
      const start = new Date(slot);
      const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
      const body =
        mode.kind === "call"
          ? {
              stepId: mode.stepId,
              mentorId: null,
              startTime: slot,
              endTime: end.toISOString(),
              userToken: mode.userToken,
              ...termsRequestFields(termsOn, terms.ticked),
            }
          : {
              sectionId: mode.sectionId,
              serviceTitle: mode.serviceTitle,
              startTime: slot,
              endTime: end.toISOString(),
            };
      const res = await fetch(
        `/api/portal/${locationId}/${mode.kind === "call" ? "book-call" : "book-delivery"}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(checkoutErrorText(data?.error, res.status));
        return;
      }
      onBooked?.(
        `${longDate(start)} at ${start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone })}`,
      );
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBooking(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="ui-modal-overlay" onClick={() => onOpenChange(false)} />
      <div className="ui-modal-content ui-modal-content--lg mbook" role="dialog" aria-modal="true" aria-label={title}>
        <header className="ui-modal-header">
          <div className="ui-modal-header__text">
            <h2 className="ui-modal-title">{title}</h2>
            <p className="ui-modal-description">{callName}</p>
          </div>
          <button type="button" className="ui-modal-close" aria-label="Close" onClick={() => onOpenChange(false)}>
            <X size={16} aria-hidden />
          </button>
        </header>
        <div className="ui-modal-body">
          <div className="mbook__who">
            {avatar ?? <Avatar name={whoName} size={40} />}
            <div>
              <div className="mbook__who-name">Booking with {whoName}</div>
              <div className="mbook__who-role">{whoRole}</div>
            </div>
          </div>

          <h3 className="mbook__h">Pick a day and a time</h3>

          <div className="mbook__cols">
            <div className="mbook__cal">
              <div className="mbook__cal-head">
                <button
                  type="button"
                  className="mbook__nav"
                  onClick={() => {
                    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
                    setPickedDay(null);
                    setPickedSlot(null);
                  }}
                  disabled={atCurrentMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} aria-hidden />
                </button>
                <div className="mbook__month" aria-live="polite">
                  {MONTHS[month.getMonth()]} {month.getFullYear()}
                </div>
                <button
                  type="button"
                  className="mbook__nav"
                  onClick={() => {
                    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
                    setPickedDay(null);
                    setPickedSlot(null);
                  }}
                  aria-label="Next month"
                >
                  <ChevronRight size={16} aria-hidden />
                </button>
              </div>

              <div className="mbook__dow" aria-hidden>
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="mbook__grid" role="grid" aria-label="Available days">
                {cells.map((d, i) => {
                  if (d === null) return <span key={`b${i}`} />;
                  const key = dayKey(d);
                  const has = (slotsByDate[key]?.length ?? 0) > 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="gridcell"
                      className={`mbook__day${has ? " is-open" : ""}${pickedDay === key ? " is-picked" : ""}`}
                      disabled={!has}
                      aria-label={has ? longDate(d) : `${longDate(d)} — not available`}
                      onClick={() => {
                        setPickedDay(key);
                        setPickedSlot(null);
                      }}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mbook__times">
              {pickedDay ? (
                <>
                  <div className="mbook__times-head">{longDate(new Date(`${pickedDay}T12:00:00`))}</div>
                  <div className="mbook__slots">
                    {daySlots.map((iso) => (
                      <button
                        key={iso}
                        type="button"
                        className={`mbook__slot${pickedSlot === iso ? " is-picked" : ""}`}
                        aria-pressed={pickedSlot === iso}
                        onClick={() => setPickedSlot(iso)}
                      >
                        {new Date(iso).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: timezone,
                        })}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mbook__hint">
                  {loadingSlots ? (
                    "Checking which days are free…"
                  ) : slotsError ? (
                    <>
                      {/* An error is an error. Saying "no times are free" here
                          would blame her calendar for our failed request. */}
                      Could not load the free times.{" "}
                      <button type="button" className="mbook__retry" onClick={loadSlots}>
                        Try again
                      </button>
                    </>
                  ) : Object.keys(slotsByDate).length === 0 ? (
                    "No times are free this month. Try the next one."
                  ) : (
                    "Pick a day to see the times that are free."
                  )}
                </p>
              )}
            </div>
          </div>

          <p className="mbook__tz-note">Times are shown in {timezone.replace(/_/g, " ")}.</p>
        </div>

        <footer className="ui-modal-footer mbook__foot">
          <div className="mbook__price">
            {price <= 0 ? (
              <span>This call is included with what you bought.</span>
            ) : freeSessions > 0 ? (
              <span>
                Covered by a free session — you have <strong>{freeSessions}</strong> left.
              </span>
            ) : (
              <>
                <span>
                  This call costs <strong>{formatUSD(price)}</strong>
                </span>
                {amounts != null && (
                  <span className="mbook__wallet">
                    {WALLET_BALANCE_LABEL}: <strong>{formatUSD(amounts.paidBalance)}</strong>
                  </span>
                )}
                <PromotionalCreditLine amounts={amounts} format={formatUSD} className="mbook__wallet" />
                <PurchaseBreakdownLine
                  breakdown={purchaseBreakdown(price, amounts)}
                  format={formatUSD}
                  className="mbook__wallet"
                />
                {!canAfford && (
                  <span className="mbook__short">
                    You need {formatUSD(price - (balance ?? 0))} more before you can book.
                    Nothing is charged yet.
                  </span>
                )}
              </>
            )}
            {error && <span className="mbook__short">{error}</span>}
            {disabled && <span className="mbook__short">Test state — booking is off.</span>}
            {termsOn && (
              <TermsConsent {...terms.box} disabled={booking || addressGate.asking} />
            )}
          </div>
          {/* Short on funds is not a dead end. This button used to say "Add
              money to your wallet" and be DISABLED — it named the way out and
              then refused to take it. There is no in-app card charge (money
              is added on the GHL billing page, and no API here can charge a
              card), so the honest version is the one v1/v2 ships: hand her
              the wallet in a NEW TAB, so the day and time she picked survive,
              and let her re-check the balance when she comes back. */}
          {/* The address form is its own <form>: it replaces the button. */}
          <AddressStep gate={addressGate} classes={RM3_ADDRESS_FORM_CLASSES}>
            {!canAfford && pickedDay && pickedSlot ? (
              <div className="mbook__topup">
                <a
                  className="rm2-btn rm2-btn--green mbook__cta"
                  href={`https://app.govpreneurs.com/v2/location/${locationId}/settings/company-billing/billing?tab=wallet_transactions`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Add money to your wallet <ArrowRight size={14} aria-hidden />
                </a>
                <button
                  type="button"
                  className="rm2-btn rm2-btn--blue-outline"
                  onClick={() => void recheckBalance()}
                  disabled={checking}
                >
                  {checking ? "Checking…" : "I added money — check again"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="rm2-btn rm2-btn--green mbook__cta"
                disabled={
                  !pickedDay || !pickedSlot || !canAfford || booking || disabled || terms.payDisabled
                }
                onClick={confirm}
              >
                {booking
                  ? "Booking…"
                  : !pickedDay
                    ? "Pick a day"
                    : !pickedSlot
                      ? "Pick a time"
                      : "Confirm this booking"}
              </button>
            )}
          </AddressStep>
        </footer>
      </div>
    </>
  );
}
