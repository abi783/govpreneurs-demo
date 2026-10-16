// Shared render primitives for Grant's surface. Design-system rules:
//   • Grant's authored output is AI output → amber `.ai-surface` + attribution.
//   • Every colored signal pairs a hue with a glyph (survives grayscale).
//   • One bold consequence-phrase per line; numbers in the mono/tabular face.
import {
  AlertTriangle,
  Check,
  Circle,
  HelpCircle,
  Minus,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type { Pin, RichLine, Tone } from "../../lib/grant/types";
import { chipVariant, refLabel } from "../../lib/sources/resolve";
import { SourceSheet } from "../SourceRef/SourceSheet";

export function RichText({ line }: { line: RichLine }) {
  return (
    <>
      {line.map((seg, i) =>
        seg.bold ? <b key={i}>{seg.text}</b> : <span key={i}>{seg.text}</span>,
      )}
    </>
  );
}

/** A stack of rich lines, each its own scannable line. */
export function RichLines({ lines, className }: { lines: RichLine[]; className?: string }) {
  return (
    <>
      {lines.map((ln, i) => (
        <p key={i} className={className}>
          <RichText line={ln} />
        </p>
      ))}
    </>
  );
}

const GLYPHS: Record<string, LucideIcon> = {
  check: Check,
  x: X,
  help: HelpCircle,
  "alert-triangle": AlertTriangle,
  dot: Circle,
  dash: Minus,
};

/** Color + glyph, always together. */
export function ToneGlyph({
  glyph,
  tone,
  size = 16,
}: {
  glyph: string;
  tone: Tone;
  size?: number;
}) {
  const Icon = GLYPHS[glyph] ?? Circle;
  return (
    <Icon size={size} strokeWidth={2} className={`grant-glyph grant-glyph--${tone}`} aria-hidden />
  );
}

/** Provenance pin — the "one tap to the evidence" affordance (§12.3). Tapping it
 *  opens the source sheet: the source itself, pinpointed, view-only, without
 *  leaving the page. Every pin resolves to a real body — a document passage with
 *  its surrounding context, the member's own record with the backing field
 *  highlighted, the turns of a conversation, or an explicit "we could not read
 *  this" — so a tappable chip never leads nowhere.
 *
 *  The chip's variant advertises what the sheet will show, so the doorway matches
 *  the room: your own record reads differently from the solicitation, and a
 *  source we couldn't read says so before you tap it.
 *
 *  `claim` is the sentence this pin is proving — carried into the sheet so the
 *  overlay never hides what the reader was reading. `noticeId` lets a bare
 *  §-clause ref resolve to that section's real text instead of "no excerpt".
 *
 *  Links out (a safe non-HigherGov URL) and the in-page jump to the evidence
 *  block both survive as the sheet's single escape hatch — see SourceSheet. */
export function EvidencePin({
  pin,
  claim,
  noticeId,
  sourcePath,
}: {
  pin: Pin;
  claim?: string;
  noticeId?: string;
  /** The issuing agency's posting URL, so a solicitation pin with no passage of
   *  its own can still reach the real source. Never a HigherGov link. */
  sourcePath?: string | null;
}) {
  // A pin is wire data all the way down, and this runs inside the canvas: a
  // missing provenance or a non-string label must degrade to a chip that still
  // opens (the sheet explains the gap), never to a throw that unmounts the take.
  const quote = typeof pin?.provenance?.quote === "string" ? pin.provenance.quote : null;
  const label = typeof pin?.label === "string" ? pin.label : "Source";
  // The hover title falls back to the REF when there is no quote — and a ref is
  // an addressing string, not a citation: "award:W912…#winner" is a key. Route
  // it through refLabel so the register prefix and highlight list are dropped
  // and a URL never appears at all.
  const coordinate = refLabel(typeof pin?.provenance?.ref === "string" ? pin.provenance.ref : "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const variant = chipVariant(pin, { noticeId, sourcePath });
  return (
    <>
      <button
        type="button"
        className={`grant-pin${variant === "doc" ? "" : ` grant-pin--${variant}`}`}
        title={quote ?? (coordinate ? `Source: ${coordinate}` : `Source: ${label}`)}
        aria-label={`Source: ${label}`}
        onClick={(e) => {
          // Focus must not be stranded inside an aria-hidden subtree when the
          // dialog takes over — same lesson as the clickable-card pattern.
          e.currentTarget.blur();
          setSheetOpen(true);
        }}
      >
        {label}
      </button>
      <SourceSheet
        pin={pin}
        noticeId={noticeId}
        sourcePath={sourcePath}
        claim={claim ?? `Grant cited ${label}.`}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}

/** AI-authorship attribution (mandatory on AI output). */
export function GrantAttr({ subtitle }: { subtitle?: string }) {
  return (
    <span className="grant-attr">
      <Sparkles size={13} strokeWidth={2} aria-hidden />
      Grant{subtitle ? <span className="grant-attr__sub"> · {subtitle}</span> : null}
    </span>
  );
}

export function SkeletonRow({ w = "100%" }: { w?: string }) {
  return <span className="grant-skel" style={{ width: w }} aria-hidden />;
}
