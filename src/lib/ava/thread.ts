// Phase 1 is a conversation (docs/ava/ava-two-phase.html, Part 2). This file
// builds it from what Ava read and what she answered, in the order she
// answered (BidState.trail). Nothing here is stored: the thread is the same
// every time her state is the same, so every screen can be reached by
// answering, and reopening an answer takes its turn back out.
//
// Ava speaks as "I" (skill §5). The product names her in the third person
// only outside her own words. Every string a member reads is here, once.

import { blockingFindings } from "./checks";
import { bidDecision, claimView, sectionParagraphs } from "./derive";
import { dayFromNow, fullDate } from "./dates";
import {
  buyerWord,
  checkLines,
  count,
  filesRead,
  grantUnsure,
  leadLine,
  readyWords,
  tookWords,
  type CheckLine,
  type Flow,
  type Question,
} from "./flow";
import type { GrantView } from "./grant";
import { approvalTotal, isRateList, usd } from "./price";
import { decisionKey, type AskAnswer, type BidState } from "./store";
import type { Ask, AvaBid } from "./types";
import { readable } from "./types";

export type Turn =
  | { kind: "ava"; key: string; lines: string[] }
  | {
      kind: "you";
      key: string;
      text: string;
      file?: { name: string; photo: boolean };
      voice?: boolean;
    }
  | { kind: "grant"; key: string; call: GrantView["call"]; gist: string }
  | {
      kind: "mentor";
      key: string;
      name: string;
      verdict: "pursue" | "dont-pursue" | null;
      note: string;
      reviewId: string;
    }
  | {
      kind: "trace";
      key: string;
      live: boolean;
      /** The live line ("Reading Exhibit B") or the folded summary. */
      line: string;
      time?: string;
      steps: { done: boolean; text: string; found?: string | null }[];
    };

/** The mentor's read of the opportunity, as Ava shows it. */
export interface MentorRead {
  name: string;
  verdict: "pursue" | "dont-pursue" | null;
  note: string;
  reviewId: string;
}

/** Words for the owner of an ask, as she would say them: "your insurance agent". */
export const OWNER_WORDS: Record<Ask["owner"], string> = {
  you: "you",
  bookkeeper: "your bookkeeper",
  "insurance-agent": "your insurance agent",
  surety: "your surety",
  references: "your references",
  subcontractor: "the company that does part of the work for you",
};

/** Ava's question about a promise. The promise's own full stop stays inside the
 *  quotation marks, so the line never ends a quotation with two marks. */
function promiseLine(text: string): string {
  const t = text.trim();
  const inside = /[.!?]$/.test(t) ? t : `${t}.`;
  return `If you win, you promise this: “${inside}” Can you do it?`;
}

function lowerFirst(t: string): string {
  return /^[A-Z][a-z]/.test(t) && !/^(Form|Exhibit|Addendum)\b/.test(t)
    ? t.charAt(0).toLowerCase() + t.slice(1)
    : t;
}

function firstName(full: string): string {
  return full.split(" ")[0];
}

// ─── What Ava asks ───

/** A fix her button names ("Add it to my price"), asked by Ava as a
 *  question: "Add it to your price?" */
export function fixQuestion(label: string): string {
  return `${label.replace(/\bmy\b/g, "your")}?`;
}

/** The words of a question, as Ava asks it. */
export function questionText(bid: AvaBid, s: BidState, q: Question): string {
  const w = buyerWord(bid);
  switch (q.kind) {
    case "must":
      if (q.ask?.answer.type === "answer") return q.ask.answer.question;
      return `Can you meet this rule? ${q.title}.`;
    case "ask": {
      const a = q.ask!;
      if (a.answer.type === "answer") return a.answer.question;
      if (a.answer.type === "approve") return `Is this right? ${a.answer.proposal}`;
      if (a.kind === "upload")
        return `Next paper: ${lowerFirst(a.title)}.${q.goes ? ` It goes into ${q.goes}. I marked the spot.` : ""}`;
      return `Next, I need this: ${lowerFirst(a.title)}.${q.goes ? ` It goes into ${q.goes}.` : ""}`;
    }
    case "promise":
      return promiseLine(q.commitment!.text);
    case "decision":
      return "One choice I should not make for you. Which is true for you?";
    case "staffing":
      return "Here is the staffing plan I propose. I build your price from it. Is this your plan?";
    case "price": {
      // In phase 2 her bid, and its price sheet, are in the middle.
      const where = s.readOpened ? "on the price sheet in your bid" : "on the right";
      if (isRateList(bid))
        return `Your rates are ${where}. The buyer gives no quantities, so there is no total. Are these the rates you want to bid?`;
      const total = approvalTotal(bid, s);
      const what = bid.price?.periods ? "The total across every period" : "The total for year one";
      return total === null
        ? `Your price is ${where}. Is this the price you want to bid?`
        : `Your price is ${where}. ${what} is ${usd(total)}. Is this the price you want to bid?`;
    }
    case "clar":
      return `Something in the ${w}'s files is unclear. Only the ${w} can answer it. I wrote the question for you.`;
    case "fix":
      return q.finding!.fix
        ? `${q.finding!.title}. ${fixQuestion(q.finding!.fix.label)}`
        : `${q.finding!.title}. ${q.finding!.detail}`;
    case "portal":
      return `The ${w}'s questions sit behind its portal login. I cannot read them from the files. Show me the screens, and I build your guide.`;
  }
}

/** The answer she gave, in her own short words, for the thread. */
export function answerText(bid: AvaBid, s: BidState, key: string): string | null {
  const kind = key.split(":")[0];
  if (kind === "ask") {
    const id = key.slice(4);
    const ask = bid.asks.find((a) => a.id === id);
    const a = s.answers[id];
    if (!ask || !a) return null;
    return askAnswerWords(ask, a);
  }
  if (key.startsWith("must:")) {
    const m = s.mustHave[key.slice(5)];
    if (!m) return null;
    return m.says === "have" ? "Yes, I have it." : "I can get it in time.";
  }
  if (key.startsWith("promise:")) return "Yes, I promise this.";
  if (key.startsWith("decision:")) {
    const d = s.decisions[key.slice(9)];
    if (!d) return null;
    if (d.pick === "own") return d.text ?? "My own words.";
    const [secId, decId] = key.slice(9).split(":");
    const dec = bid.sections.find((x) => x.id === secId)?.decisions?.find((x) => x.id === decId);
    return d.pick === "ava"
      ? (dec?.choice ?? "Keep your choice.")
      : (dec?.other ?? "The other one.");
  }
  if (key === "price") return "Yes, approve it.";
  if (key.startsWith("clar:")) return "I sent it.";
  if (key === "portal") {
    const n = s.portalShots.length;
    return n > 0 ? `I added ${n} ${n === 1 ? "picture" : "pictures"} of the portal.` : null;
  }
  if (key === "fix:staffing:approved") return "Yes, that is my plan.";
  if (key === "fix:demo:price-yourself") return "I will type my prices instead.";
  if (key.startsWith("fix:")) {
    const f = blockingFindings(bid, { ...s, fixes: {} }).find(
      (x) => x.fix && `fix:${x.fix.key}` === key,
    );
    return f?.fix
      ? `Yes, ${f.fix.label.charAt(0).toLowerCase()}${f.fix.label.slice(1)}.`
      : "Yes, do it.";
  }
  if (key.startsWith("left:")) {
    const q = key.slice(5);
    const l = s.left[q];
    if (!l) return null;
    if (l.for === "mentor") return "Leave it for my mentor.";
    if (q.startsWith("clar:")) return "Skip it.";
    if (q.startsWith("must:") || bid.hardRequirements.some((r) => `ask:${r.askId}` === q))
      return "I'm not sure. Leave it open for now.";
    return "I don't have it now.";
  }
  return null;
}

/** "your insurance agent" as she says it herself: "my insurance agent". */
export function mine(words: string): string {
  return words.replace(/^your /, "my ").replace(/^you$/, "me");
}

function askAnswerWords(ask: Ask, a: AskAnswer): string {
  // What she chose, in her own voice. Ava cannot know an email was sent: she
  // opened it in her own mail app, or she said she will call.
  if (a.status === "forwarded")
    return a.forwardedTo?.startsWith("a call to ")
      ? `I will call ${mine(a.forwardedTo.slice("a call to ".length))}.`
      : `I opened the email to ${mine(a.forwardedTo ?? OWNER_WORDS[ask.owner])}.`;
  if (a.status === "dont-have") {
    const o = ask.dontHave?.find((x) => x.id === a.optionId);
    return o ? o.label : "I don't have it.";
  }
  if (a.fromGrant) return `I told Grant: ${a.fromGrant}.`;
  switch (ask.answer.type) {
    case "answer":
      return ask.answer.choices.find((c) => c.id === a.choiceId)?.label ?? "I answered it.";
    case "approve":
      return typeof a.values?.correction === "string"
        ? `This is not right: ${a.values.correction}`
        : "Yes, use it.";
    case "upload":
      return a.fileName ? `Sent: ${a.fileName}` : "I sent it.";
    case "enter": {
      const vals = ask.answer.fields.flatMap((f) => {
        const v = a.values?.[f.id];
        if (v === undefined || v === "") return [];
        if (typeof v !== "number") return [String(v)];
        if (f.unit === "usd") return [usd(v)];
        if (f.unit === "usd-hour") return [`${usd(v)} an hour`];
        if (f.unit === "percent") return [`${v}%`];
        return [String(v)];
      });
      return vals.length > 0 ? vals.join(" · ") : "I typed it.";
    }
  }
}

/** Ava's short reply after an answer, if she says one. */
function ack(bid: AvaBid, s: BidState, key: string): string | null {
  if (key.startsWith("must:")) {
    const m = s.mustHave[key.slice(5)];
    const r = bid.hardRequirements.find((x) => x.id === key.slice(5));
    if (!m || !r) return null;
    if (m.says === "have") return "Good. I ask for the copy when I write that part.";
    const copy = [r.askId, ...(r.askIds ?? [])]
      .map((x) => bid.asks.find((a) => a.id === x))
      .find((a) => a?.kind === "upload");
    const lead = copy ? leadLine(bid, s, copy) : null;
    if (lead?.fits === false) return `${lead.text} I keep building meanwhile.`;
    return "Good. I keep building while you get it.";
  }
  if (key.startsWith("left:")) {
    const q = key.slice(5);
    const l = s.left[q];
    if (q.startsWith("clar:")) return "That is fine. Your bid is safe either way.";
    const rule = q.startsWith("must:")
      ? bid.hardRequirements.find((r) => `must:${r.id}` === q)
      : bid.hardRequirements.find((r) =>
          [r.askId, ...(r.askIds ?? [])].some((a) => `ask:${a}` === q),
        );
    if (rule && l?.for !== "mentor")
      return "That is fine. I left this rule open. Check it before you send. I list it in How to send it.";
    // A mentor cannot meet a rule for her: no mentor holds her permit or goes
    // to her site visit (review panel, round 2).
    if (rule)
      return "That is fine. I left this rule open. A mentor can tell you if your paper counts. Only you can get it, so start this week.";
    if (l?.for === "mentor") {
      // The cost is said once: the first time she leaves something for a mentor.
      const first = s.trail.find(
        (k) => k.startsWith("left:") && s.left[k.slice(5)]?.for === "mentor",
      );
      return first === key
        ? "That is fine. I left it open and marked in your bid. A mentor can fill it if you ask for a review. A review costs $97."
        : "That is fine. I left it open for a mentor.";
    }
    return "That is fine. I left it open. It stays marked in your bid until you fill it.";
  }
  if (key.split(":")[0] === "ask") {
    const ask = bid.asks.find((a) => key === ["ask", a.id].join(":"));
    const a = s.answers[key.slice(4)];
    if (ask && a?.status === "forwarded")
      return `Thank you. I keep writing while we wait for ${OWNER_WORDS[ask.owner]}.`;
    // DEMO: a choice that carries a risk says so at once (AnswerChoice.warn).
    if (ask?.answer.type === "answer" && a?.status === "done") {
      const warn = ask.answer.choices.find((c) => c.id === a.choiceId)?.warn;
      if (warn) return warn;
    }
  }
  if (key === "price") return "Thank you. Your price is in your bid.";
  return null;
}

// ─── The thread ───

export interface ThreadInput {
  bid: AvaBid;
  s: BidState;
  flow: Flow;
  now: number;
  memberName: string;
  grant: GrantView | null;
  mentor: MentorRead | null;
}

/** Phase 1, every turn before the question shown now. */
export function threadOf(i: ThreadInput): Turn[] {
  const { bid, s, flow, now } = i;
  const w = buyerWord(bid);
  const files = bid.files.filter((f) => !f.supersededBy);
  const out: Turn[] = [];

  out.push({
    kind: "ava",
    key: "hello",
    lines: [
      `Hi ${firstName(i.memberName)}. I am Ava. I will build this bid with you, and show you everything as I go.`,
    ],
  });
  if (flow.stage === "stopped") {
    const main = files.find((f) => f.role === "main");
    out.push({
      kind: "ava",
      key: "stopped",
      lines:
        flow.stop === "no-files"
          ? [
              "This notice came with no files, and no notice text I can read.",
              "I will not guess the rules. Check the notice on SAM.gov, or find another bid.",
            ]
          : flow.stop === "no-main"
            ? [
                `I need the ${w}'s main file: the document that asks for bids. None of your files is that one.`,
                "Without it I cannot know the rules, so I have not started. Your files are on the right.",
              ]
            : [
                `I cannot read ${main?.name ?? "the main file"}. Its words come out jumbled.`,
                "I stop here rather than build from part of the rules. I need a copy I can read.",
              ],
    });
    return out;
  }
  if (i.grant) out.push({ kind: "grant", key: "grant", call: i.grant.call, gist: i.grant.gist });
  // Her mentor's read of the opportunity, with or without a verdict: a reply
  // in her own words is shown as her note (review panel, 7 October 2026).
  if (i.mentor && (i.mentor.verdict || i.mentor.note)) {
    out.push({ kind: "mentor", key: "mentor", ...i.mentor });
  }

  if (flow.stage === "mentor-no") {
    const n = firstName(i.mentor?.name ?? "Your mentor");
    out.push({
      kind: "ava",
      key: "mentor-no",
      lines: [
        `Before we start: ${n}, your mentor, advised against this bid. Her note is on the right.`,
        "I have not started. If you build it anyway, I keep her note with your bid. What would you like to do?",
      ],
    });
    return out;
  }
  if (i.mentor?.verdict === "dont-pursue" && s.overMentor) {
    out.push({ kind: "you", key: "over-mentor", text: "Build it anyway." });
  }

  const intro: string[] = [];
  if (i.mentor && i.mentor.verdict !== "dont-pursue" && (i.mentor.verdict || i.mentor.note))
    intro.push(`I read ${firstName(i.mentor.name)}'s note. I keep it with your bid.`);
  intro.push(`I am reading the ${w}'s ${files.length} files now. You can watch them on the right.`);
  out.push({ kind: "ava", key: "reading", lines: intro });

  // Reading: a live line while it runs, one quiet line when it is done.
  const read = filesRead(bid, s, now);
  const doing = read.find((r) => r.state === "now");
  if (!s.read?.doneAt) {
    out.push({
      kind: "trace",
      key: "trace-read",
      live: true,
      line: doing ? `Reading ${doing.file.name}` : `Reading the ${w}'s files`,
      time: s.read ? tookWords(now - s.read.startedAt) : undefined,
      steps: read
        .filter((r) => r.state !== "next")
        .map((r) => ({
          done: r.state !== "now",
          text:
            r.state === "now"
              ? `Reading ${r.file.name}`
              : `Read ${r.file.name}${r.file.pages ? ` · ${r.file.pages} pages` : ""}`,
          found: r.state === "now" ? null : r.found,
        })),
    });
    return out;
  }
  out.push({
    kind: "trace",
    key: "trace-read",
    live: false,
    line: `Read the ${w}'s ${files.length} files`,
    time: tookWords(s.read.doneAt - s.read.startedAt),
    steps: read.map((r) => ({
      done: true,
      text: `Read ${r.file.name}${r.file.pages ? ` · ${r.file.pages} pages` : ""}`,
      found: r.found,
    })),
  });

  const rules = flow.must;
  const unsure = grantUnsure(bid);
  // A file she must get herself is not "read" (Exhibit D, behind a login).
  const locked = files.filter((f) => !readable(f));
  // A scanned main file: read from a picture of each page, and said once (PC-1).
  const scanMain = files.some((f) => f.role === "main" && f.readability === "scan");
  const readLine =
    locked.length === 0
      ? `I read all ${files.length} files.`
      : `I read ${files.length - locked.length} of ${files.length} files. I could not open ${locked.map((f) => f.name).join(" or ")}.`;
  const scanLine = scanMain
    ? " Your main file is a scan. I read it from a picture of each page. You check the due date and the price lines first."
    : "";
  const mustKeys = new Set(
    flow.must.flatMap((r) => [
      `must:${r.rule.id}`,
      ...[r.rule.askId, ...(r.rule.askIds ?? [])].filter(Boolean).map((x) => `ask:${x}`),
    ]),
  );
  const anyMust = s.trail.some((k) => mustKeys.has(k)) || flow.stage === "must";
  out.push({
    kind: "ava",
    key: "must-intro",
    lines:
      rules.length === 0
        ? [`${readLine}${scanLine} I found no rule that can get a bid rejected.`]
        : anyMust
          ? [
              `${readLine}${scanLine} Before I build, let's check the ${count(rules.length, "rule")} that can get your bid rejected.`,
              ...(unsure > 0 ? [`Grant could not tell on ${unsure} of them, so I ask you.`] : []),
            ]
          : [
              `${readLine}${scanLine} You meet all ${count(rules.length, "rule")} that can get a bid rejected.`,
            ],
  });

  // Her answers, in the order she gave them.
  let built = false;
  const buildIntro = () => {
    if (built) return;
    built = true;
    out.push({
      kind: "ava",
      key: "build-intro",
      lines: [
        "Good. You can bid. Now I write your bid.",
        "I ask one thing at a time, and show you where each one goes. You can see your bid on the right.",
      ],
    });
  };
  const mustDone = flow.stage !== "must" && flow.stage !== "paused";
  for (const key of s.trail) {
    if (key === "paused") continue;
    // A rule she left open is still part of "check you can bid".
    const base = key.startsWith("left:") ? key.slice(5) : key;
    if (!mustKeys.has(base) && mustDone) buildIntro();
    const said = answerText(bid, s, key);
    if (!said) continue;
    const ask = key.startsWith("ask:") ? bid.asks.find((a) => `ask:${a.id}` === key) : undefined;
    const answer = ask ? s.answers[ask.id] : undefined;
    out.push({
      kind: "ava",
      key: `q:${key}`,
      lines: [askedText(bid, s, key)],
    });
    out.push({
      kind: "you",
      key: `a:${key}`,
      text: said,
      file:
        ask?.kind === "upload" && answer?.fileName
          ? { name: answer.fileName, photo: /photo/i.test(answer.fileName) }
          : undefined,
      voice: typeof answer?.values?.spoken === "string",
    });
    const reply = ack(bid, s, key);
    if (reply) out.push({ kind: "ava", key: `ack:${key}`, lines: [reply] });
  }

  if (flow.stage === "paused") {
    // DEMO: say what stopped the bid, in the words of the rule. A paused bid
    // that does not say why looks broken.
    const why = bidDecision(bid, s)?.reason;
    out.push({
      kind: "ava",
      key: "paused",
      lines: [
        ...(why ? [why] : []),
        why
          ? `The ${w} would reject this bid, so I paused before building. You lose no time.`
          : `Then the ${w} would reject this bid. I paused before building, so you lose no time.`,
        "Your answers stay saved. Grant can look again, or your mentor can tell you what she would do.",
      ],
    });
    return out;
  }
  if (mustDone) buildIntro();

  if (flow.stage === "checking" || flow.stage === "found" || flow.stage === "ready") {
    out.push({
      kind: "ava",
      key: "check-intro",
      lines: [
        `That was my last question. Now I check your whole bid for mistakes, the way the ${w} will.`,
        "I fix what I can myself. If I find something only you can answer, I will ask. You can leave this page.",
      ],
    });
    out.push(checkTrace(bid, s, now));
  }
  if (flow.stage === "found") {
    const fixed = Object.keys(s.avaFixes).length;
    out.push({
      kind: "ava",
      key: "found",
      lines: [
        fixed > 0
          ? `I checked your whole bid. I fixed ${count(fixed, "thing")} myself.`
          : "I checked your whole bid.",
      ],
    });
  }
  if (flow.stage === "ready") {
    if (s.check?.failed)
      out.push({
        kind: "ava",
        key: "check-failed",
        lines: [
          "I could not finish checking your bid. I fixed nothing and asked nothing.",
          "When you download it, How to send it lists what to check yourself.",
        ],
      });
    out.push({ kind: "ava", key: "ready", lines: readyWords(bid, s, flow).lines });
  }
  return out;
}

/** The short form of a question already answered, for the thread. */
function askedText(bid: AvaBid, s: BidState, key: string): string {
  if (key.startsWith("ask:")) {
    const ask = bid.asks.find((a) => `ask:${a.id}` === key);
    if (!ask) return "";
    if (ask.answer.type === "answer") return ask.answer.question;
    if (ask.answer.type === "approve") return `Is this right? ${ask.answer.proposal}`;
    return ask.kind === "upload"
      ? `Next paper: ${lowerFirst(ask.title)}.`
      : `Next, I need this: ${lowerFirst(ask.title)}.`;
  }
  if (key.startsWith("must:")) {
    const r = bid.hardRequirements.find((x) => `must:${x.id}` === key);
    return r ? `Can you meet this rule? ${r.label}.` : "";
  }
  if (key.startsWith("promise:")) {
    const c = bid.commitments.find((x) => `promise:${x.id}` === key);
    return c ? promiseLine(c.text) : "";
  }
  if (key.startsWith("decision:"))
    return "One choice I should not make for you. Which is true for you?";
  if (key === "price") {
    const t = s.priceApproval?.total;
    return t ? `Is ${usd(t)} the price you want to bid?` : "Is this the price you want to bid?";
  }
  if (key.startsWith("clar:")) {
    const c = bid.clarifications.find((x) => `clar:${x.id}` === key);
    return c ? `Send the ${buyerWord(bid)} a question: ${lowerFirst(c.title)}.` : "";
  }
  if (key === "fix:staffing:approved" || key === "fix:demo:price-yourself")
    return "Here is the staffing plan I propose. Is this your plan?";
  if (key.startsWith("fix:")) {
    const f = blockingFindings(bid, { ...s, fixes: {} }).find(
      (x) => x.fix && `fix:${x.fix.key}` === key,
    );
    // Asked as a question, so her yes has something to say yes to.
    return f ? `${f.title}. ${fixQuestion(f.fix!.label)}` : "I found one more thing to ask you.";
  }
  if (key === "portal") return `Can you show me the ${buyerWord(bid)}'s portal screens?`;
  if (key.startsWith("left:"))
    return askedText(bid, s, key.slice(5)) || "Can you give me this now?";
  return "";
}

/** The check, as a live trace while it runs and one line when it is done. */
export function checkTrace(bid: AvaBid, s: BidState, now: number): Turn {
  const lines = checkLines(bid, s);
  const c = s.check;
  const done = c?.doneAt
    ? lines.length
    : c
      ? Math.min(lines.length - 1, Math.floor((now - c.startedAt) / 1100))
      : 0;
  if (c?.doneAt) {
    const fixed = Object.keys(s.avaFixes).length;
    return {
      kind: "trace",
      key: "trace-check",
      live: false,
      line: `Checked your whole bid${fixed > 0 ? ` · fixed ${count(fixed, "thing")}` : ""}`,
      time: tookWords(c.doneAt - c.startedAt),
      steps: lines.map((l) => ({ done: true, text: l.label, found: l.result })),
    };
  }
  const nowLine = lines[done] as CheckLine | undefined;
  return {
    kind: "trace",
    key: "trace-check",
    live: true,
    line: nowLine ? `Checking ${lowerFirst(nowLine.label)}` : "Checking your bid",
    time: c ? tookWords(now - c.startedAt) : undefined,
    steps: lines.slice(0, done + 1).map((l, i) => ({
      done: i < done,
      text: i < done ? l.label : `Checking ${lowerFirst(l.label)}`,
      found: i < done ? l.result : null,
    })),
  };
}

// ─── Phase 2 ───

/** A sentence she can tap in her bid: where it is and its words. */
export interface Sentence {
  key: string;
  sectionId: string;
  paragraph: number;
  text: string;
}

/** Where each sentence of a text starts and ends: [start, end) pairs. One
 *  split, used by the page and by the chat, so a tapped sentence and its
 *  key always agree. */
export function sentenceRanges(text: string): [number, number][] {
  const out: [number, number][] = [];
  // A stop ends a sentence only before a space, a quote or the end, so
  // "$9.40" and "Section 7.4" stay whole.
  const re = /(?:[^.!?]|[.!?](?=[^\s"”]))+(?:[.!?]+["”]?\s*|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    out.push([m.index, m.index + m[0].length]);
  }
  if (out.length === 0) out.push([0, text.length]);
  // Anything before the first match (a leading mark) joins the first sentence.
  out[0] = [0, out[0][1]];
  out[out.length - 1] = [out[out.length - 1][0], text.length];
  return out;
}

/** The sentences of a paragraph as it reads now, each with its key. Her
 *  answers inside it read as she gave them. */
export function sentencesOf(bid: AvaBid, s: BidState, sectionId: string): Sentence[][] {
  const sec = bid.sections.find((x) => x.id === sectionId);
  if (!sec) return [];
  return sectionParagraphs(s, sec).map((spans, pi) => {
    const text = spans
      .map((sp) => (sp.claim ? (claimView(bid, s, sp.claim).text ?? sp.text) : sp.text))
      .join("");
    return sentenceRanges(text).map(([a, b], n) => ({
      key: `${sectionId}:${pi}:${n}`,
      sectionId,
      paragraph: pi,
      text: text.slice(a, b).trim(),
    }));
  });
}

/** "Due Thursday 21 May 2026", for "How to send it". */
export function dueDate(bid: AvaBid): string {
  return fullDate(dayFromNow(bid.deadline.dueDaysFromNow));
}

export { decisionKey };
