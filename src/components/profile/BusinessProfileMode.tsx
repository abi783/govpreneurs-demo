import { createContext, useContext } from "react";

export type ProfileMode = "default" | "onboarding";

export const BusinessProfileModeContext = createContext<ProfileMode>("default");

export function useProfileMode(): ProfileMode {
  return useContext(BusinessProfileModeContext);
}
