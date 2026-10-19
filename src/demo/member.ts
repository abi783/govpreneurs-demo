// DEMO: which sample member the demo is about.
//
// The demo tells one story per member: Lantern Row Creative (a marketing agency,
// the Level Up story, and the default), Haddad Catering (a caterer), and one
// member per niche. The choice is made once, when the page loads, so every story
// module reads one member for the whole page view. Changing it wipes the demo
// and reloads.
//
//   ?member=caterer on any URL       switches and remembers it
//   presenter panel (Shift+Alt+P)    "Member" switch
//   unit tests                       DEMO_MEMBER=<id> (default caterer)
//   QA builds                        QA_MEMBER=<id> → VITE_DEMO_MEMBER (default caterer)
//
// MEMBER PACKS. Every member except the caterer keeps its whole story in
// src/demo/members/<id>/, with the same files and export names as the agency's
// (pack.test.ts checks). Shared code reads the member on stage's copy of a file
// with `own(import.meta.glob(...))`, one literal glob per file, so the import
// graph is the one a static import would make. The caterer's story is inline in
// the shared code, where it began; `byMember({ caterer, pack })` picks hers or
// the pack's. A new member is a folder plus one line in MEMBERS (and one in
// story/opportunities.ts, which the QA specs load outside Vite).

/** Members whose story is a pack folder. */
export type PackMemberId = "agency" | "construction" | "consulting" | "it" | "trucking";
export type MemberId = "caterer" | PackMemberId;

export const MEMBERS: { id: MemberId; label: string; short: string }[] = [
  { id: "agency", label: "Lantern Row Creative · ad agency", short: "Ad agency" },
  { id: "caterer", label: "Haddad Catering · caterer", short: "Caterer" },
  { id: "construction", label: "Ninebark Builders · contractor", short: "Contractor" },
  { id: "consulting", label: "Coppervale Advisory Group · consulting", short: "Consulting" },
  { id: "it", label: "Gallberry Technology Group · IT services", short: "IT services" },
  { id: "trucking", label: "Rockfish Run Freight · trucking", short: "Trucking" },
];

/** Outside the `gp-demo:v1:` store, so "Reset demo" keeps the member. */
export const MEMBER_KEY = "gp-demo:member";

function isMember(v: unknown): v is MemberId {
  return MEMBERS.some((m) => m.id === v);
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

/** Pick the caterer's value, or the pack's while any other member is on stage. */
export function byMember<T>(values: { caterer: T; pack: T }): T {
  return MEMBER === "caterer" ? values.caterer : values.pack;
}

function inFolder<M>(mods: Record<string, M>, id: string): M | undefined {
  return Object.entries(mods).find(([path]) => path.includes(`/members/${id}/`))?.[1];
}

/**
 * The member on stage's copy of one pack file, from
 * `import.meta.glob("/src/demo/members/<*>/<file>", { eager: true })`.
 * The caterer has few pack files; for the rest she reads the agency's, which
 * `byMember` then passes over for her own value.
 */
export function own<M>(mods: Record<string, M>): M {
  const mod =
    inFolder(mods, MEMBER) ?? (MEMBER === "caterer" ? inFolder(mods, "agency") : undefined);
  if (!mod)
    throw new Error(
      `Member "${MEMBER}" has no ${Object.keys(mods)[0]?.replace(/.*\/members\/[^/]+\//, "") ?? "file"}`,
    );
  return mod;
}

/** Every other member's copy of one file: lookups that open another member's record by its number. */
export function others<M>(mods: Record<string, M>): M[] {
  return Object.entries(mods)
    .filter(([path]) => !path.includes(`/members/${MEMBER}/`))
    .map(([, mod]) => mod);
}
