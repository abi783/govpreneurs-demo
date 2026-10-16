// DEMO: the Mentors page (menu item "Mentors", route /find-a-mentor).
//
// This is the production server page (sc-main `src/app/[locationId]/mentors/page.tsx`)
// as a client component. `MentorsPageClient` and `BookMentorModal` are production
// code. The page here does what the server did: it gives them the mentor list and
// the wallet. It adds two small blocks around them:
//   - a bar above the page when the member has a mentor call booked, so a new
//     booking shows at once;
//   - a block below the cards that links to Mentor Reviews (written feedback).

import { useEffect, useMemo, useReducer } from "react";
import Link from "next/link";
import { MentorsPageClient } from "@sc/components/portal/MentorsPageClient";
import { walletAmountsFrom } from "@sc/lib/billing/walletDisplay";
import { useDemoRefresh } from "@/demo/runtime/refresh";
import { subscribeDemoState } from "@/demo/runtime/store";
import { MENTOR_REVIEW_PRICE, getWalletBalance } from "@/demo/state/wallet";
import { PERSONA } from "@/demo/story/persona";
import { AddFundsHost } from "@/demo/sc/home/addFunds";
import { HOME_STATE_KEYS, appointmentsForHome, mentorIdFromCalendar } from "@/demo/sc/home/store";
import { formatSlot } from "@/demo/sc/home/time";
import { BENCH, getBenchMentor, toPortalMentor } from "./bench";

const MENTORS = BENCH.map(toPortalMentor);

function useMentorsData() {
  const tick = useDemoRefresh();
  const [version, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const offs = HOME_STATE_KEYS.map((key) => subscribeDemoState(key, bump));
    return () => offs.forEach((off) => off());
  }, []);

  return useMemo(() => {
    const balance = getWalletBalance();
    const now = Date.now();
    const sessions = appointmentsForHome()
      .all.filter((a) => {
        const active = !["cancelled", "canceled", "noshow", "no-show", "invalid"].includes((a.appointmentStatus ?? "").toLowerCase());
        return active && new Date(a.startTime).getTime() >= now && mentorIdFromCalendar(a.calendarId ?? "");
      })
      .map((a) => ({
        id: a.id,
        startTime: a.startTime,
        mentorName: getBenchMentor(mentorIdFromCalendar(a.calendarId ?? "") ?? "")?.name ?? "Your mentor",
      }));
    return {
      balance,
      amounts: walletAmountsFrom({ paidBalance: balance, promotionalCredit: 0 }),
      sessions,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, version]);
}

export function ScMentorsPage() {
  const { balance, amounts, sessions } = useMentorsData();

  return (
    <>
      <div className="w-full min-h-screen" style={{ background: "#f9fafb" }}>
        <div className="w-full px-6 lg:px-12 pt-8 pb-20">
          {sessions.length > 0 && (
            <div
              className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 px-5 py-3.5"
              style={{ borderRadius: 10, borderLeft: "4px solid #1d4ed8" }}
              data-testid="booked-sessions"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {sessions.length === 1 ? "You have 1 mentor call booked" : `You have ${sessions.length} mentor calls booked`}
                </p>
                <ul className="mt-0.5 text-xs text-gray-600">
                  {sessions.map((s) => (
                    <li key={s.id}>
                      {s.mentorName} · {formatSlot(s.startTime)}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/" className="text-sm font-bold" style={{ color: "#1d4ed8" }}>
                See it on your Success Center
              </Link>
            </div>
          )}

          <MentorsPageClient
            mentors={MENTORS}
            saasPlanName={PERSONA.plan}
            walletBalance={balance}
            walletAmounts={amounts}
            walletCurrency="USD"
            locationId={PERSONA.locationId}
            hasContact
            iframeOnlyAccess={false}
          />

          <div
            className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white border border-gray-200 px-6 py-5"
            style={{ borderRadius: 10 }}
          >
            <div className="min-w-0">
              <p className="text-base font-extrabold text-gray-900">Want written feedback instead of a call?</p>
              <p className="text-xs text-gray-600 mt-1 max-w-xl leading-relaxed">
                Send a bid to a mentor for review. The mentor reads it and writes back in Mentor Reviews. One review costs ${MENTOR_REVIEW_PRICE} from your wallet.
              </p>
            </div>
            <Link
              href="/mentors"
              className="px-4 py-2.5 text-sm font-bold"
              style={{ borderRadius: 8, background: "#ffffff", color: "#1d4ed8", border: "1px solid #1d4ed8" }}
            >
              Open Mentor Reviews
            </Link>
          </div>
        </div>
      </div>
      <AddFundsHost />
    </>
  );
}
