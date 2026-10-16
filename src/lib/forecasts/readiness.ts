// Which Get ready steps a member has marked done, per forecast. In memory, like
// tracking (src/lib/trackedForecasts.ts): the prototype has no backend, and a
// finished step must survive moving between the list and the page in one session.

import { useEffect, useState } from "react";
import { bus } from "../eventBus";

export const STEPS_CHANGED_EVENT = "forecast-steps-changed";

let done: Record<string, Record<string, true>> = {};

export function doneSteps(forecastId: string): ReadonlySet<string> {
  return new Set(Object.keys(done[forecastId] ?? {}));
}

export function toggleStep(forecastId: string, stepId: string): boolean {
  const steps = { ...(done[forecastId] ?? {}) };
  const nowDone = !steps[stepId];
  if (nowDone) steps[stepId] = true;
  else delete steps[stepId];
  done = { ...done, [forecastId]: steps };
  bus.publish("forecastSteps");
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STEPS_CHANGED_EVENT));
  return nowDone;
}

/** The done steps for one forecast, re-read whenever any step changes. */
export function useDoneSteps(forecastId: string): ReadonlySet<string> {
  const [steps, setSteps] = useState<ReadonlySet<string>>(() => doneSteps(forecastId));
  useEffect(() => {
    setSteps(doneSteps(forecastId));
    const onChange = () => setSteps(doneSteps(forecastId));
    window.addEventListener(STEPS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(STEPS_CHANGED_EVENT, onChange);
  }, [forecastId]);
  return steps;
}

export function resetForecastSteps(): void {
  done = {};
  bus.publish("forecastSteps");
}
