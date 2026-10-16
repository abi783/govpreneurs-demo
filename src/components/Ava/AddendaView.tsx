// Addenda (Ava-Build-Spec §9, concept "Always on: addenda").
//
// Ava compares the whole solicitation, old version against new, because many
// reissues come with no list of changes. The report says what changed, what it
// reopened (requirements, sections, prices AND approvals), and what is still
// valid, so the member does not re-check everything. It runs even after the
// bid is Ready. Ava does not ask "want us to check?" — it already has.

import { useEffect, useId, useState } from "react";
import { CircleCheck, FileSearch, Inbox, RefreshCw, RotateCcw, Upload } from "lucide-react";
import {
  addendumPostedDay,
  askResolved,
  clarificationStatus,
  commitmentStatus,
  receivedAddenda,
  ruleReopenedBy,
  sectionPages,
} from "../../lib/ava/derive";
import { requirementStatus } from "../../lib/ava/checks";
import { dayFromNow, dayMonth, fullDate } from "../../lib/ava/dates";
import { approvalTotal, usd0 } from "../../lib/ava/price";
import { buyerWord } from "../../lib/ava/flow";
import { findOpportunity } from "../../demo/ava/opportunity";
import { ava } from "../../lib/ava/store";
import type { Addendum, AddendumChange, Commitment } from "../../lib/ava/types";
import { AvaCard, ConfirmDialog, SourcePin } from "./primitives";
import type { AvaContext } from "./useAva";
import type { ViewProps } from "./views";

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Files that sit behind the buyer's portal login: addenda reach the member there. */
function portalOnly(ctx: AvaContext): boolean {
  return ctx.fixture.files.some((f) => f.readability === "behind-login");
}

/** Open a question in her bid's chat by its key ("price", "promise:<id>").
 *  Given from phase 2, where a reopened item is asked again. */
type Ask = (key: string) => void;

/** A federal bid's addenda are on its notice, and Ava reads them there. A
 *  state or local buyer sends addenda only to bidders it knows about, so Ava
 *  knows only the ones she adds (PRD §9.2). */
function federalBid(ctx: AvaContext): boolean {
  return findOpportunity(ctx.id)?.scope === "fed";
}

export function AddendaView({ ctx, go, ask }: ViewProps & { ask?: Ask }) {
  const { fixture, s, id } = ctx;
  const federal = federalBid(ctx);
  const w = buyerWord(ctx.bid);
  const received = receivedAddenda(fixture, s);
  const newest = [...received].sort((a, b) => b.number - a.number);

  // Opening the report is reading it: the notice above the tabs goes away.
  const unseen = received
    .filter((a) => a.arrivesDuringBuild && !s.addendaSeen[a.id])
    .map((a) => a.id)
    .join(",");
  useEffect(() => {
    if (!unseen) return;
    for (const aid of unseen.split(",")) ava.seeAddendum(id, aid);
  }, [id, unseen]);

  const portal = portalOnly(ctx);

  if (newest.length === 0) {
    return (
      <AvaCard className="ava-a-none">
        <p className="ava-a-none__icon">
          <Inbox size={20} strokeWidth={2} aria-hidden />
        </p>
        <h2 className="ava-h2">No addenda for this bid yet.</h2>
        {federal ? (
          <>
            <p className="ava-lede">
              Ava checks the buyer&apos;s files for new addenda every day. It keeps checking after
              the bid is ready.
            </p>
            <p className="ava-lede">
              When one arrives, Ava compares it with the previous version and shows you what
              changed.
            </p>
          </>
        ) : (
          <p className="ava-lede">
            Ava only knows about addenda you add. Check the {w}&apos;s bid page before you send. Add
            any new ones you find.
          </p>
        )}
        <UploadAddendum ctx={ctx} portal={portal} />
      </AvaCard>
    );
  }

  return (
    <>
      <header className="ava-a-intro">
        <h2 className="ava-h2">
          {newest.length} {plural(newest.length, "addendum", "addenda")} in this bid
        </h2>
        <p className="ava-lede">
          {portal
            ? "Newest first. The buyer posts addenda behind a portal login. Check the portal, and upload any you find."
            : federal
              ? "Ava checks for new addenda every day, even after the bid is ready. Newest first."
              : `Newest first. Ava only knows about addenda you add. Check the ${w}'s bid page for new ones before you send.`}
        </p>
      </header>
      {portal ? (
        <AvaCard className="ava-a-uploadcard">
          <UploadAddendum ctx={ctx} portal />
        </AvaCard>
      ) : null}
      {newest.map((a) => (
        <AddendumReport key={a.id} ctx={ctx} a={a} go={go} ask={ask} federal={federal} />
      ))}
      {portal ? null : (
        <AvaCard className="ava-a-uploadcard">
          <UploadAddendum ctx={ctx} portal={false} />
        </AvaCard>
      )}
    </>
  );
}

/** An addendum the member found. For a bid whose files sit behind the
 *  buyer's portal login, this is the only way addenda reach Ava. Ava does
 *  not pretend to have read it: until she has compared it, it says so, and
 *  changes nothing in the bid (review panel, round 2). */
function UploadAddendum({ ctx, portal }: { ctx: AvaContext; portal: boolean }) {
  const { s, id } = ctx;
  const inputId = useId();
  return (
    <div className="ava-a-upload">
      <h3 className="ava-a-upload__h">Upload an addendum you found</h3>
      {portal ? (
        <p className="ava-a-p">
          The buyer posts files behind a portal login. Ava cannot reach them. Check the portal for
          new addenda, and upload any you find here. That is how addenda reach Ava for this bid.
        </p>
      ) : federalBid(ctx) ? (
        <p className="ava-a-p">
          Ava checks the buyer&apos;s files every day. If you find an addendum Ava has not listed,
          upload it here.
        </p>
      ) : (
        <p className="ava-a-p">
          Ava only knows about addenda you add. If you find one, upload it here.
        </p>
      )}
      <div className="ava-s-upload">
        <input
          id={inputId}
          type="file"
          className="ava-s-upload__input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) ava.uploadAddendum(id, file.name);
            e.target.value = "";
          }}
        />
        <label htmlFor={inputId} className="btn btn-secondary btn-sm">
          <Upload size={14} strokeWidth={2} aria-hidden /> Upload an addendum you found
        </label>
      </div>
      {s.addendumUploads.length > 0 ? (
        <ul className="ava-a-uploads">
          {s.addendumUploads.map((u, i) => (
            <li key={`${i}:${u.fileName}`}>
              <FileSearch size={14} strokeWidth={2} aria-hidden />
              <span>
                {s.fixes[`upload-compared:${i}`] ? (
                  <>
                    Ava compared <span className="mono">{u.fileName}</span> with your bid.
                  </>
                ) : s.fixes[`upload-read:${i}`] ? (
                  <>
                    You read <span className="mono">{u.fileName}</span> and said it changes nothing
                    in your bid. Ava has not compared it yet.
                  </>
                ) : (
                  <>
                    Ava has not compared <span className="mono">{u.fileName}</span> with your bid
                    yet.
                  </>
                )}
                <span className="ava-a-uploads__sub">
                  {" "}
                  Uploaded {fullDate(new Date(u.at))}.{" "}
                  {s.fixes[`upload-ack:${i}`]
                    ? "You will sign its acknowledgment and send it with your bid."
                    : "It needs your acknowledgment, signed the way the buyer asks."}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** "Still valid" can carry a line written when the addendum was posted, such
 *  as "The page limit question is still open." Once that question is
 *  answered or settled, the line is no longer true, so it is dropped. A line
 *  about an open question stays only while a matching question is open. */
function currentStillValid(ctx: AvaContext, text: string): string {
  const { bid, s } = ctx;
  const words = (x: string) =>
    new Set(
      x
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
  const openNow = (cid: string) => {
    const st = clarificationStatus(bid, s, cid);
    return st === "open" || st === "sent";
  };
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const kept = sentences.filter((sen) => {
    if (!/\b(still open|not settled|not answered)\b/i.test(sen)) return true;
    const sw = words(sen);
    let best: { id: string; overlap: number } | null = null;
    for (const c of bid.clarifications) {
      const overlap = [...words(c.title)].filter((w) => sw.has(w)).length;
      if (overlap > 0 && (!best || overlap > best.overlap)) best = { id: c.id, overlap };
    }
    return best ? openNow(best.id) : bid.clarifications.some((c) => openNow(c.id));
  });
  return kept.join("").trim();
}

// ─── One addendum's report ───

function AddendumReport({
  ctx,
  a,
  go,
  ask,
  federal,
}: {
  ctx: AvaContext;
  a: Addendum;
  go: ViewProps["go"];
  ask?: Ask;
  federal: boolean;
}) {
  const { bid, s } = ctx;
  const total = a.changes.length + a.otherChanges;
  const affecting = a.changes.filter((c) => c.effect !== "no-effect").length;
  const due = a.changes.find((c) => c.patch.kind === "due");
  const dueText =
    due && due.patch.kind === "due"
      ? ` · due date moved to ${dayMonth(dayFromNow(due.patch.dueDaysFromNow))}`
      : "";
  const reopened = a.changes.filter((c) => c.effect === "reopened");
  const reopenedPrice = reopened.filter((c) => c.patch.kind === "price-qty");
  const stillValid = currentStillValid(ctx, a.stillValid);
  const ackForm = bid.forms.find((f) => f.acknowledgesAddendumId === a.id);
  const ackFixed = !!s.fixes[`ack:${a.id}`];
  const settles = a.settlesClarificationId
    ? bid.clarifications.find((c) => c.id === a.settlesClarificationId)
    : undefined;
  const headingId = `ava-a-${a.id}`;

  return (
    <section className="ava-card ava-a-report" aria-labelledby={headingId}>
      <header className="ava-a-report__head">
        <h2 id={headingId} className="ava-a-report__title">
          Addendum {a.number} · {federal ? "posted" : "you added it on"}{" "}
          {fullDate(addendumPostedDay(a))}
        </h2>
        <p className="ava-muted">
          {a.arrivesDuringBuild
            ? "Ava compared it with the previous version."
            : "It came before Ava started. Already part of your bid."}
        </p>
      </header>

      <p className="ava-a-headline">
        <span className="mono">{total}</span> {plural(total, "change", "changes")} ·{" "}
        {affecting === 0 ? (
          "none affect your bid"
        ) : (
          <>
            <span className="mono">{affecting}</span> {plural(affecting, "affects", "affect")} your
            bid
          </>
        )}
        {dueText}
      </p>

      {a.changes.length > 0 ? (
        <div className="ava-a-tablewrap">
          <table className="ava-table ava-a-table">
            <caption className="ava-a-caption">What Addendum {a.number} changed</caption>
            <thead>
              <tr>
                <th scope="col">Change</th>
                <th scope="col">Before</th>
                <th scope="col">Now</th>
                <th scope="col">Your bid</th>
              </tr>
            </thead>
            <tbody>
              {a.changes.map((c) => (
                <tr key={c.id}>
                  <td className="ava-a-what">
                    {c.what}{" "}
                    <SourcePin
                      bid={bid}
                      source={c.source}
                      claim={`Addendum ${a.number}: ${c.what}.`}
                    />
                  </td>
                  <td className="ava-a-before">{c.before}</td>
                  <td className="ava-a-now">{c.now}</td>
                  <td>
                    <EffectChip effect={c.effect} />{" "}
                    <span className="ava-a-effect">{c.effectText}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {a.otherChanges > 0 ? (
        <p className="ava-a-other">
          <span className="mono">{a.otherChanges}</span> other{" "}
          {plural(a.otherChanges, "change does", "changes do")} not touch your bid. Ava read{" "}
          {plural(a.otherChanges, "it", "them")} and left your bid as it is.
        </p>
      ) : null}

      <div className="ava-grid-2 ava-a-grid">
        <div className="ava-a-box">
          <h3 className="ava-card__label">Back to you</h3>
          {reopened.length === 0 ? (
            <p className="ava-a-p">Nothing in this addendum needs a new decision from you.</p>
          ) : (
            <ul className="ava-a-back">
              {reopened
                .filter((c) => c.patch.kind !== "price-qty")
                .map((c) => (
                  <li key={c.id}>
                    <BackToYou ctx={ctx} change={c} go={go} ask={ask} />
                  </li>
                ))}
              {reopenedPrice.length > 0 ? (
                <li>
                  <PriceBack ctx={ctx} changes={reopenedPrice} go={go} ask={ask} />
                </li>
              ) : null}
            </ul>
          )}
        </div>
        <div className="ava-a-box">
          <h3 className="ava-card__label">Still valid, untouched by this addendum</h3>
          {stillValid ? <p className="ava-a-p">{stillValid}</p> : null}
          {ackForm || ackFixed ? (
            <p className="ava-a-ok">
              <CircleCheck size={14} strokeWidth={2} aria-hidden /> Acknowledgment form added to the
              package
              {ackForm ? `: ${ackForm.name}.` : "."}
            </p>
          ) : (
            <p className="ava-a-p">
              The acknowledgment form for this addendum is not in your bid yet. I add it when I
              check your bid again.{" "}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => go("check")}
              >
                Back to my bid
              </button>
            </p>
          )}
          {settles ? (
            <p className="ava-a-ok">
              <CircleCheck size={14} strokeWidth={2} aria-hidden /> This addendum settles your
              question: {settles.title.toLowerCase()}.
            </p>
          ) : null}
          {a.arrivesDuringBuild ? (
            <p className="ava-a-p ava-a-rerun">
              Ava checks your bid again with the new files.{" "}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => go("check")}>
                Back to my bid
              </button>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function EffectChip({ effect }: { effect: AddendumChange["effect"] }) {
  if (effect === "reopened") {
    return (
      <span className="ava-a-chip ava-a-chip--reopened">
        <RotateCcw size={11} strokeWidth={2.25} aria-hidden /> Reopened
      </span>
    );
  }
  if (effect === "updated") {
    return (
      <span className="ava-a-chip ava-a-chip--updated">
        <RefreshCw size={11} strokeWidth={2.25} aria-hidden /> Updated
      </span>
    );
  }
  return <span className="ava-a-noeffect">No effect</span>;
}

// ─── What the change hands back to the member, with its live status ───

function BackToYou({
  ctx,
  change: c,
  go,
  ask,
}: {
  ctx: AvaContext;
  change: AddendumChange;
  go: ViewProps["go"];
  ask?: Ask;
}) {
  const { bid, s } = ctx;
  const p = c.patch;

  if (p.kind === "commitment") {
    // The EFFECTIVE bid's commitment carries the addendum's new text.
    const commitment = bid.commitments.find((x) => x.id === p.commitmentId);
    if (commitment) return <CommitmentBack ctx={ctx} c={commitment} change={c} ask={ask} />;
  }

  if (p.kind === "price-qty") return <PriceBack ctx={ctx} changes={[c]} go={go} ask={ask} />;

  if (p.kind === "page-limit") {
    const sec = bid.sections.find((x) => x.id === p.sectionId);
    const pages = sec ? sectionPages(s, sec) : null;
    const over = sec && pages !== null && pages > p.pageLimit;
    return (
      <div className="ava-a-item">
        <p className="ava-a-item__h">{c.what}</p>
        <p className="ava-a-p">
          {sec
            ? `${sec.title} now has a limit of ${p.pageLimit} ${plural(p.pageLimit, "page", "pages")}.`
            : c.effectText}
        </p>
        {sec && pages !== null ? (
          <p className={`ava-a-status ava-a-status--${over ? "open" : "done"}`}>
            {over ? (
              <>
                It is <span className="mono">{pages}</span> {plural(pages, "page", "pages")} now. It
                needs cutting.
              </>
            ) : (
              <>
                <CircleCheck size={13} strokeWidth={2} aria-hidden /> It is{" "}
                <span className="mono">{pages}</span> {plural(pages, "page", "pages")}. It fits.
              </>
            )}
          </p>
        ) : null}
        <button
          type="button"
          className={`btn btn-sm ${over ? "btn-primary" : "btn-secondary"}`}
          onClick={() => go("check")}
        >
          Back to my bid
        </button>
      </div>
    );
  }

  if (p.kind === "requirement") {
    const req = bid.hardRequirements.find((r) => r.id === p.requirementId);
    const st = req ? requirementStatus(bid, s, req) : null;
    const askOpen = req?.askId ? !askResolved(bid, s, req.askId) : false;
    return (
      <div className="ava-a-item">
        <p className="ava-a-item__h">{c.what}</p>
        <p className="ava-a-p">{req ? `The requirement now reads: ${req.label}.` : c.effectText}</p>
        {st ? (
          <p className={`ava-a-status ava-a-status--${st.status === "meets" ? "done" : "open"}`}>
            {st.status === "meets" ? (
              <>
                <CircleCheck size={13} strokeWidth={2} aria-hidden /> You meet it
                {st.evidence ? `: ${st.evidence}.` : "."}
              </>
            ) : (
              "You do not meet it yet."
            )}
          </p>
        ) : null}
        {/* The rule as it now reads is asked again in her bid's chat: her
            earlier word was about the old rule (review panel, round 2). */}
        {req && st?.status !== "meets" ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() =>
              ask
                ? ask(
                    ruleReopenedBy(bid, s, req) || !askOpen || !req.askId
                      ? `must:${req.id}`
                      : `ask:${req.askId}`,
                  )
                : go("list", req.askId ? { ask: req.askId } : {})
            }
          >
            Answer it
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ava-a-item">
      <p className="ava-a-item__h">{c.what}</p>
      <p className="ava-a-p">{c.effectText}</p>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => go("check")}>
        Back to my bid
      </button>
    </div>
  );
}

/** Every quantity change in one addendum hands back ONE thing: the price. */
function PriceBack({
  ctx,
  changes,
  go,
  ask,
}: {
  ctx: AvaContext;
  changes: AddendumChange[];
  go: ViewProps["go"];
  ask?: Ask;
}) {
  const { bid, s } = ctx;
  // Approval is at the total the buyer evaluates: every period, when there are periods.
  const total = approvalTotal(bid, s);
  const across = bid.price?.periods ? "across every period" : "for year one";
  const approvedOld =
    !!s.priceApproval && total !== null && Math.abs(s.priceApproval.total - total) > 0.005;
  const approvedNow = !!s.priceApproval && total !== null && !approvedOld;
  return (
    <div className="ava-a-item">
      <p className="ava-a-item__h">Your price</p>
      <p className="ava-a-p">
        The price changed, because the buyer changed{" "}
        {changes.length === 1 ? "a quantity" : "quantities"}.
      </p>
      <ul className="ava-a-qty">
        {changes.map((c) => (
          <li key={c.id}>
            {c.what}: <span className="ava-a-before">{c.before}</span> → <strong>{c.now}</strong>
          </li>
        ))}
      </ul>
      {total === null ? (
        <p className="ava-a-status ava-a-status--open">
          Ava needs more of your answers before it can price this.
        </p>
      ) : approvedOld ? (
        <p className="ava-a-status ava-a-status--open">
          <RotateCcw size={13} strokeWidth={2} aria-hidden /> Your price changed since you approved
          it. The new total is <span className="mono">{usd0(total)}</span> {across}.
        </p>
      ) : approvedNow ? (
        <p className="ava-a-status ava-a-status--done">
          <CircleCheck size={13} strokeWidth={2} aria-hidden /> You approved the new total of{" "}
          <span className="mono">{usd0(total)}</span>.
        </p>
      ) : (
        <p className="ava-a-status ava-a-status--open">
          The new total is <span className="mono">{usd0(total)}</span> {across}. You have not
          approved it.
        </p>
      )}
      <button
        type="button"
        className={`btn btn-sm ${approvedNow ? "btn-secondary" : "btn-primary"}`}
        onClick={() => (ask ? ask("price") : go("price"))}
      >
        Open the price
      </button>
    </div>
  );
}

function sentence(t: string): string {
  const x = t.trim();
  return /[.!?]$/.test(x) ? x : `${x}.`;
}

/** From her bid, a reopened promise is asked again in its chat, like any
 *  reopened item. Elsewhere it opens here, in its own dialog. */
function CommitmentBack({
  ctx,
  c,
  change,
  ask,
}: {
  ctx: AvaContext;
  c: Commitment;
  change: AddendumChange;
  ask?: Ask;
}) {
  const { s, id } = ctx;
  const [open, setOpen] = useState(false);
  const review = () => (ask ? ask(["promise", c.id].join(":")) : setOpen(true));
  const status = commitmentStatus(s, c);
  const approved = s.commitments[c.id];

  return (
    <div className="ava-a-item">
      <p className="ava-a-item__h">{change.what}</p>
      {status === "reopened" && approved ? (
        <>
          <p className="ava-a-quote">
            Your earlier approval was based on the previous requirement.
          </p>
          <dl className="ava-a-diff">
            <dt>You approved</dt>
            <dd className="ava-a-before">“{approved.text}”</dd>
            <dt>The buyer now asks for</dt>
            <dd>
              <strong>“{c.text}”</strong>
            </dd>
          </dl>
          <p className="ava-a-status ava-a-status--open">
            <RotateCcw size={13} strokeWidth={2} aria-hidden /> This promise needs your approval
            again.
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={review}>
            Review the promise
          </button>
        </>
      ) : status === "needs-approval" ? (
        <>
          <p className="ava-a-p">
            The promise now reads: <strong>“{c.text}”</strong>
          </p>
          <p className="ava-a-status ava-a-status--open">You have not approved this promise yet.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={review}>
            Review the promise
          </button>
        </>
      ) : status === "approved" && approved ? (
        <>
          <p className="ava-a-p">
            The promise now reads: <strong>“{c.text}”</strong>
          </p>
          <p className="ava-a-status ava-a-status--done">
            <CircleCheck size={13} strokeWidth={2} aria-hidden /> You approved the new promise on{" "}
            {fullDate(new Date(approved.at))}.
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => ava.withdrawCommitment(id, c.id)}
          >
            Take back your approval
          </button>
        </>
      ) : (
        <p className="ava-a-p">
          Ava updated the promise to: <strong>“{c.text}”</strong> It does not need your approval.
        </p>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Approve the new promise"
        lines={[
          `The buyer now asks for: “${sentence(c.text)}”`,
          ...(approved && approved.text !== c.text
            ? [`You approved this before: “${sentence(approved.text)}”`]
            : []),
          ...(c.pricedAs ? [sentence(c.pricedAs)] : []),
          "If you win, you keep this promise for the whole contract.",
        ]}
        agreement="I approve this promise and will keep it if I win."
        confirmLabel="Approve the new promise"
        onConfirm={() => ava.approveCommitment(id, c.id, c.text)}
      />
    </div>
  );
}
