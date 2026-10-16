import { describe, it, expect } from "vitest";
import { setAsideLabel } from "./vocab/filterOptions";
import { gloss } from "./filterGlosses";

describe("set-aside chip labels", () => {
  it("renders a human-readable label for the MWDBE chip (not the raw id)", () => {
    const label = setAsideLabel("MWDBE");
    expect(label).toBe("MBE / WBE / DBE");
    expect(label).not.toBe("MWDBE");
  });

  it("provides a plain-English tooltip for the MWDBE chip", () => {
    expect(gloss("setAsides", "MWDBE")).toBe(
      "State & local minority/women/disadvantaged business set-asides.",
    );
  });
});
