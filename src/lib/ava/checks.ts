// Ava's check: findings, not scores.
//
// Exact checks are deterministic. Each one either passes (and says what it
// checked) or produces a finding with a severity and, where Ava can fix it
// itself, a fix. The AI never grades its own facts: nothing in this file reads
// a model's opinion. The evaluator-style read is separate — in the first
// version a GovPreneurs reviewer writes it (bid.reviewerFindings).
//
// Going ahead at risk is allowed only on a finding that is not a rule the
// buyer rejects a bid for, her price, her promises or an addendum (flow.ts
// riskAllowed; PRD R11). A finding the member accepts keeps its severity as a
// label on the package and checklist, never in the files.

import { findOpportunity } from "../../demo/ava/opportunity";
import type { BidState } from "./store";
import {
  askResolved,
  blockedFiles,
  commitmentStatus,
  dateCannotSlip,
  decideBy,
  decideByRaw,
  neededWithBid,
  openBidAsks,
  openClarifications,
  openGaps,
  receivedAddenda,
  reqStatus,
  requirementChangedBy,
  sectionPages,
  sectionClaims,
  claimView,
} from "./derive";
import { daysFromToday, fullDate } from "./dates";
import {
  deliveryCheck,
  linePrices,
  missingPriceAsks,
  otherCostAmount,
  sheetTotal,
  approvalTotal,
  fieldValue,
  usd0,
  wageWarnings,
  weeklyHours,
  isRateList,
  ratesApproved,
} from "./price";
import type { AvaBid, Severity } from "./types";

/** Where a finding sends the member. Matches the workspace views. */
export type FindingView = "brief" | "list" | "writing" | "price" | "forms" | "submit" | "addenda";

export interface Finding {
  id: string;
  kind: "exact" | "reviewer";
  severity: Severity;
  title: string;
  detail: string;
  /** A fix Ava can make itself. Applying it writes `fixes[key]`. */
  fix?: { label: string; key: string };
  /** The ask whose answer clears it. */
  askId?: string;
  view?: FindingView;
  sectionId?: string;
  /** Reviewer findings: the weak sentence, and the suggested fix. */
  quote?: string;
  suggestedFix?: string;
}

export interface CheckResult {
  findings: Finding[];
  /** Checks that ran and passed, in plain words. Shown so "checked" means something. */
  passed: string[];
}

/** The bid deposit, judged once: a certified check under the percent of the
 *  total bid is short. Null when there is nothing to judge yet. */
export function depositShort(bid: AvaBid, s: BidState): { amount: number; needed: number } | null {
  const sec = bid.bidSecurity;
  if (!sec?.check || s.answers[sec.bondAskId]?.status !== "dont-have") return null;
  const total = sheetTotal(linePrices(bid, s));
  const amount = fieldValue(bid, s, sec.check);
  if (total === null || amount === null) return null;
  const needed = Math.ceil((total * sec.percent) / 100);
  return amount < needed ? { amount, needed } : null;
}

/** A certified check whose amount cannot be compared with the total yet:
 *  her price is not set. */
function depositUnmeasured(bid: AvaBid, s: BidState): boolean {
  const sec = bid.bidSecurity;
  if (!sec?.check || s.answers[sec.bondAskId]?.status !== "dont-have") return false;
  return sheetTotal(linePrices(bid, s)) === null;
}

/** A hard requirement's status as every screen shows it: the answer judged
 *  (derive.reqStatus), plus the deposit amount against the price. The Brief,
 *  the list and the Check all read this, so they cannot disagree. */
export function requirementStatus(bid: AvaBid, s: BidState, r: AvaBid["hardRequirements"][number]) {
  const v = reqStatus(bid, s, r);
  const isBond = !!bid.bidSecurity?.bondAskId && r.askId === bid.bidSecurity.bondAskId;
  const short = isBond ? depositShort(bid, s) : null;
  // A certified check measured against no total cannot be judged yet: cannot
  // tell is never met (D-A9).
  if (isBond && v.status === "meets" && depositUnmeasured(bid, s)) {
    return {
      status: "confirm" as const,
      evidence: "I can check your deposit once your price is set",
    };
  }
  if (short && v.status === "meets") {
    return {
      status: "not-yet" as const,
      evidence: `Your deposit of ${usd0(short.amount)} is under the ${usd0(short.needed)} needed`,
    };
  }
  return v;
}

export function exactChecks(bid: AvaBid, s: BidState): CheckResult {
  const findings: Finding[] = [];
  const passed: string[] = [];

  // 1 · Hard requirements.
  const failing = bid.hardRequirements.filter(
    (r) => requirementStatus(bid, s, r).status !== "meets",
  );
  for (const r of failing) {
    const v = requirementStatus(bid, s, r);
    // Missing is never red. Critical is kept for an answer that fails the
    // rule; a rule not yet shown is Material until then.
    const failedByAnswer = v.status === "not-yet" && v.evidence !== r.evidence;
    // A rule the buyer checks only at award or before work starts does not
    // hold the bid: it is a Minor note until then, unless an answer failed it.
    const rewrittenBy = requirementChangedBy(bid, s, r.id);
    if (
      !failedByAnswer &&
      rewrittenBy &&
      v.evidence?.startsWith(`Addendum ${rewrittenBy.number} changed`)
    ) {
      findings.push({
        id: `req:${r.id}`,
        kind: "exact",
        severity: "material",
        title: `${r.label}: Addendum ${rewrittenBy.number} changed this rule`,
        detail: `Confirm on your list that you still meet it. Rule: ${r.source.short}.`,
        askId: r.askId,
        view: "list",
      });
      continue;
    }
    if (!failedByAnswer && !neededWithBid(r)) {
      findings.push({
        id: `req:${r.id}`,
        kind: "exact",
        severity: "minor",
        title: `${r.label}: needed ${r.neededAt === "award" ? "at award" : "before work starts"}`,
        detail: `It does not hold the bid. Have it ready if you win. Rule: ${r.source.short}.`,
        askId: r.askId,
        view: "list",
      });
      continue;
    }
    findings.push({
      id: `req:${r.id}`,
      kind: "exact",
      severity: failedByAnswer ? "critical" : "material",
      title: failedByAnswer
        ? `${r.label}: your answer does not meet it`
        : `${r.label}: not shown yet`,
      detail: failedByAnswer
        ? `${v.evidence ?? "Your answer"}. The buyer can reject a bid that does not meet this. Rule: ${r.source.short}.`
        : `Ava needs your proof of this before the bid is complete. Rule: ${r.source.short}.`,
      askId: r.askId,
      view: "list",
    });
  }
  if (failing.length === 0 && bid.hardRequirements.length > 0) {
    passed.push(
      `Every hard requirement is met, with your proof named (${bid.hardRequirements.length}).`,
    );
  }

  // 2 · Every addendum acknowledged.
  const received = receivedAddenda(bid, s);
  const unacked = received.filter(
    (a) => !bid.forms.some((f) => f.acknowledgesAddendumId === a.id) && !s.fixes[`ack:${a.id}`],
  );
  for (const a of unacked) {
    findings.push({
      id: `ack:${a.id}`,
      kind: "exact",
      severity: "critical",
      title: `Addendum ${a.number} is not acknowledged`,
      detail:
        "The acknowledgment form is missing from the package. Buyers reject bids that skip one.",
      fix: { label: "Add the form", key: `ack:${a.id}` },
      view: "forms",
    });
  }
  if (received.length > 0 && unacked.length === 0) {
    passed.push(`Every addendum has its acknowledgment form in the package (${received.length}).`);
  }

  // 2b · Addenda the member uploaded that Ava has not compared yet. Until it
  //      has, the bid is not checked against them (concept §9: the Critical
  //      example is "Ready, not checked against Addendum 3").
  s.addendumUploads.forEach((u, i) => {
    // Ava compared it, or she read it herself and says it changes nothing.
    // Her word clears the comparison only, never the acknowledgment below.
    if (s.fixes[`upload-compared:${i}`] || s.fixes[`upload-read:${i}`]) return;
    findings.push({
      id: `upload:${i}`,
      kind: "exact",
      severity: "critical",
      title: `${u.fileName} is not compared with your bid yet`,
      detail: "Your bid is not checked against it. Buyers reject a bid that skips an addendum.",
      view: "addenda",
    });
  });

  // 2c · Every addendum she added needs her acknowledgment, the way the buyer
  //      asks: Ava cannot sign it for her (review panel, round 2).
  s.addendumUploads.forEach((u, i) => {
    if (s.fixes[`upload-ack:${i}`]) return;
    findings.push({
      id: `upload-ack:${i}`,
      kind: "exact",
      severity: "critical",
      title: `${u.fileName} needs your acknowledgment`,
      detail:
        "The buyer wants every addendum acknowledged. Sign its acknowledgment the way the buyer asks, and send it with your bid.",
      view: "addenda",
    });
  });

  // 3 · Page limits, measured.
  let pageChecks = 0;
  for (const sec of bid.sections) {
    if (!sec.pageLimit) continue;
    pageChecks++;
    const pages = sectionPages(s, sec);
    if (pages > sec.pageLimit) {
      findings.push({
        id: `pages:${sec.id}`,
        kind: "exact",
        severity: "material",
        title: `${sec.title} is ${pages} pages. The limit is ${sec.pageLimit}.`,
        detail: `Measured on the working file. Rule: ${sec.answers.short}.`,
        fix: { label: `Cut it to ${sec.pageLimit} pages`, key: `pages:${sec.id}` },
        view: "writing",
        sectionId: sec.id,
      });
    }
  }
  if (pageChecks > 0 && !findings.some((f) => f.id.startsWith("pages:"))) {
    passed.push(`Every section is within its page limit (${pageChecks}).`);
  }

  // 4 · Company name matches the legal name. SAM.gov is the federal
  // registration only: a state or local buyer has its own vendor registration,
  // tracked as its own requirement, so a city bid never names SAM.gov here.
  const federal = findOpportunity(bid.noticeId)?.scope === "fed";
  if (bid.nameInDraft !== bid.samLegalName && !s.fixes["name-sam"]) {
    findings.push({
      id: "name-sam",
      kind: "exact",
      severity: "minor",
      title: federal
        ? "Your company name differs from your SAM.gov registration"
        : "Your company name differs from your legal name",
      detail: federal
        ? `The bid says "${bid.nameInDraft}". Your registration says "${bid.samLegalName}".`
        : `The bid says "${bid.nameInDraft}". Your legal name is "${bid.samLegalName}".`,
      fix: {
        label: federal ? "Use your registered name" : "Use your legal name",
        key: "name-sam",
      },
      view: "writing",
    });
  } else {
    passed.push(
      federal
        ? "Your company name matches your registration everywhere."
        : "Your company name matches your legal name everywhere.",
    );
  }

  // 5 · Price complete, totals recalculated. A bid the buyer allows no price
  // for is checked the other way: nothing in the package may be a price sheet.
  const pm = bid.price;
  if (!pm) {
    const sheet = bid.submission.files.filter((f) => f.contains.some((c) => c.kind === "price"));
    if (sheet.length > 0) {
      findings.push({
        id: "no-price",
        kind: "exact",
        severity: "critical",
        title: "The buyer allows no price, but the package has a price sheet",
        detail: `Take out ${sheet.map((f) => f.name).join(" and ")}. A price can get this rejected.`,
        view: "submit",
      });
    } else {
      passed.push("Your bid has no price sheet. The buyer allows no price.");
    }
  }
  const missing = missingPriceAsks(bid, s);
  const prices = linePrices(bid, s);
  const total = sheetTotal(prices);
  if (!pm) {
    // Nothing to price.
  } else if (missing.length > 0) {
    findings.push({
      id: "price-incomplete",
      kind: "exact",
      severity: "material",
      title: "The price sheet is not complete",
      detail:
        pm.builtBy === "you"
          ? "Type your price for every line on the buyer's sheet."
          : `Ava needs ${missing.length} more answer${missing.length === 1 ? "" : "s"} from you to price it.`,
      askId: missing[0],
      view: "price",
    });
  } else if (total === null && isRateList(bid)) {
    passed.push("Every line has your rate. No total: the buyer gives no quantities.");
    if (!ratesApproved(bid, s)) {
      findings.push({
        id: "price-approval",
        kind: "exact",
        severity: "material",
        title: s.priceApproval
          ? "Your rates changed since you approved them"
          : "You have not approved your rates",
        detail: "Only you decide the price.",
        view: "price",
      });
    }
  } else if (total === null) {
    findings.push({
      id: "price-incomplete",
      kind: "exact",
      severity: "critical",
      title: "The price sheet cannot be totaled",
      detail:
        "Every input is in, but a line has no quantity Ava can price. Check the buyer's quantities.",
      view: "price",
    });
  } else {
    passed.push(`The price sheet totals add up: ${pm.lines.length} lines, recalculated by Ava.`);
    const approve = approvalTotal(bid, s);
    if (pm.periods && approve !== null) {
      passed.push(
        `Every period the buyer prices has a price: year one and ${pm.periods.count} more.`,
      );
    }
    if (
      approve !== null &&
      (!s.priceApproval || Math.abs(s.priceApproval.total - approve) > 0.005)
    ) {
      findings.push({
        id: "price-approval",
        kind: "exact",
        severity: "material",
        title: s.priceApproval
          ? "Your price changed since you approved it"
          : "You have not approved the price",
        detail: pm.periods
          ? `The total is now ${usd0(approve)} across every period. Only you decide the price.`
          : `The total is now ${usd0(approve)} for year one. Only you decide the price.`,
        view: "price",
      });
    }
    // Bid security: a bond scales with the bid; a check has an amount.
    const sec = bid.bidSecurity;
    if (sec) {
      const bondAnswer = s.answers[sec.bondAskId];
      const needed = Math.ceil((total * sec.percent) / 100);
      if (bondAnswer?.status === "dont-have" && sec.check) {
        const amount = fieldValue(bid, s, sec.check);
        if (depositShort(bid, s) && amount !== null) {
          findings.push({
            id: "security-amount",
            kind: "exact",
            severity: "critical",
            title: `Your bid deposit is under ${sec.percent}% of your total bid`,
            detail: `The deposit is ${usd0(amount)}. At your price it has to be at least ${usd0(needed)}. Rule: ${sec.source.short}.`,
            askId: sec.check.askId,
            view: "list",
          });
        } else if (amount !== null) {
          passed.push(`Your bid deposit covers ${sec.percent}% of your total bid.`);
        }
      } else if (askResolved(bid, s, sec.bondAskId)) {
        passed.push(`Your bid bond is ${sec.percent}% of your bid, so it grows with your price.`);
      }
    }
  }
  if (pm?.templateError && s.fixes["template-answered"]) {
    passed.push("The buyer answered your question about their price sheet.");
  } else if (pm?.templateError && s.fixes["template"]) {
    // Asking does not fix the sheet. It stays listed, quietly, until the
    // buyer answers or an addendum corrects it.
    findings.push({
      id: "template",
      kind: "exact",
      severity: "minor",
      title: "You asked the buyer about the price sheet error",
      detail:
        "Ava keeps the correct totals until the buyer answers or an addendum fixes the sheet.",
      view: "price",
    });
  } else if (pm?.templateError) {
    findings.push({
      id: "template",
      kind: "exact",
      severity: "material",
      title: "The buyer's price sheet has a formula error",
      detail: pm.templateError,
      fix: { label: "I asked the buyer", key: "template" },
      view: "price",
    });
  }

  // 6 · Staffing in the writing matches the hours priced. Only a price Ava
  // built has hours: one she priced herself, or none, has nothing to compare.
  const builtByAva = pm && pm.builtBy !== "you" ? pm : null;
  if (builtByAva && bid.draftStaffing) {
    // Role by role, not only the weekly total: hours moved from a cook to a
    // manager keep the total and change the cost, because each role is priced
    // at its own rate.
    const priced = weeklyHours(builtByAva.roles);
    const written = weeklyHours(bid.draftStaffing);
    const drift = builtByAva.roles.filter((r) => {
      const w = bid.draftStaffing?.find((d) => d.roleId === r.id);
      return !w || w.count !== r.count || w.hoursPerWeek !== r.hoursPerWeek;
    });
    const extra = bid.draftStaffing.filter((d) => !builtByAva.roles.some((r) => r.id === d.roleId));
    if (drift.length > 0 || extra.length > 0) {
      findings.push({
        id: "staffing-price",
        kind: "exact",
        severity: "critical",
        title:
          priced !== written
            ? `The writing describes ${written} hours a week. The price pays for ${priced}.`
            : `The writing and the price give different hours to ${drift.map((r) => r.name.toLowerCase()).join(" and ")}.`,
        detail:
          "The buyer compares the two. If they differ, the buyer may think your price cannot pay for the work.",
        view: "price",
      });
    } else passed.push("The staffing in the writing matches the hours in the price.");
  } else if (builtByAva && builtByAva.roles.length > 0) {
    passed.push("The writing and the price use one staffing plan, so the hours match.");
  }

  // 7 · Wage floors.
  for (const w of wageWarnings(bid, s)) {
    findings.push({
      id: `wage:${w.role.id}`,
      kind: "exact",
      severity: "critical",
      title: `${w.role.name} pay is under the required wage`,
      detail: `You pay $${w.pay?.toFixed(2)} an hour. The law says at least $${w.belowFloor?.floor.toFixed(2)} an hour.`,
      askId: w.role.pay.askId,
      view: "price",
    });
  }

  // 8 · Can the price deliver?
  const delivery = deliveryCheck(bid, s);
  if (delivery.covers === false) {
    for (const { cost, amount } of delivery.notCovered) {
      findings.push({
        id: `deliver:${cost.id}`,
        kind: "exact",
        severity: "material",
        title: `Your price does not cover ${cost.label.toLowerCase()}`,
        detail:
          amount === null
            ? "Ava does not know this cost yet. It is a warning only."
            : `About ${usd0(amount)} a year. It is a warning only.`,
        fix: { label: "Add it to my price", key: `deliver:${cost.id}` },
        view: "price",
      });
    }
  } else if (delivery.covers) {
    passed.push("The price pays for the crew, the food and every cost Ava knows about.");
  }

  // 9 · Promises in the writing approved by you.
  const unapproved = bid.commitments.filter((c) => {
    const st = commitmentStatus(s, c);
    return st === "needs-approval" || st === "reopened";
  });
  if (unapproved.length > 0) {
    findings.push({
      id: "commitments",
      kind: "exact",
      severity: "material",
      title:
        unapproved.length === 1
          ? "1 promise in your bid needs your approval"
          : `${unapproved.length} promises in your bid need your approval`,
      detail: "A promise you have not approved cannot go in what you submit.",
      view: "list",
    });
  } else if (bid.commitments.length > 0) {
    passed.push(`You approved every promise in the bid (${bid.commitments.length}).`);
  }

  // 9b · A promise an addendum changed, still stated the old way in the writing.
  for (const a of received) {
    for (const ch of a.changes) {
      if (ch.patch.kind !== "commitment") continue;
      const cid = ch.patch.commitmentId;
      const inWriting = bid.sections.some((sec) =>
        sec.paragraphs.flat().some((sp) => sp.claim?.commitmentId === cid),
      );
      const rewritten = [ch.patch, ...(ch.alsoPatches ?? [])].some((p) => p.kind === "draft-text");
      if (inWriting && !rewritten && !ch.draftUnchanged) {
        findings.push({
          id: `stale-promise:${cid}`,
          kind: "exact",
          severity: "material",
          title: `The writing still states the old promise: ${ch.what.toLowerCase()}`,
          detail: `Addendum ${a.number} changed it to "${ch.now}". The section must say the same.`,
          view: "writing",
        });
      }
    }
  }

  // 10 · Claims with no proof yet.
  const gaps = openGaps(bid, s);
  if (gaps.length > 0) {
    findings.push({
      id: "gaps",
      kind: "exact",
      severity: "material",
      title: `${gaps.length} statement${gaps.length === 1 ? " has" : "s have"} no proof yet`,
      detail: "They stay out of the file you submit until you answer.",
      askId: gaps[0].claim.askId,
      view: "writing",
      sectionId: gaps[0].sectionId,
    });
  } else if (bid.sections.length > 0) {
    passed.push("Every fact in the writing traces to your documents or your answer.");
  }

  // 11 · Files Ava could not read.
  for (const f of blockedFiles(bid, s)) {
    findings.push({
      id: `file:${f.id}`,
      kind: "exact",
      severity: f.riskIfMissing ?? "material",
      title: `Ava could not read ${f.name}`,
      detail: f.note ?? "The bid is not checked against this file.",
      askId: f.uploadAskId,
      view: "list",
    });
  }

  // 12 · Questions to the buyer not sent.
  for (const c of openClarifications(bid, s)) {
    if (s.clarifications[c.id]?.sentAt) continue;
    findings.push({
      id: `clar:${c.id}`,
      kind: "exact",
      severity: "minor",
      title: `Question not sent: ${c.title.toLowerCase()}`,
      detail: c.meanwhile,
      view: "list",
    });
  }

  // 13 · Asks past their date. An ask due only at award does not hold the bid.
  for (const a of openBidAsks(bid, s)) {
    // The raw date, before it is held at today: past it, the answer may not
    // arrive in time. A fixed-date ask due today counts too.
    const raw = daysFromToday(decideByRaw(a, bid));
    if (raw < 0 || (dateCannotSlip(a, bid) && raw === 0)) {
      findings.push({
        id: `late:${a.id}`,
        kind: "exact",
        severity: "material",
        title: `${a.title}: needed by ${fullDate(decideBy(a, bid))}`,
        detail: "After this date it may not arrive before the bid is due.",
        askId: a.id,
        view: "list",
      });
    }
  }

  // 14 · Leftovers. Ava writes the files, so there are none to find; the
  //      check still runs on every file the member brings back (concept §6.5).
  passed.push("Ava writes the files with no comments, tracked changes or hidden text.");

  return { findings, passed };
}

/** Reviewer findings as the check shows them. */
export function reviewerChecks(bid: AvaBid): Finding[] {
  return bid.reviewerFindings.map((r) => ({
    id: `review:${r.id}`,
    kind: "reviewer" as const,
    severity: r.severity,
    title: r.finding,
    detail: r.finding,
    askId: r.askId,
    view: "writing" as const,
    sectionId: r.sectionId,
    quote: r.quote,
    suggestedFix: r.suggestedFix,
  }));
}

/** What the buyer's rejection rules call for, as the finding ids of the
 *  check: a rule that rejects the bid, a legal wage floor, a bid deposit, an
 *  addendum, her price and her promises. None of them can go ahead at risk
 *  (PRD R11): the ways out are to fix it or to stop (review panel, 7 October
 *  2026). */
const NEVER_AT_RISK =
  /^(req:|security-amount$|wage:|ack:|upload:|upload-ack:|no-price$|price-incomplete$|price-approval$|commitments$)/;

/** She may go ahead at risk on this finding. */
export function riskAllowed(f: Pick<Finding, "id">): boolean {
  return !NEVER_AT_RISK.test(f.id);
}

/** "answered": the member answered the ask behind a reviewer finding. It is
 *  not fixed until a reviewer reads the section again, so it no longer holds
 *  the bid but says plainly that it waits for that read. */
export type FindingState = "open" | "answered" | "at-risk";

export function findingState(bid: AvaBid, s: BidState, f: Finding): FindingState {
  // A risk recorded on a finding that may never go ahead at risk changes
  // nothing: it stays open.
  if (s.risks[f.id] && riskAllowed(f)) return "at-risk";
  if (f.kind === "reviewer") {
    const rid = f.id.slice("review:".length);
    if (s.reviewerLeft[rid] !== undefined) return "at-risk";
    // Released only when the answer is IN the section: a claim there that
    // waited on this ask now reads the member's answer. An answer that has not
    // reached the writing leaves the reviewer's concern open.
    if (f.askId && askResolved(bid, s, f.askId)) {
      const sec = bid.sections.find((x) => x.id === f.sectionId);
      const written =
        !!sec &&
        sectionClaims(s, sec).some(
          (c) => c.askId === f.askId && claimView(bid, s, c).tag !== "unsupported",
        );
      if (written) return "answered";
    }
  }
  return "open";
}

/** Findings that keep the bid in Reviewing: open, and critical or material. */
export function blockingFindings(bid: AvaBid, s: BidState): Finding[] {
  const all = [...exactChecks(bid, s).findings, ...reviewerChecks(bid)];
  return all.filter((f) => f.severity !== "minor" && findingState(bid, s, f) === "open");
}

/** Labels that stay on the package: every risk the member accepted. */
export function acceptedRisks(
  s: BidState,
): { key: string; label: string; severity: Severity; reason: string }[] {
  return Object.entries(s.risks).map(([key, r]) => ({
    key,
    label: r.label,
    severity: r.severity,
    reason: r.reason,
  }));
}

export function otherCostText(bid: AvaBid, s: BidState, costId: string): string | null {
  const c = bid.price?.otherCosts.find((x) => x.id === costId);
  if (!c) return null;
  const amt = otherCostAmount(bid, s, c);
  return amt === null ? c.label : `${c.label}, about ${usd0(amt)} a year`;
}
