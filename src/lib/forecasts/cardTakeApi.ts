// The forecast list card's AI take: the client for `POST /forecasts/takes`.
// The backend half is `backend/src/forecast-grant/forecast-card-take.*.ts`.
//
// Identity is the signed-in session, resolved on the server, so only the keys are
// sent. A key with no line is absent from the answer: the card keeps its rule-built
// line. A failed call rejects; the caller retries that window later.

import { API_BASE_URL, apiFetch, buildApiError } from "../api";

/** The most keys one call may carry. Equal to the backend's `FORECAST_CARD_TAKE_MAX_KEYS`. */
export const FORECAST_CARD_TAKE_MAX_KEYS = 50;

/** The longest line the server returns. Equal to the backend's `FORECAST_CARD_TAKE_LINE_MAX`. */
export const FORECAST_CARD_TAKE_LINE_MAX = 240;

/** One line on the wire. */
export interface ForecastCardTake {
  oppKey: string;
  line: string;
}

/** `POST /forecasts/takes`, status 200. */
export interface ForecastCardTakesResponse {
  takes: ForecastCardTake[];
}

/** A take the card may show: a key it asked for and a non-empty line within the cap. */
function usable(t: unknown, asked: ReadonlySet<string>): t is ForecastCardTake {
  const take = t as Partial<ForecastCardTake> | null;
  return (
    typeof take?.oppKey === "string" &&
    asked.has(take.oppKey) &&
    typeof take.line === "string" &&
    take.line.trim() !== "" &&
    take.line.length <= FORECAST_CARD_TAKE_LINE_MAX
  );
}

/**
 * One AI take per forecast among `oppKeys`, as a map of key → line. Sends at most
 * `FORECAST_CARD_TAKE_MAX_KEYS` keys. Rejects on a failed call.
 */
export async function fetchForecastTakes(oppKeys: string[]): Promise<Map<string, string>> {
  const ids = oppKeys.slice(0, FORECAST_CARD_TAKE_MAX_KEYS);
  if (ids.length === 0) return new Map();

  const res = await apiFetch(`${API_BASE_URL}/forecasts/takes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oppKeys: ids }),
  });
  if (!res.ok) return buildApiError(res, "Failed to fetch forecast takes");
  const body = (await res.json()) as Partial<ForecastCardTakesResponse> | null;
  const asked = new Set(ids);
  const takes = Array.isArray(body?.takes) ? body.takes : [];
  return new Map(takes.filter((t) => usable(t, asked)).map((t) => [t.oppKey, t.line.trim()]));
}
