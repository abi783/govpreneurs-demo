import { describe, it, expect } from "vitest";
import { dueDateLabel, setAsideDisplayLabel, isFullAndOpen } from "./oppDisplay";

describe("dueDateLabel", () => {
  it("returns Proposal Due Date for solicitation/RFP/RFQ/combined notice types", () => {
    expect(dueDateLabel("Solicitation")).toBe("Proposal Due Date");
    expect(dueDateLabel("RFP")).toBe("Proposal Due Date");
    expect(dueDateLabel("Request for Proposal")).toBe("Proposal Due Date");
    expect(dueDateLabel("RFQ")).toBe("Proposal Due Date");
    expect(dueDateLabel("Combined Synopsis/Solicitation")).toBe("Proposal Due Date");
  });

  it("returns Response Due Date for non-solicitation notice types and empties", () => {
    expect(dueDateLabel("Sources Sought")).toBe("Response Due Date");
    expect(dueDateLabel("RFI")).toBe("Response Due Date");
    expect(dueDateLabel(null)).toBe("Response Due Date");
    expect(dueDateLabel(undefined)).toBe("Response Due Date");
  });
});

describe("setAsideDisplayLabel", () => {
  it("normalizes Full & Open variants to the standard label", () => {
    expect(setAsideDisplayLabel("Full & Open")).toBe("Full and Open Competition");
    expect(setAsideDisplayLabel("Full and Open")).toBe("Full and Open Competition");
    expect(setAsideDisplayLabel("full & open competition")).toBe("Full and Open Competition");
  });

  it("returns the raw value unchanged for other set-asides", () => {
    expect(setAsideDisplayLabel("SDVOSB Set-Aside")).toBe("SDVOSB Set-Aside");
    expect(setAsideDisplayLabel("")).toBe("");
  });
});

describe("isFullAndOpen", () => {
  it("detects Full & Open variants and rejects others", () => {
    expect(isFullAndOpen("Full & Open")).toBe(true);
    expect(isFullAndOpen("full and open competition")).toBe(true);
    expect(isFullAndOpen("SDVOSB Set-Aside")).toBe(false);
    expect(isFullAndOpen(null)).toBe(false);
  });
});
