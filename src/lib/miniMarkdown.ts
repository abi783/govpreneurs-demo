// A parser for the markdown subset a chat model writes, and nothing wider.
//
// It exists because the research model answers in markdown and the card that
// showed the answer rendered it as one flat string — the member read
// `**Industry Overview:**` with the asterisks on screen.
//
// Three rules govern what is here:
//
//   1. It returns STRUCTURE, never markup. Every leaf is `{ text, bold }`, so
//      the caller builds React nodes and no path exists for the model to inject
//      markup. This is why there is no HTML string anywhere in this file, and
//      why a caller never needs `dangerouslySetInnerHTML` to render an answer.
//   2. It covers only what the model emits — bold, bullets, numbered items,
//      headings, paragraphs. Anything else (tables, links, code fences, nested
//      lists) prints as the model wrote it. Literal text is a defensible
//      degradation; a half-parsed table is not.
//   3. Malformed input degrades, never throws. An unclosed `**` prints
//      literally and the rest of the answer still renders — a swallowed answer
//      would cost the member the whole card.

/** One run of inline text, either bold or plain. Text only — never markup. */
export interface MdSpan {
  text: string;
  bold: boolean;
}

/** One block of an answer, in the order the model wrote it. */
export type MdBlock =
  | { type: "heading"; spans: MdSpan[] }
  | { type: "paragraph"; lines: MdSpan[][] }
  | { type: "list"; ordered: boolean; items: MdSpan[][] };

const ATX_HEADING = /^#{1,6}\s+(.*)$/;
const BULLET_ITEM = /^[-*]\s+(.*)$/;
const ORDERED_ITEM = /^\d{1,2}[.)]\s+(.*)$/;
const BOLD_LINE = /^\*\*(.+)\*\*$/;

/** Splits a line into bold and plain runs. An unclosed `**` stays literal. */
export function parseInlineSpans(line: string): MdSpan[] {
  const spans: MdSpan[] = [];
  const bold = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = bold.exec(line)) !== null) {
    if (m.index > last) spans.push({ text: line.slice(last, m.index), bold: false });
    spans.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) spans.push({ text: line.slice(last), bold: false });
  return spans;
}

type LineKind =
  | { kind: "blank" }
  | { kind: "heading"; text: string }
  | { kind: "item"; text: string; ordered: boolean }
  | { kind: "text"; text: string };

/** Classifies one line. A line that is ONE whole bold run is a section heading;
 *  a line with bold at both ends is prose, not a heading. */
function classifyLine(raw: string): LineKind {
  const line = raw.trim();
  if (!line) return { kind: "blank" };
  const atx = ATX_HEADING.exec(line);
  if (atx) return { kind: "heading", text: atx[1] };
  const bullet = BULLET_ITEM.exec(line);
  if (bullet) return { kind: "item", text: bullet[1], ordered: false };
  const ordered = ORDERED_ITEM.exec(line);
  if (ordered) return { kind: "item", text: ordered[1], ordered: true };
  const boldOnly = BOLD_LINE.exec(line);
  if (boldOnly && !boldOnly[1].includes("**")) return { kind: "heading", text: boldOnly[1] };
  return { kind: "text", text: line };
}

/** Collects lines into blocks, closing the open block whenever the kind changes. */
class BlockBuilder {
  private readonly blocks: MdBlock[] = [];
  private paragraph: string[] = [];
  private items: string[] = [];
  private ordered = false;

  /** Ends a paragraph. It does NOT end a list: the research model writes its
   *  items with a blank line between them, and four one-item lists are not
   *  what it wrote. Prose or a heading is what closes a list. */
  blank(): void {
    if (this.items.length > 0) return;
    this.flush();
  }

  /** Closes whatever block is open. At most one is, so the order is stable. */
  flush(): void {
    if (this.paragraph.length > 0) {
      this.blocks.push({ type: "paragraph", lines: this.paragraph.map(parseInlineSpans) });
      this.paragraph = [];
    }
    if (this.items.length > 0) {
      this.blocks.push({
        type: "list",
        ordered: this.ordered,
        items: this.items.map(parseInlineSpans),
      });
      this.items = [];
    }
  }

  heading(text: string): void {
    this.flush();
    this.blocks.push({ type: "heading", spans: parseInlineSpans(text) });
  }

  item(text: string, ordered: boolean): void {
    if (this.paragraph.length > 0 || (this.items.length > 0 && this.ordered !== ordered)) {
      this.flush();
    }
    this.ordered = ordered;
    this.items.push(text);
  }

  text(line: string): void {
    if (this.items.length > 0) this.flush();
    this.paragraph.push(line);
  }

  done(): MdBlock[] {
    this.flush();
    return this.blocks;
  }
}

/** Parses an answer into ordered blocks. Unsupported markup stays literal text. */
export function parseMarkdownBlocks(text: string): MdBlock[] {
  const builder = new BlockBuilder();
  for (const raw of text.split("\n")) {
    const line = classifyLine(raw);
    switch (line.kind) {
      case "blank":
        builder.blank();
        break;
      case "heading":
        builder.heading(line.text);
        break;
      case "item":
        builder.item(line.text, line.ordered);
        break;
      default:
        builder.text(line.text);
    }
  }
  return builder.done();
}
