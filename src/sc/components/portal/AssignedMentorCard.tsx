"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@sc/components/ui/Card";
import { BookMentorModal } from "./BookMentorModal";
import { SelectMentorModal } from "./SelectMentorModal";
import { MentorPhoto } from "./MentorPhoto";
import {
  SUMMIT_LOCK_CREDIT_NOTE,
  SUMMIT_LOCK_UPGRADE,
  SUMMIT_MENTOR_LOCK_BODY,
  SUMMIT_MENTOR_LOCK_TITLE,
} from "@sc/lib/walletCopy";

interface Props {
  locationId: string;
  mentor: {
    id: string;
    name: string;
    title: string | null;
    avatarUrl: string | null;
    email: string | null;
    phone: string | null;
    bio: string | null;
    consultationPrice: string | null;
    formEnabled?: boolean;
    formDescription?: string | null;
    comingSoon?: boolean;
  } | null;
  freeRemaining: number;
  walletBalance: number | null;
  walletCurrency: string;
  hasContact: boolean;
  /** Summit attendee, not yet a member: no primary mentor. The card is
   *  locked in both branches (no picker, no booking); the Mentors page
   *  stays open to them. */
  summitLocked?: boolean;
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

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function AssignedMentorCard({ locationId, mentor, freeRemaining, walletBalance, walletCurrency, hasContact, summitLocked = false }: Props) {
  const router = useRouter();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [optimisticBalance, setOptimisticBalance] = useState<number | null>(walletBalance);
  const [userToken, setUserToken] = useState<string | null>(null);

  useEffect(() => { setOptimisticBalance(walletBalance); }, [walletBalance]);

  // Token relay — same pattern as MentorsPageClient
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.parent === window) return;
    const PARENT_ORIGIN = "https://app.govpreneurs.com";
    let pendingId: string | null = null;

    function requestToken() {
      pendingId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      window.parent.postMessage(
        { message: "REQUEST_AUTH_TOKEN", requestId: pendingId, forceRefresh: true },
        PARENT_ORIGIN
      );
    }
    function onMessage(ev: MessageEvent) {
      if (ev.origin !== PARENT_ORIGIN) return;
      const data = ev.data as { message?: string; requestId?: string; payload?: string; error?: string } | null;
      if (!data || data.message !== "REQUEST_AUTH_TOKEN_RESPONSE") return;
      if (pendingId && data.requestId !== pendingId) return;
      if (data.error || !data.payload) return;
      setUserToken(data.payload);
    }
    window.addEventListener("message", onMessage);
    requestToken();
    const iv = setInterval(requestToken, 25 * 60 * 1000);
    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(iv);
    };
  }, []);

  if (summitLocked) {
    const rechargeUrl = `https://app.govpreneurs.com/v2/location/${locationId}/settings/company-billing/billing?tab=wallet_transactions`;
    return (
      <Card className="p-5 flex flex-col gap-3 min-h-[120px]">
        <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
          <span className="block w-3 h-px bg-[var(--gold)] opacity-60" />
          Your Mentor
        </div>
        <div className="flex items-start gap-2.5">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div className="flex flex-col gap-1">
            <p className="text-[0.82rem] font-semibold text-white">{SUMMIT_MENTOR_LOCK_TITLE}</p>
            <p className="text-[0.7rem] text-[var(--text-muted)] leading-snug">
              {SUMMIT_LOCK_UPGRADE} {SUMMIT_LOCK_CREDIT_NOTE}
            </p>
          </div>
        </div>
        <a
          href={rechargeUrl}
          target="_top"
          rel="noopener"
          className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] text-white text-[0.8rem] font-bold"
          style={{ background: "var(--gold)" }}
        >
          Recharge Wallet
        </a>
        <a href={`/${locationId}/mentors`} className="text-center text-[0.72rem] font-semibold text-[var(--text-secondary)] hover:text-white">
          {SUMMIT_MENTOR_LOCK_BODY}
        </a>
      </Card>
    );
  }

  if (!mentor) {
    return (
      <>
        <Card className="p-5 flex flex-col gap-3 min-h-[120px]">
          <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="block w-3 h-px bg-[var(--gold)] opacity-60" />
            Your Mentor
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-[0.78rem] font-semibold text-white">
              Pick a mentor to unlock 1-on-1 guidance.
            </p>
            <p className="text-[0.68rem] text-[var(--text-muted)] leading-snug max-w-[220px]">
              Choose from our vetted advisors and start booking calls right away.
            </p>
            <button
              onClick={() => setSelectOpen(true)}
              className="mt-1 px-4 py-2 rounded-[var(--radius-sm)] text-[0.78rem] font-bold text-white transition-colors"
              style={{ background: "var(--gold)" }}
            >
              Select Mentor
            </button>
          </div>
        </Card>
        {selectOpen && (
          <SelectMentorModal
            locationId={locationId}
            onClose={() => setSelectOpen(false)}
            onAssigned={() => router.refresh()}
          />
        )}
      </>
    );
  }

  const price = parsePrice(mentor.consultationPrice);
  const isFree = freeRemaining > 0;

  return (
    <>
      <Card className="p-5 flex flex-col gap-3 min-h-[120px]">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="block w-3 h-px bg-[var(--green-text)] opacity-60" />
            Your Mentor
          </div>
          {isFree ? (
            <span
              className="text-[0.6rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(34,197,94,0.10)", color: "#22c55e" }}
            >
              {freeRemaining} free session{freeRemaining === 1 ? "" : "s"} left
            </span>
          ) : price > 0 ? (
            <span className="text-[0.6rem] font-semibold text-[var(--text-secondary)] flex-shrink-0">
              {formatMoney(price, walletCurrency)} / session
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <MentorPhoto
            src={mentor.avatarUrl}
            alt={mentor.name}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
            fallback={
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[0.85rem] font-bold flex-shrink-0" style={{ background: "#1e3a8a" }}>
                {initials(mentor.name)}
              </div>
            }
          />
          <div className="flex-1 min-w-0">
            <p className="text-[0.95rem] font-extrabold text-white truncate">{mentor.name}</p>
            {mentor.title && <p className="text-[0.75rem] text-[var(--text-muted)] truncate">{mentor.title}</p>}
          </div>
        </div>
        {mentor.bio && (
          <p className="text-[0.72rem] text-[var(--text-muted)] leading-snug line-clamp-3">{mentor.bio}</p>
        )}
        {(mentor.email || mentor.phone) && (
          <div className="flex flex-col gap-1">
            {mentor.email && (
              <a href={`mailto:${mentor.email}`} className="text-[0.78rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1.5 min-w-0">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="truncate">{mentor.email}</span>
              </a>
            )}
            {mentor.phone && (
              <a href={`tel:${mentor.phone}`} className="text-[0.78rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1.5 min-w-0">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span className="truncate">{mentor.phone}</span>
              </a>
            )}
          </div>
        )}
        {mentor.comingSoon ? (
          <button
            disabled
            className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-white/[0.06] border border-white/[0.1] text-[var(--text-muted)] text-[0.8rem] font-bold cursor-not-allowed"
          >
            Coming Soon
          </button>
        ) : (
          <button
            onClick={() => setBookingOpen(true)}
            disabled={!hasContact}
            className="mt-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-[var(--green-mid)] border border-[rgba(0,166,90,0.3)] text-white text-[0.8rem] font-bold hover:bg-[var(--green-bright)] transition-colors disabled:opacity-50"
          >
            Book a Call
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </Card>

      {bookingOpen && (
        <BookMentorModal
          mentor={{ id: mentor.id, name: mentor.name, consultationPrice: mentor.consultationPrice, formEnabled: mentor.formEnabled, formDescription: mentor.formDescription }}
          locationId={locationId}
          walletCurrency={walletCurrency}
          optimisticBalance={optimisticBalance}
          onBalanceChange={setOptimisticBalance}
          userToken={userToken}
          freeBooking={isFree}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </>
  );
}
