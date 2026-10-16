// @vitest-environment jsdom
//
// Feature 14(b) — the research card's safety work survives the move to the
// stage. Five properties, five assertions. This is the one card where the
// target is BETTER than the prototype it is being synced with, so a regression
// here is a downgrade, not a drift.
import { describe, expect, it, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import type { WebResearchPayload } from "../../../lib/hunterChat";
import { MAX_CITATIONS } from "../../../lib/renderLimits";
import { ResearchArtifact } from "./ResearchArtifact";

/** A payload shaped exactly as the web-research tool returns one. */
function payload(over: Partial<WebResearchPayload> = {}): WebResearchPayload {
  return {
    query: "SDVOSB recertification window",
    answer: "The certification runs for three years [1]. Recertify before it lapses [2].",
    citations: [
      {
        index: 1,
        title: "Veteran Small Business Certification",
        url: "https://veterans.certify.sba.gov/",
        host: "veterans.certify.sba.gov",
        trusted: true,
      },
      {
        index: 2,
        title: "Program overview",
        url: "https://example.com/overview",
        host: "example.com",
        trusted: false,
      },
    ],
    ...over,
  };
}

/** `n` citations, numbered from 1 — enough to cross `MAX_CITATIONS`. */
function manyCitations(n: number): WebResearchPayload["citations"] {
  return Array.from({ length: n }, (_, i) => ({
    index: i + 1,
    title: `Source ${i + 1}`,
    url: `https://example.gov/${i + 1}`,
    host: "example.gov",
    trusted: true,
  }));
}

beforeEach(cleanup);

describe("the research artifact keeps its five safety properties (14b)", () => {
  it("1 · numbers every citation and prints its host", () => {
    const { container } = render(<ResearchArtifact payload={payload()} />);
    const nums = Array.from(container.querySelectorAll(".hunter-research__source-num")).map(
      (n) => n.textContent,
    );
    expect(nums).toEqual(["1", "2"]);
    const hosts = Array.from(container.querySelectorAll(".hunter-research__source-host")).map(
      (n) => n.textContent,
    );
    expect(hosts[0]).toContain("veterans.certify.sba.gov");
    expect(hosts[1]).toContain("example.com");
  });

  it("2 · marks a trusted source and leaves an untrusted one unmarked", () => {
    const { container } = render(<ResearchArtifact payload={payload()} />);
    const marks = container.querySelectorAll('[aria-label="Official / trusted source"]');
    expect(marks).toHaveLength(1);
  });

  it("3 · vets every URL through httpUrlOrNull — a rejected URL hides the LINK, never the citation", () => {
    const { container } = render(
      <ResearchArtifact
        payload={payload({
          citations: [
            {
              index: 1,
              title: "Injected source",
              url: "javascript:alert(1)",
              host: "attacker.example",
              trusted: false,
            },
          ],
        })}
      />,
    );
    // The citation is still on screen, in full.
    expect(container.textContent).toContain("Injected source");
    expect(container.textContent).toContain("attacker.example");
    // The link is not.
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.querySelector(".hunter-research__source-link--inert")).not.toBeNull();
    // And the inline marker for it degraded to inert text as well.
    expect(container.querySelector(".hunter-research__cite--inert")).not.toBeNull();
  });

  it("4 · applies MAX_CITATIONS and says how many it did not show", () => {
    const extra = 3;
    const { container } = render(
      <ResearchArtifact payload={payload({ citations: manyCitations(MAX_CITATIONS + extra) })} />,
    );
    expect(container.querySelectorAll(".hunter-research__source")).toHaveLength(MAX_CITATIONS);
    expect(container.querySelector(".hunter-research__sources-more")?.textContent).toBe(
      `and ${extra} more not shown`,
    );
  });

  it("5 · renders the verify-against-the-official-solicitation disclaimer", () => {
    const { container } = render(<ResearchArtifact payload={payload()} />);
    const disclaimer = container.querySelector(".hunter-research__disclaimer")?.textContent ?? "";
    expect(disclaimer).toContain("verify against the official solicitation");
    expect(disclaimer).toContain("Not legal advice");
  });
});

describe("inline markers agree with the list", () => {
  it("links a marker whose source is on screen", () => {
    const { container } = render(<ResearchArtifact payload={payload()} />);
    const cites = Array.from(container.querySelectorAll("a.hunter-research__cite"));
    expect(cites.map((c) => c.textContent)).toEqual(["1", "2"]);
    expect(cites[0].getAttribute("href")).toBe("https://veterans.certify.sba.gov/");
  });

  it("leaves a marker past the cap as plain text, pointing at nothing", () => {
    const beyond = MAX_CITATIONS + 1;
    const { container } = render(
      <ResearchArtifact
        payload={payload({
          answer: `A claim resting on the last source [${beyond}].`,
          citations: manyCitations(beyond),
        })}
      />,
    );
    expect(container.textContent).toContain(`[${beyond}]`);
    const linked = Array.from(container.querySelectorAll("a.hunter-research__cite")).map(
      (a) => a.textContent,
    );
    expect(linked).not.toContain(String(beyond));
  });

  it("renders the answer text the payload carried, and only that", () => {
    const { container } = render(<ResearchArtifact payload={payload()} />);
    const body = container.querySelector(".hunter-research__body")?.textContent ?? "";
    expect(body).toContain("The certification runs for three years");
    expect(body).toContain("Recertify before it lapses");
  });
});

describe("the model's markdown renders as structure, not as literal text", () => {
  it("renders a bold-only line as a heading and drops the asterisks", () => {
    const { container } = render(
      <ResearchArtifact
        payload={payload({
          answer: "**Industry Overview:**\n\nThe catering market is large.",
          citations: [],
        })}
      />,
    );
    const head = container.querySelector(".hunter-research__heading");
    expect(head?.textContent).toBe("Industry Overview:");
    expect(container.textContent).not.toContain("**");
  });

  it("renders consecutive `- ` lines as ONE list, with the lead-in bolded", () => {
    const { container } = render(
      <ResearchArtifact
        payload={payload({
          answer: "- **Total Revenue:** about $70B\n- **Growth:** 3% a year",
          citations: [],
        })}
      />,
    );
    const lists = container.querySelectorAll("ul.hunter-research__list");
    expect(lists).toHaveLength(1);
    expect(lists[0].querySelectorAll("li")).toHaveLength(2);
    const bolds = Array.from(container.querySelectorAll(".hunter-research__body strong")).map(
      (b) => b.textContent,
    );
    expect(bolds).toEqual(["Total Revenue:", "Growth:"]);
    expect(container.textContent).not.toContain("- **");
  });

  it("keeps a citation clickable inside a bold run", () => {
    const { container } = render(
      <ResearchArtifact payload={payload({ answer: "**Revenue is $70B [1]** today." })} />,
    );
    const cite = container.querySelector("strong a.hunter-research__cite");
    expect(cite?.textContent).toBe("1");
    expect(cite?.getAttribute("href")).toBe("https://veterans.certify.sba.gov/");
  });

  it("keeps a citation clickable inside a list item", () => {
    const { container } = render(
      <ResearchArtifact payload={payload({ answer: "- Recertify before it lapses [2]." })} />,
    );
    const cite = container.querySelector("li a.hunter-research__cite");
    expect(cite?.textContent).toBe("2");
    expect(cite?.getAttribute("href")).toBe("https://example.com/overview");
  });

  it("degrades an unclosed ** to literal text, keeping the rest of the answer", () => {
    const { container } = render(
      <ResearchArtifact
        payload={payload({ answer: "A **claim that never closes and then more words [1]." })}
      />,
    );
    const body = container.querySelector(".hunter-research__body")?.textContent ?? "";
    expect(body).toContain("**claim that never closes");
    expect(body).toContain("and then more words");
    expect(container.querySelector("a.hunter-research__cite")?.textContent).toBe("1");
  });

  it("builds nodes, never markup — an HTML-looking answer prints as text", () => {
    const { container } = render(
      <ResearchArtifact
        payload={payload({ answer: "- <img src=x onerror=alert(1)>", citations: [] })}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("renders an empty answer as an empty body, not a crash", () => {
    const { container } = render(<ResearchArtifact payload={payload({ answer: "" })} />);
    expect(container.querySelector(".hunter-research__body")?.textContent).toBe("");
  });
});
