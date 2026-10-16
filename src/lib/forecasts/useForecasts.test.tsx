// @vitest-environment jsdom
// The forecast page's data (useForecast): a row the list already loaded draws the
// page at once with no list request; a page opened directly reads GET /forecasts/:oppKey.

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ForecastNotFoundError,
  fetchForecast,
  fetchForecastList,
  type ForecastMemberDto,
  type ForecastRecordDto,
} from "../forecastsApi";
import { HIGHERGOV_FORECASTS } from "./__fixtures__/forecastRecords";
import { rememberForecasts, resetLoadedForecasts } from "./loadedForecasts";
import { useForecast } from "./useForecasts";

vi.mock("../forecastsApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("../forecastsApi")>();
  return {
    ...real,
    fetchForecast: vi.fn(),
    fetchForecastList: vi.fn(),
  };
});
const oneMock = vi.mocked(fetchForecast);
const pageMock = vi.mocked(fetchForecastList);

const BASE = HIGHERGOV_FORECASTS[0];
const MEMBER: ForecastMemberDto = {
  naics: [],
  states: [],
  certs: [],
  certsKnown: false,
  isSmall: null,
  registration: { status: "not_registered", endsOn: null },
  biggestPastJob: null,
  smallestTarget: null,
  businessName: null,
  address: null,
};

function record(id: string, title: string): ForecastRecordDto {
  return {
    ...BASE,
    id,
    oppKey: id,
    hunter: { plainTitle: title, semanticFit: null, categoryFit: null },
  };
}

/** A promise that never settles: the single read is still in flight. */
const pending = <T,>() => new Promise<T>(() => {});

beforeEach(() => {
  resetLoadedForecasts();
  oneMock.mockReset();
  pageMock.mockReset();
});

afterEach(() => resetLoadedForecasts());

describe("useForecast", () => {
  it("draws from a row the list loaded, with no list request", async () => {
    rememberForecasts(MEMBER, [record("fc-1", "Loaded from the list")]);
    oneMock.mockReturnValue(pending());

    const { result } = renderHook(() => useForecast("fc-1"));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.forecast?.facts.title).toBe("Loaded from the list");
    expect(result.current.member).toEqual(MEMBER);
    expect(pageMock).not.toHaveBeenCalled();
  });

  it("replaces the loaded row with the single record when it arrives", async () => {
    rememberForecasts(MEMBER, [record("fc-1", "Loaded from the list")]);
    oneMock.mockResolvedValue({ member: MEMBER, forecast: record("fc-1", "With its files") });

    const { result } = renderHook(() => useForecast("fc-1"));

    await waitFor(() => expect(result.current.forecast?.facts.title).toBe("With its files"));
  });

  it("reads GET /forecasts/:oppKey when the page is opened directly", async () => {
    oneMock.mockResolvedValue({ member: MEMBER, forecast: record("fc-2", "Opened directly") });

    const { result } = renderHook(() => useForecast("fc-2"));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.forecast?.facts.title).toBe("Opened directly");
    expect(oneMock).toHaveBeenCalledWith("fc-2");
    expect(pageMock).not.toHaveBeenCalled();
  });

  it("says not found when the forecast does not exist and no row is loaded", async () => {
    oneMock.mockRejectedValue(new ForecastNotFoundError());
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useForecast("fc-gone"));

    await waitFor(() => expect(result.current.status).toBe("not_found"));
  });

  it("keeps the loaded row on screen when the single read fails", async () => {
    rememberForecasts(MEMBER, [record("fc-1", "Loaded from the list")]);
    oneMock.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useForecast("fc-1"));

    await waitFor(() => expect(oneMock).toHaveBeenCalled());
    await Promise.resolve();
    expect(result.current.status).toBe("ready");
    expect(result.current.forecast?.facts.title).toBe("Loaded from the list");
  });
});
