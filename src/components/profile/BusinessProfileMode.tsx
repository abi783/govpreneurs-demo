import { createContext, useContext } from "react";

export type ProfileMode = "default" | "onboarding";

export const BusinessProfileModeContext = createContext<ProfileMode>("default");

export function useProfileMode(): ProfileMode {
  return useContext(BusinessProfileModeContext);
}

// DEMO: the "Edit mode" switch in the page header. When it is off, the page is a
// read-only view: values show, and the edit buttons are hidden.
export const EditModeContext = createContext<boolean>(true);

export function useEditMode(): boolean {
  return useContext(EditModeContext);
}
