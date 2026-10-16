// @vitest-environment jsdom
//
// Feature 14(d) — the compare artifact ships DEGRADED, and the degradation is
// the point of these tests. `ComparePayload` carries no per-column weights, so
// there is one winner segment and no per-column percentage anywhere on screen.
import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { ComparePayload } from "../../../lib/hunterChat";
import { CompareArtifact } from "./CompareArtifact";

/** A payload shaped exactly as `POST /hunter-chat/message` returns one. */
function payload(over: Partial<ComparePayload> = {}): ComparePayload {
  return {
    opps: [
      { oppKey: "opp-a", title: "Mess hall support", agency: "Army", location: "Fort Bragg, NC" },
      { oppKey: "opp-b", title: "Grounds maintenance", agency: "GSA", location: "Raleigh, NC" },
    ],
    rows: [
      { field: "Set-aside", values: ["SDVOSB", "Full and open"], winner: 0 },
      { field: "Value", values: ["$1.2M", "$480K"], winner: 0 },
      { field: "Deadline", values: ["21 days", "9 days"], winner: 0 },
    ],
    verdict: {
      winnerOppKey: "opp-a",
      winnerTitle: "Mess hall support",
      strengthPct: 68,
      strengthLabel: "Clear edge",
    },
    tradeoff: "The larger award closes later but needs a certification you do not hold.",
    ...over,
  };
}

beforeEach(cleanup);

describe("CompareArtifact renders the live payload", () => {
  it("shows every column, every row field and every cell value", () => {
    const { container } = render(<CompareArtifact payload={payload()} />);
    const text = container.textContent ?? "";
    for (const s of [
      "Mess hall support",
      "Grounds maintenance",
      "Set-aside",
      "SDVOSB",
      "Full and open",
      "$480K",
      "The larger award closes later but needs a certification you do not hold.",
    ]) {
      expect(text).toContain(s);
    }
  });

  it("marks the winning column and the winning cells from the payload", () => {
    const { container } = render(<CompareArtifact payload={payload()} />);
    expect(container.querySelectorAll("th.win")).toHaveLength(1);
    expect(container.querySelectorAll("td.win")).toHaveLength(3);
  });
});

describe("the verdict bar is one winner segment (14d)", () => {
  it("renders exactly one segment, sized by strengthPct", () => {
    const { container } = render(<CompareArtifact payload={payload()} />);
    const segs = container.querySelectorAll(".hunter-compare__bar-fill");
    expect(segs).toHaveLength(1);
    expect((segs[0] as HTMLElement).style.width).toBe("68%");
  });

  it("does NOT print a percentage anywhere — no per-column share exists to print", () => {
    const { container } = render(<CompareArtifact payload={payload()} />);
    expect(container.textContent).not.toContain("%");
    expect(container.textContent).not.toContain("68");
  });

  it("names the winner with the payload's own strength label, not a computed one", () => {
    const { container } = render(<CompareArtifact payload={payload()} />);
    expect(container.querySelector(".hunter-compare__strength")?.textContent).toBe("Clear edge");
  });

  it("keeps a malformed percentage inside the bar", () => {
    const { container } = render(
      <CompareArtifact
        payload={payload({
          verdict: {
            winnerOppKey: "opp-a",
            winnerTitle: "Mess hall support",
            strengthPct: 400,
            strengthLabel: "Clear edge",
          },
        })}
      />,
    );
    const seg = container.querySelector(".hunter-compare__bar-fill") as HTMLElement;
    expect(seg.style.width).toBe("100%");
  });
});

describe("the per-cell note", () => {
  it("renders nothing extra when the server sent no note", () => {
    // An absent note leaves the cell exactly as it was. Reserving space for a
    // sentence nobody wrote is how a table starts looking like it is hiding
    // something.
    const { container } = render(<CompareArtifact payload={payload()} />);
    const firstRow = container.querySelectorAll("tbody tr")[0];
    const cells = firstRow.querySelectorAll("td");
    expect(cells).toHaveLength(3);
    expect(cells[1].children).toHaveLength(0);
    expect(cells[1].textContent).toBe("SDVOSB");
  });

  it("renders the note under the value it explains", () => {
    const { container } = render(
      <CompareArtifact
        payload={payload({
          rows: [
            {
              field: "Deadline",
              values: ["21 days", "9 days"],
              notes: ["runway is workable", "tight — start now"],
              winner: 0,
            },
          ],
        })}
      />,
    );
    const cells = container.querySelectorAll("tbody tr td");
    expect(cells[1].textContent).toBe("21 daysrunway is workable");
    expect(cells[1].querySelector(".hunter-compare__note")?.textContent).toBe("runway is workable");
  });

  it("renders a note for one cell and not for its neighbour", () => {
    // `notes` is parallel to `values` and each entry is independently nullable:
    // one column having a basis to state does not oblige the other to invent one.
    const { container } = render(
      <CompareArtifact
        payload={payload({
          rows: [
            {
              field: "Offers received",
              values: ["4 offers (median)", "Not enough award history"],
              notes: ["over 31 comparable awards", null],
              winner: 0,
            },
          ],
        })}
      />,
    );
    const cells = container.querySelectorAll("tbody tr td");
    expect(cells[1].querySelector(".hunter-compare__note")).toBeTruthy();
    expect(cells[2].querySelector(".hunter-compare__note")).toBeNull();
    expect(cells[2].textContent).toBe("Not enough award history");
  });

  it("puts the note and the agency on their own line WITHOUT relying on CSS", () => {
    // The bug this guards: as spans they needed `display: block` to take their
    // own line, so a stylesheet that had not loaded rendered
    // "Houston, TXin your city" — two facts fused into one unreadable string.
    // Block-level markup degrades to a line break instead of to nonsense.
    const { container } = render(
      <CompareArtifact
        payload={payload({
          rows: [
            {
              field: "Place of performance",
              values: ["Houston, TX", "Raleigh, NC"],
              notes: ["in your city", "outside your service area"],
              winner: 0,
            },
          ],
        })}
      />,
    );
    expect(container.querySelector(".hunter-compare__note")?.tagName).toBe("DIV");
    expect(container.querySelector(".hunter-compare__agency")?.tagName).toBe("DIV");
  });

  it("names the buyer under each column title", () => {
    // Already on the payload and previously dropped: a member comparing two
    // notices is comparing two buyers as much as two jobs.
    const { container } = render(<CompareArtifact payload={payload()} />);
    const agencies = [...container.querySelectorAll(".hunter-compare__agency")].map(
      (n) => n.textContent,
    );
    expect(agencies).toEqual(["Army", "GSA"]);
  });

  it("drops the tradeoff line out rather than filling it", () => {
    const { container } = render(<CompareArtifact payload={payload({ tradeoff: "" })} />);
    expect(container.querySelector(".hunter-compare__tradeoff")).toBeNull();
  });
});
