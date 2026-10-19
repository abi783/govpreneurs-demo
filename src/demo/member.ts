// DEMO: which sample member the demo is about.
//
// The demo can tell two stories: Lantern Row Creative (a marketing agency, the
// Level Up story, and the default) and Haddad Catering (a caterer). The choice is
// made once, when the page loads, so every story module reads one member for
// the whole page view. Changing it wipes the demo and reloads.
//
//   ?member=caterer on any URL       switches and remembers it
//   presenter panel (Shift+Alt+P)    "Member" switch
//   unit tests                       DEMO_MEMBER=agency|caterer (default caterer)
//   QA builds                        QA_MEMBER=agency|caterer → VITE_DEMO_MEMBER (default caterer)

export type MemberId = "agency" | "caterer";

export const MEMBERS: { id: MemberId; label: string }[] = [
  { id: "agency", label: "Lantern Row Creative · ad agency" },
  { id: "caterer", label: "Haddad Catering · caterer" },
];

/** Outside the `gp-demo:v1:` store, so "Reset demo" keeps the member. */
export const MEMBER_KEY = "gp-demo:member";

function isMember(v: unknown): v is MemberId {
  return v === "agency" || v === "caterer";
}

function resolveMember(): MemberId {
  if (typeof window !== "undefined") {
    try {
      const asked = new URLSearchParams(window.location.search).get("member");
      if (isMember(asked)) {
        window.sessionStorage.setItem(MEMBER_KEY, asked);
        return asked;
      }
      const kept = window.sessionStorage.getItem(MEMBER_KEY);
      if (isMember(kept)) return kept;
    } catch {
      /* storage blocked: fall through */
    }
  }
  const env = typeof process !== "undefined" ? process.env?.DEMO_MEMBER : undefined;
  if (isMember(env)) return env;
  // A build can pin its default (the QA runs build once per member).
  const built = import.meta.env?.VITE_DEMO_MEMBER;
  if (isMember(built)) return built;
  // Unit tests run the caterer story unless told otherwise; the app opens on the agency.
  return typeof process !== "undefined" && process.env?.VITEST ? "caterer" : "agency";
}

export const MEMBER: MemberId = resolveMember();

/** Pick the active member's value. */
export function byMember<T>(values: Record<MemberId, T>): T {
  return values[MEMBER];
}
