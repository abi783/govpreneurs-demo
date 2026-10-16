// Small orders — the tab the board opens on.
//
// A member who arrives with no `?view=` and has no For you matches opens on
// All orders. A member who chose For you in the address stays there, and a
// For you walk that failed or has not answered keeps her on For you.
import { describe, expect, it } from "vitest";
import { landingView } from "./boardView";

describe("landingView", () => {
  it("opens All orders when she chose no tab and For you has no matches", () => {
    expect(landingView({ explicitView: undefined, forYou: { total: 0 } })).toBe("all");
  });

  it("keeps For you when the address asks for it, even with no matches", () => {
    expect(landingView({ explicitView: "for-you", forYou: { total: 0 } })).toBe("for-you");
  });

  it("keeps For you when For you has matches", () => {
    expect(landingView({ explicitView: undefined, forYou: { total: 3 } })).toBe("for-you");
  });

  it("keeps For you when the For you walk failed", () => {
    expect(landingView({ explicitView: undefined, forYou: null })).toBe("for-you");
  });

  it("keeps For you while the For you walk has not answered", () => {
    expect(landingView({ explicitView: undefined, forYou: undefined })).toBe("for-you");
  });

  it("keeps any tab the address asks for", () => {
    expect(landingView({ explicitView: "saved", forYou: { total: 0 } })).toBe("saved");
  });
});
