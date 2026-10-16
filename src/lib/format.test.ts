import { describe, it, expect } from "vitest";

import { formatDeadline } from "./format";

describe("formatDeadline", () => {
  it("reports a real deadline", () => {
    // `NOW` is fixed at 2026-05-07 so this does not drift with the clock.
    expect(formatDeadline("2026-05-17T12:00:00Z").text).toBe("Closes in 10 days");
  });

  // The same defect the card carried: `daysUntil` returns NaN for an empty or
  // unparseable date, EVERY comparison against NaN is false, and the value fell
  // through to the weeks branch — "Closes in NaN weeks".
  it.each(["", "not a date", "2026-13-45"])(
    "states the absence for %p instead of printing NaN",
    (iso) => {
      const { text, tone } = formatDeadline(iso);
      expect(text).toBe("No deadline on file");
      expect(text).not.toMatch(/NaN/);
      // No date, no urgency.
      expect(tone).toBe("normal");
    },
  );
});
