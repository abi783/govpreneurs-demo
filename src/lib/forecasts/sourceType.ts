// Which HigherGov source types carry forecasts. A forecast is work a buyer plans:
// nothing is open for bids yet, its date is an expected date, and it opens on the
// forecast page (/forecasts/$forecastId), never on the opportunity page.

/** The two HigherGov source types that carry forecasts. */
export const FORECAST_SOURCES: readonly string[] = ["forecast", "sled_forecast"];

/** True when a record of this source type is a forecast. */
export function isForecastSource(sourceType: string | null | undefined): boolean {
  return sourceType != null && FORECAST_SOURCES.includes(sourceType);
}
