// SourceSheet — depth 3 of the source-reference pattern. The source itself,
// pinpointed, view-only, without leaving the page you were reading.
//
// Design rules this file enforces (see components.css header for the full set):
//   R1 The claim travels with you — restated at the head in AI chrome, so the
//      overlay never hides the thing being proved.
//   R2 Crossing into a source changes the chrome — .ai-surface amber wraps the
//      CLAIM only. The body is neutral: this is the record, not the agent.
//   R3 Pinpoint with context — highlight the exact span/field, keep what
//      surrounds it visible but recessive.
//   R4 View only, and say so — one read-only marker, one clearly-secondary
//      escape hatch.
//   R5 A missing source is a stated fact — never an empty body.
//   R6 Escape returns you where you were — Radix Dialog restores focus to the
//      trigger; we add nothing that navigates by default.
//   R7 When the source is SPEECH, show the turns around it. A document sentence
//      is rarely reversed by its neighbour; a spoken one constantly is. FRE 106
//      (the rule of completeness) exists for exactly this, and quoted speech
//      here is held to the same standard.
//   R8 Verbatim and derived never share a surface. What someone SAID is the
//      record (neutral chrome); what we CONCLUDED from it is the agent (AI
//      chrome, attributed). R2 applied inside a single body.

import { useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  AudioLines,
  Calculator,
  Database,
  FileText,
  Globe,
  Landmark,
  MessageSquareQuote,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import type { Pin, ProvenanceType, Turn } from "../../lib/grant/types";
import { resolveSource, type SourceView } from "../../lib/sources/resolve";
import type { PublicEntry, PublicTally } from "../../lib/sources/publicRecords";
import type { RecordDescriptor } from "../../lib/sources/records";

/** Keyed off the provenance TYPE, not the header label — the label is dynamic
 *  for conversations ("Diana Potts, on the call") and would never match a map. */
const TYPE_ICON: Record<ProvenanceType, typeof FileText> = {
  solicitation: FileText,
  fpds: Database,
  sam: Landmark,
  web: Globe,
  profile: ShieldCheck,
  computed: Calculator,
  chat: MessageSquareQuote,
  transcript: AudioLines,
  // A government register reads as federal authority, not as a document.
  public: Landmark,
};

function KindIcon({ type }: { type?: ProvenanceType }) {
  // `type` is wire data: an absent provenance or a type outside the union both
  // land on the document glyph rather than on `undefined is not a component`.
  const Icon = (type && TYPE_ICON[type]) || FileText;
  return <Icon size={13} strokeWidth={1.75} aria-hidden />;
}

/* ── Body A · a document passage ─────────────────────────────────────── */
function DocBody({ view }: { view: Extract<SourceView, { kind: "doc" }> }) {
  return (
    <div className="src-doc">
      {view.before ? <p className="src-doc__ctx">{view.before}</p> : null}
      <p className="src-doc__hit">{view.sectionOnly ? view.span : <mark>{view.span}</mark>}</p>
      {view.after ? <p className="src-doc__ctx">{view.after}</p> : null}
      {view.sectionOnly ? (
        <p className="src-doc__note">
          Grant pointed at this section rather than a single sentence, so nothing is highlighted.
        </p>
      ) : view.contextMissing ? (
        <p className="src-doc__note">
          This is the passage Grant recorded. The surrounding text of the document isn&rsquo;t
          available here.
        </p>
      ) : null}
    </div>
  );
}

/* ── Body B · a saved record ─────────────────────────────────────────── */
function RecordBody({ record }: { record: RecordDescriptor }) {
  const pinned = new Set(record.pinned);
  return (
    <div className="src-rec">
      <div className="src-rec__id">
        <span className="src-rec__icon">
          <ShieldCheck size={17} strokeWidth={1.75} aria-hidden />
        </span>
        <span>
          <span className="src-rec__title">{record.title}</span>
          <span className={`src-rec__status src-rec__status--${record.status.tone}`}>
            {record.status.text}
          </span>
        </span>
      </div>
      <dl className="src-rec__fields">
        {record.fields.map((f) => (
          <div
            key={f.key}
            className={`src-rec__row ${pinned.has(f.key) ? "src-rec__row--pinned" : "src-rec__row--rest"}`}
          >
            <dt>{f.label}</dt>
            <dd>{f.value ?? "Not on file"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── Body B2 · one row of a public government register ────────────────
   Structurally the record body, but the trust question differs: for your own
   record you ask "is this complete?"; for a government record you ask "which
   record is this, and how current?" — so the identity line carries freshness
   rather than a status. */
function PublicBody({ entry }: { entry: PublicEntry }) {
  const pinned = new Set(entry.pinned);
  return (
    <div className="src-rec">
      <div className="src-rec__id">
        <span className="src-rec__icon src-rec__icon--public">
          <Landmark size={17} strokeWidth={1.75} aria-hidden />
        </span>
        <span>
          <span className="src-rec__title">{entry.title}</span>
          {/* The header already names the register, so this line carries the
              one thing it doesn't: how current the copy is. */}
          <span className="src-rec__origin">Record {entry.asOf}</span>
        </span>
      </div>
      <dl className="src-rec__fields">
        {entry.fields.map((f) => (
          <div
            key={f.key}
            className={`src-rec__row ${pinned.has(f.key) ? "src-rec__row--pinned" : "src-rec__row--rest"}`}
          >
            <dt>{f.label}</dt>
            <dd>{f.value ?? "Not in the record"}</dd>
          </div>
        ))}
      </dl>
      {/* Stale-but-flagged is acceptable; stale-and-silent is a failure. */}
      {entry.lagNote ? <p className="src-lag">{entry.lagNote}</p> : null}
    </div>
  );
}

/* ── Body B3 · a figure counted over many public records ──────────────
   A derived number is only as believable as its basis. Showing one row would
   misrepresent it and showing every row would bury it, so this body does what
   every product that has solved this does: the figure, what was counted, and a
   few of the actual rows. Zillow shows the comps behind a Zestimate; Ramp shows
   the cohort behind a benchmark. Same move.

   The figure carries the --hl-* highlight, exactly as a quoted span does — it is
   the thing the claim rests on. */
function TallyBody({ tally }: { tally: PublicTally }) {
  return (
    <div className="src-fig">
      <p className="src-fig__value">
        <mark>{tally.figure}</mark>
      </p>
      <p className="src-fig__label">{tally.figureLabel}</p>

      <dl className="src-fig__basis">
        {tally.basis.map((b) => (
          <div key={b.label} className="src-fig__basisrow">
            <dt>{b.label}</dt>
            <dd>{b.value}</dd>
          </div>
        ))}
      </dl>

      {tally.sample.length ? (
        <div className="src-fig__sample">
          {/* The basis block already says what was counted, so this line only
              has to be honest about whether you are seeing all of it. */}
          <p className="src-fig__samplehead">
            {tally.sample.length < tally.sampleOf
              ? `Showing ${tally.sample.length} of ${tally.sampleOf} ${tally.unit ?? "records"}`
              : `All ${tally.sampleOf} ${tally.unit ?? "records"}`}
          </p>
          {tally.sample.map((sRow) => (
            <div key={sRow.key} className="src-fig__row">
              <span className="src-fig__rowlabel">{sRow.label}</span>
              <span className="src-fig__rowvalue">{sRow.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {tally.lagNote ? <p className="src-lag">{tally.lagNote}</p> : null}
    </div>
  );
}

/* ── Body C · a conversation ──────────────────────────────────────────
   The third geometry. Turns either side of the cited one are not decoration:
   "$2M" means nothing without the question that prompted it, and a spoken
   commitment can be undone by the next breath (R7). */

/** A turn's position in time: a call timecode passes through, an ISO instant is
 *  formatted, and anything that won't parse is dropped. A timestamp reading
 *  "Invalid Date" beside a quote undermines the one thing this sheet is for. */
function timeOf(at: unknown): string | null {
  if (typeof at !== "string" || !at) return null;
  if (/^\d{1,2}:\d{2}/.test(at)) return at;
  const d = new Date(at);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function TurnRow({ turn, pinned }: { turn: Turn; pinned: boolean }) {
  const at = timeOf(turn.at);
  return (
    <div
      className={`src-turn src-turn--${turn.role} ${pinned ? "src-turn--pinned" : "src-turn--rest"}`}
    >
      <span className="src-turn__who">
        {turn.speaker}
        {at ? <span className="src-turn__at">{at}</span> : null}
      </span>
      <span className="src-turn__text">{turn.text}</span>
    </div>
  );
}

function ThreadBody({ view }: { view: Extract<SourceView, { kind: "conversation" }> }) {
  const c = view.conversation;
  return (
    <div>
      <div className="src-thread">
        {c.turns.map((t) => (
          <TurnRow key={t.id} turn={t} pinned={t.id === c.citedTurnId} />
        ))}
      </div>

      {/* An attestation carries more weight than a passing remark, and the
          reader should not have to infer which this was. */}
      <span className={`src-attest${c.attested ? "" : " src-attest--remark"}`}>
        {c.attested
          ? view.isSelf
            ? "You answered this directly"
            : "Said directly, on the record"
          : "Said in passing — weaker evidence"}
      </span>

      {/* R8 · what we concluded, never mixed into what was said. */}
      {c.learning ? (
        <div className="src-learning">
          <p className="src-learning__label">
            <Sparkles size={11} strokeWidth={2} aria-hidden />
            {c.learningBy ?? "What we took from this"}
          </p>
          <p>{c.learning}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ── Body D · nothing to show, said out loud ─────────────────────────── */
function UnavailableBody({ view }: { view: Extract<SourceView, { kind: "unavailable" }> }) {
  return (
    <div className="src-unavail">
      <span className="src-unavail__icon">
        <AlertCircle size={17} strokeWidth={1.75} aria-hidden />
      </span>
      <h4>{view.headline}</h4>
      <p>
        {view.reason}{" "}
        {view.usedInAnalysis
          ? "Grant still used this reference, so treat the related claim as unconfirmed."
          : "Grant did not use it, so nothing in the analysis depends on it."}
      </p>
      {/* Not having the passage is not the same as not having the source. When
          we hold the agency's own posting we say so here, because the footer
          link is quiet by design (R4) and this body is where a reader decides
          whether they've hit a dead end. */}
      {view.href ? (
        <p className="src-unavail__origin">
          You can read the original at the source — the link is below.
        </p>
      ) : null}
    </div>
  );
}

/** Header accent, by how far the content sits from ground truth: a government
 *  record is federal-authority blue, a figure counted over many is analysis
 *  chrome. Nothing here is inferred — see publicRecords.ts. */
function headModifier(view: SourceView): string {
  if (view.kind === "record") return " src-sheet__kind--record";
  if (view.kind === "public" || view.kind === "tally") return " src-sheet__kind--public";
  if (view.kind === "unavailable") return " src-sheet__kind--missing";
  return "";
}

/* ── The sheet ───────────────────────────────────────────────────────── */
export function SourceSheet({
  pin,
  claim,
  claimBy = "Grant",
  noticeId,
  sourcePath,
  open,
  onOpenChange,
}: {
  pin: Pin;
  /** The sentence this source is proving. Carried into the sheet (R1). */
  claim: string;
  /** Which agent authored the claim. `null` when nothing did — a figure the
   *  page rendered straight from a record. Only an agent's words get AI chrome:
   *  showing a register figure under "Grant said" in amber would assert an
   *  authorship it does not have, which is the one thing --ai-* exists to
   *  prevent (public-records-PRD.md §3 D6). */
  claimBy?: string | null;
  /** Lets a bare section ref resolve to that section's text. */
  noticeId?: string;
  /** The issuing agency's posting URL for this opportunity — the source we show
   *  a member when the vendor record is HigherGov's. */
  sourcePath?: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const view = resolveSource(pin, { noticeId, sourcePath });

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md" className="src-sheet" aria-describedby={undefined}>
        <header className="src-sheet__head">
          <Modal.Title asChild>
            <span className={`src-sheet__kind${headModifier(view)}`}>
              <KindIcon type={pin?.provenance?.type} />
              Source · {view.sourceLabel}
            </span>
          </Modal.Title>
          <span className="src-sheet__headright">
            <span className="src-sheet__ro">View only</span>
            <Modal.Close asChild>
              <button type="button" className="ui-modal-close" aria-label="Close source">
                <X size={16} aria-hidden />
              </button>
            </Modal.Close>
          </span>
        </header>

        {/* R1 · the claim travels with you, in AI chrome — and only here (R2).
            D6 · unless nothing authored it, in which case the amber comes off. */}
        <div className={`src-sheet__claim${claimBy ? "" : " src-sheet__claim--plain"}`}>
          <p className="src-sheet__claimlabel">
            {claimBy ? <Sparkles size={11} strokeWidth={2} aria-hidden /> : null}
            {claimBy ? `${claimBy} said` : "What you tapped"}
          </p>
          <p>{claim}</p>
        </div>

        <div className="src-sheet__loc">
          <span className="src-sheet__path">{view.locator}</span>
        </div>

        <div className="src-sheet__body">
          {view.kind === "doc" ? <DocBody view={view} /> : null}
          {view.kind === "record" ? <RecordBody record={view.record} /> : null}
          {view.kind === "public" ? <PublicBody entry={view.entry} /> : null}
          {view.kind === "tally" ? <TallyBody tally={view.tally} /> : null}
          {view.kind === "conversation" ? <ThreadBody view={view} /> : null}
          {view.kind === "unavailable" ? <UnavailableBody view={view} /> : null}
          {view.kind === "computed" ? (
            <div className="src-doc">
              <p className="src-doc__hit">{view.note}</p>
            </div>
          ) : null}
        </div>

        <div className="src-sheet__foot">
          <span className="src-sheet__prov">{view.provLine}</span>
          {/* R4 · exactly one escape hatch, clearly secondary. For a document it
              reveals the section in the page behind (no new tab); for a record it
              links to the page that owns it; for an external source it opens the
              original, which `externalSourceUrl` has already vetted. */}
          {view.kind === "doc" && view.revealRef ? (
            <Modal.Close asChild>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  // `grant:jump-to-source` is what the page already listens for
                  // (EvidenceBlock scrolls itself into view and flashes). Closing
                  // the sheet first is what makes this a reveal rather than a
                  // navigation — the reader lands on the document they were
                  // already looking at.
                  window.dispatchEvent(
                    new CustomEvent("grant:jump-to-source", { detail: pin.provenance }),
                  )
                }
              >
                Show this section in the document
                <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
              </button>
            </Modal.Close>
          ) : view.kind === "conversation" && view.conversation.playAt ? (
            // The gold standard for a call citation is to resume the recording at
            // the exact moment (Gong, Dovetail). Wire to the Fireflies deep link.
            <a
              className="btn btn-ghost btn-sm"
              href={`#play-${view.conversation.playAt.replace(":", "-")}`}
            >
              <PlayCircle size={12} strokeWidth={2} aria-hidden />
              Play from {view.conversation.playAt}
            </a>
          ) : view.href ? (
            <a
              className="btn btn-ghost btn-sm"
              href={view.href}
              {...(view.href.startsWith("/")
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
            >
              {view.hrefLabel}
              <ArrowUpRight size={12} strokeWidth={2} aria-hidden />
            </a>
          ) : (
            <span />
          )}
        </div>
      </Modal.Content>
    </Modal.Root>
  );
}

/** Convenience wrapper: a chip that opens its own sheet. */
export function SourceChip({
  pin,
  claim,
  claimBy = "Grant",
  noticeId,
  sourcePath,
}: {
  pin: Pin;
  claim: string;
  claimBy?: string | null;
  noticeId?: string;
  sourcePath?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const view = resolveSource(pin, { noticeId, sourcePath });
  // Same reason as EvidencePin: the label is wire data on a render path.
  const label = typeof pin?.label === "string" ? pin.label : "Source";
  const variant =
    view.kind === "record"
      ? "record"
      : view.kind === "conversation"
        ? "said"
        : view.kind === "unavailable"
        ? "missing"
        : view.kind === "public" || view.kind === "tally"
          ? "public"
          : "doc";
  return (
    <>
      <button
        type="button"
        className={`src-chip${variant === "doc" ? "" : ` src-chip--${variant}`}`}
        onClick={(e) => {
          // Focus must not be stranded inside an aria-hidden subtree when the
          // dialog takes over — same lesson as the clickable-card pattern.
          e.currentTarget.blur();
          setOpen(true);
        }}
        aria-label={`Source: ${label}`}
      >
        {label}
      </button>
      <SourceSheet
        pin={pin}
        claim={claim}
        claimBy={claimBy}
        noticeId={noticeId}
        sourcePath={sourcePath}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
