import { describe, it, expect } from "vitest";
import { matchTierToVerdict, scoreToVerdict } from "./verdict";

describe("matchTierToVerdict — backend tier is the source of truth", () => {
  // MatchTier maps from the backend tier: strong←priority, good←strong,
  // stretch←stretch, longshot←low. Verdict: priority|strong → bid,
  // stretch → Review (lean), low → No Bid (pass).
  it("maps strong (backend priority) → bid", () => {
    expect(matchTierToVerdict("strong")).toBe("bid");
  });

  it("maps good (backend strong) → bid", () => {
    expect(matchTierToVerdict("good")).toBe("bid");
  });

  it("maps stretch → lean (Review)", () => {
    expect(matchTierToVerdict("stretch")).toBe("lean");
  });

  it("maps longshot (backend low) → pass (No Bid)", () => {
    expect(matchTierToVerdict("longshot")).toBe("pass");
  });
});

describe("scoreToVerdict — fallback for data without a backend tier (65 / 40 / else)", () => {
  it("classifies >= 65 as bid", () => {
    expect(scoreToVerdict(100)).toBe("bid");
    expect(scoreToVerdict(65)).toBe("bid");
  });

  it("classifies 40..64 as lean", () => {
    expect(scoreToVerdict(64)).toBe("lean");
    expect(scoreToVerdict(40)).toBe("lean");
  });

  it("classifies < 40 as pass", () => {
    expect(scoreToVerdict(39)).toBe("pass");
    expect(scoreToVerdict(0)).toBe("pass");
  });
});
