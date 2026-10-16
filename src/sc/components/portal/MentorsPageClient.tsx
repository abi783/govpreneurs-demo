"use client";

import { useEffect, useState } from "react";
import { BookMentorModal } from "./BookMentorModal";
import { PortalAuthGate } from "./PortalAuthGate";
import { PromotionalCreditLine } from "./WalletAmountLines";
import type { WalletAmounts } from "@sc/lib/billing/walletDisplay";
import { WALLET_BALANCE_LABEL } from "@sc/lib/walletCopy";

interface Mentor {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  consultationPrice: string | null;
  consultationDescription: string | null;
  formEnabled?: boolean;
  formDescription?: string | null;
  comingSoon?: boolean;
}

interface Props {
  mentors: Mentor[];
  saasPlanName: string | null;
  /** Both pools added: the booking modal checks the price against it. */
  walletBalance: number | null;
  /** The paid balance and the promotional credit, shown apart in the header. */
  walletAmounts: WalletAmounts | null;
  walletCurrency: string;
  locationId: string;
  hasContact: boolean;
  iframeOnlyAccess?: boolean;
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

export function MentorsPageClient({
  mentors,
  saasPlanName,
  walletBalance,
  walletAmounts,
  walletCurrency,
  locationId,
  hasContact,
  iframeOnlyAccess = true,
}: Props) {
  const [optimisticBalance, setOptimisticBalance] = useState<number | null>(walletBalance);
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);

  // Token relay — same pattern as RoadmapPageClient
  const [userToken, setUserToken] = useState<string | null>(null);
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

  useEffect(() => {
    setOptimisticBalance(walletBalance);
  }, [walletBalance]);

  return (
    <PortalAuthGate iframeOnly={iframeOnlyAccess}>
    <div className="space-y-5">
      {/* Header — mirrors RoadmapPageClient */}
      <div className="pb-4 border-b border-gray-200 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold text-gray-900 tracking-tight">Mentors</h1>
          <p className="text-sm text-gray-500 mt-1">Book a consultation call with a GovPreneurs expert.</p>
        </div>
        <div className="flex-shrink-0 text-right">
          {saasPlanName && <p className="text-xs font-semibold text-gray-500">{saasPlanName}</p>}
          <p className="text-sm font-bold text-gray-700 mt-0.5">
            {WALLET_BALANCE_LABEL}:{" "}
            <span className="text-gray-900">
              {walletAmounts === null ? "—" : formatMoney(walletAmounts.paidBalance, walletCurrency)}
            </span>
          </p>
          <PromotionalCreditLine
            amounts={walletAmounts}
            format={(n) => formatMoney(n, walletCurrency)}
            className="text-xs text-gray-500 mt-0.5"
          />
        </div>
      </div>

      {!hasContact && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm" style={{ borderRadius: 10 }}>
          Your account isn&apos;t linked to a GoCSM contact yet — please contact support before booking.
        </div>
      )}

      {mentors.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No mentors available for booking right now. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mentors.map((m) => {
            const price = parsePrice(m.consultationPrice);
            return (
              <div
                key={m.id}
                className="bg-white border border-gray-200 p-6 flex flex-col gap-3"
                style={{ borderRadius: 10 }}
              >
                <div className="flex items-center gap-3">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatarUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#1e3a8a" }}>
                      {initials(m.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-extrabold text-gray-900 truncate">{m.name}</p>
                    {/* DEMO: was `truncate`. A mentor title can be long, so it wraps to two lines. */}
                    {m.title && <p className="text-xs text-gray-500 line-clamp-2">{m.title}</p>}
                  </div>
                  {m.comingSoon ? (
                    <span
                      className="text-[0.68rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ background: "#f3f4f6", color: "#6b7280" }}
                    >
                      Coming Soon
                    </span>
                  ) : (
                    <span
                      className="text-sm font-extrabold px-2 py-0.5 rounded-full"
                      style={{ background: "#dbeafe", color: "#1d4ed8" }}
                    >
                      {formatMoney(price, walletCurrency)}
                    </span>
                  )}
                </div>

                {(m.bio || m.consultationDescription) && (
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {m.consultationDescription || m.bio}
                  </p>
                )}

                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  {m.email && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span className="truncate">{m.email}</span>
                    </span>
                  )}
                  {m.phone && (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      <span>{m.phone}</span>
                    </span>
                  )}
                </div>

                {m.comingSoon ? (
                  <button
                    disabled
                    className="mt-auto px-4 py-2.5 text-sm font-bold cursor-not-allowed"
                    style={{ borderRadius: 8, background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb" }}
                  >
                    Coming Soon
                  </button>
                ) : (
                  <button
                    onClick={() => setBookingMentor(m)}
                    disabled={!hasContact}
                    className="mt-auto px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
                    style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}
                  >
                    Book a call
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {bookingMentor && (
        <BookMentorModal
          mentor={bookingMentor}
          locationId={locationId}
          walletCurrency={walletCurrency}
          optimisticBalance={optimisticBalance}
          onBalanceChange={setOptimisticBalance}
          userToken={userToken}
          onClose={() => setBookingMentor(null)}
        />
      )}
    </div>
    </PortalAuthGate>
  );
}
