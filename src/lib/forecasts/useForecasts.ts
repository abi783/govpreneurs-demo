// The forecast page's data, read by the engine. The list reads its pages through
// `useForecastList`. `useForecast` draws a forecast page from a row this session
// already loaded (loadedForecasts.ts), then reads the single record for its files.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ForecastNotFoundError,
  fetchForecast,
  type ForecastMemberDto,
  type ForecastRecordDto,
} from "../forecastsApi";
import type { ScoredForecast } from "./engine";
import { firmFromMember, scoreLive } from "./live";
import { loadedForecast, type LoadedForecast } from "./loadedForecasts";

type Load<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not_found" }
  | { status: "ready"; data: T };

function scoreOne(member: ForecastMemberDto, record: ForecastRecordDto): ScoredForecast {
  return scoreLive(record, firmFromMember(member));
}

/** Logs the detail of a failed load; the page shows one fixed sentence. */
function logFailure(what: string, err: unknown): void {
  console.error(`[forecasts] ${what} failed`, err);
}

/** One live forecast, read for the member. */
export function useForecast(id: string): {
  status: "loading" | "error" | "not_found" | "ready";
  forecast: ScoredForecast | null;
  member: ForecastMemberDto | null;
  retry: () => void;
} {
  const [load, setLoad] = useState<Load<LoadedForecast>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // A row the list already loaded draws the page at once. The single record
    // follows, because only it carries the forecast's files.
    const hit = loadedForecast(id);
    setLoad(hit ? { status: "ready", data: hit } : { status: "loading" });
    fetchForecast(id)
      .then((r) => {
        if (!cancelled)
          setLoad({ status: "ready", data: { member: r.member, record: r.forecast } });
      })
      .catch((err: unknown) => {
        logFailure("forecast", err);
        // With the loaded row on screen, a failed single read only costs the files.
        if (cancelled || hit) return;
        setLoad({ status: err instanceof ForecastNotFoundError ? "not_found" : "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const ready = load.status === "ready" ? load.data : null;
  const forecast = useMemo(() => (ready ? scoreOne(ready.member, ready.record) : null), [ready]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { status: load.status, forecast, member: ready?.member ?? null, retry };
}
