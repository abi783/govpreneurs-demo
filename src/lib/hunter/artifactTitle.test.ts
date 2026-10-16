// Feature 14 — one artifact, one name, on both surfaces that name it.
import { describe, expect, it } from "vitest";
import type { StageArtifactInput } from "./stageArtifact";
import { artifactLabel, artifactOnScreenSentence, artifactTitle } from "./artifactTitle";

const scorecard: StageArtifactInput = {
  kind: "scorecard",
  payload: {
    oppKey: "opp-1",
    title: "Dining facility attendant services",
    agency: "Department of the Army",
    verdict: "eligible",
    verdictLabel: "Eligible",
    soleSource: false,
    rows: [],
    note: null,
  },
};

const compare: StageArtifactInput = {
  kind: "compare",
  payload: {
    opps: [
      { oppKey: "a", title: "Mess hall support", agency: null, location: null },
      { oppKey: "b", title: "Grounds maintenance", agency: null, location: null },
    ],
    rows: [],
    verdict: {
      winnerOppKey: "a",
      winnerTitle: "Mess hall support",
      strengthPct: 62,
      strengthLabel: "Clear edge",
    },
    tradeoff: "",
  },
};

describe("artifactTitle", () => {
  it("names the readiness check by the opportunity it checked", () => {
    expect(artifactTitle(scorecard)).toEqual({
      kicker: "Readiness check",
      subject: "Dining facility attendant services",
    });
  });

  it("joins the compared opportunities into one subject", () => {
    expect(artifactLabel(compare)).toBe("Compare · Mess hall support vs Grounds maintenance");
  });

  it("gives the matches list no subject, because the payload names none", () => {
    const label = artifactLabel({ kind: "matches", payload: { rows: [] } });
    expect(label).toBe("Best matches");
    expect(artifactTitle({ kind: "matches", payload: { rows: [] } }).subject).toBeNull();
  });

  it("drops an absent checklist subject rather than inventing one", () => {
    const artifact: StageArtifactInput = {
      kind: "checklist",
      payload: {
        gap: { kind: "sam", oppKey: null, title: null, setAsideName: null, note: null },
        trustLevel: "high",
        offers: [],
      },
    };
    expect(artifactLabel(artifact)).toBe("Action checklist");
  });

  it("treats a blank subject as no subject", () => {
    const blank: StageArtifactInput = {
      kind: "research",
      payload: { query: "   ", answer: "", citations: [] },
    };
    expect(artifactLabel(blank)).toBe("Research");
  });
});

describe("artifactOnScreenSentence", () => {
  it("keeps the readiness sentence the stage shell already announced", () => {
    expect(artifactOnScreenSentence(scorecard)).toBe(
      "Readiness check for Dining facility attendant services is on screen",
    );
  });

  it("reads as a sentence for every kind", () => {
    expect(artifactOnScreenSentence(compare)).toBe(
      "Comparison of Mess hall support vs Grounds maintenance is on screen",
    );
    expect(artifactOnScreenSentence({ kind: "matches", payload: { rows: [] } })).toBe(
      "Best matches are on screen",
    );
    expect(
      artifactOnScreenSentence({
        kind: "research",
        payload: { query: "SDVOSB recertification", answer: "", citations: [] },
      }),
    ).toBe("Research for SDVOSB recertification is on screen");
    expect(
      artifactOnScreenSentence({
        kind: "profile",
        payload: {
          rows: [],
          hiddenCount: 0,
          notOnFile: [],
          capabilityStatement: "none",
          factsUnavailable: false,
        },
      }),
    ).toBe("Your business profile is on screen");
  });
});
