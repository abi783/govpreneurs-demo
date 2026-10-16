// "How to send it" (ava-two-phase.html Part 5, PRD D35): after she downloads,
// the steps only she can do, in order, for the way this buyer takes a bid.
// Ava never sends anything, and there is no "I sent it" step (Shyam, 7
// October 2026), so nothing here counts a submission.
//
// What it must never drop (review panel, 7 October 2026): the files as she
// actually downloaded them, any paper she must add herself, the day to send
// it (a day early) and the time it must arrive by, how to prove it arrived,
// every risk she accepted, what Ava did not check, and what is due if she
// wins.

import { useRef, useState, useSyncExternalStore } from "react";
import { Check, Mail, Upload } from "lucide-react";
import { ChatCard, FileRows, TodoList } from "../ds/AgentChat";
import { acceptedRisks } from "../../lib/ava/checks";
import { askNeededAt, visibleAsks } from "../../lib/ava/derive";
import { dayFromNow, fullDate } from "../../lib/ava/dates";
import {
  buyerWord,
  downloadStale,
  dueWords,
  holdsOf,
  lastWholeDownload,
  samWarning,
  samWords,
  selfChecks,
  sendDay,
} from "../../lib/ava/flow";
import { findOpportunity } from "../../demo/ava/opportunity";
import { packageParts } from "../../lib/ava/package";
import { ava } from "../../lib/ava/store";
import type { AvaBid, BidForm } from "../../lib/ava/types";
import { SourcePin } from "./primitives";
import { CopyButton, EmailDraftDialog } from "./EmailDraft";
import { PERSONA } from "../../demo/story/persona";
import { PortalSendDesk } from "./BidPortal";
import { modeFor, papersToResend, planDownload } from "./downloads";
import { builtFiles, papersVersion, subscribePapers } from "./paperFiles";
import type { AvaContext } from "./useAva";

const HOW: Record<string, string> = {
  portal: "Upload every file on the buyer's portal",
  email: "Send every file by email",
  paper: "Print it, sign it and deliver it",
  "typed-portal": "Type your answers on the buyer's website",
};

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;

/** A step from the buyer's checklist, in words that fit a bid she sends
 *  herself: proof that it arrived is kept, "upload it here" is not, because
 *  Ava has no "I sent it" step. A count of files says how many she has. */
function stepWords(label: string, files: number): string {
  if (/^upload the portal's receipt here/i.test(label))
    return "Save the portal's receipt and its confirmation number.";
  return label
    .replace(/,? and upload (a photo of )?it here\.?$/i, ".")
    .replace(/ and upload it here\.?$/i, ".")
    .replace(/\b\d+ files\b/i, `${files} ${files === 1 ? "file" : "files"}`)
    .replace(/\.\.$/, ".");
}

/** "Your price must stay open until 19 August 2026", from the buyer's words. */
function priceOpen(bid: AvaBid): string | null {
  const v = bid.overview?.validity;
  if (!v) return null;
  const days = Number(v.text.match(/(\d+)\s+days/)?.[1]);
  if (!Number.isFinite(days)) return v.text;
  const until = dayFromNow(bid.deadline.dueDaysFromNow + days);
  return `Your price must stay open until ${fullDate(until)}. The ${buyerWord(bid)} can accept it until then.`;
}

/** "Form 2" from "Non-Collusion Affidavit (Form 2)" or "Form C-1, …". */
function formShort(f: BidForm): string {
  return f.name.match(/\b(Form [A-Z0-9-]+)\b/)?.[1] ?? f.name;
}

function listWords(xs: string[]): string {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

/** Why she sends a paper again, in one line. */
const RESEND_WHY: Record<"broken" | "kind" | "gone", string> = {
  broken: "The file you sent will not open. Send the paper again.",
  kind: "I cannot put this kind of photo in your file. Send a JPEG, a PNG or a PDF.",
  gone: "I no longer have the file you sent. Send the paper again.",
};

/** Her steps, in order, in one list she ticks off: what Ava knows she must
 *  do to the files first, then the buyer's own checklist (8 October 2026:
 *  one list, not a numbered list and a checklist that repeat each other). */
function sendSteps(x: {
  bid: AvaBid;
  s: AvaContext["s"];
  mode: string;
  wantsPdf: boolean;
  paper: boolean;
  formsFile: string | null;
  signForms: BidForm[];
  notaryForms: BidForm[];
  originals: { askId: string; original?: string }[];
  steps: { id: string; label: string }[];
}): { id: string; label: string }[] {
  const w = buyerWord(x.bid);
  const word = x.wantsPdf
    ? "Then save each one as a PDF, with the same name. On a phone, open it in Word, tap the three dots, then Export, then PDF."
    : "Then print them.";
  const notary =
    x.notaryForms.length > 0
      ? ` Take ${listWords(x.notaryForms.map(formShort))} to a notary, with your photo ID. A notary is an official who watches you sign and stamps the form. Many banks and shipping stores have one. Call first.`
      : "";
  const scan = x.paper
    ? ""
    : " Then scan every page with your phone into one PDF, with the same name.";
  return [
    ...(x.mode === "word"
      ? [
          {
            id: "ava-step:word",
            label: `These are Word files, so you can fill the marked spaces. ${word}`,
          },
        ]
      : []),
    ...(x.signForms.length > 0 && x.formsFile
      ? [
          {
            id: "ava-step:sign",
            label: `${x.paper ? "Print every file." : `Print ${x.formsFile}.`} Sign each form.${notary}${scan}`,
          },
        ]
      : []),
    ...x.s.addendumUploads.map((u) => ({
      id: `ava-step:ack:${u.fileName}`,
      label: `Acknowledge ${u.fileName} the way the ${w} asks, and send it with your bid.`,
    })),
    ...x.originals.map((p) => ({
      id: `ava-step:original:${p.askId}`,
      label:
        p.original === "check"
          ? "Put your certified check in the envelope, with the original set."
          : "Put your surety's signed original bond in the envelope, with the original set. A copy does not count.",
    })),
    ...x.steps.map((c) => ({ id: c.id, label: c.label })),
  ];
}

/** The name over her file rows. */
function filesWords(paper: boolean, n: number): string {
  if (paper) return n === 1 ? "The file to print and sign" : `The ${n} files to print and sign`;
  return n === 1 ? "Your file to send" : `Your ${n} files to send`;
}

export function HowToSend({ ctx }: { ctx: AvaContext }) {
  const { bid, s, id } = ctx;
  const sub = bid.submission;
  const w = buyerWord(bid);
  const add = useRef<HTMLInputElement>(null);
  const [mailOpen, setMailOpen] = useState(false);
  // Her papers and the files a download wrote live in this session: when one
  // changes, what she has and what she sends again change with it.
  useSyncExternalStore(subscribePapers, papersVersion, () => 0);
  const federal = findOpportunity(id)?.scope === "fed";
  const emails = sub.account.match(EMAIL) ?? [];
  const whole = lastWholeDownload(s);
  const mode = modeFor(whole?.holes ?? 0);
  const plan = planDownload(ctx, null, mode);
  // What she has: the files the download wrote, else the plan it followed.
  const files = builtFiles(id, true) ?? plan.files.map((f) => f.name);
  const resend = papersToResend(ctx);
  const originals = plan.papers.filter((p) => p.original);
  // Not ready to send: something holds the bid, or her files are older than
  // it (round 2). Then no file list and no steps, only what to do first.
  const holds = holdsOf(bid, s, packageParts(bid));
  const stale = !!downloadStale(s);
  const parts = s.downloads.filter((d) => d.whole === false);
  const partOnly = !whole && parts.length > 0;
  const wantsPdf = sub.files.some((f) => /\.pdf$/i.test(f.name)) || /\bpdf\b/i.test(sub.limits);
  const paper = sub.method === "paper";
  const steps = sub.checklist
    .filter((c) => !c.auto)
    .map((c) => ({ ...c, label: stepWords(c.label, files.length) }));
  // Forms she signs, and those a notary must see her sign.
  const signForms = bid.forms.filter(
    (f) => f.handling.includes("you-sign") || f.handling.includes("notary"),
  );
  const notaryForms = bid.forms.filter((f) => f.handling.includes("notary"));
  const formsFile =
    plan.files.find((f) =>
      f.part.pieces.some((pc) => pc.kind === "form" && signForms.some((x) => x.id === pc.formId)),
    )?.name ?? null;
  const notary = notaryForms.length > 0 || steps.some((c) => /notary/i.test(c.label));

  const todo = sendSteps({
    bid,
    s,
    mode,
    wantsPdf,
    paper,
    formsFile,
    signForms,
    notaryForms,
    originals,
    steps,
  });
  // A notary step that came from the buyer's list still gets its meaning.
  const notaryNote = notary && notaryForms.length === 0;
  const filesLabel = filesWords(paper, files.length);
  const notReady =
    holds.length > 0 || stale ? (
      <p className="ava2-send__stale">
        {stale
          ? "The files you have are older than your bid."
          : "Your bid is not ready to send yet."}{" "}
        Answer the questions above, then download it again.
      </p>
    ) : null;

  if (sub.method === "typed-portal") {
    return (
      <ChatCard className="ava2-send">
        <h4>How to send it</h4>
        {notReady ?? (
          <>
            <p>
              <b>Submit it by {sendDay(bid)}</b>, a day early. It must arrive by {dueWords(bid)}.
            </p>
            <p>Only you can do these, in order. Ava cannot see the portal, so tick each one.</p>
            <div className="ava2-send__portal">
              <PortalSendDesk ctx={ctx} noReceipt />
            </div>
          </>
        )}
        <Keep ctx={ctx} />
      </ChatCard>
    );
  }

  return (
    <ChatCard className="ava2-send">
      <h4>How to send it</h4>
      {notReady ? null : (
        <p>
          <b>
            {paper ? "Deliver" : "Send"} it by {sendDay(bid)}
          </b>
          , a day early. It must arrive by {dueWords(bid)}.
        </p>
      )}
      <p>
        {HOW[sub.method] ?? "Hand it in"}: {sub.where.replace(/^The /, "the ")}.{" "}
        <SourcePin bid={bid} source={sub.source} claim={`Send it to ${sub.where}.`} />
      </p>
      {emails.length > 0 ? (
        <ul className="ava2-send__copy">
          {emails.map((e) => (
            <li key={e}>
              <span className="mono">{e}</span>
              <CopyButton text={e} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="ds-note">{sub.account}</p>
      )}

      {notReady ? (
        notReady
      ) : partOnly ? (
        <>
          <h5>You downloaded {parts[parts.length - 1].what.toLowerCase()} only</h5>
          <FileRows
            files={(builtFiles(id, false) ?? []).map((f) => ({ name: f, kind: kindOf(f) }))}
          />
          <p>
            To send your bid, download all of it. These files are still to download:{" "}
            {plan.files
              .map((f) => f.name)
              .filter((n) => !(builtFiles(id, false) ?? []).includes(n))
              .join(", ")}
            .
          </p>
        </>
      ) : (
        <>
          {resend.length > 0 ? (
            <>
              <h5>Send me these papers again before you download</h5>
              <ul>
                {resend.map((p) => (
                  <li key={p.askId}>
                    <b>{p.title}.</b> {RESEND_WHY[p.why]}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h5>{filesLabel}</h5>
          {signForms.length > 0 && !paper ? (
            <p className="ds-note">Send them after you sign.</p>
          ) : null}
          <FileRows files={files.map((f) => ({ name: f, kind: kindOf(f) }))} />
          {sub.limits ? <p className="ds-note">{sub.limits}</p> : null}

          {todo.length > 0 ? (
            <>
              <h5>Your steps, in order</h5>
              <p className="ds-note">
                Only you can do these. Ava never sends anything for you. Check off each one as you do it.
              </p>
              <TodoList
                items={todo.map((t) => ({ ...t, done: !!s.checklist[t.id] }))}
                onToggle={(key) => ava.toggleChecklist(id, key)}
              />
              {notaryNote ? (
                <p className="ds-note">
                  A notary is an official who watches you sign and stamps the form. Many banks and
                  shipping stores have one. Call first.
                </p>
              ) : null}
            </>
          ) : null}

          {sub.markings.length > 0 ? (
            <>
              <h5>How the {w} wants the files</h5>
              <ul>
                {sub.markings.map((m) => (
                  <li key={m}>
                    {m}
                    {/^cover page/i.test(m)
                      ? " Ava puts this on the first page of your proposal."
                      : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}

      {sub.method === "email" && !notReady && !partOnly ? (
        <>
          <p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setMailOpen(true)}
            >
              <Mail size={14} aria-hidden /> See the email Ava wrote
            </button>
          </p>
          <EmailDraftDialog
            open={mailOpen}
            onOpenChange={setMailOpen}
            to={emails.join(", ")}
            subject={coverSubject(bid)}
            body={coverBody(bid, files)}
          />
        </>
      ) : null}

      <Keep ctx={ctx} />

      <SentIt ctx={ctx} ready={!notReady && !partOnly && !!whole} />

      {federal ? (
        <p className="ds-note">Check the notice on SAM.gov for changes before you send.</p>
      ) : (
        <div className="ava2-send__addenda">
          <p className="ds-note">
            An addendum is a change the {w} makes to its files. Ava only knows about addenda you
            add.{" "}
            {sub.method === "portal"
              ? `Check ${sub.where.replace(/^The /, "the ")} for new addenda before you send.`
              : `Ask the ${w}'s buyer about new addenda before you send.`}
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => add.current?.click()}
          >
            <Upload size={14} aria-hidden /> Add an addendum
          </button>
          <input
            ref={add}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) ava.uploadAddendum(id, f.name);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </ChatCard>
  );
}

/** "PDF" from "1_Proposal_HaddadCatering.pdf": the kind beside a file row. */
function kindOf(name: string): string | undefined {
  if (/\.xlsx?$/i.test(name)) return "Excel";
  if (/\.docx?$/i.test(name)) return "Word";
  if (/\.pdf$/i.test(name)) return "PDF";
  return undefined;
}

/** What she keeps in mind after she sends: what Ava did not check, the risks
 *  she took, her registration, how long her price stays open, and what is
 *  due if she wins. */
function Keep({ ctx }: { ctx: AvaContext }) {
  const { bid, s } = ctx;
  const unchecked = selfChecks(bid, s);
  const risks = acceptedRisks(s);
  const sam = samWarning(bid, s);
  const open = priceOpen(bid);
  const later = visibleAsks(bid, s).filter((a) => askNeededAt(bid, a) !== "bid");
  // A rule checked with the bid whose duty starts at award (a performance
  // bond within 10 days of award): due if she wins, in the buyer's words.
  const atAward = bid.hardRequirements.filter(
    (r) =>
      (r.neededAt ?? "bid") === "bid" &&
      /\bof (notice of )?award\b|if you win/i.test(r.label) &&
      !later.some((a) => a.title === r.label),
  );
  // Only a reason she gave herself (round 2: never one Ava wrote for her).
  const said = (reason: string) => !!reason && !/^you chose to leave it\.?$/i.test(reason.trim());
  return (
    <>
      {unchecked.length > 0 ? (
        <>
          <h5>Check these yourself before you send</h5>
          <ul>
            {unchecked.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      ) : null}
      {risks.length > 0 ? (
        <>
          <h5>You chose to go ahead at risk on these</h5>
          <ul>
            {risks.map((r) => (
              <li key={r.key}>
                Going ahead at risk: {r.label.replace(/^Sent with an open problem: /, "")}.
                {said(r.reason) ? ` Your reason: ${r.reason}` : ""}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {sam ? (
        <>
          <h5>{samWords(bid, sam).title}</h5>
          <p className="ava2-send__term">{samWords(bid, sam).term}</p>
          <p>{samWords(bid, sam).text}</p>
        </>
      ) : null}
      {open && bid.overview?.validity ? (
        <p>
          {open}{" "}
          <SourcePin
            bid={bid}
            source={bid.overview.validity.source}
            claim={bid.overview.validity.text}
          />
        </p>
      ) : null}
      {later.length + atAward.length > 0 ? (
        <>
          <h5>If you win</h5>
          <ul>
            {atAward.map((r) => (
              <li key={r.id}>
                <b>{r.label}.</b>{" "}
                {r.source.quote ? `The ${buyerWord(bid)}'s words: “${r.source.quote}”` : ""}{" "}
                <SourcePin bid={bid} source={r.source} claim={r.label} />
              </li>
            ))}
            {later.map((a) => (
              <li key={a.id}>
                <b>{a.title}.</b> {a.why} <SourcePin bid={bid} source={a.source} claim={a.title} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

// ─── The email Ava wrote to go with the files ───

/** The buyer's own subject line when its words give one, else the bid number and her name. */
function coverSubject(bid: AvaBid): string {
  const quoted = bid.submission.markings.map((m) => m.match(/"([^"]+)"/)?.[1]).find(Boolean);
  return quoted ?? `${bid.bidNumber} – ${PERSONA.businessName}`;
}

function coverBody(bid: AvaBid, files: string[]): string {
  const noun = bid.kind === "reply" ? "reply" : "bid";
  return [
    "Hello,",
    `Please find attached the ${noun} from ${PERSONA.businessName} for ${bid.officialTitle} (${bid.bidNumber}).`,
    files.length > 0 ? `Attached:\n${files.map((f) => `- ${f}`).join("\n")}` : null,
    `Please confirm that you received it. If you need anything else, call or write to me.`,
    [
      `Thank you,`,
      PERSONA.ownerName,
      `${PERSONA.ownerTitle}, ${PERSONA.businessName}`,
      `${PERSONA.phone} · ${PERSONA.email}`,
      `UEI ${PERSONA.uei} · CAGE ${PERSONA.cage}`,
    ].join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** DEMO: the last step. Ava never sends anything. She only keeps the day the
 *  member says she sent it, so the list and the header can say so. */
function SentIt({ ctx, ready }: { ctx: AvaContext; ready: boolean }) {
  const { id, s, bid } = ctx;
  const noun = bid.kind === "reply" ? "reply" : "bid";
  if (s.sentAt) {
    return (
      <div className="ava2-sentit" role="status">
        <p>
          <Check size={15} aria-hidden />{" "}
          <b>You told Ava you sent it on {fullDate(new Date(s.sentAt))}.</b> Ava keeps your files
          here. If the buyer asks you a question, come back to this page.
        </p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => ava.unsendBid(id)}>
          I did not send it
        </button>
      </div>
    );
  }
  return (
    <div className="ava2-sentit">
      <h5>When you have sent it</h5>
      <p className="ds-note">
        Ava never sends your {noun} for you. Tell Ava when you did, and she keeps the day.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!ready}
        onClick={() => ava.sendBid(id)}
      >
        <Check size={16} aria-hidden /> I sent it
      </button>
      {!ready ? <p className="ds-note">Download your {noun} first.</p> : null}
    </div>
  );
}
