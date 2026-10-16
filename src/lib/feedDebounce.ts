// The waits before a list asks the server again after a change. The opportunities
// feed (routes/index.tsx) and the forecast list (lib/forecasts/useForecastList.ts)
// read the same pair, so the two lists answer a change at the same speed.

/** The wait after a change to the search words, in milliseconds. */
export const SEARCH_DEBOUNCE_MS = 250;
/** The wait after any other change, so a run of clicks asks once. */
export const FACET_DEBOUNCE_MS = 120;
