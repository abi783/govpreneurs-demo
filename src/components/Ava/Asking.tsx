// Every input is a question (docs/ava/build-handoff-two-phase.md): papers,
// answers, her price, her promises and the choices only she can make. One at
// a time, in the conversation, each saying what kind of proof it wants and
// where it goes, with "Why?" on demand. Nothing is saved until she answers,
// and "I don't have it" is always a real answer.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, Copy, FileUp, Mail, Mic, Phone } from "lucide-react";
import { AgentAvatar } from "../Companion/AgentAvatar";
import {
  AgentMsg,
  AgentTurn,
  ChatCard,
  MetaLine,
  QuickReplies,
  YouMsg,
  type Reply,
} from "../ds/AgentChat";
import { dayFromNow, fullDate } from "../../lib/ava/dates";
import type { Finding } from "../../lib/ava/checks";
import {
  buyerWord,
  addByDay,
  LEAD_WORDS,
  leadLine,
  PROOF_LABEL,
  riskAllowed,
  ruleOfAsk,
  STAFFING_KEY,
  type Question,
} from "../../lib/ava/flow";
import {
  approvalTotal,
  PRICE_YOURSELF_KEY,
  priceOf,
  rates,
  usd,
  wageWarnings,
} from "../../lib/ava/price";
import { ava, decisionKey, type LeadSaid } from "../../lib/ava/store";
import { fixQuestion, mine, OWNER_WORDS, questionText } from "../../lib/ava/thread";
import type { Ask, EnterField } from "../../lib/ava/types";
import { ConfirmDialog, copyText, PromiseConfirm, RiskDialog, SourcePin } from "./primitives";
import { EmailDraftDialog } from "./EmailDraft";
import { openOutside } from "./outside";
import { matchReply } from "../../lib/ava/words";

export { matchReply };
import { dropPaper, keepPaper } from "./paperFiles";
import type { AvaContext } from "./useAva";
import { currentMember } from "../../demo/ava/member";

export const avaFace = <AgentAvatar agent="ava" size={32} />;

/** A typed box that holds words, not a number: text, a phone or an email. */
function isWords(unit: EnterField["unit"]): boolean {
  return unit === "text" || unit === "phone" || unit === "email";
}

/** The input for a typed box: a phone gets the phone keypad, an email the
 *  email keyboard, a number the number pad. Her browser never fills in her
 *  own details: these boxes are often someone else's (a reference). */
function inputKind(unit: EnterField["unit"]) {
  if (unit === "phone") return { type: "tel", inputMode: "tel" as const, autoComplete: "off" };
  if (unit === "email") return { type: "email", inputMode: "email" as const, autoComplete: "off" };
  if (unit === "text") return { type: "text", inputMode: "text" as const };
  return { type: "text", inputMode: "decimal" as const };
}

/** What "Take a photo" accepts: any picture the phone's camera makes. */
const PHOTOS = ["jpeg", "png", "heic", "webp"].map((x) => `image/${x}`).join(",");

/** A value as she reads it: "$650", "1.9%", "$17.90 an hour". */
export function valueWords(v: number | string, unit: EnterField["unit"]): string {
  if (typeof v !== "number") return v;
  if (unit === "usd") return usd(v);
  if (unit === "usd-hour") return `${usd(v)} an hour`;
  if (unit === "percent") return `${v}%`;
  return String(v);
}

/** The email Ava drafts for someone who must act (her insurance agent), so
 *  she only has to send it. Ava never sends anything herself. It quotes the
 *  buyer's own words, so the paper that comes back meets the rule: limits,
 *  coverage, who it must name (review panel, 7 October 2026). */
export function draftEmail(
  ctx: AvaContext,
  ask: Ask,
): { to: string; subject: string; body: string } {
  const { bid } = ctx;
  const quote = ask.source.quote ?? ruleOfAsk(bid, ask.id)?.source.quote;
  const rule = ruleOfAsk(bid, ask.id)?.source ?? ask.source;
  const due = fullDate(dayFromNow(bid.deadline.dueDaysFromNow));
  const by =
    leadLine(bid, ctx.s, ask).fits === false
      ? "as soon as you can"
      : `by ${fullDate(addByDay(bid))}`;
  return {
    to: OWNER_WORDS[ask.owner].replace(/^your /, "Your "),
    subject: `${ask.title} for ${bid.bidNumber}`,
    body: [
      "Hello,",
      `I need this paper for a bid: ${ask.title.charAt(0).toLowerCase()}${ask.title.slice(1)}.`,
      quote ? `The ${buyerWord(bid)}'s rule (${rule.short}) says: "${quote}"` : null,
      `The bid is ${bid.bidNumber}, for ${bid.buyer}. It is due ${due}.`,
      `Could you send it to me ${by}?`,
      `Thank you, ${currentMember.ownerName}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

/** A question asked about a rule she said she is getting: Ava writes the
 *  email that gets it moving, instead of asking for the paper itself. */
export function isGetting(ctx: AvaContext, q: Question): boolean {
  if (q.kind !== "ask" || !q.ask || !q.rule) return false;
  return ctx.s.mustHave[q.rule.id]?.says === "getting" && q.ask.owner !== "you";
}

function FileButton({
  label,
  icon,
  kind,
  photo,
  onFile,
}: {
  label: string;
  icon: ReactNode;
  kind: "primary" | "secondary";
  photo: boolean;
  onFile: (file: File, photo: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={`btn btn-${kind}`} onClick={() => ref.current?.click()}>
        {icon}
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        hidden
        accept={photo ? PHOTOS : undefined}
        capture={photo ? "environment" : undefined}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f, photo);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** "Take a photo" and "Choose a file" for an ask. Every file she sends is
 *  kept as the file itself for her download (paperFiles.ts). */
function SendPaper({
  ctx,
  ask,
  first,
}: {
  ctx: AvaContext;
  ask: Ask;
  /** The photo button leads; false when another answer leads. */
  first: boolean;
}) {
  const send = (f: File, photo: boolean) => {
    keepPaper(ctx.id, ask.id, f);
    ava.sendFile(ctx.id, ask.id, f.name, photo);
  };
  return (
    <>
      <FileButton
        label="Take a photo"
        kind={first ? "primary" : "secondary"}
        photo
        icon={<Camera size={16} aria-hidden />}
        onFile={send}
      />
      <FileButton
        label="Choose a file"
        kind="secondary"
        photo={false}
        icon={<FileUp size={16} aria-hidden />}
        onFile={send}
      />
    </>
  );
}

/** The wage floor finding, as the pay answer it changes. */
function wageFix(
  ctx: AvaContext,
  f: Finding,
): { askId: string; fieldId: string; floor: number } | null {
  const w = wageWarnings(ctx.bid, ctx.s).find((x) => `wage:${x.role.id}` === f.id);
  if (!w?.belowFloor) return null;
  return { askId: w.role.pay.askId, fieldId: w.role.pay.fieldId, floor: w.belowFloor.floor };
}

/** She chose a step toward the paper, not the paper: an "I don't have it"
 *  option that does not meet the rule (DontHaveOption.satisfies absent). */
function stepTaken(ctx: AvaContext, ask: Ask): boolean {
  const a = ctx.s.answers[ask.id];
  if (a?.status !== "dont-have") return false;
  return !ask.dontHave?.find((o) => o.id === a.optionId)?.satisfies;
}

/** "Certificate of insurance" → "certificate of insurance"; a name or an
 *  acronym stays as it is. */
function lowerFirst(t: string): string {
  return /^[A-Z][a-z]/.test(t) && !/^(Form|Exhibit|Addendum|Ava|Grant)\b/.test(t)
    ? t.charAt(0).toLowerCase() + t.slice(1)
    : t;
}

/** True when every box of a typed answer is a percent she chooses (profit,
 *  contingency): "I don't have it" does not fit a choice. */
function percentChoice(ask: Ask): boolean {
  return ask.answer.type === "enter" && ask.answer.fields.every((f) => f.unit === "percent");
}

/** "Why?", when she asks: one plain sentence and the buyer's words. */
export function WhyTurn({ ctx, q }: { ctx: AvaContext; q: Question }) {
  if (!q.why) return null;
  return (
    <>
      <YouMsg>Why do you need this?</YouMsg>
      <AgentTurn avatar={avaFace}>
        <AgentMsg>
          {q.why.text} <SourcePin bid={ctx.bid} source={q.why.source} claim={q.why.text} /> The{" "}
          {buyerWord(ctx.bid)}'s words are on the right.
        </AgentMsg>
      </AgentTurn>
    </>
  );
}

/** The question shown now, with its answers under it. */
export function QuestionCard({
  ctx,
  q,
  why,
  onWhy,
  onShow,
  dialog: dialogAtStart,
  incoming,
  more = 0,
  repliesRef,
}: {
  ctx: AvaContext;
  q: Question;
  /** DEMO: the card keeps its answers here, so words she types can pick one. */
  repliesRef?: { current: Reply[] };
  /** How many questions come after this one. */
  more?: number;
  why: boolean;
  onWhy: () => void;
  /** Show something on the right: how Ava built the price. */
  onShow: (what: "build" | null) => void;
  /** PROTOTYPE: a case opens with a dialog open. */
  dialog?: string;
  /** Words she said or typed in the talk box, for a box on this card. */
  incoming?: { text: string; n: number } | null;
}) {
  const { bid, s, id } = ctx;
  const [mode, setMode] = useState<"" | "dont" | "fix" | "own" | "costs" | "unsure">("");
  const [text, setText] = useState("");
  const [email, setEmail] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<"" | "price" | "promise" | "risk">(
    dialogAtStart === "price" || dialogAtStart === "promise" || dialogAtStart === "risk"
      ? dialogAtStart
      : "",
  );
  const pending = s.pending[q.key];
  const ask = q.ask;
  const moreWords = more > 0 ? `${more} more after this` : null;
  useEffect(() => {
    if (dialogAtStart === "price" || dialogAtStart === "promise" || dialogAtStart === "risk")
      setDialog(dialogAtStart);
  }, [dialogAtStart]);
  // Words from the talk box fill the first empty box she can type words in.
  useEffect(() => {
    if (!incoming || !ask || ask.answer.type !== "enter") return;
    const f = ask.answer.fields.find((x) => x.unit === "text" && !(values[x.id] ?? "").trim());
    if (f) setValues((v) => ({ ...v, [f.id]: incoming.text }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming?.n]);
  const w = buyerWord(bid);
  const leave = (who: "me" | "mentor") => ava.leave(id, q.key, who);

  // What she can answer with, by kind.
  let lead: ReactNode = <AgentMsg>{questionText(bid, s, q)}</AgentMsg>;
  let body: ReactNode = null;
  let replies: Reply[] = [];
  let tail: ReactNode = null;
  /** One quiet line under the answers: what an answer does before she taps it. */
  let after: ReactNode = null;
  let stack = false;
  let meta = true;

  const dontHave = (): Reply => ({
    label: "I don't have it",
    kind: "ghost",
    onClick: () => (ask?.dontHave?.length ? setMode("dont") : leave("me")),
  });

  if (mode === "dont" && ask?.dontHave) {
    lead = <AgentMsg>That is a real answer. These are the ways the {w}'s files allow:</AgentMsg>;
    stack = true;
    replies = [
      ...ask.dontHave.map((o) => ({
        label: `${o.label} ${o.detail}`,
        onClick: () => ava.answer(id, ask.id, { status: "dont-have", optionId: o.id }),
      })),
      { label: "Leave it open for now", kind: "ghost" as const, onClick: () => leave("me") },
      { label: "Go back to the question", kind: "ghost" as const, onClick: () => setMode("") },
    ];
    meta = false;
  } else if (pending && ask) {
    // She sent a photo or a file: what Ava read, and one question.
    const ex = ask.answer.type === "upload" ? (ask.answer.extracts ?? []) : [];
    lead = (
      <>
        <AgentMsg>
          Got it.{" "}
          {ex.length > 0
            ? s.readOpened
              ? "I read it."
              : "I read it. What I found is on the right."
            : `I attached ${pending.fileName}.`}
        </AgentMsg>
        <AgentMsg>
          {ex.length > 0
            ? `Is this right? ${ex.map((x) => `${x.label}: ${valueWords(x.value, x.unit)}`).join(". ")}.`
            : `Is this the right paper? ${ask.title}.`}
        </AgentMsg>
      </>
    );
    meta = false;
    replies = [
      {
        label: "Yes, that is right",
        kind: "primary",
        onClick: () =>
          ava.answer(id, ask.id, {
            status: "done",
            fileName: pending.fileName,
            values:
              ex.length > 0 ? Object.fromEntries(ex.map((x) => [x.fieldId, x.value])) : undefined,
          }),
      },
      {
        label: "Choose another",
        onClick: () => {
          dropPaper(id, ask.id);
          ava.dropFile(id, ask.id);
        },
      },
    ];
  } else if (mode === "unsure" && q.kind === "must") {
    // "I'm not sure" on a rule that rejects the bid: never a yes, never a
    // pause. One plain line on what the rule does first; the buyer's own
    // words only under "Why?" (review panel, round 2).
    const plain = ask?.why ?? q.why?.text ?? null;
    lead = (
      <ChatCard>
        <h4>
          {q.proof === "there"
            ? "That is fine. You can decide later."
            : "That is fine. Not sure is a real answer."}
        </h4>
        {plain ? <p>{plain}</p> : null}
        {ask?.answer.type === "upload" ? <p>What counts: {ask.answer.accepts}</p> : null}
        <p>I leave this rule open and keep going. You can check it later, or ask a mentor.</p>
      </ChatCard>
    );
    meta = false;
    replies = [
      { label: "Leave it open for now", kind: "primary", onClick: () => leave("me") },
      { label: "Ask a mentor about this rule", onClick: () => leave("mentor") },
      ...(q.why && !why ? [{ label: "Why?", onClick: onWhy }] : []),
      { label: "Go back to the question", kind: "ghost", onClick: () => setMode("") },
    ];
  } else if (q.kind === "must" && q.changedBy && q.rule) {
    // An addendum changed this rule after she answered it: her answer was
    // about the old rule, so Ava asks once more (review panel, round 2).
    const r = q.rule;
    lead = (
      <ChatCard>
        <h4>Addendum {q.changedBy} changed this rule. Do you still meet it?</h4>
        <p>
          <b>{r.label}.</b> The {w} rejects a bid that does not meet it.{" "}
          <SourcePin bid={bid} source={r.source} claim={r.label} />
        </p>
      </ChatCard>
    );
    meta = false;
    replies = [
      {
        label: "I still meet it",
        kind: "primary",
        onClick: () => ava.sayMustHave(id, r.id, "have"),
      },
      { label: "I'm not sure", onClick: () => setMode("unsure") },
      {
        label: "No, I can't",
        kind: "ghost",
        onClick: () =>
          ava.sendBack(id, {
            reason: `You cannot meet this rule: ${r.label}.`,
            source: r.source,
          }),
      },
    ];
    after = <p className="ava2-small ava2-pauseline">{PAUSE_LINE}</p>;
  } else if (q.kind === "must" && !(ask && ask.answer.type === "answer")) {
    const r = q.rule!;
    lead = (
      <ChatCard>
        <h4>Can you meet this rule?</h4>
        <p>
          <b>{r.label}.</b> The {w} rejects a bid that does not meet it.{" "}
          <SourcePin bid={bid} source={r.source} claim={r.label} />
        </p>
        <MetaLine proof={PROOF_LABEL[q.proof]} goes={q.goes} after={moreWords} onWhy={onWhy} />
      </ChatCard>
    );
    meta = false;
    replies = [
      { label: "Yes, I have it", onClick: () => ava.sayMustHave(id, r.id, "have") },
      { label: "I can get it in time", onClick: () => ava.sayMustHave(id, r.id, "getting") },
      { label: "I'm not sure", onClick: () => setMode("unsure") },
      {
        label: "No, I can't",
        kind: "ghost",
        onClick: () =>
          ask?.dontHave?.length
            ? setMode("dont")
            : ava.sendBack(id, {
                reason: `You cannot meet this rule: ${r.label}.`,
                source: r.source,
              }),
      },
    ];
    after = <p className="ava2-small ava2-pauseline">{PAUSE_LINE}</p>;
  } else if (ask && ask.answer.type === "answer") {
    const choices = ask.answer.choices;
    if (q.kind === "must") {
      lead = (
        <ChatCard>
          <h4>{ask.answer.question}</h4>
          <p>{ask.why}</p>
          <MetaLine proof={PROOF_LABEL[q.proof]} goes={q.goes} after={moreWords} onWhy={onWhy} />
        </ChatCard>
      );
      meta = false;
    }
    replies = choices.map((c) => ({
      label: c.label,
      kind: c.failsGate ? ("ghost" as const) : ("secondary" as const),
      onClick: () => ava.answer(id, ask.id, { status: "done", choiceId: c.id }),
    }));
    // A question whose own choices already let her say she does not know keeps
    // the buyer's wording, and gets no second "I'm not sure".
    const ownUnsure = choices.some((c) => /not sure|don't know/i.test(c.label));
    if (ownUnsure) {
      // Nothing to add.
    } else if (q.kind !== "must")
      replies.push({ label: "I'm not sure", kind: "ghost", onClick: () => leave("mentor") });
    else {
      // Not knowing yet is a real answer: the rule stays open, nothing pauses.
      const last = replies.findIndex((x) => x.kind === "ghost");
      replies.splice(last < 0 ? replies.length : last, 0, {
        label: q.proof === "there" ? "I don't know yet" : "I'm not sure",
        onClick: () => setMode("unsure"),
      });
      if (choices.some((c) => c.failsGate))
        after = <p className="ava2-small ava2-pauseline">{PAUSE_LINE}</p>;
    }
  } else if (ask && ask.kind === "upload" && stepTaken(ctx, ask)) {
    // She chose a step toward the paper (her agent quotes the coverage). The
    // paper itself is still not in her bid: when it comes, she adds it here
    // (review panel, round 2: a quote is not the certificate).
    const a = s.answers[ask.id];
    const o = ask.dontHave?.find((x) => x.id === a?.optionId);
    lead = (
      <>
        <AgentMsg>
          You chose: {o ? o.label.split(". ")[0].replace(/\.$/, "") : "another way"}. That is a
          step. {ask.title} is still not in your bid.
        </AgentMsg>
        <AgentMsg>When it comes, add it here, and I put it in your bid.</AgentMsg>
      </>
    );
    meta = false;
    body = (
      <div className="ava2-came">
        <p className="ava2-small">It came:</p>
        <div className="ds-replies">
          <SendPaper ctx={ctx} ask={ask} first />
        </div>
      </div>
    );
    replies = [{ label: "Choose a different way", kind: "ghost", onClick: () => setMode("dont") }];
  } else if (ask && ask.kind === "upload" && isGetting(ctx, q)) {
    // A paper on its way from someone else. The email or the call gets it
    // moving; when it comes, she adds it right here (review panel, 7 October
    // 2026: this card was a dead end once she had asked for it).
    const mail = draftEmail(ctx, ask);
    const asked = s.answers[ask.id]?.status === "forwarded";
    const who = OWNER_WORDS[ask.owner];
    // She chose to call: no email button after that, only the paper.
    const called = s.answers[ask.id]?.forwardedTo?.startsWith("a call to ") ?? false;
    const line = leadLine(bid, s, ask);
    // How long it takes is hers to say: Ava asks, and never states a lead time
    // of its own (PRD OD2, Shyam, 8 October 2026).
    const howLong = !asked && !s.lead?.[ask.id] && ask.decideByDaysFromNow === undefined;
    lead = howLong ? (
      <AgentMsg>
        {ask.title} is not in your bid yet. How long will it take {who} to send it?
      </AgentMsg>
    ) : asked ? (
      <>
        <AgentMsg>
          Did your {lowerFirst(ask.title)} come? Add it here, and I put it in your bid.
        </AgentMsg>
        {line.text ? <AgentMsg>{line.text}</AgentMsg> : null}
      </>
    ) : (
      <>
        <AgentMsg>
          {ask.title} is not in your bid yet. {line.text}
        </AgentMsg>
        <AgentMsg>
          I wrote the email to {who}, with the {w}'s words in it.
          {s.readOpened ? "" : " It is on the right."}
        </AgentMsg>
      </>
    );
    const mailReply: Reply = {
      label: asked ? "Open the email again" : "Send it from my email",
      kind: asked ? "secondary" : "primary",
      icon: <Mail size={16} aria-hidden />,
      onClick: () => setEmail(true),
    };
    replies = howLong
      ? (Object.keys(LEAD_WORDS) as LeadSaid[]).map((k) => ({
          label: LEAD_WORDS[k],
          kind: k === "unsure" ? ("ghost" as const) : ("secondary" as const),
          onClick: () => ava.sayLead(id, ask.id, k),
        }))
      : [
          ...(called ? [] : [mailReply]),
          ...(asked
            ? []
            : [
                {
                  label: `I will call ${mine(who)}`,
                  icon: <Phone size={16} aria-hidden />,
                  onClick: () => ava.forward(id, [ask.id], `a call to ${who}`),
                },
              ]),
          {
            label: "I can't get it",
            kind: "ghost",
            onClick: () => (ask.dontHave?.length ? setMode("dont") : leave("me")),
          },
        ];
    body = howLong ? null : (
      <div className="ava2-came">
        <p className="ava2-small">{asked ? "It came:" : "Already have it?"}</p>
        <div className="ds-replies">
          <SendPaper ctx={ctx} ask={ask} first={asked} />
        </div>
      </div>
    );
  } else if (ask && ask.kind === "upload") {
    // One of the buyer's own files she must fetch (Exhibit D, behind its
    // login): say where it comes from, not "send me a photo".
    const buyerFile = bid.files.find((f) => f.uploadAskId === ask.id);
    if (buyerFile && ask.answer.type === "upload") {
      lead = (
        <>
          <AgentMsg>
            I need the {w}'s own file, {buyerFile.name}. It is not a paper of yours.
          </AgentMsg>
          <AgentMsg>{ask.answer.accepts}</AgentMsg>
        </>
      );
    }
    replies = [];
    tail = (
      <div className="ds-replies">
        {buyerFile ? (
          <FileButton
            label="Add the file"
            kind="primary"
            photo={false}
            icon={<FileUp size={16} aria-hidden />}
            onFile={(f) => {
              keepPaper(id, ask.id, f);
              ava.sendFile(id, ask.id, f.name, false);
            }}
          />
        ) : (
          <SendPaper ctx={ctx} ask={ask} first />
        )}
        <button type="button" className="btn btn-ghost" onClick={dontHave().onClick}>
          I don't have it
        </button>
      </div>
    );
  } else if (ask && ask.answer.type === "enter") {
    const fields = ask.answer.fields;
    const all = fields.every((f) => (values[f.id] ?? "").trim() !== "");
    body = (
      <div className="ava2-fields">
        {fields.map((f) => (
          <label key={f.id} className="ava2-field">
            <span className="ava2-field__l">{f.label}</span>
            <span className="ava2-field__box">
              {f.unit === "usd" || f.unit === "usd-hour" ? <span className="mono">$</span> : null}
              <input
                className="ava2-field__in"
                {...inputKind(f.unit)}
                value={values[f.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
              />
              {f.unit === "usd-hour" ? <span className="ava2-field__u">an hour</span> : null}
              {f.unit === "percent" ? <span className="ava2-field__u">%</span> : null}
            </span>
            {f.hint ? <span className="ava2-field__h">{f.hint}</span> : null}
          </label>
        ))}
        <div className="ava2-fields__acts">
          {all ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                ava.answer(id, ask.id, {
                  status: "done",
                  values: Object.fromEntries(
                    fields.map((f) => [
                      f.id,
                      isWords(f.unit)
                        ? values[f.id].trim()
                        : Number(values[f.id].replace(/[$,%\s]/g, "")),
                    ]),
                  ),
                })
              }
            >
              Save it
            </button>
          ) : (
            <span className="ava2-need">
              {fields.length === 1 ? "Type it, or say it with Talk." : "Fill every box to save."}
            </span>
          )}
          {percentChoice(ask) ? (
            <button type="button" className="btn btn-ghost" onClick={() => leave("mentor")}>
              I'm not sure. Ask my mentor
            </button>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={dontHave().onClick}>
              I don't have it
            </button>
          )}
        </div>
      </div>
    );
  } else if (ask && ask.answer.type === "approve") {
    if (mode === "fix") {
      body = (
        <div className="ava2-fields">
          <label className="ava2-field">
            <span className="ava2-field__l">What is right?</span>
            <span className="ava2-field__box">
              <input
                className="ava2-field__in"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </span>
          </label>
          <div className="ava2-fields__acts">
            {text.trim() ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  ava.answer(id, ask.id, { status: "done", values: { correction: text.trim() } })
                }
              >
                Tell Ava
              </button>
            ) : (
              <span className="ava2-need">Type what is right.</span>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setMode("")}>
              Go back
            </button>
          </div>
        </div>
      );
    } else {
      replies = [
        {
          label: "Yes, use it",
          kind: "primary",
          onClick: () => ava.answer(id, ask.id, { status: "done" }),
        },
        { label: "This is not right", onClick: () => setMode("fix") },
      ];
    }
  } else if (q.kind === "promise" && q.commitment) {
    replies = [
      { label: "Yes, I promise this", kind: "primary", onClick: () => setDialog("promise") },
      { label: "Not yet", kind: "ghost", onClick: () => leave("me") },
    ];
  } else if (q.kind === "decision" && q.decision) {
    const { sectionId, decision } = q.decision;
    const key = decisionKey(sectionId, decision.id);
    stack = true;
    if (mode === "own") {
      body = (
        <div className="ava2-fields">
          <label className="ava2-field">
            <span className="ava2-field__l">Your own words</span>
            <span className="ava2-field__box">
              <input
                className="ava2-field__in"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </span>
          </label>
          <div className="ava2-fields__acts">
            {text.trim() ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => ava.decide(id, key, "own", text)}
              >
                Use my words
              </button>
            ) : (
              <span className="ava2-need">Type your words, or say them with Talk.</span>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setMode("")}>
              Go back
            </button>
          </div>
        </div>
      );
    } else {
      replies = [
        { label: decision.choice, onClick: () => ava.decide(id, key, "ava") },
        { label: decision.other, onClick: () => ava.decide(id, key, "other") },
        { label: "Something else: my own words", kind: "ghost", onClick: () => setMode("own") },
      ];
    }
  } else if (q.kind === "staffing") {
    const p = priceOf(bid);
    lead = (
      <ChatCard>
        <h4>The staffing plan I propose</h4>
        <ul className="ava2-plan">
          {p.roles.map((r) => (
            <li key={r.id}>
              <b>
                {r.count} {r.name.toLowerCase()}
              </b>
              , {r.hoursPerWeek} hours a week
            </li>
          ))}
        </ul>
        <p>I build your price from it. Is this your plan?</p>
      </ChatCard>
    );
    replies = [
      { label: "Yes, that is my plan", kind: "primary", onClick: () => ava.fix(id, STAFFING_KEY) },
      { label: "I will type my prices instead", onClick: () => ava.fix(id, PRICE_YOURSELF_KEY) },
      { label: "Not sure? Ask a mentor", kind: "ghost", onClick: () => leave("mentor") },
    ];
  } else if (q.kind === "price") {
    replies =
      mode === "costs"
        ? [
            ...ctx.bid.asks
              .filter((a) => s.answers[a.id] && a.feeds.some((f) => f.startsWith("Price · ")))
              .slice(0, 6)
              .map((a) => ({
                label: `Change: ${a.title}`,
                onClick: () => ava.reopenAsk(id, a.id),
              })),
            { label: "Go back", kind: "ghost" as const, onClick: () => setMode("") },
          ]
        : [
            { label: "Yes, approve it", kind: "primary", onClick: () => setDialog("price") },
            { label: "Change a cost", onClick: () => setMode("costs") },
            { label: "How did you build it?", kind: "ghost", onClick: () => onShow("build") },
            { label: "I'm not sure. Ask my mentor", kind: "ghost", onClick: () => leave("mentor") },
          ];
    stack = mode === "costs";
  } else if (q.kind === "clar" && q.clar) {
    const c = q.clar;
    // Ava builds to the stricter reading of a simple limit: the bid is safe
    // either way, so asking the buyer is her choice, not her homework.
    const optional = c.kind === "simple-limit";
    lead = (
      <ChatCard>
        <h4>
          {optional
            ? `You can ask the ${w} a question. You do not have to.`
            : `Send the ${w} a question`}
        </h4>
        <p>
          {c.title}.{" "}
          {optional
            ? // In Ava's own voice; the fixture's line names her in the third
              // person (review panel, round 2).
              "I build your bid to the stricter limit, so it is safe either way."
            : c.checked}
        </p>
        <blockquote className="ava2-draft">{c.question}</blockquote>
        <p className="ava2-small">
          To {c.to}, {c.channel}.{optional ? "" : ` Meanwhile: ${c.meanwhile}`}
        </p>
      </ChatCard>
    );
    meta = false;
    // Skipped already: no "Skip it" that would do nothing (D-D2).
    const skipped = !!s.left[q.key];
    replies = optional
      ? [
          ...(skipped
            ? []
            : [{ label: "Skip it", kind: "primary" as const, onClick: () => leave("me") }]),
          {
            label: "Copy the question",
            icon: <Copy size={16} aria-hidden />,
            onClick: () => void copyText(c.question),
          },
          { label: "I sent it", onClick: () => ava.markSent(id, c.id) },
        ]
      : [
          {
            label: "Copy the question",
            icon: <Copy size={16} aria-hidden />,
            onClick: () => void copyText(c.question),
          },
          { label: "I sent it", kind: "primary", onClick: () => ava.markSent(id, c.id) },
          { label: "Later", kind: "ghost", onClick: () => leave("me") },
        ];
  } else if (q.kind === "portal") {
    meta = false;
    const url = bid.submission.portalUrl;
    body = (
      <div className="ds-replies">
        <FileButton
          label="Add pictures of the screens"
          kind="primary"
          photo={false}
          icon={<FileUp size={16} aria-hidden />}
          onFile={(f) => ava.addPortalShot(id, f.name)}
        />
        {url ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openOutside(`The ${w}'s portal`)}
          >
            Open the {w}'s portal
          </button>
        ) : null}
      </div>
    );
  } else if (q.kind === "fix" && q.finding) {
    const f = q.finding;
    lead = (
      <>
        <AgentMsg>Only you can answer this.</AgentMsg>
        <ChatCard>
          <h4>{f.title}</h4>
          <p>{f.detail}</p>
          {f.fix ? (
            <p>
              <b>{fixQuestion(f.fix.label)}</b>
            </p>
          ) : null}
        </ChatCard>
      </>
    );
    meta = false;
    // A rule the buyer rejects a bid for never goes ahead at risk (PRD R11):
    // its ways out are to change it, or to stop.
    const knock = !riskAllowed(f);
    const wage = /^wage:/.test(f.id) ? wageFix(ctx, f) : null;
    const deposit = f.id === "security-amount";
    replies = [
      ...(f.fix
        ? [{ label: f.fix.label, kind: "primary" as const, onClick: () => ava.fix(id, f.fix!.key) }]
        : []),
      ...(wage
        ? [
            {
              label: `Pay ${usd(wage.floor)} an hour, the lowest the law allows`,
              kind: "primary" as const,
              onClick: () =>
                ava.answer(id, wage.askId, {
                  status: "done",
                  values: { ...(s.answers[wage.askId]?.values ?? {}), [wage.fieldId]: wage.floor },
                }),
            },
          ]
        : []),
      ...(f.askId && s.answers[f.askId]
        ? [
            {
              label: wage ? "Change my pay" : deposit ? "Change the amount" : "Change my answer",
              kind: deposit ? ("primary" as const) : undefined,
              onClick: () => ava.reopenAsk(id, f.askId!),
            },
          ]
        : []),
      ...(deposit
        ? [
            {
              label: "I can't meet this",
              kind: "ghost" as const,
              onClick: () => ava.sendBack(id, { reason: `${f.title}.`, fromAskId: f.askId }),
            },
          ]
        : []),
      ...(knock
        ? [{ label: "Leave it open for now", kind: "ghost" as const, onClick: () => leave("me") }]
        : [
            {
              label: "Leave it as it is",
              kind: "ghost" as const,
              onClick: () =>
                f.severity === "critical"
                  ? setDialog("risk")
                  : ava.acceptRisk(id, f.id, {
                      // No reason she did not give (review panel, round 2).
                      reason: "",
                      severity: f.severity,
                      label: f.title,
                    }),
            },
          ]),
    ];
    if (knock)
      after = (
        <p className="ava2-small ava2-pauseline">
          The {w} rejects a bid with this. You cannot download your bid until it is fixed.
        </p>
      );
  }

  // Asks Ava cannot write without her: talk first, write, or leave it.
  if (
    ask &&
    ask.answer.type === "enter" &&
    ask.answer.fields.some((f) => f.unit === "text") &&
    !pending &&
    // A rule already offers "Ask a mentor about this rule": one mentor option.
    q.kind !== "must"
  ) {
    replies = [
      ...replies,
      { label: "Leave it for my mentor", kind: "ghost", onClick: () => leave("mentor") },
    ];
  }

  if (repliesRef) repliesRef.current = replies;
  const total = approvalTotal(bid, s);
  const rateNow = rates(bid, s);
  return (
    <>
      <AgentTurn avatar={avaFace}>
        {lead}
        {meta && q.kind !== "fix" ? (
          <MetaLine
            proof={PROOF_LABEL[q.proof]}
            later={q.proof === "later"}
            goes={q.goes}
            after={moreWords}
            onWhy={q.why && !why ? onWhy : undefined}
          />
        ) : null}
        {body}
      </AgentTurn>
      {why ? <WhyTurn ctx={ctx} q={q} /> : null}
      {tail}
      <QuickReplies replies={replies} stack={stack} />
      {after}
      {q.kind === "price" && rateNow ? (
        <ConfirmDialog
          open={dialog === "price"}
          onOpenChange={(o) => setDialog(o ? "price" : "")}
          title="Approve your rates"
          lines={[
            ...priceOf(bid).lines.map((l) => `${l.item}: ${usd(rateNow[l.id])} ${l.unit}.`),
            "No total: the buyer gives no quantities.",
            `They go on ${priceOf(bid).sheetName}. If you change a rate, Ava asks you to approve again.`,
          ]}
          agreement="I checked every rate. These are the rates I want to bid."
          confirmLabel="Approve the rates"
          onConfirm={() => ava.approveRates(id, rateNow)}
        />
      ) : null}
      {q.kind === "price" && total !== null ? (
        <ConfirmDialog
          open={dialog === "price"}
          onOpenChange={(o) => setDialog(o ? "price" : "")}
          title="Approve your price"
          lines={[
            `Your total: ${usd(total)}.`,
            `It goes on ${priceOf(bid).sheetName}.`,
            priceOf(bid).builtBy === "you"
              ? "If you change a price, Ava asks you to approve it again."
              : "If any cost changes, Ava asks you to approve it again.",
          ]}
          agreement="I checked the price. It is the price I want to bid."
          confirmLabel="Approve the price"
          onConfirm={() => ava.approvePrice(id, total)}
        />
      ) : null}
      {q.kind === "promise" && q.commitment ? (
        <PromiseConfirm
          open={dialog === "promise"}
          onOpenChange={(o) => setDialog(o ? "promise" : "")}
          noticeId={id}
          commitment={q.commitment}
        />
      ) : null}
      {ask && isGetting(ctx, q) ? (
        <EmailDraftDialog
          open={email}
          onOpenChange={setEmail}
          {...draftEmail(ctx, ask)}
          sendLabel="I sent it"
          onSent={() => {
            if (s.answers[ask.id]?.status !== "forwarded")
              ava.forward(id, [ask.id], OWNER_WORDS[ask.owner]);
          }}
        />
      ) : null}
      {q.finding && riskAllowed(q.finding) ? (
        <RiskDialog
          open={dialog === "risk"}
          onOpenChange={(o) => setDialog(o ? "risk" : "")}
          what={q.finding.title}
          severity={q.finding.severity}
          label={`Sent with an open problem: ${q.finding.title}`}
          onConfirm={(reason) =>
            ava.acceptRisk(id, q.finding!.id, {
              reason,
              severity: q.finding!.severity,
              label: `Sent with an open problem: ${q.finding!.title}`,
            })
          }
        />
      ) : null}
    </>
  );
}

/** The talk box sends words here first: they answer the question shown now
 *  when it takes words. Returns false when it cannot take them. */
export function answerByWords(
  ctx: AvaContext,
  q: Question | null,
  text: string,
  voice: boolean,
): boolean {
  const { id } = ctx;
  if (!q) return false;
  const ask = q.ask;
  if (ask && ask.answer.type === "enter") {
    const fields = ask.answer.fields;
    if (fields.length !== 1) return false;
    const f = fields[0];
    const v = isWords(f.unit) ? text : Number(text.replace(/[$,%\s]/g, ""));
    if (!isWords(f.unit) && !Number.isFinite(v as number)) return false;
    ava.answer(id, ask.id, {
      status: "done",
      values: { [f.id]: v, ...(voice ? { spoken: text } : {}) },
    });
    return true;
  }
  if (q.kind === "decision" && q.decision) {
    ava.decide(id, decisionKey(q.decision.sectionId, q.decision.decision.id), "own", text);
    return true;
  }
  return false;
}

export const TALK_LINE = "Ava can make mistakes. Read your bid before you send it.";

/** Under a rule that rejects the bid: what "No" does, before she taps it. */
const PAUSE_LINE = "If you can't, I pause the bid. Your answers stay saved.";
export { Mic };
