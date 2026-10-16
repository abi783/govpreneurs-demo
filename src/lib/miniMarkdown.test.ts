// The markdown subset the research model actually writes, and nothing else.
//
// Two properties are load-bearing here:
//   1. The parser is PURE STRUCTURE. It returns text and a bold flag; it never
//      returns markup. Nothing downstream can inject, because there is nothing
//      to inject through.
//   2. Malformed markdown degrades to readable text. An unclosed `**` prints as
//      it was written and the rest of the answer still renders.
import { describe, expect, it } from "vitest";
import { parseInlineSpans, parseMarkdownBlocks } from "./miniMarkdown";

describe("parseInlineSpans", () => {
  it("splits a bold run out of the surrounding text", () => {
    expect(parseInlineSpans("Revenue is **$1.2M** a year")).toEqual([
      { text: "Revenue is ", bold: false },
      { text: "$1.2M", bold: true },
      { text: " a year", bold: false },
    ]);
  });

  it("keeps a bolded lead-in at the start of the line", () => {
    expect(parseInlineSpans("**Total Revenue:** about $70B")).toEqual([
      { text: "Total Revenue:", bold: true },
      { text: " about $70B", bold: false },
    ]);
  });

  it("keeps a citation marker inside the bold run it was written in", () => {
    expect(parseInlineSpans("**$70B [2]** in 2024")).toEqual([
      { text: "$70B [2]", bold: true },
      { text: " in 2024", bold: false },
    ]);
  });

  it("prints an unclosed ** literally and keeps the rest of the line", () => {
    expect(parseInlineSpans("A **claim that never closes")).toEqual([
      { text: "A **claim that never closes", bold: false },
    ]);
  });

  it("prints an empty **** literally", () => {
    expect(parseInlineSpans("****")).toEqual([{ text: "****", bold: false }]);
  });

  it("returns no spans for an empty line", () => {
    expect(parseInlineSpans("")).toEqual([]);
  });
});

describe("parseMarkdownBlocks", () => {
  it("makes one paragraph per blank-line-separated group", () => {
    const blocks = parseMarkdownBlocks("First para.\n\nSecond para.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      type: "paragraph",
      lines: [[{ text: "First para.", bold: false }]],
    });
  });

  it("keeps consecutive lines of one paragraph as separate lines", () => {
    const blocks = parseMarkdownBlocks("one\ntwo");
    expect(blocks).toEqual([
      {
        type: "paragraph",
        lines: [[{ text: "one", bold: false }], [{ text: "two", bold: false }]],
      },
    ]);
  });

  it("groups consecutive `- ` lines into ONE list", () => {
    const blocks = parseMarkdownBlocks("- alpha\n- beta\n- gamma");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({
      type: "list",
      ordered: false,
      items: [
        [{ text: "alpha", bold: false }],
        [{ text: "beta", bold: false }],
        [{ text: "gamma", bold: false }],
      ],
    });
  });

  it("keeps a blank-line-separated (loose) list as ONE list", () => {
    // How the research model actually writes a list — see the live answer.
    const blocks = parseMarkdownBlocks("- alpha\n\n- beta\n\n- gamma");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "list", ordered: false });
  });

  it("reads a bold-only line as a heading", () => {
    const blocks = parseMarkdownBlocks("**Industry Overview:**\n\nThe market is large.");
    expect(blocks[0]).toEqual({
      type: "heading",
      spans: [{ text: "Industry Overview:", bold: false }],
    });
    expect(blocks[1].type).toBe("paragraph");
  });

  it("does not read a line with bold on both ends as a heading", () => {
    const blocks = parseMarkdownBlocks("**Revenue** grew, and **margin** did too");
    expect(blocks[0].type).toBe("paragraph");
  });

  it("reads an ATX `###` line as a heading", () => {
    expect(parseMarkdownBlocks("### Startup Costs")[0]).toEqual({
      type: "heading",
      spans: [{ text: "Startup Costs", bold: false }],
    });
  });

  it("reads a `1.` run as one ordered list", () => {
    const blocks = parseMarkdownBlocks("1. first\n2. second");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "list", ordered: true });
  });

  it("ends the list when the prose resumes", () => {
    const blocks = parseMarkdownBlocks("Intro:\n- alpha\n- beta\nClosing line.");
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "list", "paragraph"]);
  });

  it("keeps the bolded lead-in inside a list item", () => {
    const blocks = parseMarkdownBlocks("- **Total Revenue:** about $70B [2]");
    expect(blocks[0]).toEqual({
      type: "list",
      ordered: false,
      items: [
        [
          { text: "Total Revenue:", bold: true },
          { text: " about $70B [2]", bold: false },
        ],
      ],
    });
  });

  it("returns no blocks for an empty or whitespace-only answer", () => {
    expect(parseMarkdownBlocks("")).toEqual([]);
    expect(parseMarkdownBlocks("   \n\n  ")).toEqual([]);
  });

  it("never returns markup — every leaf is text plus a bold flag", () => {
    const blocks = parseMarkdownBlocks("- <img src=x onerror=alert(1)> **<b>hi</b>**");
    expect(JSON.stringify(blocks)).toContain("<img src=x onerror=alert(1)>");
    expect(blocks[0]).toMatchObject({ type: "list" });
  });
});
