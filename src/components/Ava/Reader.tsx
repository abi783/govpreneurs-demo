// Phase 2, "Read it and send it" (ava-two-phase.html Part 3): the whole bid
// in the middle, a tab for each part, and Ava's chat on the right. No part
// picker, no page count, no bar. Her own read: tap any sentence to change it
// or to ask why it is there; holes stay marked and can go through; a mentor
// can read it first. A download held by something the buyer rejects a bid
// for shows the reason in the button's place (replace, never disable).
//
// Phase 2 is not the end of the questions (review panel, 7 October 2026):
// anything an addendum, a mentor's change or a date reopens is asked here,
// in the chat, and holds the download until she answers.

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  Camera,
  Check,
  Clock,
  Download,
  ExternalLink,
  Mic,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import {
  AgentMsg,
  AgentTurn,
  ChatCard,
  Composer,
  PersonMsg,
  QuickReplies,
  ThinkingTrace,
  YouMsg,
} from "../ds/AgentChat";
import {
  builtSummary,
  buyerWord,
  count,
  downloadSig,
  downloadStale,
  dueWords,
  lastWholeDownload,
  mentorTooLate,
  pieceWords,
  readNote,
  SAM_RENEWED_KEY,
  samWarning,
  samWords,
  selfChecks,
  usd,
  type Hold,
  type Question,
} from "../../lib/ava/flow";
import { approvalTotal } from "../../lib/ava/price";
import type { AvaBid } from "../../lib/ava/types";
import { acceptedRisks, riskAllowed } from "../../lib/ava/checks";
import { fullDate } from "../../lib/ava/dates";
import { daysLeft } from "../../lib/ava/derive";
import { findOpportunity } from "../../demo/ava/opportunity";
import { getGrantSummary } from "../../demo/ava/grantSummary";
import { createReview, MENTOR_REPLY, MENTOR_REPLY_DAYS } from "../../demo/ava/mentorReviews";
import { ava } from "../../lib/ava/store";
import type { Part } from "../../lib/ava/package";
import { sentencesOf } from "../../lib/ava/thread";
import { openOutside } from "./outside";
import { SendToMentorModal } from "./SendToMentorModal";
import { answerByWords, avaFace, QuestionCard, TALK_LINE } from "./Asking";
import { BidText } from "./BidText";
import { downloadBid } from "./download";
import { modeFor, planDownload, type PlannedPaper } from "./downloads";
import { keepPaper, papersVersion, subscribePapers } from "./paperFiles";
import { FormPaper } from "./FormPaper";
import { HowToSend } from "./HowToSend";
import { Papers } from "./Papers";
import { PortalDesk, PortalPriceDesk } from "./BidPortal";
import { bidModel } from "../../lib/ava/package";
import { RiskDialog, SourcePin } from "./primitives";
import { initials } from "./Showing";
import { Workbook } from "./Workbook";
import type { AvaContext } from "./useAva";
import type { BidState } from "../../lib/ava/store";
import type { FlowView } from "./useFlow";
import type { WorkspaceNav } from "./Workspace2";
import { FoldedSide, SideFold } from "../ds/AgentWorkspace";
import type { Side } from "./Frame2";

/** The right column in phase 2, by name. */
const CHAT_LABEL = "Ava's chat";

/** The mentor review, in the same words here and in the dialog she pays in.
 *  No pronoun: until a mentor is assigned, nobody knows who it is. */
export const MENTOR_SERVICE =
  "A mentor reads your whole bid and can change sentences in it. Each change shows the mentor's name, and you can undo it.";
export const MENTOR_WHERE = "The reply comes in Mentors.";

/** Her papers that are not in the file she would download: one that would
 *  not open, or one this session no longer holds. Never a file that names a
 *  paper it does not carry (review panel, round 2). PDF only: in Word, a
 *  paper is a marked space she fills. */
function missingPapers(ctx: AvaContext, holes: number): PlannedPaper[] {
  if (modeFor(holes) !== "pdf") return [];
  return planDownload(ctx, null, "pdf").papers.filter((p) => !p.inFile && !p.original);
}

/** Where a tap's result lands. Below 1100px the panes stack and the page
 *  scrolls as one, so it is centred; on a wide screen each pane scrolls on
 *  its own, and the window stays put so the header stays in view. */
function intoView(): ScrollLogicalPosition {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 1100px)").matches
    ? "center"
    : "nearest";
}

/** A hold's line. An addendum she added keeps its file name as she named it. */
function holdLine(h: Hold, s: BidState): string {
  const m = h.key.match(/^upload(-ack)?:(\d+)$/);
  const u = m ? s.addendumUploads[Number(m[2])] : null;
  if (!u) return h.text;
  return m![1]
    ? `No download yet: ${u.fileName} needs your acknowledgment.`
    : `No download yet: ${u.fileName} is not compared with your bid yet.`;
}

/** "the price sheet", from a part's label. */
function partWords(label: string): string {
  return /^(your|the)\b/i.test(label) ? label.toLowerCase() : `the ${label.toLowerCase()}`;
}

/** A button's words, and a shorter form for a narrow bid column (the tab
 *  row's container query picks one). */
/** What the chat can end on: the one thing she does next. */
type Act =
  | "edit"
  | "focus"
  | "hold"
  | "missing"
  | "failed"
  | "holes"
  | "stale"
  | "sam"
  | "part"
  | "mentor";
/** The ones that need her, counted in "3 things need you". */
const NEEDS = new Set<Act>(["hold", "missing", "failed", "holes", "stale", "sam", "part"]);

/** "I did not finish checking it", said once above the list, not in every
 *  line of it (8 October 2026). */
const UNFINISHED = /: I did not finish checking it\.$/;

function Words({ long, short, tiny }: { long: string; short: string; tiny?: string }) {
  return (
    <>
      <span className="ava2-w--long">{long}</span>
      <span className="ava2-w--short" aria-hidden>
        {short}
      </span>
      {tiny !== undefined ? (
        <span className="ava2-w--tiny" aria-hidden>
          {tiny}
        </span>
      ) : null}
    </>
  );
}

/** The holes and holds that sit in a part, for its tab. */
function partHoles(part: Part, qs: Question[]): number {
  const ids = new Set(part.pieces.map((pc) => pc.id));
  return qs.filter((q) => q.pieces.some((pc) => ids.has(pc.id))).length;
}

/** The parts that carry something that holds the download. A hold with no
 *  place in the bid (a check still running, a deposit) holds every part. */
function heldParts(parts: Part[], holds: Hold[]): Set<string> {
  const out = new Set<string>();
  for (const h of holds) {
    const pcs = h.question?.pieces ?? [];
    if (pcs.length === 0) {
      for (const p of parts) out.add(p.id);
      continue;
    }
    const ids = new Set(pcs.map((pc) => pc.id));
    for (const p of parts) if (p.pieces.some((pc) => ids.has(pc.id))) out.add(p.id);
  }
  return out;
}

/** What Ava says to words she cannot act on yet in her read of the bid. The
 *  demo has no model, so the answers are scripted for what a person asks. */
/** Words typed after she taps a sentence: a question about it, an order about
 *  it, or the new words themselves. */
export function aboutSentence(text: string): "why" | "order" | "words" {
  const t = text.trim().toLowerCase();
  if (/\?\s*$/.test(t) || /^(why|what|how|who|when|where|which|is|are|does|do|did)\b/.test(t))
    return "why";
  if (
    /^(please\b|can you\b|could you\b|would you\b|make\b|change\b|shorten\b|rewrite\b|reword\b|remove\b|delete\b|fix\b|improve\b|edit\b)/.test(
      t,
    )
  )
    return "order";
  return "words";
}

function readerReply(text: string, bid: AvaBid): string {
  const t = text.toLowerCase();
  if (/download|pdf|word|excel|file/.test(t))
    return "Press Download in the bar over your bid. I build every file on your device, so nothing leaves it.";
  if (/send|email|submit|deliver|portal/.test(t))
    return "After you download your bid, How to send it shows your steps, in order. I never send anything for you.";
  if (/due|deadline|when|date|late/.test(t))
    return `Your ${bid.kind === "reply" ? "reply" : "bid"} is due ${dueWords(bid)}. Send it a day early.`;
  if (/mentor|sarah|review|second opinion/.test(t))
    return "Press the mentor button at the top. A review costs $97 from your wallet, and the mentor usually replies within 1 business day.";
  if (/price|cost|total|how much/.test(t))
    return "Open the price part of your bid to see every line. If you change a cost, I ask you to approve the price again.";
  return "Tap the sentence you want to change first. Then tell me the new words.";
}

export function Reader({
  ctx,
  view,
  nav,
  top,
  side,
  mentorAsk = 0,
}: {
  ctx: AvaContext;
  view: FlowView;
  nav: WorkspaceNav;
  /** The steps, over her bid only: the chat on the right runs to the top. */
  top?: ReactNode;
  /** The right column, open or folded. */
  side: Side;
  /** Counts up each time she presses the header's mentor button. */
  mentorAsk?: number;
}) {
  const { id, s, bid } = ctx;
  const { flow } = view;
  const parts = flow.parts;
  const part = parts.find((p) => p.id === nav.tab) ?? parts[0];
  const holes = flow.holes;
  const holds = flow.holds;
  const holdQs = holds.flatMap((h) => (h.question ? [h.question] : []));
  // A hole that holds the download is shown once, as the hold.
  const marked = [...holes.filter((h) => !holdQs.some((x) => x.key === h.key)), ...holdQs];
  const pending = view.bidReview?.status === "pending";
  const passed = daysLeft(bid) < 0;
  const onHole = (key: string) => nav.setFocus(key);
  const onlyPrice = part?.pieces.length === 1 && part.pieces[0].kind === "price";
  const xlsx = onlyPrice && /\.xlsx$/i.test(part.file.name);
  const portal =
    bid.submission.method === "typed-portal" ? (bid.submission.portalUrl ?? null) : null;
  const partHeld = !!part && heldParts(parts, holds).has(part.id);
  // Re-read when a paper she sends arrives or will not open.
  useSyncExternalStore(subscribePapers, papersVersion, papersVersion);
  const missing = passed ? [] : missingPapers(ctx, holes.length);
  // A bid entered wholly on the buyer's portal has no file of its own.
  const files = parts.filter((p) => !p.onPortal);

  // Every download records her bid's files as they stand, so a later change
  // can say the file she has is older. Only the whole bid counts as her bid:
  // one part is never "downloaded" (review panel, round 2).
  const download = (what: "all" | "part", label?: string) => {
    const whole = what === "all";
    const name = label ?? (!whole && part ? part.label : "Your whole bid");
    // Recorded only once files were written: a paper that will not open
    // writes none, and nothing was downloaded.
    const sig = downloadSig(s);
    void downloadBid(ctx, whole ? null : part, holes).then((n) => {
      if (n > 0) ava.downloaded(id, name, holes.length, sig, whole);
    });
  };
  // A part she can start on while something else holds her bid: forms to
  // sign before a notary. It is not her bid yet, so it is not recorded as a
  // download, and nothing says she can send it.
  const draft = () => {
    if (part) void downloadBid(ctx, part, holes);
  };

  return (
    <div className={`ava2-read${side.open ? "" : " is-folded"}`}>
      <div className="ava2-read__doc">
        {top}
        {pending && view.bidReview ? (
          <p className="ava2-banner">
            <Clock size={16} aria-hidden /> With your mentor since{" "}
            {fullDate(new Date(view.bidReview.sentAt))}.
          </p>
        ) : null}
        {/* One row, always: the tabs take what is left and scroll sideways if
            they must; the download buttons never drop to a second line. */}
        <div className="ava2-tabs">
          <div className="ava2-tabs__list" role="tablist" aria-label="The parts of your bid">
            {parts.map((p) => {
              const n = partHoles(p, marked);
              const on = p.id === part?.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={`ava2-tab${on ? " is-on" : ""}`}
                  onClick={() => nav.setTab(p.id)}
                >
                  {p.label}
                  {n > 0 ? (
                    <span className="ava2-tab__n mono">{n}</span>
                  ) : (
                    <Check size={14} aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
          {passed ? (
            <button
              type="button"
              className="btn btn-secondary ava2-dlbtn"
              onClick={() => download("all", "Your whole bid, for your records")}
            >
              <Download size={16} aria-hidden /> Download it for your records
            </button>
          ) : holds.length > 0 || missing.length > 0 ? (
            <>
              <span className="ava2-hold" role="status">
                {(holds[0] ? holdLine(holds[0], s) : null) ??
                  `No download yet: send me ${missing.length === 1 ? "1 paper" : `${missing.length} papers`} again.`}
              </span>
              {part && !partHeld && holds.length > 0 ? (
                <span className="ava2-dldraft">
                  <button type="button" className="btn btn-secondary ava2-dlbtn" onClick={draft}>
                    <Download size={16} aria-hidden /> Download this part
                  </button>
                  <span className="ava2-dldraft__note">Not ready to send yet</span>
                </span>
              ) : null}
            </>
          ) : (
            <span className="ava2-dlset">
              {/* This part only: never the main button, and never her bid. */}
              {portal && part?.onPortal ? (
                // A typed portal takes no file: a link opens it (5.6). Opening
                // it is not a download: nothing is on her device.
                <button
                  type="button"
                  className="btn btn-secondary ava2-dlbtn"
                  onClick={() => openOutside(`The ${buyerWord(bid)}'s portal`)}
                >
                  <ExternalLink size={16} aria-hidden /> Open the {buyerWord(bid)}&apos;s portal
                </button>
              ) : part && files.length > 1 && !part.onPortal ? (
                <button
                  type="button"
                  className="btn btn-ghost ava2-dlbtn ava2-dlbtn--part"
                  title={xlsx ? "This part only (Excel)" : "This part only"}
                  onClick={() => download("part")}
                >
                  <Download size={16} aria-hidden />
                  <Words
                    long={xlsx ? "This part only (Excel)" : "This part only"}
                    short={xlsx ? "This part (Excel)" : "This part"}
                    tiny=""
                  />
                </button>
              ) : null}
              {files.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-primary ava2-dlbtn"
                  onClick={() => download("all")}
                >
                  <Download size={16} aria-hidden />
                  {holes.length > 0 ? (
                    <Words
                      long="Download your bid to finish (Word)"
                      short="Download to finish (Word)"
                      tiny="Download (Word)"
                    />
                  ) : (
                    "Download your bid"
                  )}
                </button>
              ) : null}
            </span>
          )}
        </div>
        {readNote(bid) ? <p className="ava2-readnote">{readNote(bid)}</p> : null}
        <div className="ava2-read__page">
          {part ? (
            <PartView ctx={ctx} view={view} part={part} nav={nav} onHole={onHole} still={passed} />
          ) : null}
        </div>
      </div>
      {side.open ? (
        <>
          <SideFold label={CHAT_LABEL} onFold={side.toggle} />
          <ReadChat
            ctx={ctx}
            view={view}
            nav={nav}
            missing={missing}
            onDownload={() => download("all")}
            mentorAsk={mentorAsk}
          />
        </>
      ) : (
        // A question, a hold or papers to send again wait in the chat: a dot
        // says so on the strip.
        <FoldedSide
          label={CHAT_LABEL}
          onOpen={side.toggle}
          needs={view.flow.queue.length > 0 || view.flow.holds.length > 0 || missing.length > 0}
        />
      )}
    </div>
  );
}

function PartView({
  ctx,
  view,
  part,
  nav,
  onHole,
  still,
}: {
  ctx: AvaContext;
  view: FlowView;
  part: Part;
  nav: WorkspaceNav;
  onHole: (key: string) => void;
  /** After the deadline: her bid is a record, and nothing in it changes. */
  still: boolean;
}) {
  const { bid, s } = ctx;
  const m = part.onPortal ? bidModel(bid, s) : null;
  return (
    <div className="ava2-paperstack">
      {part.pieces.map((pc) => {
        if (pc.kind === "section") {
          const sec = bid.sections.find((x) => x.id === pc.sectionId)!;
          return (
            <div key={pc.id} className="ava2-sheet">
              <BidText
                bid={bid}
                s={s}
                sec={sec}
                heading={pieceWords(view.flow.parts, pc).replace(/^part (\d+), /, "$1. ")}
                holeOn={nav.focus}
                onHole={onHole}
                sentenceOn={still ? null : nav.sel}
                onSentence={(key) => {
                  if (!still) nav.setSel(key);
                }}
              />
            </div>
          );
        }
        if (pc.kind === "price" && part.onPortal && m)
          return (
            <PortalPriceDesk
              key={pc.id}
              ctx={ctx}
              part={part}
              piece={pc}
              spots={m.spots[pc.id] ?? []}
              numbers={new Map()}
              selected={nav.focus}
              onSelect={(k) => onHole(k)}
              onPiece={() => {}}
              go={() => {}}
              m={m}
            />
          );
        if (pc.kind === "price")
          return <Workbook key={pc.id} ctx={ctx} holeOn={nav.focus} onHole={onHole} />;
        if (pc.kind === "form") {
          const form = bid.forms.find((f) => f.id === pc.formId)!;
          return (
            <div key={pc.id} className="ava2-sheet">
              <FormPaper ctx={ctx} form={form} holeOn={nav.focus} onHole={onHole} />
            </div>
          );
        }
        if (pc.kind === "papers")
          return (
            <div key={pc.id} className="ava2-sheet">
              <h4 className="ava2-sheet__h">{pc.label}</h4>
              <Papers ctx={ctx} piece={pc} holeOn={nav.focus} onHole={onHole} />
            </div>
          );
        if (pc.kind === "portal" && m)
          return (
            <Fragment key={pc.id}>
              <PortalDesk
                ctx={ctx}
                part={part}
                piece={pc}
                spots={m.spots[pc.id] ?? []}
                numbers={new Map()}
                selected={nav.focus}
                onSelect={(k) => onHole(k)}
                onPiece={() => {}}
                go={() => {}}
                m={m}
              />
            </Fragment>
          );
        return null;
      })}
    </div>
  );
}

/** The button that answers a hold, in words for what it opens. */
function holdAct(h: Hold, q: Question): string {
  if (h.kind === "rule" && q.ask) return "Add it now";
  if (h.kind === "price")
    return q.kind === "staffing"
      ? "Open my staffing plan"
      : q.kind === "price"
        ? "Approve my price"
        : "Add it now";
  return "Answer it";
}

/** Ava's chat in phase 2. */
function ReadChat({
  ctx,
  view,
  nav,
  missing,
  onDownload,
  mentorAsk,
}: {
  ctx: AvaContext;
  view: FlowView;
  nav: WorkspaceNav;
  /** Papers not in the file she would download: she sends them again. */
  missing: PlannedPaper[];
  onDownload: () => void;
  mentorAsk: number;
}) {
  const { bid, s, id } = ctx;
  const { flow } = view;
  const w = buyerWord(bid);
  const passed = daysLeft(bid) < 0;
  const [proposal, setProposal] = useState<{ key: string; now: string; voice: boolean } | null>(
    null,
  );
  const [whyOpen, setWhyOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(nav.dlg === "mentor");
  useEffect(() => {
    if (nav.dlg === "mentor") setMentorOpen(true);
    if (nav.dlg === "risk") setRisk(flow.holds.find((h) => h.canRisk)?.key ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.dlg]);
  useEffect(() => {
    if (mentorAsk) setMentorOpen(true);
  }, [mentorAsk]);
  const [noThanks, setNoThanks] = useState(false);
  const [risk, setRisk] = useState<string | null>(
    nav.dlg === "risk" ? (view.flow.holds.find((h) => h.canRisk)?.key ?? null) : null,
  );
  const [said, setSaid] = useState<{ you: string; ava: string } | null>(null);
  /** One line after she changes a sentence, or keeps the old one. */
  const [note, setNote] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const asked = useRef<HTMLDivElement>(null);
  const opp = findOpportunity(id);
  const review = view.bidReview;
  // A mentor is named only from a review she already has; before that, Ava
  // says "a mentor": nobody is assigned yet (review panel, 7 October 2026).
  const known = view.bidReview ?? view.oppReview;
  const mentorName = known?.mentorName ?? null;
  const first = mentorName ? mentorName.split(" ")[0] : null;
  // Her whole bid, downloaded. A part alone is not her bid (round 2).
  const whole = lastWholeDownload(s);
  const downloaded = !!whole;
  const lastAny = s.downloads[s.downloads.length - 1] ?? null;
  const partOnly = !!lastAny && lastAny.whole === false && lastAny !== whole;
  const stale = downloadStale(s);
  // How to send it is for the files she has, and only while they are her
  // current bid: never beside a hold or an older file (review panel, round 2).
  const sendable = downloaded && !stale && flow.holds.length === 0 && missing.length === 0;
  const late = mentorTooLate(bid, MENTOR_REPLY_DAYS);
  const sam = passed ? null : samWarning(bid, s);
  // A risk on a rule the buyer rejects a bid for changes nothing, so it is
  // not listed as taken.
  const risks = acceptedRisks(s).filter((r) => riskAllowed({ id: r.key }));
  const self = selfChecks(bid, s);

  // The sentence she tapped.
  const sentence = nav.sel
    ? sentencesOf(bid, s, nav.sel.split(":")[0])
        .flat()
        .find((x) => x.key === nav.sel)
    : null;
  const sec = sentence ? bid.sections.find((x) => x.id === sentence.sectionId) : null;
  const secPart = sec
    ? flow.parts.flatMap((p) => p.pieces).find((pc) => pc.sectionId === sec.id)
    : null;
  // The question shown: one she tapped, or the first thing that reopened,
  // which Ava asks at once (flow.ts flowOf, phase 2).
  const focusQ = passed ? null : flow.current;
  const tapped = !!focusQ && nav.focus === focusQ.key;

  useEffect(() => {
    setProposal(null);
    setWhyOpen(false);
    setSaid(null);
    if (nav.sel) setNote(null);
  }, [nav.sel]);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [nav.sel, nav.focus, focusQ?.key, proposal, review?.status, downloaded, said, note]);
  // On a phone the page scrolls as one: bring what a tap opened into view,
  // and keep her place (PRD RS-02; review panel, round 2).
  useEffect(() => {
    if (!nav.focus) return;
    // After the part's tab opens: the page above the chat changes height.
    const t = window.setTimeout(() => {
      asked.current?.scrollIntoView({ block: intoView() });
    }, 150);
    return () => window.clearTimeout(t);
  }, [nav.focus, nav.tab]);
  useEffect(() => {
    if (!nav.sel) return;
    // After the tab opens, the sentence is on the page.
    const t = window.setTimeout(() => {
      document.querySelector(".ava2-sent.is-on")?.scrollIntoView({ block: intoView() });
    }, 150);
    return () => window.clearTimeout(t);
  }, [nav.sel, nav.tab]);
  // A question about one part opens that part in the middle: a reopened
  // price shows the price sheet.
  const focusPiece = focusQ?.pieces[0]?.id ?? null;
  useEffect(() => {
    if (!focusPiece) return;
    const p = flow.parts.find((x) => x.pieces.some((pc) => pc.id === focusPiece));
    if (p && p.id !== nav.tab && !(nav.tab === null && p.id === flow.parts[0]?.id))
      nav.setTab(p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPiece]);

  const mentorEdits = Object.entries(s.edits).filter(([, e]) => e.by === "mentor");
  const showEdits = () => {
    const firstEdit = mentorEdits[0];
    if (!firstEdit) return;
    const [key, e] = firstEdit;
    const p = flow.parts.find((x) => x.pieces.some((pc) => pc.sectionId === e.sectionId));
    nav.open(p?.id ?? null, key);
  };

  // What she sends a mentor, counted the way the checklist counts it.
  const sentLines = [
    `Every part of your bid, as the ${w} will get it.`,
    ...builtSummary(bid, s, flow).map((l) => `${l.text}.`),
    ...(flow.holes.length > 0
      ? [`Left open for you or a mentor: ${flow.holes.map((h) => h.title).join("; ")}.`]
      : []),
    `Ava's check: ${count(Object.keys(s.avaFixes).length, "fix", "fixes")} made.`,
  ];

  const onSend = (text: string, how: { voice: boolean }) => {
    if (sentence) {
      // Words typed after she taps a sentence are the new sentence, unless they
      // ask a question or give an order. Those are never put into her bid.
      const kind = aboutSentence(text);
      if (kind === "why") {
        setWhyOpen(true);
        setSaid({ you: text, ava: "Here is why I put this sentence in your bid." });
        return;
      }
      if (kind === "order") {
        setSaid({
          you: text,
          ava: "I cannot rewrite a sentence from an order in this sample. Type the words you want in its place, and I show you the new sentence before anything changes.",
        });
        return;
      }
      setProposal({ key: sentence.key, now: text, voice: how.voice });
      return;
    }
    if (focusQ && answerByWords(ctx, focusQ, text, how.voice)) return;
    setSaid({ you: text, ava: readerReply(text, bid) });
  };

  /** The question a hold opens: its own, or the check's question about it. */
  const holdQuestion = (h: Hold): Question | null => {
    if (h.question) return h.question;
    if (!h.finding) return null;
    const key = `fix:${h.finding.id}`;
    return [...flow.queue, ...flow.holes].find((q) => q.key === key) ?? null;
  };
  const firstHold = flow.holds.find((h) => h.kind !== "checking" && h.kind !== "reopened");
  const firstFailed = flow.holds.find(
    (h) => h.kind === "rule" && !holdQuestion(h) && !!h.finding?.askId,
  );
  const holeOnly = flow.holes.filter((h) => !flow.holds.some((x) => x.question?.key === h.key));
  const holesOpen = flow.holes.length > 0;

  // One thing at a time, and it is always the last thing in the chat: what
  // happened is said above it, and nothing is said under a button (Shyam, 8
  // October 2026). Her own tap comes first; then what holds her download.
  const guide = !!whole && (passed || sendable);
  const checking = !passed && flow.holds.some((h) => h.kind === "checking");
  const actionHolds = passed
    ? []
    : flow.holds.filter((h) => h.kind !== "reopened" && h.kind !== "checking");
  const plan: Act[] = [
    ...(sentence && sec ? (["edit"] as const) : []),
    ...(focusQ ? (["focus"] as const) : []),
    ...(actionHolds.length > 0 ? (["hold"] as const) : []),
    ...(!passed && missing.length > 0 ? (["missing"] as const) : []),
    ...(!passed && s.check?.failed ? (["failed"] as const) : []),
    ...(!passed && holeOnly.length > 0 && !guide ? (["holes"] as const) : []),
    ...(!passed && downloaded && stale && flow.holds.length === 0 && missing.length === 0
      ? (["stale"] as const)
      : []),
    ...(sam && sam.kind !== "told" && !guide ? (["sam"] as const) : []),
    ...(!passed && partOnly && !!lastAny && flow.holds.length === 0 && missing.length === 0
      ? (["part"] as const)
      : []),
    ...(!review && !noThanks && !downloaded && flow.holds.length === 0 && !passed
      ? (["mentor"] as const)
      : []),
  ];
  // An addendum she added that Ava has not compared is asked as its own
  // question below; it is not listed again among what she checks herself.
  const selfShown = actionHolds.some((h) => h.key.startsWith("upload:"))
    ? self.filter((t) => !/^I have not compared /.test(t))
    : self;
  const now = plan[0] ?? null;
  // How many things need her, counting each hold.
  const waiting = plan.filter((a) => NEEDS.has(a) && a !== "hold").length + actionHolds.length;

  return (
    <div className="ava2-read__chat">
      <div className="ava2-read__scroll" ref={scroller}>
        <div className="ds-chat ava2-thread ava2-thread--side">
          <AgentTurn avatar={avaFace}>
            {passed ? (
              <AgentMsg>Here is your bid, for your records.</AgentMsg>
            ) : (
              <>
                <AgentMsg>
                  Here is your whole bid, as the {w} will get it. Read it through.
                </AgentMsg>
                <AgentMsg>Tap any sentence to change it, or to ask me why it is there.</AgentMsg>
              </>
            )}
          </AgentTurn>

          {mentorEdits.length > 0 && !passed ? (
            <AgentTurn avatar={avaFace}>
              <AgentMsg>
                {first ?? "Your mentor"} changed {count(mentorEdits.length, "sentence")} in your
                bid. Each one is marked in grey with {first ? `${first}'s` : "the mentor's"} name.
                Keep them, or tap one to go back to the old sentence.{" "}
                <button type="button" className="ava2-link" onClick={showEdits}>
                  {first ? `Show me ${first}'s changes` : "Show me the changes"}
                </button>
              </AgentMsg>
            </AgentTurn>
          ) : null}

          {review ? (
            <PersonMsg
              who={
                <>
                  <span className="ava2-mav">{initials(review.mentorName ?? "Mentor")}</span>
                  <span>
                    <b>{review.mentorName ?? "Your mentor"}</b>
                    {review.mentorCredential ? ` · ${review.mentorCredential}` : ""}
                  </span>
                </>
              }
            >
              {review.status === "pending" ? (
                <>
                  <p>
                    <b>Reviewing</b> · sent {fullDate(new Date(review.sentAt))}
                  </p>
                  {review.memberNote ? <p>Your question: “{review.memberNote}”</p> : null}
                </>
              ) : (
                <p>
                  <b>Finished reading your bid</b>.{" "}
                  {[...review.messages]
                    .reverse()
                    .find((m) => m.from === "mentor")
                    ?.body.replace(/<[^>]+>/g, " ") ?? ""}
                </p>
              )}
              <Link to="/mentors/$reviewId" params={{ reviewId: review.id }} className="ava2-help">
                <MessageSquare size={14} aria-hidden /> Reply to {first ?? "your mentor"} in Mentors
              </Link>
            </PersonMsg>
          ) : null}

          {/* Back to you: what reopened after she started reading (8.4). */}
          {!passed && flow.queue.length > 0 ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                <h4>{count(flow.queue.length, "thing")} changed in your bid</h4>
                <ul className="ava2-plan">
                  {flow.queue.map((q) => (
                    <li key={q.key}>
                      {q.changedBy
                        ? `Addendum ${q.changedBy} changed this rule: ${q.title}`
                        : q.title}
                    </li>
                  ))}
                </ul>
                <p>
                  {downloaded
                    ? "Answer each one here. Then download your bid again: the file you have is older."
                    : "Answer each one here. Then you can download your bid."}
                </p>
              </ChatCard>
            </AgentTurn>
          ) : null}

          {risks.length > 0 && !guide ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                <h4>You chose to go ahead at risk</h4>
                <ul className="ava2-plan">
                  {risks.map((r) => (
                    <li key={r.key}>
                      {r.label.replace(/^Sent with an open problem: /, "")}.
                      {/* A reason is shown only when she gave one. */}
                      {r.reason && !/^You chose to leave it\.?$/.test(r.reason)
                        ? ` Your reason: “${r.reason}”`
                        : ""}
                    </li>
                  ))}
                </ul>
                <p>I keep this list with your bid. It is not in the files you send.</p>
              </ChatCard>
            </AgentTurn>
          ) : null}

          {!passed && !s.check?.failed && !downloaded && selfShown.length > 0 ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                <h4>
                  {s.check?.failed
                    ? "I could not finish checking your bid"
                    : "Check these yourself before you send"}
                </h4>
                {selfShown.length > 0 ? (
                  <>
                    {s.check?.failed ? <p>I did not finish checking these:</p> : null}
                    <ul className="ava2-plan">
                      {selfShown.map((t) => (
                        <li key={t}>{t.replace(UNFINISHED, "")}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <p>
                  {s.check?.failed
                    ? "I can try again. If I still cannot finish, check each one yourself before you send."
                    : "I did not check these. Check each one yourself before you send."}
                </p>
              </ChatCard>
              {s.check?.failed ? (
                <QuickReplies
                  replies={[
                    {
                      label: "Check my bid again",
                      kind: "primary",
                      onClick: () => ava.recheck(id),
                    },
                  ]}
                />
              ) : null}
            </AgentTurn>
          ) : null}

          {!passed && downloaded && (flow.holds.length > 0 || missing.length > 0) ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                <h4>The files you have are older than your bid</h4>
                <p>
                  {flow.holds.length > 0 || missing.length > 0
                    ? "Do not send them. Answer what is above, then download your bid again. Then I show you how to send it."
                    : "Download your bid again before you send. Then I show you how to send it."}
                </p>
              </ChatCard>
              {flow.holds.length === 0 && missing.length === 0 ? (
                <QuickReplies
                  replies={[
                    {
                      label: "Download it again",
                      kind: "primary",
                      icon: <Download size={16} aria-hidden />,
                      onClick: onDownload,
                    },
                  ]}
                />
              ) : null}
            </AgentTurn>
          ) : null}

          {partOnly && lastAny && !passed && (flow.holds.length > 0 || missing.length > 0) ? (
            <AgentTurn avatar={avaFace}>
              <AgentMsg>
                You downloaded {partWords(lastAny.what)} on {fullDate(new Date(lastAny.at))}. That
                is one part. Download your whole bid to send it.
              </AgentMsg>
              {flow.holds.length === 0 && missing.length === 0 ? (
                <QuickReplies
                  replies={[
                    {
                      label: holesOpen ? "Download your bid to finish (Word)" : "Download your bid",
                      kind: "primary",
                      icon: <Download size={16} aria-hidden />,
                      onClick: onDownload,
                    },
                  ]}
                />
              ) : null}
            </AgentTurn>
          ) : null}

          {said && !(sentence && sec) ? (
            <>
              <YouMsg>{said.you}</YouMsg>
              <AgentTurn avatar={avaFace}>
                <AgentMsg>{said.ava}</AgentMsg>
              </AgentTurn>
            </>
          ) : null}

          {!(sentence && sec) && note ? (
            <AgentTurn avatar={avaFace}>
              <AgentMsg>{note}</AgentMsg>
            </AgentTurn>
          ) : null}

          {guide && whole ? (
            <AgentTurn avatar={avaFace}>
              <AgentMsg>
                You downloaded {whole.what.toLowerCase()} on {fullDate(new Date(whole.at))}.
              </AgentMsg>
              {passed ? null : <HowToSend ctx={ctx} />}
            </AgentTurn>
          ) : null}

          {/* Work Ava is doing: the same moving line as reading the files. */}
          {checking ? (
            <AgentTurn avatar={avaFace}>
              <ThinkingTrace
                live
                line="Checking your changes, the way I checked your whole bid"
                steps={[]}
              />
            </AgentTurn>
          ) : null}

          {/* More than one thing needs her: said once, then the first one.
              The rest come one at a time, as they do while she builds. */}
          {waiting > 1 && now !== null && NEEDS.has(now) ? (
            <AgentTurn avatar={avaFace}>
              <AgentMsg>
                {count(waiting, "thing needs", "things need")} you. Here is the first.
              </AgentMsg>
            </AgentTurn>
          ) : null}

          {sentence && sec ? (
            <>
              <YouMsg tapped="You tapped">
                {secPart ? pieceWords(flow.parts, secPart).replace(/^part/, "Part") : sec.title}: “
                {sentence.text}”
              </YouMsg>
              {said ? (
                <>
                  <YouMsg>{said.you}</YouMsg>
                  <AgentTurn avatar={avaFace}>
                    <AgentMsg>{said.ava}</AgentMsg>
                  </AgentTurn>
                </>
              ) : null}
              {s.edits[sentence.key] && !proposal ? (
                <AgentTurn avatar={avaFace}>
                  <ChatCard>
                    <h4>
                      {s.edits[sentence.key].by === "mentor"
                        ? `${first ?? "Your mentor"} changed this sentence`
                        : "You changed this sentence"}
                    </h4>
                    <div className="ava2-fix">
                      <div className="ava2-fix__was">
                        <span>Was</span>
                        {s.edits[sentence.key].was}
                      </div>
                      <div className="ava2-fix__now">
                        <span>Now</span>
                        {s.edits[sentence.key].now}
                      </div>
                    </div>
                  </ChatCard>
                </AgentTurn>
              ) : null}
              {proposal ? (
                <>
                  <YouMsg voice={proposal.voice ? "You said" : undefined}>{proposal.now}</YouMsg>
                  <AgentTurn avatar={avaFace}>
                    <ChatCard>
                      <h4>Here is the new sentence</h4>
                      <div className="ava2-fix">
                        <div className="ava2-fix__was">
                          <span>Was</span>
                          {sentence.text}
                        </div>
                        <div className="ava2-fix__now">
                          <span>Now</span>
                          {proposal.now}
                        </div>
                      </div>
                      <p className="ava2-small">These are your words. I did not change them.</p>
                    </ChatCard>
                    <QuickReplies
                      replies={[
                        {
                          label: "Use the new sentence",
                          kind: "primary",
                          onClick: () => {
                            ava.edit(id, sentence.key, {
                              sectionId: sentence.sectionId,
                              paragraph: sentence.paragraph,
                              was: sentence.text,
                              now: proposal.now,
                              by: "you",
                            });
                            setProposal(null);
                            nav.setSel(null);
                            setNote(
                              "I changed the sentence. I check your bid again before you download it.",
                            );
                          },
                        },
                        { label: "Change it", onClick: () => setProposal(null) },
                        {
                          label: "Keep the old sentence",
                          kind: "ghost",
                          onClick: () => {
                            setProposal(null);
                            nav.setSel(null);
                            setNote("You kept the old sentence. Nothing changed.");
                          },
                        },
                      ]}
                    />
                  </AgentTurn>
                </>
              ) : (
                <AgentTurn avatar={avaFace}>
                  <AgentMsg>
                    What should it say? Say it or type it below. Nothing changes until you say so.
                  </AgentMsg>
                  {whyOpen ? (
                    <AgentMsg>
                      This part answers the {w}'s words in {sec.answers.short}.{" "}
                      <SourcePin bid={bid} source={sec.answers} claim={sentence.text} />
                    </AgentMsg>
                  ) : null}
                  <QuickReplies
                    replies={[
                      ...(whyOpen
                        ? []
                        : [{ label: "Why is it there?", onClick: () => setWhyOpen(true) }]),
                      ...(s.edits[sentence.key]
                        ? [
                            {
                              label: "Go back to the old sentence",
                              onClick: () => {
                                ava.unedit(id, sentence.key);
                                nav.setSel(null);
                                setNote(
                                  "I put the old sentence back. I check your bid again before you download it.",
                                );
                              },
                            },
                          ]
                        : []),
                      {
                        label: "Never mind",
                        kind: "ghost" as const,
                        onClick: () => nav.setSel(null),
                      },
                    ]}
                  />
                </AgentTurn>
              )}
            </>
          ) : null}

          {now === "focus" && focusQ ? (
            <div ref={asked} className="ava2-asked">
              {tapped ? <YouMsg tapped="You tapped">{focusQ.title}</YouMsg> : null}
              <QuestionCard
                key={focusQ.key}
                ctx={ctx}
                q={focusQ}
                why={false}
                onWhy={() => {}}
                onShow={() => {}}
              />
              {tapped ? (
                <button type="button" className="ava2-link" onClick={() => nav.setFocus(null)}>
                  Close this question
                </button>
              ) : null}
            </div>
          ) : null}

          {now === "hold"
            ? actionHolds.slice(0, 1).map((h) => {
                const q = holdQuestion(h);
                // An addendum she added: Ava compares it, and she signs its
                // acknowledgment. Her own word is the last way, never the
                // first (review panel, round 2).
                const upIndex = /^upload(-ack)?:/.test(h.key)
                  ? Number(h.key.slice(h.key.indexOf(":") + 1))
                  : null;
                const upload = upIndex !== null ? s.addendumUploads[upIndex] : null;
                const isAck = h.key.startsWith("upload-ack:");
                const replies = [
                  ...(q && q.key !== focusQ?.key
                    ? [
                        {
                          label: holdAct(h, q),
                          kind: "primary" as const,
                          onClick: () => nav.setFocus(q.key),
                        },
                      ]
                    : []),
                  // An answer that fails a rule the buyer rejects a bid
                  // for: change it, or stop. Never at risk (PRD R11).
                  ...(!q && h.kind === "rule" && h.finding?.askId
                    ? [
                        {
                          label: h.key.startsWith("wage:") ? "Change my pay" : "Change my answer",
                          kind: "primary" as const,
                          onClick: () => ava.reopenAsk(id, h.finding!.askId!),
                        },
                        // Said once, on the first such rule: it pauses the bid.
                        ...(h === firstFailed
                          ? [
                              {
                                label: "I can't meet this",
                                kind: "ghost" as const,
                                onClick: () =>
                                  ava.sendBack(id, {
                                    reason: h.finding!.title,
                                    fromAskId: h.finding!.askId,
                                  }),
                              },
                            ]
                          : []),
                      ]
                    : []),
                  ...(upload && isAck
                    ? [
                        {
                          label: "I will sign it and send it with my bid",
                          kind: "primary" as const,
                          onClick: () => ava.fix(id, `upload-ack:${upIndex}`),
                        },
                      ]
                    : []),
                  ...(h.canRisk && h.finding
                    ? [
                        {
                          label: "Go ahead at risk",
                          kind: "ghost" as const,
                          onClick: () => setRisk(h.key),
                        },
                      ]
                    : []),
                  // A quiet way to a mentor, beside the first hold only.
                  ...(!review && h === firstHold
                    ? [
                        {
                          label: first ? `Ask ${first} · $97` : "Ask a mentor · $97",
                          kind: "ghost" as const,
                          onClick: () => setMentorOpen(true),
                        },
                      ]
                    : []),
                  ...(upload && !isAck
                    ? [
                        {
                          label: "I read it myself. It changes nothing in my bid",
                          kind: "ghost" as const,
                          onClick: () => ava.fix(id, `upload-read:${upIndex}`),
                        },
                      ]
                    : []),
                ];
                const total = h.kind === "price" ? approvalTotal(bid, s) : null;
                return (
                  <AgentTurn key={h.key} avatar={avaFace}>
                    <ChatCard>
                      <h4>
                        {upload
                          ? isAck
                            ? `${upload.fileName} needs your acknowledgment`
                            : `I have not compared ${upload.fileName} with your bid yet`
                          : h.text}
                      </h4>
                      {upload && !isAck ? (
                        <p>Until I have, your bid is not checked against it.</p>
                      ) : upload ? (
                        <p>
                          The {w} wants every addendum acknowledged. Sign its acknowledgment the way
                          the {w} asks, and send it with your bid.
                        </p>
                      ) : h.kind === "price" ? (
                        <p>
                          {q?.kind === "staffing"
                            ? "There is no price until you approve your staffing plan. "
                            : total !== null
                              ? `Your price is ${usd(total)}${bid.price?.periods ? " across every period" : ""}. `
                              : ""}
                          I never put a price in your bid that you did not approve.
                        </p>
                      ) : (
                        <p>
                          {h.finding
                            ? h.finding.detail
                            : `The ${w} rejects a bid without it.${q ? " Add it, and you can download your bid." : ""}`}
                        </p>
                      )}
                    </ChatCard>
                    {upload && !isAck ? (
                      <ThinkingTrace
                        live
                        line={`Reading ${upload.fileName}. I show you what changed.`}
                        steps={[]}
                      />
                    ) : null}
                    {replies.length > 0 ? <QuickReplies replies={replies} /> : null}
                    {h.canRisk && h.finding ? (
                      <RiskDialog
                        open={risk === h.key}
                        onOpenChange={(o) => setRisk(o ? h.key : null)}
                        what={h.finding.title}
                        severity={h.finding.severity}
                        label={`Sent with an open problem: ${h.finding.title}`}
                        onConfirm={(reason) =>
                          ava.acceptRisk(id, h.finding!.id, {
                            reason,
                            severity: h.finding!.severity,
                            label: `Sent with an open problem: ${h.finding!.title}`,
                          })
                        }
                      />
                    ) : null}
                  </AgentTurn>
                );
              })
            : null}

          {/* Papers not in her file: one that would not open, or one this
              session no longer holds. She sends them again; Ava never sends
              a file that names a paper it does not carry. */}
          {now === "failed" ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                <h4>
                  {s.check?.failed
                    ? "I could not finish checking your bid"
                    : "Check these yourself before you send"}
                </h4>
                {self.length > 0 ? (
                  <>
                    {s.check?.failed ? <p>I did not finish checking these:</p> : null}
                    <ul className="ava2-plan">
                      {self.map((t) => (
                        <li key={t}>{t.replace(UNFINISHED, "")}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <p>
                  {s.check?.failed
                    ? "I can try again. If I still cannot finish, check each one yourself before you send."
                    : "I did not check these. Check each one yourself before you send."}
                </p>
              </ChatCard>
              {s.check?.failed ? (
                <QuickReplies
                  replies={[
                    {
                      label: "Check my bid again",
                      kind: "primary",
                      onClick: () => ava.recheck(id),
                    },
                  ]}
                />
              ) : null}
            </AgentTurn>
          ) : null}

          {now === "missing" ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                <h4>
                  {missing.length === 1
                    ? `Send me ${missing[0].title.charAt(0).toLowerCase()}${missing[0].title.slice(1)} again`
                    : `Send me ${missing.length} papers again`}
                </h4>
                <p>
                  {missing.some((m) => m.sent)
                    ? "I could not open what you sent, or I do not have it any more. Send each one again, and I put it in your file."
                    : "I do not have these papers. Send each one, and I put it in your file."}
                </p>
                <ul className="ava2-plan ava2-resend">
                  {missing.map((m) => (
                    <li key={m.askId}>
                      <span>
                        {m.title}
                        {m.sent ? <span className="ava2-small"> · you sent {m.sent}</span> : null}
                      </span>
                      <ResendPaper noticeId={id} askId={m.askId} />
                    </li>
                  ))}
                </ul>
              </ChatCard>
            </AgentTurn>
          ) : null}

          {/* Her registration: a warning, never a hold (FAR 52.204-7). */}
          {sam && !guide && (now === "sam" || sam.kind === "told") ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                {/* The plain sentence first, the government's term under it. */}
                <h4>{samWords(bid, sam).title}</h4>
                <p className="ava2-term">{samWords(bid, sam).term}</p>
                <p>{samWords(bid, sam).text}</p>
              </ChatCard>
              {sam.kind === "told" ? null : (
                <QuickReplies
                  replies={[
                    {
                      label: sam.kind === "unknown" ? "Check it on SAM.gov" : "Renew on SAM.gov",
                      kind: "primary",
                      icon: <ExternalLink size={16} aria-hidden />,
                      onClick: () => openOutside("SAM.gov"),
                    },
                    {
                      label: sam.kind === "unknown" ? "I checked the date" : "I renewed it",
                      onClick: () => ava.fix(id, SAM_RENEWED_KEY),
                    },
                  ]}
                />
              )}
            </AgentTurn>
          ) : null}

          {now === "holes" ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                <h4>{count(holeOnly.length, "part is", "parts are")} still empty</h4>
                <ul className="ava2-plan">
                  {holeOnly.map((h) => (
                    <li key={h.key}>
                      {h.title}
                      {h.goes ? ` · ${h.goes}` : ""}
                    </li>
                  ))}
                </ul>
                <p>I left a marked space in the Word file for each one.</p>
              </ChatCard>
              <QuickReplies
                replies={[
                  {
                    label: "Tell me now, by voice",
                    kind: "primary",
                    icon: <Mic size={16} aria-hidden />,
                    onClick: () => nav.setFocus(holeOnly[0].key),
                  },
                  ...(review
                    ? []
                    : [
                        {
                          label: first ? `Ask ${first} · $97` : "Ask a mentor · $97",
                          onClick: () => setMentorOpen(true),
                        },
                      ]),
                  ...(flow.holds.length === 0
                    ? [
                        {
                          label: "I will fill it in the file",
                          kind: "ghost" as const,
                          onClick: () => onDownload(),
                        },
                      ]
                    : []),
                ]}
              />
            </AgentTurn>
          ) : null}

          {now === "stale" ? (
            <AgentTurn avatar={avaFace}>
              <ChatCard>
                <h4>The files you have are older than your bid</h4>
                <p>
                  {flow.holds.length > 0 || missing.length > 0
                    ? "Do not send them. Answer what is above, then download your bid again. Then I show you how to send it."
                    : "Download your bid again before you send. Then I show you how to send it."}
                </p>
              </ChatCard>
              {flow.holds.length === 0 && missing.length === 0 ? (
                <QuickReplies
                  replies={[
                    {
                      label: "Download it again",
                      kind: "primary",
                      icon: <Download size={16} aria-hidden />,
                      onClick: onDownload,
                    },
                  ]}
                />
              ) : null}
            </AgentTurn>
          ) : null}

          {now === "part" && lastAny ? (
            <AgentTurn avatar={avaFace}>
              <AgentMsg>
                You downloaded {partWords(lastAny.what)} on {fullDate(new Date(lastAny.at))}. That
                is one part. Download your whole bid to send it.
              </AgentMsg>
              {flow.holds.length === 0 && missing.length === 0 ? (
                <QuickReplies
                  replies={[
                    {
                      label: holesOpen ? "Download your bid to finish (Word)" : "Download your bid",
                      kind: "primary",
                      icon: <Download size={16} aria-hidden />,
                      onClick: onDownload,
                    },
                  ]}
                />
              ) : null}
            </AgentTurn>
          ) : null}

          {now === "mentor" ? (
            <AgentTurn avatar={avaFace}>
              {late ? (
                <>
                  <ChatCard>
                    <h4>A mentor may not reply in time</h4>
                    <p>
                      Your bid is due {dueWords(bid)}. A mentor usually replies within{" "}
                      {MENTOR_REPLY_DAYS} business day. The reply may not come in time.
                    </p>
                  </ChatCard>
                  <QuickReplies
                    replies={[
                      {
                        label: first ? `Send it to ${first} anyway` : "Send it to a mentor anyway",
                        onClick: () => setMentorOpen(true),
                      },
                      { label: "Download it now", kind: "primary", onClick: onDownload },
                    ]}
                  />
                </>
              ) : (
                <ChatCard>
                  <h4>Want a second opinion before you send?</h4>
                  {mentorName ? (
                    <div className="ds-msg__who ava2-mrow">
                      <span className="ava2-mav">{initials(mentorName)}</span>
                      <span>
                        <b>{mentorName}</b>
                        {known?.mentorCredential ? ` · ${known.mentorCredential}` : ""}
                      </span>
                    </div>
                  ) : null}
                  <p>{MENTOR_SERVICE}</p>
                  <dl className="ava2-dl">
                    <div>
                      <dt>Cost</dt>
                      <dd>
                        <b className="mono">$97</b>, from your Wallet: the prepaid credit you use
                        for mentor reviews
                      </dd>
                    </div>
                    <div>
                      <dt>Reply</dt>
                      <dd>{MENTOR_REPLY.charAt(0).toUpperCase() + MENTOR_REPLY.slice(1)}</dd>
                    </div>
                  </dl>
                  <p className="ava2-small">{MENTOR_WHERE}</p>
                  <div className="ava2-acts">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setMentorOpen(true)}
                    >
                      {first ? `Send to ${first} for review` : "Send to a mentor"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setNoThanks(true)}
                    >
                      No thanks
                    </button>
                  </div>
                </ChatCard>
              )}
            </AgentTurn>
          ) : null}
        </div>
      </div>
      <div className="ava2-read__composer">
        <Composer
          compact
          onSend={onSend}
          sample={() => "How do I send it?"}
          placeholder="Ask Ava, or say what to change"
          typePlaceholder="Type to Ava, or say what to change"
          note={TALK_LINE}
        />
      </div>
      {opp ? (
        <SendToMentorModal
          opp={opp}
          summary={getGrantSummary(opp)}
          open={mentorOpen}
          onOpenChange={setMentorOpen}
          sending={{ title: `Your whole bid for ${bid.bidNumber}`, lines: sentLines }}
          service={`${MENTOR_SERVICE} ${MENTOR_WHERE} It usually comes within ${MENTOR_REPLY_DAYS} business day.`}
          onConfirm={(text) => {
            const r = createReview({
              opportunityId: id,
              opportunityTitle: opp.title,
              verdict: getGrantSummary(opp).call,
              rationale: getGrantSummary(opp).rationale,
              note: text,
              subject: "bid",
            });
            ava.sentToMentor(id, "bid", r.id);
            // The dialog stays open and says it was sent; "Done" closes it.
          }}
        />
      ) : null}
    </div>
  );
}

/** Take a photo or choose a file again, for one paper. Kept for this
 *  session, so her download carries the paper itself. */
function ResendPaper({ noticeId, askId }: { noticeId: string; askId: string }) {
  const photo = useId();
  const file = useId();
  const keep = (f: File | undefined) => {
    if (f) keepPaper(noticeId, askId, f);
  };
  return (
    <span className="ava2-resend__acts">
      <input
        id={photo}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="ava2-resend__input"
        onChange={(e) => {
          keep(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <label htmlFor={photo} className="btn btn-secondary btn-sm">
        <Camera size={14} aria-hidden /> Take a photo
      </label>
      <input
        id={file}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="ava2-resend__input"
        onChange={(e) => {
          keep(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <label htmlFor={file} className="btn btn-ghost btn-sm">
        <Paperclip size={14} aria-hidden /> Choose a file
      </label>
    </span>
  );
}
