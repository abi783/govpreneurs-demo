import { describe, expect, it } from "vitest";
import { interpretationChips } from "./interpretation";

describe("interpretationChips", () => {
  const i = {
    q: "cleaning",
    panel: { dollarMin: 7_500_000, dollarMax: 12_500_000, durationMinDays: 60, durationMaxDays: 120, hasSubs: true },
  };
  it("labels each part", () => {
    expect(interpretationChips(i).map((c) => c.label)).toEqual([
      "Cleaning",
      "$7.5M–$13M",
      "2–4 months long",
      "Has subcontractors",
    ]);
  });
  it("removing a chip drops only that part", () => {
    const dur = interpretationChips(i).find((c) => c.key === "duration")!;
    const next = dur.remove(i);
    expect(next.panel.durationMinDays).toBeUndefined();
    expect(next.panel.dollarMin).toBe(7_500_000);
    expect(next.q).toBe("cleaning");
  });
});
