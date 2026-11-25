// The member's profile as the Partners and Awards pages read it. Built from the real business
// profile (My Business), so "near me" and the profile gate follow what the member saved there.
import { useBusinessProfile } from "./businessProfile";

export type MemberProfile = {
  /** NAICS codes from My Business. Empty means no trade on file. */
  trades: string[];
  /** The states the member works in. Empty means she works anywhere. */
  cities: { city?: string; state: string }[];
  serviceArea: string;
};

export function useMemberState(): { profile: MemberProfile; loading: boolean } {
  const { profile, loading } = useBusinessProfile();
  return {
    loading,
    profile: {
      trades: profile?.naicsCodes ?? [],
      cities: (profile?.stateCodes ?? []).map((state) => ({ state })),
      serviceArea: "",
    },
  };
}
