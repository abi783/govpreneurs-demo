// "Ava is showing you" (docs/ava/ava-two-phase.html, Part 2): the right side
// of phase 1 shows whatever Ava is reading, asking about or writing at that
// moment — the files ticking off, the rules that reject a bid, the email she
// drafted, the buyer's page with the rule marked, what she read from a photo,
// the part of the bid being written with the spot this answer fills.

import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { Hole, ShowPanel, StatusMark } from "../ds/AgentWorkspace";
import {
  buyerWord,
  checkLines,
  count,
  filesRead,
  leftList,
  readyWords,
  staffingOpen,
  type Question,
} from "../../lib/ava/flow";
import { fullDate } from "../../lib/ava/dates";
import { askNeededAt, claimView, sectionParagraphs, visibleAsks } from "../../lib/ava/derive";
import {
  approvalTotal,
  isRateList,
  linePrices,
  missingPriceAsks,
  priceOf,
  sheetTotal,
  usd,
} from "../../lib/ava/price";
import { periodColumns } from "./PriceParts";
import type { BidState } from "../../lib/ava/store";
import type { AvaBid, Source } from "../../lib/ava/types";
import { readable } from "../../lib/ava/types";
import { draftEmail, isGetting, valueWords } from "./Asking";
import { BidText } from "./BidText";
import { FormPaper } from "./FormPaper";
import { HourlyCard, SheetCard } from "./PriceBuild";
import { fileName, SourcePin } from "./primitives";
import type { AvaContext } from "./useAva";
import type { FlowView } from "./useFlow";

// ─── Pieces ───

/** The buyer's page, with the rule marked. */
export function PageCite({ bid, source }: { bid: AvaBid; source: Source }) {
  // A page read from a scan is marked as uncertain (PRD TD-03, PC-1).
  const scan = bid.files.find((f) => f.id === source.fileId)?.readability === "scan";
  return (
    <div className="ava2-cite">
      <div className="ava2-cite__h mono">
        {fileName(bid, source.fileId)} · {source.locator}
      </div>
      {source.quote ? (
        <mark>{source.quote}</mark>
      ) : (
        <p>This rule is a table or a form, so there are no words to quote.</p>
      )}
      {scan ? (
        <p className="ava2-cite__scan">
          I read this page from a scan. A word or a number can be misread, so check it against the
          page.
        </p>
      ) : null}
    </div>
  );
}

function FileList({ ctx, now }: { ctx: AvaContext; now: number }) {
  const files = filesRead(ctx.bid, ctx.s, now);
  return (
    <div className="ava2-list">
      {files.map((f) => (
        <div key={f.file.id} className={`ava2-list__r${f.state === "now" ? " is-on" : ""}`}>
          <StatusMark kind={f.state === "locked" ? "lock" : f.state} />
          <span>
            <span className="mono ava2-fname">{f.file.name}</span>
            <span className="ava2-list__sub mono">
              {f.state === "locked"
                ? f.found
                : f.file.pages
                  ? `${f.file.pages} pages${f.file.readability === "scan" ? " · a scan" : ""}`
                  : f.file.name.endsWith(".xlsx")
                    ? "Excel"
                    : ""}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function MustList({ ctx, view }: { ctx: AvaContext; view: FlowView }) {
  return (
    <>
      <div className="ava2-list">
        {view.flow.must.map((m) => {
          const kind =
            m.state === "meets" || m.state === "have" || m.state === "planned"
              ? "done"
              : m.state === "cant-meet"
                ? "next"
                : "need";
          return (
            <div key={m.rule.id} className={`ava2-list__r${m.state === "asking" ? " is-on" : ""}`}>
              <StatusMark kind={kind} />
              <span>
                {m.rule.label}{" "}
                <SourcePin bid={ctx.bid} source={m.rule.source} claim={m.rule.label} />
                <span
                  className={`ava2-st ava2-st--${
                    m.state === "meets" || m.state === "have" || m.state === "planned"
                      ? "ok"
                      : m.state === "grant-unsure" || m.state === "open"
                        ? "quiet"
                        : "need"
                  }`}
                >
                  {m.line}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="ds-show__note">
        Miss any one of these, and the {buyerWord(ctx.bid)} does not read your bid.
      </p>
    </>
  );
}

function EmailDraft({ ctx, q }: { ctx: AvaContext; q: Question }) {
  const mail = draftEmail(ctx, q.ask!);
  return (
    <>
      <div className="ava2-email">
        <div className="ava2-email__r">
          <span>To</span>
          <span>{mail.to}</span>
        </div>
        <div className="ava2-email__r">
          <span>Subject</span>
          <span>{mail.subject}</span>
        </div>
        <div className="ava2-email__b">{mail.body}</div>
      </div>
      {q.rule ? (
        <p className="ds-show__note">
          The {buyerWord(ctx.bid)}'s rule{" "}
          <SourcePin bid={ctx.bid} source={q.rule.source} claim={q.rule.label} />{" "}
          {q.rule.source.quote ? `“${q.rule.source.quote}”` : ""}
        </p>
      ) : null}
    </>
  );
}

function PhotoRead({ ctx, q }: { ctx: AvaContext; q: Question }) {
  const pending = ctx.s.pending[q.key];
  const ask = q.ask!;
  const ex = ask.answer.type === "upload" ? (ask.answer.extracts ?? []) : [];
  return (
    <>
      <div className="ava2-photo">
        <div className="ava2-photo__img" aria-hidden>
          <div className="ava2-photo__paper">
            <i className="t" />
            <i />
            <i className="s" />
            <i />
            <i />
            <i className="s" />
          </div>
        </div>
        <div className="ava2-photo__read">
          <div className="ava2-photo__h">{ex.length > 0 ? "What I read" : "What you sent"}</div>
          <dl className="ava2-dl">
            <div>
              <dt>File</dt>
              <dd className="mono">{pending?.fileName}</dd>
            </div>
            {ex.map((x) => (
              <div key={x.fieldId}>
                <dt>{x.label}</dt>
                <dd>
                  <span className="mono">{valueWords(x.value, x.unit)}</span>
                  <span className="ava2-list__sub">{x.where}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="ds-show__note">
        Nothing goes in your bid until you say it is right. The {buyerWord(ctx.bid)}'s rule:{" "}
        <SourcePin bid={ctx.bid} source={ask.source} claim={ask.title} />
      </p>
    </>
  );
}

/** A line with no price yet, in its cell. What it waits on is said once. */
const NOT_PRICED = "Not priced yet";

/** Her price, line by line, on the buyer's sheet. */
export function PriceMini({ ctx }: { ctx: AvaContext }) {
  const { bid, s } = ctx;
  const p = priceOf(bid);
  const prices = linePrices(bid, s);
  const total = sheetTotal(prices);
  // What an empty line waits on, named: her staffing plan, or the first
  // answer the price still needs (an insurance cost on its way).
  const first = missingPriceAsks(bid, s)
    .map((x) => bid.asks.find((a) => a.id === x))
    .find(Boolean);
  const waits = staffingOpen(bid, s)
    ? "Waits on your staffing plan"
    : first
      ? `Waits on ${first.title.charAt(0).toLowerCase()}${first.title.slice(1)}`
      : "Waits on your costs";
  // A bid with option periods: every period's unit price, before she
  // approves the total across them (design 6.10; review panel, 7 October 2026).
  const periods = p.periods ? periodColumns(bid, s) : null;
  const across = p.periods ? approvalTotal(bid, s) : null;
  // What an empty line waits on is said once, above the lines; each empty
  // cell says only "Not priced yet" (8 October 2026: the sentence in every
  // row squeezed each name to one word a line in the narrow right side).
  const empty = prices.some((x) => x.unitPrice === null);
  return (
    <>
      {empty ? <p className="ava2-waits">{waits}.</p> : null}
      <div className="ava2-list">
        {prices.map((x, i) => (
          <div key={x.line.id} className="ava2-list__r ava2-list__r--price">
            <span>
              <b>{x.line.item}</b>
              <span className="ava2-list__sub mono">
                {x.line.qty === null
                  ? "No quantity"
                  : `${x.line.qty.toLocaleString("en-US")} a year`}
              </span>
            </span>
            <span className="ava2-num">
              {x.unitPrice === null ? (
                <span className="ava2-holecell">{NOT_PRICED}</span>
              ) : (
                <>
                  <b className="mono">{usd(x.unitPrice)}</b> {x.line.unit}
                </>
              )}
              <span className="ava2-list__sub mono">
                {x.extended === null ? "" : usd(x.extended)}
              </span>
            </span>
            {periods ? (
              <span className="ava2-periods">
                {periods.map((c) => (
                  <span key={c.label}>
                    <span>{c.label}</span>
                    <b className="mono">{c.prices[i] === null ? "Not set" : usd(c.prices[i]!)}</b>
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        ))}
        <div className="ava2-list__r ava2-list__r--price">
          {isRateList(bid) ? (
            <span className="ava2-list__sub">No total: the buyer gives no quantities.</span>
          ) : (
            <>
              <b>Total for year one</b>
              {total === null ? (
                <span className="ava2-holecell ava2-num">{NOT_PRICED}</span>
              ) : (
                <b className="mono ava2-num">{usd(total)}</b>
              )}
            </>
          )}
        </div>
        {p.periods ? (
          <div className="ava2-list__r ava2-list__r--price">
            <b>Total across every period</b>
            {across === null ? (
              <span className="ava2-holecell ava2-num">{NOT_PRICED}</span>
            ) : (
              <b className="mono ava2-num">{usd(across)}</b>
            )}
          </div>
        ) : null}
      </div>
      <p className="ds-show__note">
        On the {buyerWord(bid)}'s own sheet, {p.sheetName}. {p.contractType}{" "}
        <SourcePin bid={bid} source={p.contractTypeSource} claim={p.contractType} />
      </p>
    </>
  );
}

function StaffingPlan({ ctx }: { ctx: AvaContext }) {
  const p = priceOf(ctx.bid);
  return (
    <>
      <div className="ava2-list">
        {p.roles.map((r) => (
          <div key={r.id} className="ava2-list__r ava2-list__r--price">
            <span>
              <b>{r.name}</b>
              <span className="ava2-list__sub">{count(r.count, "person", "people")}</span>
            </span>
            <span className="ava2-num mono">{r.hoursPerWeek} hours a week</span>
          </div>
        ))}
      </div>
      <p className="ds-show__note">
        How the cost of these hours is shared across the {buyerWord(ctx.bid)}'s lines:
      </p>
      <div className="ava2-list">
        {p.lines.map((l) => (
          <div key={l.id} className="ava2-list__r ava2-list__r--price">
            <span>{l.item}</span>
            <span className="ava2-num mono">{Math.round(l.laborShare * 100)}%</span>
          </div>
        ))}
      </div>
    </>
  );
}

function CheckList({ ctx, now }: { ctx: AvaContext; now: number }) {
  const lines = checkLines(ctx.bid, ctx.s);
  const c = ctx.s.check;
  const done = c?.doneAt ? lines.length : c ? Math.floor((now - c.startedAt) / 1100) : 0;
  return (
    <div className="ava2-list">
      {lines.map((l, i) => (
        <div key={l.id} className={`ava2-list__r${i === done ? " is-on" : ""}`}>
          <StatusMark kind={i < done ? "done" : i === done ? "now" : "next"} />
          <span>
            {l.label}
            {i < done ? (
              <span
                className={`ava2-st ava2-st--${l.tone === "you" || l.tone === "hold" ? "need" : "ok"}`}
              >
                {l.result}
              </span>
            ) : i === done ? (
              <span className="ava2-st ava2-st--quiet">Checking now</span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}

function Milestone({ ctx, view }: { ctx: AvaContext; view: FlowView }) {
  const fixes = Object.values(ctx.s.avaFixes);
  const { flow } = view;
  // One list, one count, each thing once (Shyam, 7 October 2026). The tag,
  // the chat and this list all read leftList.
  const left = leftList(ctx.bid, ctx.s, flow);
  const head = readyWords(ctx.bid, ctx.s, flow).head;
  return (
    <div className="ava2-mile">
      <span className={`ava2-mile__tag${left.length > 0 ? " is-open" : ""}`}>
        <StatusMark kind={left.length === 0 ? "done" : "need"} small /> {head}
      </span>
      {left.length > 0 ? (
        <ul className="ava2-mile__left2">
          {left.map((x) => (
            <li key={x.key}>
              <StatusMark kind="need" small />
              <span>
                <b>{x.title}</b>
                <span className="ava2-mile__who">
                  {x.who}
                  {x.blocks ? " · Needed before you download" : ""}
                </span>
                {x.note ? <span className="ava2-mile__note">{x.note}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {fixes.length > 0 ? (
        <details className="ava2-mile__fixed">
          <summary>What I fixed ({fixes.length})</summary>
          <ul className="ava2-mile__fixes">
            {fixes.map((f) => (
              <li key={f.text}>{f.text}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/** The papers she sends: one slot each, the one asked about marked. */
function PapersMini({ ctx, q }: { ctx: AvaContext; q: Question }) {
  const piece = q.pieces[0];
  const asks = (piece?.papers ?? [])
    .map((p) => ctx.bid.asks.find((a) => a.id === p.askId))
    .filter(Boolean);
  return (
    <div className="ava2-list">
      {asks.map((a) => (
        <div key={a!.id} className={`ava2-list__r${q.ask?.id === a!.id ? " is-on" : ""}`}>
          <StatusMark kind={ctx.s.answers[a!.id]?.status === "done" ? "done" : "need"} />
          <span>
            {a!.title}
            <span className="ava2-list__sub">
              {ctx.s.answers[a!.id]?.fileName ?? "Waiting for your copy"}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── The panel ───

export function Showing({
  ctx,
  view,
  why,
  show,
  onHole,
}: {
  ctx: AvaContext;
  view: FlowView;
  why: boolean;
  show: "build" | null;
  onHole: (key: string) => void;
}) {
  const { bid, s } = ctx;
  const { flow, now } = view;
  const q = flow.current;
  const w = buyerWord(bid);
  let title = "";
  let body: ReactNode = null;

  if (flow.stage === "stopped") {
    title =
      flow.stop === "no-files"
        ? "What the buyer posted"
        : flow.stop === "no-main"
          ? "The files you added"
          : "The file I cannot read";
    body =
      flow.stop === "no-files" ? (
        <p className="ds-show__note">
          Nothing: no files, and no notice text. I will not guess the rules.
        </p>
      ) : (
        <div className="ava2-list">
          {bid.files.map((f) => (
            <div key={f.id} className="ava2-list__r">
              <StatusMark kind={readable(f) ? "done" : "lock"} />
              <span>
                <span className="mono ava2-fname">{f.name}</span>
                <span className="ava2-list__sub">
                  {f.role === "main" && !readable(f)
                    ? "Its words come out jumbled. I need a copy I can read."
                    : f.role === "price-form"
                      ? "A price sheet, not the main document"
                      : f.role === "form"
                        ? "Forms, not the main document"
                        : "Not the main document"}
                </span>
              </span>
            </div>
          ))}
        </div>
      );
  } else if (flow.stage === "mentor-no" && view.mentorRead) {
    const m = view.mentorRead;
    title = `${m.name.split(" ")[0]}'s note`;
    body = (
      <div className="ds-chatcard ds-chatcard--person">
        <div className="ds-msg__who">
          <span className="ava2-mav">{initials(m.name)}</span>
          <span>
            <b>{m.name}</b> · your mentor
          </span>
        </div>
        <span className="ava2-verdict ava2-verdict--no">Don't pursue</span>
        <p>“{m.note}”</p>
        <Link to="/mentors/$reviewId" params={{ reviewId: m.reviewId }} className="ava2-help">
          <MessageSquare size={14} aria-hidden /> Open her reply in Mentors
        </Link>
      </div>
    );
  } else if (flow.stage === "reading") {
    title = `The ${w}'s files, as I read them`;
    body = <FileList ctx={ctx} now={now} />;
  } else if (flow.stage === "paused") {
    const d = s.decision ?? null;
    const rule = bid.hardRequirements.find(
      (r) => d?.fromAskId && (r.askId === d.fromAskId || (r.askIds ?? []).includes(d.fromAskId)),
    );
    const src = rule?.source ?? d?.source;
    title = `The ${w}'s rule`;
    body = src ? <PageCite bid={bid} source={src} /> : <MustList ctx={ctx} view={view} />;
  } else if (why && q?.why) {
    title = `The ${w}'s rule, ${q.why.source.short}`;
    body = <PageCite bid={bid} source={q.why.source} />;
  } else if (show === "build" && bid.price) {
    title = "How I built your price";
    body = (
      <div className="ava2-build">
        <HourlyCard ctx={ctx} go={() => {}} />
        <SheetCard ctx={ctx} go={() => {}} />
      </div>
    );
  } else if (flow.stage === "must") {
    title = `The ${count(flow.must.length, "rule")} that can get your bid rejected`;
    body = <MustList ctx={ctx} view={view} />;
  } else if (flow.stage === "checking") {
    title = `Checking your bid the way the ${w} will`;
    body = <CheckList ctx={ctx} now={now} />;
  } else if (flow.stage === "ready") {
    // The card below gives the one count; the title only names the panel.
    title = "Your bid, as it stands";
    body = <Milestone ctx={ctx} view={view} />;
  } else if (q) {
    ({ title, body } = showQuestion(ctx, view, q, onHole));
  } else {
    title = "Your bid";
    body = <Milestone ctx={ctx} view={view} />;
  }
  return (
    <ShowPanel label="Ava is showing you" title={title}>
      {body}
    </ShowPanel>
  );
}

function showQuestion(
  ctx: AvaContext,
  view: FlowView,
  q: Question,
  onHole: (key: string) => void,
): { title: string; body: ReactNode } {
  const { bid, s } = ctx;
  const w = buyerWord(bid);
  if (s.pending[q.key] && q.ask)
    return {
      title: `Your ${q.ask.title.charAt(0).toLowerCase()}${q.ask.title.slice(1)}, and what I read`,
      body: <PhotoRead ctx={ctx} q={q} />,
    };
  if (isGetting(ctx, q))
    return {
      title: `The email to ${q.ask!.owner === "insurance-agent" ? "your insurance agent" : "them"}`,
      body: <EmailDraft ctx={ctx} q={q} />,
    };
  if (q.kind === "price")
    return { title: `Your price, on the ${w}'s price sheet`, body: <PriceMini ctx={ctx} /> };
  if (q.kind === "staffing")
    return { title: "Your staffing plan", body: <StaffingPlan ctx={ctx} /> };
  if (q.kind === "clar" && q.clar)
    return {
      title: `The ${w}'s words`,
      body: (
        <>
          {q.clar.passages.map((p, i) => (
            <PageCite key={i} bid={bid} source={p} />
          ))}
        </>
      ),
    };
  if (q.kind === "portal")
    return {
      title: "How to show me the portal",
      body: (
        <>
          <ol className="ava2-steps">
            <li>Open the {w}'s portal and sign in.</li>
            <li>Open this bid, and go to each screen of questions.</li>
            <li>Take a picture of each screen, or save it as a page.</li>
            <li>Add them in the chat. I read them and build your guide to the portal.</li>
          </ol>
          <p className="ds-show__note">
            The {w}'s rule:{" "}
            <SourcePin bid={bid} source={bid.submission.source} claim={bid.submission.where} />
          </p>
        </>
      ),
    };
  if (q.kind === "fix")
    return {
      title: `Checking your bid the way the ${w} will`,
      body: <CheckList ctx={ctx} now={view.now} />,
    };
  const piece = q.pieces[0];
  if (q.kind === "decision" && q.decision) {
    const sec = bid.sections.find((x) => x.id === q.decision!.sectionId);
    return {
      title: `What each answer puts in ${q.goes ?? "your bid"}`,
      body: (
        <div className="ava2-mini">
          <div className="ava2-mini__run">
            {bid.samLegalName} · {bid.bidNumber}
          </div>
          <h4>{sec?.title}</h4>
          <p className="ava2-mini__opt">
            <b>The first:</b> <span className="ava2-ins">{q.decision.decision.choice}</span>
          </p>
          <p className="ava2-mini__opt">
            <b>The second:</b> <span className="ava2-ins">{q.decision.decision.other}</span>
          </p>
        </div>
      ),
    };
  }
  if (piece?.kind === "section") {
    const sec = bid.sections.find((x) => x.id === piece.sectionId)!;
    return {
      title: "Your proposal, as I write it",
      body: (
        <div className="ava2-mini">
          <div className="ava2-mini__run">
            {bid.samLegalName} · {bid.bidNumber}
          </div>
          <BidText
            bid={bid}
            s={s}
            sec={sec}
            heading={q.goes ? q.goes.replace(/^part (\d+), /, "$1. ") : sec.title}
            holeOn={q.key}
            onHole={onHole}
            small
          />
          {q.ask && !gapIn(ctx, sec.id, q.ask.id) ? (
            <Hole
              title={
                q.ask.kind === "upload"
                  ? `Your ${lowerFirst(q.ask.title)} goes here`
                  : "Your answer goes here"
              }
              line={
                q.ask.kind === "upload"
                  ? "Add it, and I write this part with it."
                  : "Answer it, and I write this part with it."
              }
              act={q.ask.kind === "upload" ? "Add it" : "Answer it"}
              on
              onOpen={() => onHole(q.key)}
            />
          ) : null}
        </div>
      ),
    };
  }
  if (piece?.kind === "form") {
    const form = bid.forms.find((f) => f.id === piece.formId)!;
    return {
      title: `${form.name}, as I fill it`,
      body: <FormPaper ctx={ctx} form={form} holeOn={q.key} onHole={onHole} small />,
    };
  }
  if (piece?.kind === "papers")
    return { title: "The papers you send", body: <PapersMini ctx={ctx} q={q} /> };
  if (piece?.kind === "price")
    return { title: `Where it goes: the ${w}'s price sheet`, body: <PriceMini ctx={ctx} /> };
  // Nowhere in the files (a visit, her word): the rule itself.
  const src = q.why?.source ?? q.rule?.source;
  const later = visibleAsks(bid, s).filter((a) => askNeededAt(bid, a) !== "bid");
  return {
    title: src ? `The ${w}'s rule, ${src.short}` : "Your bid",
    body: (
      <>
        {src ? <PageCite bid={bid} source={src} /> : null}
        {later.length > 0 ? (
          <p className="ds-show__note">
            Only if you win:{" "}
            {later.map((a) => a.title.charAt(0).toLowerCase() + a.title.slice(1)).join("; ")}. I
            will remind you then.
          </p>
        ) : null}
      </>
    ),
  };
}

/** True when the section shows this ask as a marked gap in its words. */
function gapIn(ctx: AvaContext, sectionId: string, askId: string): boolean {
  const sec = ctx.bid.sections.find((x) => x.id === sectionId);
  if (!sec) return false;
  return sectionParagraphs(ctx.s, sec)
    .flat()
    .some(
      (sp) =>
        sp.claim?.askId === askId && claimView(ctx.bid, ctx.s, sp.claim).tag === "unsupported",
    );
}

function lowerFirst(t: string): string {
  return /^[A-Z][a-z]/.test(t) && !/^(Form|Exhibit|Addendum)\b/.test(t)
    ? t.charAt(0).toLowerCase() + t.slice(1)
    : t;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export { fullDate, PriceMini as PriceLines };
export type { BidState };
