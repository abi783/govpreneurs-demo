"use client";

// Every date the member reads on her roadmap, rendered in HER timezone.
//
// `toLocaleDateString` with no zone uses the READER's, which is only the same
// person by coincidence. A call held at 19:00 UTC on 12 August reads "13
// August" to anyone at UTC+5 or further east, while the appointment card —
// which has always formatted in the member's own zone — still says the 12th.
// Two screens, one call, two dates.
//
// A context rather than a prop because the dates are nine call sites deep in
// four components, and a prop threaded through all of them is a prop somebody
// forgets on the tenth.

import { createContext, useCallback, useContext } from "react";
import { fullDate } from "./detailContent";

const MemberTimeZoneContext = createContext<string | undefined>(undefined);

/** Wraps the roadmap. `timeZone` is V3Payload.timeZone — null is fine. */
export function MemberTimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone: string | null;
  children: React.ReactNode;
}) {
  return (
    <MemberTimeZoneContext.Provider value={timeZone ?? undefined}>
      {children}
    </MemberTimeZoneContext.Provider>
  );
}

/**
 * `fullDate`, bound to the member's zone. Use this everywhere on the roadmap
 * instead of importing `fullDate` directly.
 *
 * Falls back to the reader's zone when GHL has no timezone for her, which is
 * what every date on this page did before.
 */
export function useMemberDate(): (iso: string) => string {
  const tz = useContext(MemberTimeZoneContext);
  return useCallback((iso: string) => fullDate(iso, tz), [tz]);
}
