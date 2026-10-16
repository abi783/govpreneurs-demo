// The web-research answer — the `WebResearchPayload` artifact on the stage.
//
// Moved here from the chat thread UNCHANGED. This is the one card where the
// target is better than the prototype it is being synced with: the prototype
// carries a bare `source` string in a `title` attribute, this one carries
// numbered citations with a host and a trusted flag. Porting the prototype's
// version would be a regression, so nothing inside here was rewritten.
//
// Four safety properties travel with it, and all four are load-bearing:
//
//   1. Every citation renders its number, its title and its host.
//   2. A URL reaches an `href` only through `httpUrlOrNull`. A rejected URL
//      hides the LINK, never the citation — the source still reads, it just
//      is not clickable.
//   3. `MAX_CITATIONS` bounds the list, and the card says how many it dropped.
//      The bound is applied BEFORE the inline markers are indexed, so a marker
//      past the cap has no source and stays plain text rather than pointing at
//      a row that is not on screen.
//   4. The disclaimer stands: this is a live web search, not the solicitation.
//
// The answer arrives in markdown, so `parseMarkdownBlocks` turns it into blocks
// and this file turns those blocks into React NODES. Nothing here builds markup,
// so the model cannot inject any — this card never reaches for
// `dangerouslySetInnerHTML`. Citation markers are read from the LEAF text of
// every span, so a `[n]` written inside a bold run or a list item is still a
// chip. The four properties above hold wherever the marker sits.

import { Fragment, useMemo, type ReactNode } from "react";
import { ExternalLink, Globe, ShieldCheck } from "lucide-react";
import type { WebResearchPayload } from "../../../lib/hunterChat";
import { httpUrlOrNull } from "../../../lib/safeUrl";
import { boundedList, MAX_CITATIONS } from "../../../lib/renderLimits";
import { parseMarkdownBlocks, type MdBlock, type MdSpan } from "../../../lib/miniMarkdown";

/** The bounded citations, by their 1-based marker number. */
type CiteIndex = Map<number, WebResearchPayload["citations"][number]>;

/** Renders one run of answer text, turning inline `[n]` markers into clickable
 *  superscript citation chips that jump to the matching source (new tab). A
 *  marker with no matching source renders as plain text, and so does one whose
 *  source URL is not an ordinary web link (`httpUrlOrNull`) — a citation is
 *  http(s) or it is not a link. */
function renderWithCitations(text: string, byIndex: CiteIndex) {
  const parts: ReactNode[] = [];
  const re = /\[(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const n = Number(m[1]);
    const cite = byIndex.get(n);
    const href = cite ? httpUrlOrNull(cite.url) : null;
    if (cite && href) {
      parts.push(
        <a
          key={`c-${key++}`}
          className="hunter-research__cite"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${cite.title} — ${cite.host}`}
        >
          {n}
        </a>,
      );
    } else if (cite) {
      parts.push(
        <span
          key={`c-${key++}`}
          className="hunter-research__cite hunter-research__cite--inert"
          title={`${cite.title} — ${cite.host}`}
        >
          {n}
        </span>,
      );
    } else {
      parts.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Renders one line's spans. A bold span is a `<strong>` around the SAME
 *  citation-aware text render, so a marker inside bold stays a chip. */
function renderSpans(spans: MdSpan[], byIndex: CiteIndex): ReactNode[] {
  return spans.map((span, i) => {
    const body = renderWithCitations(span.text, byIndex);
    if (span.bold) return <strong key={i}>{body}</strong>;
    return <Fragment key={i}>{body}</Fragment>;
  });
}

/** Renders one parsed block — a heading, a list or a paragraph. */
function Block({ block, byIndex }: { block: MdBlock; byIndex: CiteIndex }) {
  if (block.type === "heading") {
    return <div className="hunter-research__heading">{renderSpans(block.spans, byIndex)}</div>;
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return (
      <Tag className="hunter-research__list">
        {block.items.map((item, i) => (
          <li key={i} className="hunter-research__item">
            {renderSpans(item, byIndex)}
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <p className="hunter-research__para">
      {block.lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderSpans(line, byIndex)}
        </Fragment>
      ))}
    </p>
  );
}

/** One source row. The title and host always render; only the LINK depends on
 *  the scheme, so a rejected URL hides the affordance, never the citation. */
function SourceRow({ cite }: { cite: WebResearchPayload["citations"][number] }) {
  const href = httpUrlOrNull(cite.url);
  const body = (
    <>
      <span className="hunter-research__source-title">{cite.title}</span>
      <span className="hunter-research__source-host">
        {cite.trusted && <ShieldCheck size={11} aria-label="Official / trusted source" />}
        {cite.host}
        {href && <ExternalLink size={11} aria-hidden />}
      </span>
    </>
  );
  return (
    <li className="hunter-research__source">
      <span className="hunter-research__source-num">{cite.index}</span>
      {href ? (
        <a
          className="hunter-research__source-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {body}
        </a>
      ) : (
        <span className="hunter-research__source-link hunter-research__source-link--inert">
          {body}
        </span>
      )}
    </li>
  );
}

/** Renders one researched answer, its numbered sources and the disclaimer. */
export function ResearchArtifact({ payload }: { payload: WebResearchPayload }) {
  const answer = payload?.answer ?? "";
  const citations = payload?.citations;
  // Bounded before anything indexes or renders it, so the inline markers agree
  // with the list: a marker past the cap has no source and stays plain text.
  const { shown, hidden } = useMemo(() => boundedList(citations ?? [], MAX_CITATIONS), [citations]);
  const byIndex = useMemo(() => new Map(shown.map((c) => [c.index, c])), [shown]);
  const blocks = useMemo(() => parseMarkdownBlocks(answer), [answer]);

  return (
    <div className="hunter-research">
      <div className="hunter-research__head">
        <Globe size={13} aria-hidden />
        <span className="hunter-research__kicker">Web research</span>
        <span className="hunter-research__live">live sources</span>
      </div>

      <div className="hunter-research__body">
        {blocks.map((block, i) => (
          <Block key={i} block={block} byIndex={byIndex} />
        ))}
      </div>

      {shown.length > 0 && (
        <div className="hunter-research__sources">
          <div className="hunter-research__sources-head">Sources</div>
          <ol className="hunter-research__source-list">
            {shown.map((c) => (
              <SourceRow key={c.index} cite={c} />
            ))}
          </ol>
          {hidden > 0 && (
            <div className="hunter-research__sources-more">and {hidden} more not shown</div>
          )}
        </div>
      )}

      <div className="hunter-research__disclaimer">
        General information from a live web search — verify against the official solicitation or
        current regulation. Not legal advice.
      </div>
    </div>
  );
}
