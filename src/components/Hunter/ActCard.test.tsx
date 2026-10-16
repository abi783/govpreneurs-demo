// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ActCard } from "./ActCard";
import type { ActPayload } from "../../lib/hunterChat";
import { roadmapUrl } from "../../lib/preview";
import { NAV_INTENT_KEY, NAV_MESSAGE } from "../../lib/ghlNav";

afterEach(cleanup);

const dfyPayload: ActPayload = {
  gap: {
    kind: "sam",
    oppKey: null,
    title: null,
    setAsideName: null,
    note: "Not registered in SAM.gov.",
  },
  trustLevel: "high",
  offers: [
    {
      slug: "sam-registration",
      name: "SAM.gov Registration",
      benefit: "Get bid-ready on federal contracts",
      turnaround: "1–2 weeks",
      selfServeDestination: "roadmap",
      externalGuidance: "SAM.gov registration is free to do yourself at sam.gov.",
    },
  ],
  bidChecklist: [
    { label: "Register in SAM.gov (UEI + CAGE)", done: false },
    { label: "Capability statement on file", done: true },
    { label: "Prepare and submit your bid", done: false },
  ],
};

const certPayload: ActPayload = {
  gap: {
    kind: "set_aside",
    oppKey: "K1",
    title: "Janitorial Services",
    verdict: "certify_to_qualify",
    setAsideName: "WOSB",
    note: null,
  },
  trustLevel: "high",
  offers: [],
  selfServe: {
    cert: "wosb",
    label: "WOSB (Women-Owned Small Business)",
    authority: "sba",
    url: "https://certify.sba.gov",
    guidance: "Self-certify at certify.sba.gov.",
    mentorOptional: true,
  },
  mentorFeeUSD: 97,
  bidChecklist: [{ label: "Hold the WOSB set-aside certification", done: false }],
};

const diversityCertPayload: ActPayload = {
  gap: {
    kind: "set_aside",
    oppKey: "K2",
    title: "City Facilities Maintenance",
    verdict: "certify_to_qualify",
    setAsideName: "MBE",
    note: "Add the MBE certification to qualify.",
  },
  trustLevel: "high",
  offers: [],
  selfServe: {
    cert: "mbe",
    label: "MBE (Minority Business Enterprise)",
    authority: "state_local",
    url: "https://nmsdc.org",
    guidance:
      "MBE status is issued by state, city, or a regional council (e.g. an NMSDC affiliate).",
    mentorOptional: true,
  },
  mentorFeeUSD: 97,
  bidChecklist: [{ label: "Hold the MBE set-aside certification", done: false }],
};

describe("ActCard", () => {
  it("renders name + benefit + turnaround + a Get started CTA, and NO price", () => {
    render(<ActCard payload={dfyPayload} locationId="LOC1" />);
    expect(screen.getByText("SAM.gov Registration")).toBeTruthy();
    expect(screen.getByText("Get bid-ready on federal contracts")).toBeTruthy();
    expect(screen.getByText("1–2 weeks")).toBeTruthy();
    const cta = screen.getByRole("link", { name: "Get started" });
    // The real, location-scoped Success Center link — NOT a bare path, which would
    // resolve against our own origin and 404.
    expect(cta.getAttribute("href")).toBe(roadmapUrl("LOC1"));
    // Opened in a new tab so it breaks out of the GHL iframe rather than nesting it.
    expect(cta.getAttribute("target")).toBe("_blank");
    expect(cta.getAttribute("rel")).toContain("noopener");
    // No DFY price figure anywhere in the DFY-offer card.
    expect(document.body.textContent ?? "").not.toMatch(/\$\d/);
  });

  it("embedded in GHL: the CTA relays a REQUEST_NAVIGATION intent to the parent", () => {
    // Simulate the GHL iframe: window.parent !== window, and capture what we post.
    const posted: unknown[] = [];
    const fakeParent = { postMessage: (m: unknown) => posted.push(m) };
    const realParent = Object.getOwnPropertyDescriptor(window, "parent");
    Object.defineProperty(window, "parent", { value: fakeParent, configurable: true });
    try {
      render(<ActCard payload={dfyPayload} locationId="LOC1" />);
      const cta = screen.getByRole("button", { name: "Get started" });
      cta.click();
      expect(posted).toHaveLength(1);
      expect(posted[0]).toMatchObject({
        message: NAV_MESSAGE,
        payload: { v: 1, page: "roadmap" },
      });
      // The intent is also parked for our own apps to consume on boot.
      expect(window.localStorage.getItem(NAV_INTENT_KEY)).toContain('"page":"roadmap"');
    } finally {
      if (realParent) Object.defineProperty(window, "parent", realParent);
      window.localStorage.removeItem(NAV_INTENT_KEY);
    }
  });

  it("omits the CTA when the location is unknown, keeping the DIY guidance", () => {
    render(<ActCard payload={dfyPayload} locationId={null} />);
    expect(screen.queryByRole("link", { name: "Get started" })).toBeNull();
    expect(
      screen.getByText("SAM.gov registration is free to do yourself at sam.gov."),
    ).toBeTruthy();
  });

  it("renders the bid-checklist with done-vs-todo steps", () => {
    render(<ActCard payload={dfyPayload} />);
    expect(screen.getByText("Before you bid")).toBeTruthy();
    expect(screen.getByText("Register in SAM.gov (UEI + CAGE)")).toBeTruthy();
    const doneStep = screen.getByText("Capability statement on file").closest("li");
    expect(doneStep?.className).toContain("hunter-act__step--done");
  });

  it("renders a self-serve cert route + the flat mentor fee (the only figure allowed)", () => {
    render(<ActCard payload={certPayload} />);
    expect(screen.getByText("WOSB (Women-Owned Small Business)")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Self-serve" }).getAttribute("href")).toBe(
      "https://certify.sba.gov",
    );
    // The flat $97 mentor fee is the sole permitted monetary figure.
    expect(screen.getByText(/have a mentor help \(\$97\)/)).toBeTruthy();
  });

  it("renders an MBE/WBE/DBE state-local diversity cert as a self-serve route (no paid offer)", () => {
    render(<ActCard payload={diversityCertPayload} />);
    // The diversity-cert label + its state/local portal render via the shared
    // self-serve block (#3 risk #2: these gaps now reach the card).
    expect(screen.getByText("MBE (Minority Business Enterprise)")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Self-serve" }).getAttribute("href")).toBe(
      "https://nmsdc.org",
    );
    // No DFY "Get started" offer CTA — certs are never sold.
    expect(screen.queryByRole("link", { name: "Get started" })).toBeNull();
    // The flat $97 mentor fee is the only monetary figure on the card.
    expect(screen.getByText(/have a mentor help \(\$97\)/)).toBeTruthy();
    expect((document.body.textContent ?? "").match(/\$\d+/g)).toEqual(["$97"]);
  });
});
