// The forecasts this session has already loaded, by id. The list writes each row it
// receives. The forecast page reads it first, so a card opens at once and needs no
// list request. The page then asks `GET /forecasts/:oppKey` for the files.

import type { ForecastMemberDto, ForecastRecordDto } from "../forecastsApi";

/** A loaded forecast, with the member's facts it was read with. */
export interface LoadedForecast {
  member: ForecastMemberDto;
  record: ForecastRecordDto;
}

const loaded = new Map<string, LoadedForecast>();

/** Keeps the records of one answer, so the forecast page can draw from them. */
export function rememberForecasts(
  member: ForecastMemberDto,
  records: readonly ForecastRecordDto[],
): void {
  for (const record of records) loaded.set(record.id, { member, record });
}

/** A forecast this session has loaded, or null. */
export function loadedForecast(id: string): LoadedForecast | null {
  return loaded.get(id) ?? null;
}

/** Clears the loaded forecasts. For tests. */
export function resetLoadedForecasts(): void {
  loaded.clear();
}
