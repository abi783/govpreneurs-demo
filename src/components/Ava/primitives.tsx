// Ava's shared pieces. Every view composes these, so a source pin, a claim
// tag or a risk label looks and behaves the same everywhere.
//
// COLOR RULES (design system §6):
//   • The buyer's words are a government fact: neutral chrome, never amber.
//     Their pin is a blue mono chip because tapping it opens the source.
//   • Ava's own words (the draft, "why it matters", reasoning) sit inside
//     .ai-surface with an Ava attribution — machine-derived, check it.
//   • Missing is never red. Red (--urg) is kept for a Critical finding only:
//     the one thing that gets a bid rejected.
//   • Every state carries a word and a glyph, never color alone.

import { useRef, useState, type ReactNode, type RefObject } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CircleDashed,
  FileText,
  Handshake,
  Keyboard,
  MessageCircleQuestion,
  Mic,
  Square,
  Sparkles,
  Upload,
  UserCheck,
  CircleAlert,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { useDictation } from "../ds/AgentChat";
import { fullDate } from "../../lib/ava/dates";
import { ava } from "../../lib/ava/store";
import type {
  AskKind,
  AskOwner,
  AvaBid,
  BidKind,
  ClaimTag,
  Commitment,
  Proof,
  ReqStatus,
  Severity,
  Source,
} from "../../lib/ava/types";

/** A stored ISO date inside a locator ("Answered 2026-05-07") is written out. */
export function readableLocator(locator: string): string {
  return locator.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_m, y, mo, d) =>
    fullDate(new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)))),
  );
}

// ─── Words, in one place ───

export const KIND_LABEL: Record<BidKind, { label: string; what: string }> = {
  "bid-package": {
    label: "Bid package",
    what: "A price and forms. Most low-bid awards and many quote requests.",
  },
  "short-response": {
    label: "Short response",
    what: "A short pass-or-fail write-up, plus the price and forms.",
  },
  "written-proposal": {
    label: "Written proposal",
    what: "Writing the buyer gives points for, plus the price and forms.",
  },
  qualifications: {
    label: "Qualifications",
    what: "Your experience only, ranked before the buyer asks for a price.",
  },
  reply: {
    label: "Reply to the buyer",
    what: "The buyer asks who can do the work. You answer by email. No price.",
  },
};

export const OWNER_LABEL: Record<AskOwner, string> = {
  you: "You",
  bookkeeper: "Your bookkeeper",
  "insurance-agent": "Your insurance agent",
  surety: "Your surety",
  references: "Your references",
  subcontractor: "Your partner company",
};

export const ASK_KIND_LABEL: Record<AskKind, string> = {
  approve: "Approve",
  upload: "Upload",
  enter: "Enter",
  answer: "Answer",
};

export const TAG_META: Record<ClaimTag, { label: string; what: string }> = {
  verified: { label: "Verified", what: "From your documents or the buyer's files." },
  confirmed: { label: "You confirmed", what: "You told Ava this." },
  unsupported: {
    label: "Unsupported",
    what: "No proof yet. It stays out of what you submit.",
  },
  commitment: {
    label: "Promise",
    what: "A promise you keep if you win. It needs your approval.",
  },
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  material: "Material",
  minor: "Minor",
};

const ASK_KIND_ICON: Record<AskKind, typeof Check> = {
  approve: Check,
  upload: Upload,
  enter: Keyboard,
  answer: MessageCircleQuestion,
};

/** The kind of ask, as a read-only chip: a word and a glyph, never color alone. */
export function AskKindChip({ kind }: { kind: AskKind }) {
  const Icon = ASK_KIND_ICON[kind];
  return (
    <span className={`ava-askkind ava-askkind--${kind}`}>
      <Icon size={11} strokeWidth={2.25} aria-hidden />
      {ASK_KIND_LABEL[kind]}
    </span>
  );
}

// ─── Attribution ───

/** Machine-derived content carries this: Ava made it, the member checks it. */
export function AvaAttr({ subtitle }: { subtitle?: string }) {
  return (
    <span className="ava-attr">
      <Sparkles size={12} strokeWidth={2} aria-hidden />
      Ava{subtitle ? <span className="ava-attr__sub"> · {subtitle}</span> : null}
    </span>
  );
}

// ─── Sources ───

export function fileName(bid: AvaBid, fileId: string): string {
  return bid.files.find((f) => f.id === fileId)?.name ?? "The buyer's file";
}

const PROOF_LABEL: Record<Proof["kind"], string> = {
  "your-document": "Your document",
  "you-confirmed": "Your answer",
  profile: "Your GovPreneurs profile",
  sam: "Your registration",
  "public-record": "A public record",
};

/** Ava's source sheet: the source itself, view only, without leaving the
 *  page. Same chrome as the shared SourceSheet (src-sheet), but Ava's own
 *  words — the shared sheet speaks as Grant and offers a jump into Grant's
 *  page, which does not exist here. The claim travels with you (amber, Ava's
 *  words); the source body is neutral (the record, not the agent). */
export function AvaSourceSheet({
  open,
  onOpenChange,
  kindLabel,
  claim,
  locator,
  quote,
  foot,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kindLabel: string;
  claim: string;
  locator: string;
  quote: string | null;
  foot: string;
  /** The pin that opened the sheet. Focus goes back to it when the sheet closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content
        size="md"
        className="src-sheet"
        aria-describedby={undefined}
        {...(returnFocusRef
          ? {
              onCloseAutoFocus: (e: Event) => {
                const el = returnFocusRef.current;
                if (!el || !el.isConnected) return;
                e.preventDefault();
                el.focus();
              },
            }
          : {})}
      >
        <header className="src-sheet__head">
          <Modal.Title asChild>
            <span className="src-sheet__kind">
              <FileText size={14} strokeWidth={1.75} aria-hidden /> Source · {kindLabel}
            </span>
          </Modal.Title>
          <span className="src-sheet__headright">
            <span className="src-sheet__ro">View only</span>
            <Modal.Close asChild>
              <button type="button" className="ui-modal-close" aria-label="Close source">
                <span aria-hidden>×</span>
              </button>
            </Modal.Close>
          </span>
        </header>
        <div className="src-sheet__claim">
          <p className="src-sheet__claimlabel">
            <Sparkles size={11} strokeWidth={2} aria-hidden /> Ava said
          </p>
          <p>{claim}</p>
        </div>
        <div className="src-sheet__loc">
          <span className="src-sheet__path">{locator}</span>
        </div>
        <div className="src-sheet__body">
          <div className="src-doc">
            {quote ? (
              <p className="src-doc__hit">
                <mark>{quote}</mark>
              </p>
            ) : (
              <p className="src-doc__hit">
                This rule is a table or a form, so there are no words to quote.
              </p>
            )}
          </div>
        </div>
        <div className="src-sheet__foot">
          <span className="src-sheet__prov">{foot}</span>
          <span />
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}

/** Blue mono chip → popover with the buyer's exact words → the full source sheet. */
export function SourcePin({
  bid,
  source,
  claim,
}: {
  bid: AvaBid;
  source: Source;
  /** The sentence this source proves. Carried into the sheet. */
  claim?: string;
}) {
  const [sheet, setSheet] = useState(false);
  const pinRef = useRef<HTMLButtonElement>(null);
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          ref={pinRef}
          type="button"
          className="ava-pin"
          aria-label={`Source: ${source.short}`}
        >
          {source.short}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="ava-pop"
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
        >
          <p className="ava-pop__head">
            <FileText size={12} strokeWidth={2} aria-hidden /> {fileName(bid, source.fileId)}
          </p>
          <p className="ava-pop__loc">{source.locator}</p>
          {source.quote ? (
            <blockquote className="ava-pop__quote">“{source.quote}”</blockquote>
          ) : (
            <p className="ava-pop__none">
              This rule is a table or a form, so there are no words to quote.
            </p>
          )}
          <Popover.Close asChild>
            <button type="button" className="ava-pop__open" onClick={() => setSheet(true)}>
              Open the source <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
            </button>
          </Popover.Close>
          <Popover.Arrow className="ava-pop__arrow" width={12} height={6} />
        </Popover.Content>
      </Popover.Portal>
      <AvaSourceSheet
        open={sheet}
        onOpenChange={setSheet}
        kindLabel="The buyer's file"
        claim={claim ?? `Ava cited ${source.short}.`}
        locator={`${fileName(bid, source.fileId)} · ${source.locator}`}
        quote={source.quote ?? null}
        foot="The buyer's words, exactly as written. Ava keeps its own copy of every file."
        returnFocusRef={pinRef}
      />
    </Popover.Root>
  );
}

/** Where a fact about the member came from. */
export function ProofPin({
  proof,
  claim,
  label,
}: {
  proof: Proof;
  claim?: string;
  label?: string;
}) {
  const [sheet, setSheet] = useState(false);
  const pinRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={pinRef} type="button" className="ava-proofpin" onClick={() => setSheet(true)}>
        {label ?? proof.from}
      </button>
      <AvaSourceSheet
        open={sheet}
        onOpenChange={setSheet}
        kindLabel={PROOF_LABEL[proof.kind]}
        claim={claim ?? proof.quote}
        locator={`${proof.from} · ${readableLocator(proof.locator)}`}
        quote={proof.quote}
        foot={
          proof.kind === "you-confirmed"
            ? "What you told Ava. You stand behind it when you sign."
            : "Your own record. You stand behind it when you sign."
        }
        returnFocusRef={pinRef}
      />
    </>
  );
}

/** The buyer's own words, with where they came from. Neutral: a government fact. */
export function BuyerQuote({
  bid,
  source,
  claim,
}: {
  bid: AvaBid;
  source: Source;
  claim?: string;
}) {
  if (!source.quote) {
    return (
      <p className="ava-quote ava-quote--none">
        {fileName(bid, source.fileId)}, {source.locator}{" "}
        <SourcePin bid={bid} source={source} claim={claim} />
      </p>
    );
  }
  return (
    <figure className="ava-quote">
      <blockquote>“{source.quote}”</blockquote>
      <figcaption>
        <SourcePin bid={bid} source={source} claim={claim} />
        <span className="ava-quote__loc">
          {fileName(bid, source.fileId)} · {source.locator}
        </span>
      </figcaption>
    </figure>
  );
}

// ─── States ───

export function ReqMark({ status }: { status: ReqStatus }) {
  if (status === "meets") {
    return (
      <span className="ava-req ava-req--meets">
        <Check size={12} strokeWidth={2.25} aria-hidden /> Meets
      </span>
    );
  }
  if (status === "not-yet") {
    return (
      <span className="ava-req ava-req--notyet">
        <CircleAlert size={12} strokeWidth={2} aria-hidden /> Not yet
      </span>
    );
  }
  return (
    <span className="ava-req ava-req--confirm">
      <CircleDashed size={12} strokeWidth={2} aria-hidden /> Confirm
    </span>
  );
}

const TAG_ICON: Record<ClaimTag, typeof Check> = {
  verified: Check,
  confirmed: UserCheck,
  unsupported: CircleAlert,
  commitment: Handshake,
};

export function TagChip({ tag }: { tag: ClaimTag }) {
  const Icon = TAG_ICON[tag];
  return (
    <span className={`ava-tag ava-tag--${tag}`}>
      <Icon size={11} strokeWidth={2.25} aria-hidden />
      {TAG_META[tag].label}
    </span>
  );
}

export function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span className={`ava-sev ava-sev--${severity}`}>
      {severity === "critical" ? <AlertTriangle size={11} strokeWidth={2.25} aria-hidden /> : null}
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

// ─── Layout ───

/** A titled box. `label` is the small uppercase eyebrow. */
export function AvaCard({
  label,
  children,
  className,
  aside,
  id,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <section className={`ava-card${className ? ` ${className}` : ""}`} id={id}>
      {label || aside ? (
        <header className="ava-card__head">
          {label ? <h2 className="ava-card__label">{label}</h2> : <span />}
          {aside}
        </header>
      ) : null}
      {children}
    </section>
  );
}

// ─── Clipboard ───

/** Copy text. Ava copies; the member sends. Returns false when the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Dialogs ───

/** Going ahead at risk: always allowed, always labeled, one-line reason. */
/** Reasons she can pick instead of typing one. */
const RISK_REASONS = [
  "I checked it myself",
  "The buyer will not answer in time",
  "My mentor said to go ahead",
];

export function RiskDialog({
  open,
  onOpenChange,
  what,
  label,
  onConfirm,
  reasons = RISK_REASONS,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** What the member is going ahead without. */
  what: string;
  /** Kept for the record the caller writes; the dialog shows the label in
   *  words, never a severity chip she cannot read (review panel, round 2). */
  severity: Severity;
  /** The label that stays on the package: "Ready, not checked against Exhibit D". */
  label: string;
  onConfirm: (reason: string) => void;
  /** Short reasons to pick, so she does not have to type English. */
  reasons?: string[];
}) {
  const [reason, setReason] = useState("");
  // Talking beats typing: she can say her reason (review panel, 7 October 2026).
  const dictation = useDictation(
    (said) => setReason(said),
    () => "I will check this myself before I send the bid.",
  );
  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="sm" className="ava-modal" aria-describedby={undefined}>
        <Modal.Header title="Go ahead at risk" description={what} />
        <Modal.Body>
          <p className="ava-dialog__p">I list it in How to send it, so you remember it.</p>
          <p className="ava-dialog__label">
            <span>The note I keep: {label}</span>
          </p>
          <p className="ava-dialog__p">The buyer never sees this note.</p>
          <span className="ava-field__label">
            Why do you want to go ahead? Pick one, say it, or type it.
          </span>
          <div className="ava-dialog__reasons">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                className={`btn ${reason === r ? "btn-primary" : "btn-secondary"}`}
                aria-pressed={reason === r}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
            {dictation.can ? (
              <button type="button" className="btn btn-secondary" onClick={dictation.toggle}>
                {dictation.live ? <Square size={16} aria-hidden /> : <Mic size={16} aria-hidden />}
                {dictation.live ? "Stop" : "Say it"}
              </button>
            ) : null}
          </div>
          <label className="ava-field">
            <span className="ava-field__label">Your reason, in your words</span>
            <input
              className="ava-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="For example: the city will not answer before the deadline"
            />
          </label>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close asChild>
            <button type="button" className="btn btn-ghost">
              Go back
            </button>
          </Modal.Close>
          {reason.trim() ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onConfirm(reason.trim());
                setReason("");
                onOpenChange(false);
              }}
            >
              Go ahead with this label
            </button>
          ) : (
            <span className="ava-dialog__need">Pick or say a reason to go ahead.</span>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

/** A deliberate confirmation for price, key people and promises. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  lines,
  agreement,
  confirmLabel,
  needLine,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  /** What the member is agreeing to, one fact per line. */
  lines: string[];
  /** The sentence the member ticks. */
  agreement: string;
  confirmLabel: string;
  /** Shown until the box is ticked. Default: "Tick the box to approve." */
  needLine?: string;
  onConfirm: () => void;
}) {
  const [ticked, setTicked] = useState(false);
  return (
    <Modal.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) setTicked(false);
        onOpenChange(o);
      }}
    >
      <Modal.Content size="sm" className="ava-modal" aria-describedby={undefined}>
        <Modal.Header title={title} />
        <Modal.Body>
          <ul className="ava-dialog__list">
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <label className="ava-check">
            <input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} />
            <span>{agreement}</span>
          </label>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close asChild>
            <button type="button" className="btn btn-ghost">
              Not yet
            </button>
          </Modal.Close>
          {ticked ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onConfirm();
                setTicked(false);
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </button>
          ) : (
            <span className="ava-dialog__need">{needLine ?? "Tick the box to approve."}</span>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}

/** Approving a promise the member keeps if they win. One dialog, used from
 *  the list and the brief, so the words and the write are the same in both. */
export function PromiseConfirm({
  open,
  onOpenChange,
  noticeId,
  commitment,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  noticeId: string;
  commitment: Commitment;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Approve this promise"
      lines={[commitment.text, ...(commitment.pricedAs ? [commitment.pricedAs] : [])]}
      agreement="I understand this is a promise I keep if I win."
      confirmLabel="Approve this promise"
      onConfirm={() => ava.approveCommitment(noticeId, commitment.id, commitment.text)}
    />
  );
}
