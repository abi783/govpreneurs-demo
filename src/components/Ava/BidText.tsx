// A part of her proposal as it reads now: Ava's words, her answers in them,
// where each fact came from, and a marked hole wherever her input goes.
// Tapping a hole opens its ask in the chat (both ways: the ask names its
// spot). In phase 2 every sentence can be tapped, to change it or to ask why
// it is there. Used small on the right in phase 1 and as the page in phase 2.

import { Fragment, type ReactNode } from "react";
import { InlineHole } from "../ds/AgentWorkspace";
import { claimView, sectionParagraphs } from "../../lib/ava/derive";
import { sentenceRanges } from "../../lib/ava/thread";
import { decisionKey } from "../../lib/ava/store";
import type { AvaBid, DraftSection, Span } from "../../lib/ava/types";
import type { BidState } from "../../lib/ava/store";

/** "[NEEDED: your event jobs since 2022]" → "your event jobs since 2022". */
export function gapWords(gap: string | undefined, fallback: string): string {
  if (!gap) return fallback;
  return gap.replace(/^\[(NEEDED|CONFIRM):\s*/i, "").replace(/\]$/, "");
}

/** The words of a span as they read now. */
function spanText(bid: AvaBid, s: BidState, sp: Span): string {
  if (!sp.claim) return sp.text;
  const v = claimView(bid, s, sp.claim);
  return v.tag === "unsupported" ? gapWords(v.gap, sp.text) : (v.text ?? sp.text);
}

/** Where a fact came from, as a small chip: "Your profile", "Your answer". */
function provenance(bid: AvaBid, s: BidState, sp: Span): string | null {
  if (!sp.claim) return null;
  const v = claimView(bid, s, sp.claim);
  if (v.tag === "unsupported" || v.tag === "commitment") return null;
  if (v.proof?.kind === "you-confirmed") return "Your answer";
  if (v.proof?.kind === "profile") return "Your profile";
  if (v.proof?.kind === "your-document") return "Your file";
  if (v.proof?.kind === "sam") return "SAM.gov";
  return v.proof ? "Your records" : null;
}

export interface BidTextProps {
  bid: AvaBid;
  s: BidState;
  sec: DraftSection;
  /** "3. Menu and food safety". */
  heading: string;
  /** The hole (question key) shown as selected. */
  holeOn?: string | null;
  onHole: (key: string) => void;
  /** Phase 2: the selected sentence, and tapping one. */
  sentenceOn?: string | null;
  onSentence?: (key: string, text: string) => void;
  small?: boolean;
}

/** One paragraph, split into sentences she can tap, each holding its spans. */
function Paragraph({
  bid,
  s,
  sec,
  spans,
  pi,
  holeOn,
  onHole,
  sentenceOn,
  onSentence,
}: Omit<BidTextProps, "heading" | "small"> & { spans: Span[]; pi: number }) {
  const texts = spans.map((sp) => spanText(bid, s, sp));
  const full = texts.join("");
  const ranges = sentenceRanges(full);
  // Pieces of spans, cut at sentence ends, each knowing its sentence.
  const pieces: { sp: Span; text: string; n: number; first: boolean }[] = [];
  let pos = 0;
  spans.forEach((sp, i) => {
    const t = texts[i];
    let start = 0;
    while (start < t.length) {
      const at = pos + start;
      const n = Math.max(
        0,
        ranges.findIndex((r) => at >= r[0] && at < r[1]),
      );
      const end = Math.min(t.length, ranges[n][1] - pos);
      pieces.push({ sp, text: t.slice(start, end), n, first: start === 0 });
      start = end;
    }
    pos += t.length;
  });

  const renderPiece = (p: (typeof pieces)[number], k: number): ReactNode => {
    const { sp, text } = p;
    if (sp.claim) {
      const v = claimView(bid, s, sp.claim);
      const askKey = sp.claim.askId ? `ask:${sp.claim.askId}` : null;
      if (v.tag === "unsupported" && askKey) {
        return (
          <InlineHole
            key={k}
            on={holeOn === askKey}
            label={`Needs you: ${text.trim()}`}
            onOpen={() => onHole(askKey)}
          >
            {text}
          </InlineHole>
        );
      }
      if (v.tag === "commitment") {
        return (
          <span key={k} className="ava2-promise" title="A promise you make if you win">
            {text}
          </span>
        );
      }
      const from = provenance(bid, s, sp);
      return (
        <Fragment key={k}>
          {text}
          {from && p.first && /\S/.test(text) ? (
            <span className="ava2-from mono">{from}</span>
          ) : null}
        </Fragment>
      );
    }
    if (sp.decisionId) {
      const open = !s.decisions[decisionKey(sec.id, sp.decisionId)];
      const key = `decision:${decisionKey(sec.id, sp.decisionId)}`;
      return open ? (
        <InlineHole
          key={k}
          on={holeOn === key}
          label={`A choice only you can make: ${text}`}
          onOpen={() => onHole(key)}
        >
          {text}
        </InlineHole>
      ) : (
        <span key={k} className="ava2-yours">
          {text}
        </span>
      );
    }
    if (sp.edit) {
      return (
        <span key={k} className={`ava2-edit ava2-edit--${sp.edit}`}>
          {text}
        </span>
      );
    }
    return <Fragment key={k}>{text}</Fragment>;
  };

  if (!onSentence) return <p>{pieces.map(renderPiece)}</p>;
  return (
    <p>
      {ranges.map((_, n) => {
        const key = `${sec.id}:${pi}:${n}`;
        const mine = pieces.filter((p) => p.n === n);
        const words = mine
          .map((p) => p.text)
          .join("")
          .trim();
        if (!words) return null;
        return (
          <span
            key={key}
            role="button"
            tabIndex={0}
            className={`ava2-sent${sentenceOn === key ? " is-on" : ""}`}
            aria-pressed={sentenceOn === key}
            aria-label={`Change or ask about: ${words}`}
            onClick={() => onSentence(key, words)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSentence(key, words);
              }
            }}
          >
            {mine.map((p, i) => renderPiece(p, i))}
          </span>
        );
      })}
    </p>
  );
}

export function BidText(props: BidTextProps) {
  const { s, sec, heading, small } = props;
  return (
    <div className={`ava2-text${small ? " ava2-text--small" : ""}`}>
      <h4>{heading}</h4>
      {sectionParagraphs(s, sec).map((spans, pi) => (
        <Paragraph key={pi} {...props} spans={spans} pi={pi} />
      ))}
    </div>
  );
}
