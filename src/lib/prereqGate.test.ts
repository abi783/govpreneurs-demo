import { computeCertPrereqs } from "./prereqGate";

describe("computeCertPrereqs", () => {
  it("gates a set-aside the firm does not hold", () => {
    const out = computeCertPrereqs("WOSB", ["SDVOSB"]);
    expect(out.map((p) => p.key)).toEqual(["wosb"]);
  });

  it("does not gate when the firm holds the required cert", () => {
    expect(computeCertPrereqs("WOSB", ["WOSB"])).toHaveLength(0);
    expect(computeCertPrereqs("8(a)", ["8A"])).toHaveLength(0);
  });

  it("treats an SDVOSB firm as satisfying a VOSB requirement", () => {
    expect(computeCertPrereqs("VOSB", ["SDVOSB"])).toHaveLength(0);
    // but a plain SDVOSB set-aside still needs SDVOSB specifically
    expect(computeCertPrereqs("SDVOSB", ["VOSB"])).toHaveLength(1);
  });

  it("does not match VOSB inside the SDVOSB string", () => {
    // "SDVOSB" must trigger only the SDVOSB rule, never the VOSB rule
    expect(computeCertPrereqs("SDVOSB", []).map((p) => p.key)).toEqual(["sdvosb"]);
  });

  it("never gates Total Small Business or open competition", () => {
    expect(computeCertPrereqs("Total Small Business", [])).toHaveLength(0);
    expect(computeCertPrereqs(undefined, [])).toHaveLength(0);
    expect(computeCertPrereqs("", [])).toHaveLength(0);
  });
});
