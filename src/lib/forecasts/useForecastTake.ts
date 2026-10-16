// Grant's take on one forecast, for the forecast page. Null while it loads, and null
// when it failed or was not found: the page then reads exactly as it does with no take.

import { useEffect, useState } from "react";
import { fetchForecastTake, type ForecastTakeResponse } from "./grantTakeApi";

/** The take for `oppKey`, or null until one is read. Fetched once per session. */
export function useForecastTake(oppKey: string): ForecastTakeResponse | null {
  const [held, setHeld] = useState<{ oppKey: string; take: ForecastTakeResponse | null } | null>(
    null,
  );
  useEffect(() => {
    let live = true;
    void fetchForecastTake(oppKey).then((result) => {
      if (live) setHeld({ oppKey, take: result.ok ? result.take : null });
    });
    return () => {
      live = false;
    };
  }, [oppKey]);
  return held?.oppKey === oppKey ? held.take : null;
}
