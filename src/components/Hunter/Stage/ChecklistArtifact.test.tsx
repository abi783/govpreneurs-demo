// @vitest-environment jsdom
//
// Feature 14(c) — the act checklist on the stage renders NO price for any
// `DfyOffer`. `mentorFeeUSD` is the only monetary figure the payload may put on
// screen (`lib/hunterChat.ts`), and the prototype's `priceLabel` has no field to
// come from here.
import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { ActPayload } from "../../../lib/hunterChat";
import { ChecklistArtifact } from "./ChecklistArtifact";

/** A payload shaped exactly as the act agent returns one. */
function payload(over: Partial<ActPayload> = {}): ActPayload {
  return {
    gap: {
      kind: "set_aside",
      oppKey: "opp-1",
      title: "Dining facility attendant services",
      verdict: "certify_to_qualify",
      setAsideName: "SDVOSB",
      note: "The award is set aside; the registration is the one blocker.",
    },
    trustLevel: "high",
    offers: [
      {
        slug: "sam-registration",
        name: "SAM.gov registration review",
        benefit: "A reviewed registration that will not bounce at submission.",
        turnaround: "5 business days",
        selfServeDestination: "roadmap",
        externalGuidance: null,
      },
    ],
    selfServe: {
      cert: "SDVOSB",
      label: "Certify with VetCert",
      authority: "vetcert",
      url: "https://veterans.certify.sba.gov/",
      guidance: "Apply directly; the application is free.",
      mentorOptional: true,
    },
    bidChecklist: [
      { label: "Active SAM.gov registration", done: true },
      { label: "SDVOSB certification on file", done: false },
      { label: "Capability statement uploaded", done: false },
    ],
    mentorFeeUSD: 250,
    ...over,
  };
}

beforeEach(cleanup);

describe("ChecklistArtifact renders the live payload", () => {
  it("shows the gap, the offer and every checklist step", () => {
    const { container } = render(<ChecklistArtifact payload={payload()} />);
    const text = container.textContent ?? "";
    for (const s of [
      "SDVOSB certification",
      "SAM.gov registration review",
      "A reviewed registration that will not bounce at submission.",
      "5 business days",
      "Active SAM.gov registration",
      "Capability statement uploaded",
    ]) {
      expect(text).toContain(s);
    }
  });

  it("marks the done steps apart from the to-do ones", () => {
    const { container } = render(<ChecklistArtifact payload={payload()} />);
    expect(container.querySelectorAll(".hunter-act__step")).toHaveLength(3);
    expect(container.querySelectorAll(".hunter-act__step--done")).toHaveLength(1);
  });
});

describe("no price ever reaches a DfyOffer (14c)", () => {
  it("renders exactly one monetary figure, and it is the mentor fee", () => {
    const { container } = render(<ChecklistArtifact payload={payload()} />);
    const text = container.textContent ?? "";
    const money = text.match(/\$[\d,]+/g) ?? [];
    expect(money).toEqual(["$250"]);
  });

  it("renders no monetary figure at all when there is no mentor fee", () => {
    const { container } = render(
      <ChecklistArtifact payload={payload({ mentorFeeUSD: undefined })} />,
    );
    expect(container.textContent).not.toMatch(/\$[\d,]/);
  });

  it("renders no monetary figure for an offer-only payload", () => {
    const { container } = render(
      <ChecklistArtifact
        payload={payload({ selfServe: undefined, mentorFeeUSD: undefined, bidChecklist: [] })}
      />,
    );
    expect(container.textContent).toContain("SAM.gov registration review");
    expect(container.textContent).not.toMatch(/\$[\d,]/);
  });
});

describe("absent sections drop out", () => {
  it("renders no checklist block when the payload carries no steps", () => {
    const { container } = render(<ChecklistArtifact payload={payload({ bidChecklist: [] })} />);
    expect(container.querySelector(".hunter-act__checklist")).toBeNull();
  });

  it("renders no note when the gap carries none", () => {
    const { container } = render(
      <ChecklistArtifact
        payload={payload({
          gap: {
            kind: "sam",
            oppKey: null,
            title: null,
            setAsideName: null,
            note: null,
          },
        })}
      />,
    );
    expect(container.querySelector(".hunter-act__note")).toBeNull();
  });
});
