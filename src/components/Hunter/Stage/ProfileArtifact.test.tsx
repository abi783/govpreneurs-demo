// @vitest-environment jsdom
//
// The profile card — what Hunter read when the member asked about her own
// business. Every value names where it came from, an unconfirmed value says so,
// and an absence is stated rather than left blank.
import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import type { ProfilePayload } from "../../../lib/hunterChat";
import {
  COLLAPSED_LIST_ITEMS,
  FOLDED_TEXT_CHARS,
  MAIN_PROFILE_ROWS,
} from "../../../lib/hunter/profileCardText";
import { MAX_PROFILE_ROWS } from "../../../lib/renderLimits";
import { ProfileArtifact, PROFILE_CARD_COPY } from "./ProfileArtifact";

/** A payload shaped exactly as `get_profile` returns one. */
function payload(over: Partial<ProfilePayload> = {}): ProfilePayload {
  return {
    rows: [
      { label: "Company name", value: "Acme Facilities LLC", source: "profile" },
      {
        label: "Capability summary",
        value: "Commercial plumbing and HVAC.",
        source: "capability_statement",
      },
      { label: "EIN", value: "12-3456789", source: "you_told_us" },
      { label: "Crew size", value: "20", source: "unconfirmed" },
    ],
    hiddenCount: 0,
    notOnFile: [],
    capabilityStatement: "parsed",
    factsUnavailable: false,
    ...over,
  };
}

function cardText(): string {
  return document.querySelector(".hunter-profile")?.textContent ?? "";
}

beforeEach(() => cleanup());

describe("ProfileArtifact", () => {
  it("shows every value with its label and where it came from", () => {
    render(<ProfileArtifact payload={payload()} />);

    const rows = document.querySelectorAll(".hunter-profile__row");
    expect(rows).toHaveLength(4);
    expect(rows[0].textContent).toContain("Company name");
    expect(rows[0].textContent).toContain("Acme Facilities LLC");
    expect(rows[0].textContent).toContain(PROFILE_CARD_COPY.source.profile);
    expect(rows[1].textContent).toContain(PROFILE_CARD_COPY.source.capability_statement);
    expect(rows[2].textContent).toContain(PROFILE_CARD_COPY.source.you_told_us);
    expect(rows[3].textContent).toContain(PROFILE_CARD_COPY.source.unconfirmed);
  });

  it("marks an unconfirmed value apart from a confirmed one", () => {
    render(<ProfileArtifact payload={payload()} />);

    expect(document.querySelectorAll(".hunter-profile__source--unconfirmed")).toHaveLength(1);
  });

  it("names the fields she asked about that are not on file", () => {
    render(<ProfileArtifact payload={payload({ notOnFile: ["Bonding capacity", "CAGE code"] })} />);

    expect(document.querySelector(".hunter-profile__missing")?.textContent).toBe(
      "Not on file yet: Bonding capacity, CAGE code.",
    );
  });

  it("states how many values it did not show, from the server and from its own bound", () => {
    const rows = Array.from({ length: MAX_PROFILE_ROWS + 2 }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`,
      source: "you_told_us" as const,
    }));

    render(<ProfileArtifact payload={payload({ rows, hiddenCount: 3 })} />);
    fireEvent.click(
      screen.getByRole("button", { name: `Show ${MAX_PROFILE_ROWS - MAIN_PROFILE_ROWS} more` }),
    );

    expect(document.querySelectorAll(".hunter-profile__row")).toHaveLength(MAX_PROFILE_ROWS);
    expect(document.querySelector(".hunter-profile__more")?.textContent).toBe(
      "and 5 more not shown",
    );
  });

  it("says what we hold of the capability statement", () => {
    render(<ProfileArtifact payload={payload({ capabilityStatement: "none" })} />);
    expect(cardText()).toContain(PROFILE_CARD_COPY.capabilityStatement.none);

    cleanup();
    render(<ProfileArtifact payload={payload({ capabilityStatement: "unparsed" })} />);
    expect(cardText()).toContain(PROFILE_CARD_COPY.capabilityStatement.unparsed);

    cleanup();
    render(<ProfileArtifact payload={payload({ capabilityStatement: "parsed" })} />);
    expect(document.querySelector(".hunter-profile__statement")).toBeNull();
  });

  it("says nothing is on file for an empty, readable record", () => {
    render(<ProfileArtifact payload={payload({ rows: [], capabilityStatement: "none" })} />);

    expect(cardText()).toContain(PROFILE_CARD_COPY.empty);
  });

  it("never calls an unreadable record empty", () => {
    render(
      <ProfileArtifact
        payload={payload({ rows: [], factsUnavailable: true, capabilityStatement: "none" })}
      />,
    );

    expect(cardText()).toContain(PROFILE_CARD_COPY.unavailable);
    expect(cardText()).not.toContain(PROFILE_CARD_COPY.empty);
  });

  it("renders a value as text, never as markup", () => {
    render(
      <ProfileArtifact
        payload={payload({
          rows: [{ label: "Note", value: '<img src=x onerror="alert(1)">', source: "you_told_us" }],
        })}
      />,
    );

    expect(document.querySelector(".hunter-profile img")).toBeNull();
    expect(cardText()).toContain('<img src=x onerror="alert(1)">');
  });

  it("reads a source it does not know as not confirmed", () => {
    render(
      <ProfileArtifact
        payload={payload({
          rows: [{ label: "EIN", value: "1", source: "constructor" as never }],
        })}
      />,
    );

    const source = document.querySelector(".hunter-profile__source");
    expect(source?.className).toContain("hunter-profile__source--unconfirmed");
    expect(source?.textContent).toBe(PROFILE_CARD_COPY.source.unconfirmed);
  });

  it("shows a list row as entries, each starting with a capital", () => {
    render(
      <ProfileArtifact
        payload={payload({
          rows: [
            {
              label: "Core capabilities",
              value: "federal market research; teaming",
              source: "capability_statement",
              items: ["federal market research", "iOS app delivery"],
            },
          ],
        })}
      />,
    );

    const entries = [...document.querySelectorAll(".hunter-profile__item")].map(
      (li) => li.textContent,
    );
    expect(entries).toEqual(["Federal market research", "iOS app delivery"]);
  });

  it("shows the main rows first, and the rest on request", () => {
    const rows = Array.from({ length: MAIN_PROFILE_ROWS + 4 }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`,
      source: "profile" as const,
    }));
    render(<ProfileArtifact payload={payload({ rows })} />);

    expect(document.querySelectorAll(".hunter-profile__row")).toHaveLength(MAIN_PROFILE_ROWS);
    expect(cardText()).not.toContain(`Field ${MAIN_PROFILE_ROWS}`);
    fireEvent.click(screen.getByRole("button", { name: "Show 4 more" }));
    expect(document.querySelectorAll(".hunter-profile__row")).toHaveLength(rows.length);
    fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(document.querySelectorAll(".hunter-profile__row")).toHaveLength(MAIN_PROFILE_ROWS);
  });

  it("offers no control when every row is a main row", () => {
    const rows = Array.from({ length: MAIN_PROFILE_ROWS }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`,
      source: "profile" as const,
    }));
    render(<ProfileArtifact payload={payload({ rows })} />);

    expect(document.querySelectorAll(".hunter-profile__row")).toHaveLength(MAIN_PROFILE_ROWS);
    expect(screen.queryByRole("button", { name: /more$/ })).toBeNull();
  });

  it("states the server's cut only once the rest is open", () => {
    // Collapsed, "Show 4 more" beside "and 3 more not shown" reads as two
    // different counts of the same thing.
    const rows = Array.from({ length: MAIN_PROFILE_ROWS + 4 }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`,
      source: "profile" as const,
    }));
    render(<ProfileArtifact payload={payload({ rows, hiddenCount: 3 })} />);

    expect(document.querySelector(".hunter-profile__more")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show 4 more" }));
    expect(document.querySelector(".hunter-profile__more")?.textContent).toBe(
      "and 3 more not shown",
    );
  });

  it("shows the first entries of a long list, and all of them on request", () => {
    const items = Array.from({ length: COLLAPSED_LIST_ITEMS + 3 }, (_, i) => `entry ${i}`);
    render(
      <ProfileArtifact
        payload={payload({
          rows: [{ label: "Credentials", value: "", source: "you_told_us", items }],
        })}
      />,
    );

    expect(document.querySelectorAll(".hunter-profile__item")).toHaveLength(COLLAPSED_LIST_ITEMS);
    fireEvent.click(screen.getByRole("button", { name: `Show all ${items.length}` }));
    expect(document.querySelectorAll(".hunter-profile__item")).toHaveLength(items.length);
    fireEvent.click(screen.getByRole("button", { name: "Show fewer" }));
    expect(document.querySelectorAll(".hunter-profile__item")).toHaveLength(COLLAPSED_LIST_ITEMS);
  });

  it("states the entries the server left out of a list", () => {
    render(
      <ProfileArtifact
        payload={payload({
          rows: [
            {
              label: "Core capabilities",
              value: "",
              source: "capability_statement",
              items: ["teaming"],
              moreItems: 3,
            },
          ],
        })}
      />,
    );

    expect(document.querySelector(".hunter-profile__row")?.textContent).toContain(
      "and 3 more not shown",
    );
  });

  it("sets a NAICS code apart from its name", () => {
    render(
      <ProfileArtifact
        payload={payload({
          rows: [
            {
              label: "NAICS codes",
              value: "",
              source: "profile",
              items: ["541810 — Advertising services"],
            },
          ],
        })}
      />,
    );

    expect(document.querySelector(".hunter-profile__code")?.textContent).toBe("541810");
    expect(document.querySelector(".hunter-profile__item")?.textContent).toBe(
      "541810Advertising services",
    );
  });

  it("folds long text at a word boundary, and shows it whole on request", () => {
    const long = `the firm provides ${"federal market entry consulting ".repeat(20)}end`;
    render(
      <ProfileArtifact
        payload={payload({
          rows: [{ label: "Capability summary", value: long, source: "capability_statement" }],
        })}
      />,
    );

    const text = () => document.querySelector(".hunter-profile__text")?.textContent ?? "";
    expect(text().startsWith("The firm provides")).toBe(true);
    expect(text().endsWith("…")).toBe(true);
    expect(text().length).toBeLessThanOrEqual(FOLDED_TEXT_CHARS + 1);
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    expect(text().endsWith("end")).toBe(true);
    expect(screen.getByRole("button", { name: "Show less" })).not.toBeNull();
  });

  it("survives a payload with its lists missing", () => {
    render(<ProfileArtifact payload={{} as ProfilePayload} />);

    expect(document.querySelector(".hunter-profile")).not.toBeNull();
  });
});
