// Onboarding flags — in-memory, reset on reload.
import { bus } from "./eventBus";

export const MET_HUNTER_KEY = "met_hunter";
export const AI_TEAM_UNLOCKED_KEY = "ai_team_unlocked";
export const READINESS_OVERRIDE_KEY = "readiness_override";
/** Grant introduces himself again on a forecast, because what he cannot know
 *  differs: a forecast is a plan, not a notice. */
export const MET_GRANT_FORECAST_KEY = "met_grant_forecast";

let flags: Record<string, boolean> = {};

export function readFlag(key: string): boolean {
  return !!flags[key];
}

export function writeFlag(key: string, value: boolean) {
  if (value) flags[key] = true;
  else delete flags[key];
  bus.publish("onboarding");
}

export function clearOnboarding() {
  flags = {};
  bus.publish("onboarding");
}

export function hasDemoResetParam(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("demo") === "preview";
  } catch {
    return false;
  }
}
