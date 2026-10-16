// @vitest-environment jsdom
//
// Grant's first-visit card on a forecast: the tracking promise shows only while watching
// is on, and names where she sees a change (feature 12).
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { ForecastMeetGrant } from "./ForecastMeetGrant";
import { MEET } from "../../lib/forecasts/grantCopy";
import type { WatchCopyState } from "../../lib/forecasts/watch";
import { WATCH_PROMISE } from "../../lib/forecasts/watchCopy";

const PROMISE = /\bwatched\b|hear when|\btell you\b|get told|track it/i;

function boundsOf(watchState: WatchCopyState): string {
  const { container } = render(
    <ForecastMeetGrant title="Roof repair" watchState={watchState} onDismiss={() => undefined} />,
  );
  return container.querySelector(".meet__bounds")?.textContent ?? "";
}

afterEach(cleanup);

describe("ForecastMeetGrant", () => {
  it("ends the bounds before the tracking promise while watching is off", () => {
    const text = boundsOf("off");
    expect(text).toBe(MEET.bounds);
    expect(text).not.toMatch(PROMISE);
  });

  it("adds the in-app promise while watching is on, with no email", () => {
    const text = boundsOf("inApp");
    expect(text).toBe(`${MEET.bounds} ${WATCH_PROMISE.inApp.boundsPromise}`);
    expect(text).toMatch(/My Bids/);
    expect(text).not.toMatch(/e-?mail/i);
  });

  it("names email only in the email state", () => {
    expect(boundsOf("email")).toMatch(/email/);
  });
});
