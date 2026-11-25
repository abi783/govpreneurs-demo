import type { MemberProfile } from "../memberState";

/** The states "near me" means. Empty means she works anywhere, so nothing is narrowed. */
export function serviceStates(profile: MemberProfile): string[] {
  if (profile.serviceArea === "national") return [];
  return [...new Set(profile.cities.map((c) => c.state))];
}
